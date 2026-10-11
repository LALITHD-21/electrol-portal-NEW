const path = require('path');
const fs = require('fs');

const envPath = path.resolve(__dirname, '../web/.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const m = line.match(/^([^=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
}

const { createClient } = require(path.resolve(__dirname, '../web/node_modules/@supabase/supabase-js'));
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const stations = require('./reports/parsed_polling_stations.json');

const baseMap = new Map();
for (const s of stations) {
  const base = s.ps.replace(/[A-Z]+$/i, '');
  if (!baseMap.has(base)) {
    baseMap.set(base, {
      name: s.building || `Polling Station ${base}`,
      address: [s.location, s.area].filter(Boolean).join(', ') || s.building
    });
  }
}

async function populateRecovered() {
  console.log('Fetching recovered voters without polling station...');
  const { data: nullElectors, error } = await supabase
    .from('electors')
    .select('id, source_file')
    .is('polling_station_name', null);

  if (error || !nullElectors) {
    console.error('Fetch error:', error);
    return;
  }

  console.log(`Found ${nullElectors.length} electors to backfill.`);

  // Group by part number
  const byPart = new Map();
  for (const e of nullElectors) {
    if (!e.source_file) continue;
    const m = e.source_file.match(/^(\d+)_/);
    if (m) {
      const part = m[1];
      if (!byPart.has(part)) byPart.set(part, []);
      byPart.get(part).push(e.id);
    }
  }

  console.log(`Electors span ${byPart.size} parts.`);

  for (const [part, ids] of byPart) {
    const station = baseMap.get(part) || {
      name: `Polling Station ${part}`,
      address: `Part ${part}`
    };

    // Update in chunks of 200
    for (let i = 0; i < ids.length; i += 200) {
      const chunkIds = ids.slice(i, i + 200);
      const { error: upErr } = await supabase
        .from('electors')
        .update({
          part_number: part,
          polling_station_name: station.name,
          polling_address: station.address
        })
        .in('id', chunkIds);

      if (upErr) {
        console.error(`Error updating part ${part}:`, upErr.message);
      }
    }
  }

  // Final check
  const { count: finalNull } = await supabase
    .from('electors')
    .select('id', { count: 'exact', head: true })
    .is('polling_station_name', null);

  const { count: finalPopulated } = await supabase
    .from('electors')
    .select('id', { count: 'exact', head: true })
    .not('polling_station_name', 'is', null);

  console.log(`\n✅ BACKFILL COMPLETE!`);
  console.log(`  - Electors with Polling Station: ${finalPopulated?.toLocaleString()}`);
  console.log(`  - Electors without Polling Station: ${finalNull?.toLocaleString()}`);
}

populateRecovered().catch(console.error);
