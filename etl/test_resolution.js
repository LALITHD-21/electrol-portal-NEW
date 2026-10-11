const fs = require('fs');
const path = require('path');
const envPath = path.resolve(__dirname, '../web/.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const m = line.match(/^([^=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
}
const { createClient } = require(path.resolve(__dirname, '../web/node_modules/@supabase/supabase-js'));
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const stations = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'stations_dump.json'), 'utf8'));

// Build lookup maps
const byName = new Map();
const byAddress = new Map();
const byBasePart = new Map();

stations.forEach(s => {
  const isAux = /[A-Z]/i.test(s.part_number);
  const basePart = s.part_number.replace(/[A-Z]+$/i, '');
  const commaIdx = s.address.indexOf(',');
  const location = commaIdx !== -1 ? s.address.slice(0, commaIdx).trim() : s.address.trim();
  const pollingArea = commaIdx !== -1 ? s.address.slice(commaIdx + 1).trim() : s.address.trim();

  let min = null, max = null, rangeText = null;
  const mBetween = s.address.match(/s[li]\.?\s*no\.?\s*(\d+)\s*(?:[-–]|to)\s*(\d+)/i);
  if (mBetween) {
    min = parseInt(mBetween[1], 10);
    max = parseInt(mBetween[2], 10);
    rangeText = 'SL No. ' + min + ' – ' + max;
  } else {
    const mAbove = s.address.match(/s[li]\.?\s*no\.?\s*(\d+)\s*(?:and\s+)?above/i);
    if (mAbove) {
      min = parseInt(mAbove[1], 10);
      max = 999999;
      rangeText = 'SL No. ' + min + ' & Above';
    }
  }

  const obj = { boothCode: s.part_number, basePart, isAuxiliary: isAux, buildingName: s.name, location, pollingArea, min, max, rangeText };
  byName.set(s.name.toLowerCase().trim(), obj);
  byAddress.set(s.address.toLowerCase().trim(), obj);

  if (!byBasePart.has(basePart)) byBasePart.set(basePart, []);
  byBasePart.get(basePart).push(obj);
});

async function testResolution() {
  const { data: p112d } = await supabase.from('electors').select('epic_number, part_number, serial_number, polling_station_name, polling_address').eq('part_number', 112).gte('serial_number', 3401).limit(5);

  (p112d || []).forEach(e => {
    let resolved = byName.get((e.polling_station_name || '').toLowerCase().trim());
    if (!resolved) resolved = byAddress.get((e.polling_address || '').toLowerCase().trim());
    if (!resolved && e.part_number) {
      const candidates = byBasePart.get(String(e.part_number)) || [];
      if (e.serial_number && candidates.length > 1) {
        resolved = candidates.find(c => c.min && c.max && e.serial_number >= c.min && e.serial_number <= c.max);
      }
      if (!resolved) resolved = candidates[0];
    }
    console.log('EPIC:', e.epic_number || 'N/A', '| Part:', e.part_number, '| Serial:', e.serial_number);
    console.log('  -> Booth:', resolved?.boothCode, '| isAux:', resolved?.isAuxiliary, '| Bld:', resolved?.buildingName);
    console.log('  -> Loc:', resolved?.location, '| Area:', resolved?.pollingArea);
    console.log('  -> Range:', resolved?.rangeText);
  });
}
testResolution();
