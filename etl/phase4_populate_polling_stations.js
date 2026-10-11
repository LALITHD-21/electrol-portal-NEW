const path = require('path');
const fs = require('fs');
const XLSX = require(path.resolve(__dirname, '../web/node_modules/xlsx'));

const envPath = path.resolve(__dirname, '../web/.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const m = line.match(/^([^=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
}

const { createClient } = require(path.resolve(__dirname, '../web/node_modules/@supabase/supabase-js'));
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const ROOT = path.resolve(__dirname, '..');
const POLL_FILE = path.join(ROOT, 'new poling addres', 'update polling address.xlsx');

async function populatePollingStations() {
  console.log('--- PHASE 4: POPULATING POLLING_STATIONS TABLE ---');
  const wb = XLSX.readFile(POLL_FILE);
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  let psNoCol = 1;
  let locationCol = 4;
  let buildingCol = 14;
  let pollingAreaCol = 27;

  for (let r = 0; r < Math.min(5, rows.length); r++) {
    const row = rows[r];
    for (let c = 0; c < row.length; c++) {
      const v = String(row[c]).toLowerCase().replace(/[\r\n]+/g, ' ');
      if (v.includes('ps.no') || v.includes('ps no')) psNoCol = c;
      if (v.includes('location of')) locationCol = c;
      if (v.includes('building in which')) buildingCol = c;
      if (v.includes('polling area')) pollingAreaCol = c;
    }
  }

  const stations = [];
  for (let r = 3; r < rows.length; r++) {
    const row = rows[r];
    const rawPsNo = String(row[psNoCol] || '').trim();
    const rawBuilding = String(row[buildingCol] || '').trim().replace(/[\r\n]+/g, ', ');
    const rawLocation = String(row[locationCol] || '').trim().replace(/[\r\n]+/g, ', ');
    const rawArea = String(row[pollingAreaCol] || '').trim().replace(/[\r\n]+/g, ', ');

    if (!rawPsNo || !/^\d+$/.test(rawPsNo)) continue;

    stations.push({
      part_number: rawPsNo,
      name: rawBuilding || rawLocation || `Polling Station ${rawPsNo}`,
      address: rawArea || rawLocation || rawBuilding,
      source_file: 'update polling address.xlsx',
      verified: true
    });
  }

  console.log(`Parsed ${stations.length} polling stations.`);

  // Insert into polling_stations table in Supabase
  const { error } = await supabase.from('polling_stations').insert(stations);
  if (error) {
    console.error('Error inserting into polling_stations:', error.message);
    process.exit(1);
  }

  const { count } = await supabase.from('polling_stations').select('*', { count: 'exact', head: true });
  console.log(`✅ Successfully populated polling_stations table! Verified count: ${count}`);
}

populatePollingStations().catch(console.error);
