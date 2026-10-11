const path = require('path');
const fs = require('fs');
const XLSX = require(path.resolve(__dirname, '../web/node_modules/xlsx'));

const ROOT = path.resolve(__dirname, '..');
const POLL_FILE = path.join(ROOT, 'new poling addres', 'update polling address.xlsx');

function parsePollingStations() {
  const wb = XLSX.readFile(POLL_FILE);
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  console.log(`Loaded ${rows.length} rows from ${POLL_FILE} (Sheet: ${sheetName})`);

  // Find column indices in Row 1 or Row 2
  // Row 1: ["Sl. No.", "ps.no", ..., "Location of the Polling Stations", ..., "Building in which PS is located", ..., "Polling Area", ...]
  let psNoCol = 1;
  let locationCol = 4;
  let buildingCol = 14;
  let pollingAreaCol = 27;
  let votersCol = 36;

  for (let r = 0; r < Math.min(5, rows.length); r++) {
    const row = rows[r];
    for (let c = 0; c < row.length; c++) {
      const v = String(row[c]).toLowerCase().replace(/[\r\n]+/g, ' ');
      if (v.includes('ps.no') || v.includes('ps no')) psNoCol = c;
      if (v.includes('location of')) locationCol = c;
      if (v.includes('building in which')) buildingCol = c;
      if (v.includes('polling area')) pollingAreaCol = c;
      if (v.includes('total number of voters')) votersCol = c;
    }
  }

  console.log(`Detected columns: ps.no=${psNoCol}, location=${locationCol}, building=${buildingCol}, pollingArea=${pollingAreaCol}, voters=${votersCol}`);

  const stations = [];
  const partNumbers = new Set();

  for (let r = 3; r < rows.length; r++) {
    const row = rows[r];
    const rawPsNo = String(row[psNoCol] || '').trim();
    const rawBuilding = String(row[buildingCol] || '').trim().replace(/[\r\n]+/g, ', ');
    const rawLocation = String(row[locationCol] || '').trim().replace(/[\r\n]+/g, ', ');
    const rawArea = String(row[pollingAreaCol] || '').trim().replace(/[\r\n]+/g, ', ');
    const rawVoters = String(row[votersCol] || '').trim();

    if (!rawPsNo || !/^\d+$/.test(rawPsNo)) continue;

    const station = {
      part_number: rawPsNo,
      name: rawBuilding || rawLocation || `Polling Station ${rawPsNo}`,
      address: rawArea || rawLocation || rawBuilding,
      location: rawLocation,
      voters_assigned: rawVoters ? parseInt(rawVoters, 10) : null,
      source_file: 'update polling address.xlsx'
    };

    stations.push(station);
    partNumbers.add(rawPsNo);
  }

  console.log(`Parsed ${stations.length} polling stations.`);
  console.log(`Unique part numbers in file: ${partNumbers.size}`);
  
  const sortedParts = Array.from(partNumbers).map(Number).sort((a,b)=>a-b);
  console.log(`Part range: ${sortedParts[0]} to ${sortedParts[sortedParts.length - 1]}`);

  console.log('\nSample parsed polling stations:');
  console.log(JSON.stringify(stations.slice(0, 3), null, 2));

  return stations;
}

parsePollingStations();
