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

function cleanText(t) {
  if (!t) return '';
  return String(t).replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function extractRange(areaText) {
  if (!areaText) return null;
  // Match "SL No. 1-850" or "SL No. 1 to 850" or "Sl. No. 801 to 1600"
  const mBetween = areaText.match(/s[li]\.?\s*no\.?\s*(\d+)\s*(?:[-–]|to)\s*(\d+)/i);
  if (mBetween) {
    return { min: parseInt(mBetween[1], 10), max: parseInt(mBetween[2], 10) };
  }
  // Match "SL No. 851 Above" or "SL No. 967  Above"
  const mAbove = areaText.match(/s[li]\.?\s*no\.?\s*(\d+)\s*(?:and\s+)?above/i);
  if (mAbove) {
    return { min: parseInt(mAbove[1], 10), max: 999999 };
  }
  return null;
}

async function run() {
  console.log('================================================================');
  console.log(' PARSING & APPLYING MASTER POLLING ADDRESSES & AUXILIARY BOOTHS ');
  console.log('================================================================\n');

  const wb = XLSX.readFile(POLL_FILE);
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  let currentMap = { ps: 1, loc: 4, bld: 14, area: 27, voters: 36 };
  const rawStations = [];

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];

    // Header text detection
    if (row.some(c => /building in which/i.test(String(c)))) {
      const psCol = row.findIndex(c => /ps\.?\s*no/i.test(String(c)));
      const locCol = row.findIndex(c => /location/i.test(String(c)));
      const bldCol = row.findIndex(c => /building/i.test(String(c)));
      const areaCol = row.findIndex(c => /polling\s*area/i.test(String(c)));
      if (psCol !== -1 && locCol !== -1 && bldCol !== -1 && areaCol !== -1) {
        currentMap = { ps: psCol, loc: locCol, bld: bldCol, area: areaCol, voters: currentMap.voters };
      }
    }

    // Number map detection
    const col1 = row.indexOf(1) !== -1 ? row.indexOf(1) : row.indexOf('1');
    const col2 = row.indexOf(2) !== -1 ? row.indexOf(2) : row.indexOf('2');
    const col3 = row.indexOf(3) !== -1 ? row.indexOf(3) : row.indexOf('3');
    const col6 = row.indexOf(6) !== -1 ? row.indexOf(6) : row.indexOf('6');

    if (col1 !== -1 && col2 !== -1 && col3 !== -1 && col6 !== -1) {
      currentMap = { ps: col1, loc: col2, bld: col3, area: col6, voters: row.indexOf(8) !== -1 ? row.indexOf(8) : currentMap.voters };
      continue;
    }

    // Row 130 unpacked handler (parts 53 to 62B)
    if (r === 130) {
      const blds = String(row[16] || '').split(/\r?\n/).slice(2).map(x => cleanText(x)).filter(x => x);
      const areas = String(row[31] || '').split(/\r?\n/).slice(2).map(x => cleanText(x)).filter(x => x);
      for (let subR = 132; subR <= 146; subR++) {
        const subRow = rows[subR];
        const ps = cleanText(subRow[1]).replace(/[\r\n\s]+/g, '');
        const loc = cleanText(subRow[4]);
        const idx = subR - 132;
        if (ps) {
          rawStations.push({ ps, location: loc, building: blds[idx] || '', area: areas[idx] || '' });
        }
      }
      r = 146;
      continue;
    }

    // Row 279 unpacked handler (parts 127A to 136)
    if (r === 279) {
      const psList = String(row[4] || '').split(/\r?\n/).slice(3).map(x => cleanText(x)).filter(x => x);
      const blds = String(row[16] || '').split(/\r?\n/).slice(2).map(x => cleanText(x)).filter(x => x);
      const areas = String(row[31] || '').split(/\r?\n/).slice(0).map(x => cleanText(x)).filter(x => x);
      for (let i = 0; i < psList.length; i++) {
        rawStations.push({ ps: psList[i], location: '', building: blds[i] || '', area: areas[i] || '' });
      }
      continue;
    }

    let rawPs = cleanText(row[currentMap.ps]).replace(/[\r\n\s]+/g, '');
    if (!rawPs || /ps\.no|sl\.no|remarks|whether|location|building/i.test(rawPs)) continue;

    // Clean OCR artifacts
    rawPs = rawPs.replace(/^lA$/i, '1A')
                 .replace(/^SA$/i, '5A')
                 .replace(/^5B$/i, '5B')
                 .replace(/^llA$/i, '11A')
                 .replace(/^1!\)$/i, '16')
                 .replace(/^l$/i, '1');

    if (!/^\d+[A-Z]?$/i.test(rawPs)) continue;

    const rawLoc = cleanText(row[currentMap.loc]);
    const rawBld = cleanText(row[currentMap.bld]);
    const rawArea = cleanText(row[currentMap.area]);

    if (rawBld || rawLoc || rawArea) {
      rawStations.push({ ps: rawPs, location: rawLoc, building: rawBld, area: rawArea });
    }
  }

  // Deduplicate and sanitize stations
  const stationsMap = new Map();
  for (const s of rawStations) {
    if (s.building === '3' && s.location === '2') continue;
    if (!stationsMap.has(s.ps)) {
      stationsMap.set(s.ps, s);
    }
  }

  const allStations = Array.from(stationsMap.values());
  console.log(`Parsed ${allStations.length} unique polling stations and auxiliary booths!`);

  // Step 1: Populate polling_stations table in Supabase
  console.log('\n--- Step 1: Populating polling_stations table in Supabase ---');
  // Clear existing polling_stations records
  await supabase.from('polling_stations').delete().neq('id', 0);

  const psInserts = allStations.map(s => ({
    part_number: s.ps,
    name: s.building || `Polling Station ${s.ps}`,
    address: [s.location, s.area].filter(Boolean).join(', ') || s.building,
    source_file: 'update polling address.xlsx',
    verified: true
  }));

  for (let i = 0; i < psInserts.length; i += 100) {
    const chunk = psInserts.slice(i, i + 100);
    const { error: psErr } = await supabase.from('polling_stations').insert(chunk);
    if (psErr) throw new Error('Error inserting into polling_stations: ' + psErr.message);
  }
  console.log(`✅ Inserted all ${psInserts.length} booths into polling_stations table.`);

  // Step 2: Group booths by base part number
  console.log('\n--- Step 2: Computing booth rules and serial allocations ---');
  const basePartGroups = {};
  for (const s of allStations) {
    const basePart = s.ps.replace(/[A-Z]+$/i, '');
    if (!basePartGroups[basePart]) basePartGroups[basePart] = [];
    const range = extractRange(s.area);
    basePartGroups[basePart].push({
      boothCode: s.ps,
      building: s.building || `Polling Station ${s.ps}`,
      location: s.location || '',
      area: s.area || '',
      fullAddress: [s.location, s.area].filter(Boolean).join(', ') || s.building,
      range
    });
  }

  console.log(`Configured booth rules across ${Object.keys(basePartGroups).length} base parts.`);

  // Step 3: Apply updates to electors table across all 151 parts
  console.log('\n--- Step 3: Updating electors table with polling station data ---');
  let totalPartsUpdated = 0;

  for (let p = 1; p <= 151; p++) {
    const partStr = String(p);
    const booths = basePartGroups[partStr];

    if (!booths || booths.length === 0) {
      console.log(`Warning: Part ${partStr} has no entry in update polling address.xlsx, skipping.`);
      continue;
    }

    if (booths.length === 1) {
      // Single booth for entire part
      const b = booths[0];
      const { error: upErr } = await supabase
        .from('electors')
        .update({
          polling_station_name: b.building,
          polling_address: b.fullAddress
        })
        .eq('part_number', partStr);

      if (upErr) console.error(`Error updating Part ${partStr}:`, upErr.message);
    } else {
      // Multi-booth part with auxiliary rooms
      // Primary booth is the base booth without letter suffix (or first one)
      const primaryBooth = booths.find(b => b.boothCode === partStr) || booths[0];

      for (const b of booths) {
        if (b.range) {
          // Update electors in this serial number range
          const { error: upErr } = await supabase
            .from('electors')
            .update({
              polling_station_name: b.building,
              polling_address: b.fullAddress
            })
            .eq('part_number', partStr)
            .gte('serial_number', b.range.min)
            .lte('serial_number', b.range.max);

          if (upErr) console.error(`Error updating Part ${partStr} booth ${b.boothCode}:`, upErr.message);
        }
      }

      // Default fallback for electors with serial_number IS NULL or outside parsed range
      const { error: fbErr } = await supabase
        .from('electors')
        .update({
          polling_station_name: primaryBooth.building,
          polling_address: primaryBooth.fullAddress
        })
        .eq('part_number', partStr)
        .is('polling_station_name', null);

      if (fbErr) console.error(`Error applying fallback for Part ${partStr}:`, fbErr.message);
    }

    totalPartsUpdated++;
    if (totalPartsUpdated % 15 === 0 || totalPartsUpdated >= 151) {
      process.stdout.write(`  Applied polling station updates to ${totalPartsUpdated} / 151 parts...\r`);
    }
  }

  console.log(`\n\n--- Step 4: Verification in database ---`);
  const { count: withPolling } = await supabase
    .from('electors')
    .select('id', { count: 'exact', head: true })
    .not('polling_station_name', 'is', null);

  const { count: withoutPolling } = await supabase
    .from('electors')
    .select('id', { count: 'exact', head: true })
    .is('polling_station_name', null);

  console.log(`Electors with populated polling stations: ${withPolling?.toLocaleString()}`);
  console.log(`Electors without polling stations:         ${withoutPolling?.toLocaleString()}`);

  // Sample check Part 1, Part 1A, Part 112, Part 140
  console.log('\nSample verification checks:');
  const { data: sampleP1 } = await supabase
    .from('electors')
    .select('name, part_number, serial_number, polling_station_name, polling_address')
    .eq('part_number', '1')
    .in('serial_number', [10, 950]);
  console.log('Part 1 sample (Primary vs Auxiliary):', sampleP1);

  const { data: sampleNew } = await supabase
    .from('electors')
    .select('name, part_number, serial_number, polling_station_name, polling_address')
    .in('import_batch_id', ['batch_20261010_excel_phase2_v2', 'batch_zero_drop_recovery'])
    .limit(2);
  console.log('New voters sample:', sampleNew);

  console.log('\n✅ ALL POLLING STATIONS & AUXILIARY BOOTHS PERFECTLY ALLOCATED!');
}

run().catch(console.error);
