const path = require('path');
const fs = require('fs');
const XLSX = require(path.resolve(__dirname, '../web/node_modules/xlsx'));

const ROOT = path.resolve(__dirname, '..');
const POLL_FILE = path.join(ROOT, 'new poling addres', 'update polling address.xlsx');

function parseAllPollingStations() {
  const wb = XLSX.readFile(POLL_FILE);
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  console.log(`Total rows in ${POLL_FILE}: ${rows.length}`);

  let currentMap = { ps: 1, loc: 4, bld: 14, area: 27, voters: 36 };
  const stations = [];

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];

    // Check if this row defines a new column map (row contains 1, 2, 3, etc.)
    const col1 = row.indexOf(1) !== -1 ? row.indexOf(1) : row.indexOf('1');
    const col2 = row.indexOf(2) !== -1 ? row.indexOf(2) : row.indexOf('2');
    const col3 = row.indexOf(3) !== -1 ? row.indexOf(3) : row.indexOf('3');
    const col6 = row.indexOf(6) !== -1 ? row.indexOf(6) : row.indexOf('6');

    if (col1 !== -1 && col2 !== -1 && col3 !== -1 && col6 !== -1) {
      currentMap = { ps: col1, loc: col2, bld: col3, area: col6, voters: row.indexOf(8) !== -1 ? row.indexOf(8) : currentMap.voters };
      // console.log(`[Row ${r}] Updated colMap: ps=${currentMap.ps}, loc=${currentMap.loc}, bld=${currentMap.bld}, area=${currentMap.area}`);
      continue;
    }

    // Special handler for Row 130
    if (r === 130) {
      const blds = String(row[16] || '').split(/\r?\n/).slice(2).map(x => x.trim()).filter(x => x);
      const areas = String(row[31] || '').split(/\r?\n/).slice(2).map(x => x.trim()).filter(x => x);
      for (let subR = 132; subR <= 146; subR++) {
        const subRow = rows[subR];
        const ps = String(subRow[1] || '').trim().replace(/[\r\n\s]+/g, '');
        const loc = String(subRow[4] || '').trim();
        const idx = subR - 132;
        if (ps) {
          stations.push({
            r: subR,
            ps,
            location: loc,
            building: blds[idx] || '',
            area: areas[idx] || '',
            voters: String(subRow[36] || '').trim()
          });
        }
      }
      r = 146;
      continue;
    }

    // Special handler for Row 279
    if (r === 279) {
      const psList = String(row[4] || '').split(/\r?\n/).slice(3).map(x => x.trim()).filter(x => x);
      const blds = String(row[16] || '').split(/\r?\n/).slice(2).map(x => x.trim()).filter(x => x);
      const areas = String(row[31] || '').split(/\r?\n/).slice(0).map(x => x.trim()).filter(x => x);
      const votersList = String(row[40] || '').split(/\r?\n/).slice(1).map(x => x.trim()).filter(x => x);
      for (let i = 0; i < psList.length; i++) {
        stations.push({
          r: 279,
          ps: psList[i],
          location: '',
          building: blds[i] || '',
          area: areas[i] || '',
          voters: votersList[i] || ''
        });
      }
      continue;
    }

    // Standard row parsing
    let rawPs = String(row[currentMap.ps] || '').trim().replace(/[\r\n\s]+/g, '');
    if (!rawPs || /ps\.no|sl\.no|remarks|whether|location|building/i.test(rawPs)) continue;

    // Check if rawPs is a valid polling station designation (digits + optional letter like 1, 1A, 2, 2A, SA, lA, etc.)
    if (!/^\d+[A-Z]?$/i.test(rawPs) && !/^[lIsS][A-Z]?$/i.test(rawPs)) continue;

    // OCR cleanups
    rawPs = rawPs.replace(/^lA$/i, '1A')
                 .replace(/^SA$/i, '5A')
                 .replace(/^5B$/i, '5B')
                 .replace(/^1!\)$/i, '16')
                 .replace(/^l$/i, '1');

    const rawLoc = String(row[currentMap.loc] || '').trim().replace(/[\r\n]+/g, ' ');
    const rawBld = String(row[currentMap.bld] || '').trim().replace(/[\r\n]+/g, ', ');
    const rawArea = String(row[currentMap.area] || '').trim().replace(/[\r\n]+/g, ', ');
    const rawVoters = String(row[currentMap.voters] || '').trim();

    if (rawBld || rawLoc || rawArea) {
      stations.push({
        r,
        ps: rawPs,
        location: rawLoc,
        building: rawBld,
        area: rawArea,
        voters: rawVoters
      });
    }
  }

  console.log(`\nParsed a total of ${stations.length} polling stations!`);

  const uniquePs = new Set(stations.map(s => s.ps));
  console.log(`Unique PS numbers: ${uniquePs.size}`);
  console.log('List of PS numbers:', Array.from(uniquePs).join(', '));

  const baseParts = new Set(stations.map(s => s.ps.replace(/[A-Z]+$/i, '')));
  console.log(`\nBase part numbers represented: ${baseParts.size}`);

  const missing = [];
  for (let p = 1; p <= 151; p++) {
    if (!baseParts.has(String(p))) missing.push(p);
  }
  console.log('Missing base parts from 1 to 151:', missing);

  return stations;
}

const all = parseAllPollingStations();
fs.writeFileSync(
  path.join(__dirname, 'reports/parsed_polling_stations.json'),
  JSON.stringify(all, null, 2)
);
