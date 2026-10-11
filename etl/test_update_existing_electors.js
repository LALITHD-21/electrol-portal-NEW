const path = require('path');
const fs = require('fs');
const readline = require('readline');
const XLSX = require(path.resolve(__dirname, '../web/node_modules/xlsx'));

const ROOT = path.resolve(__dirname, '..');
const NEW_EXCEL_DIR = path.join(ROOT, 'uptaed voter list');
const BACKUP_FILE = path.resolve(__dirname, 'reports/backup_2026-10-10/electors_backup.csv');

function cleanString(val) {
  if (val === null || val === undefined) return '';
  return String(val).replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function parseCsvLine(text) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') { cur += '"'; i++; }
        else inQuotes = false;
      } else cur += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ',') { result.push(cur); cur = ''; }
      else cur += ch;
    }
  }
  result.push(cur);
  return result;
}

async function analyzeUpdates() {
  console.log('Loading baseline electors from backup CSV...');
  const fileStream = fs.createReadStream(BACKUP_FILE);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let lineCount = 0;
  const existingMap = new Map();

  for await (const line of rl) {
    if (lineCount === 0) { lineCount++; continue; }
    const cols = parseCsvLine(line);
    const epic = (cols[2] || '').trim().toUpperCase();
    if (epic) {
      existingMap.set(epic, {
        id: cols[0],
        name: (cols[3] || '').trim(),
        part_number: (cols[13] || '').trim(),
        age: (cols[8] || '').trim(),
        address: (cols[5] || '').trim(),
        district: (cols[18] || '').trim(),
        taluk: (cols[20] || '').trim()
      });
    }
    lineCount++;
  }
  console.log(`Loaded ${existingMap.size.toLocaleString()} baseline electors.`);

  const allFiles = fs.readdirSync(NEW_EXCEL_DIR)
    .filter(f => f.toLowerCase().endsWith('.xlsx') && !f.startsWith('~$') && f !== '2nd page.xlsx')
    .sort();

  let totalVotersInFiles = 0;
  let matchesCount = 0;
  let updatesNeeded = 0;
  let partChanges = 0;
  let ageChanges = 0;
  let districtAdded = 0;

  const sampleUpdates = [];

  for (const f of allFiles) {
    const fullPath = path.join(NEW_EXCEL_DIR, f);
    const wb = XLSX.readFile(fullPath);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

    let partNumber = null, district = null, taluk = null;
    for (let i = 0; i < Math.min(15, rows.length); i++) {
      for (let j = 0; j < rows[i].length; j++) {
        const val = String(rows[i][j]).trim();
        if (/taluk\/town\/city/i.test(val)) {
          const tMatch = val.match(/taluk\/town\/city\s*:\s*([^:\r\n]+?)(?:\s+district|$)/i);
          if (tMatch) taluk = tMatch[1].trim();
          const dMatch = val.match(/district\s*:\s*([^:\r\n]+?)(?:$|\s+taluk)/i);
          if (dMatch) district = dMatch[1].trim();
        }
        if (/part\s*no\s*[:\s]*\d+/i.test(val)) {
          const pMatch = val.match(/part\s*no\s*[:\s]*(\d+)/i);
          if (pMatch) partNumber = pMatch[1].trim();
        }
      }
    }
    if (!partNumber) {
      const fnMatch = f.match(/^(\d+)_/);
      if (fnMatch) partNumber = fnMatch[1];
    }

    let headerRowIdx = -1;
    let colMap = {};
    for (let i = 0; i < Math.min(20, rows.length); i++) {
      const row = rows[i];
      let hasName = false, hasEpic = false;
      for (let j = 0; j < row.length; j++) {
        const v = String(row[j]).toLowerCase();
        if (v.includes('name of the elector') || v.includes('elector name')) hasName = true;
        if (v.includes('epic') || v.includes('voter id')) hasEpic = true;
      }
      if (hasName && hasEpic) { headerRowIdx = i; break; }
    }

    if (headerRowIdx !== -1) {
      const hRow = rows[headerRowIdx];
      for (let j = 0; j < hRow.length; j++) {
        const v = String(hRow[j]).toLowerCase().replace(/[\r\n]+/g, ' ').trim();
        if (/name of the elector|elector name/i.test(v)) colMap.name = j;
        else if (/father|mother|husband/i.test(v)) colMap.relative_name = j;
        else if (/address/i.test(v)) colMap.address = j;
        else if (/qualification/i.test(v)) colMap.qualification = j;
        else if (/occupation/i.test(v)) colMap.occupation = j;
        else if (/age/i.test(v)) colMap.age = j;
        else if (/epic/i.test(v)) colMap.epic_number = j;
      }
    }

    const startRow = headerRowIdx >= 0 ? headerRowIdx + 1 : 9;
    for (let r = startRow; r < rows.length; r++) {
      const row = rows[r];
      const rawName = cleanString(row[colMap.name]);
      const rawEpic = cleanString(row[colMap.epic_number]).toUpperCase().replace(/[^A-Z0-9]/g, '');
      const rawAge = cleanString(row[colMap.age]);
      const rawAddress = cleanString(row[colMap.address]);

      if (!rawName && !rawEpic) continue;
      if (/name of the elector/i.test(rawName) || /male|female|others|total/i.test(rawName)) continue;

      totalVotersInFiles++;

      if (rawEpic && rawEpic.length === 10 && existingMap.has(rawEpic)) {
        matchesCount++;
        const ex = existingMap.get(rawEpic);
        let changes = {};

        if (partNumber && ex.part_number !== partNumber) {
          changes.part_number = { old: ex.part_number, new: partNumber };
          partChanges++;
        }
        if (rawAge && ex.age !== rawAge) {
          changes.age = { old: ex.age, new: rawAge };
          ageChanges++;
        }
        if (district && !ex.district) {
          changes.district = { old: null, new: district };
          districtAdded++;
        }

        if (Object.keys(changes).length > 0) {
          updatesNeeded++;
          if (sampleUpdates.length < 5) {
            sampleUpdates.push({ epic: rawEpic, name: rawName, changes });
          }
        }
      }
    }
  }

  console.log(`\n--- UPDATE ANALYSIS ---`);
  console.log(`Total voters in new files:        ${totalVotersInFiles.toLocaleString()}`);
  console.log(`Matching voters in DB:             ${matchesCount.toLocaleString()}`);
  console.log(`Existing voters needing updates:   ${updatesNeeded.toLocaleString()}`);
  console.log(`  - Part number changed (reassigned): ${partChanges.toLocaleString()}`);
  console.log(`  - Age updated:                     ${ageChanges.toLocaleString()}`);
  console.log(`  - District populated (was null):   ${districtAdded.toLocaleString()}`);

  console.log('\nSample updates that will be applied:');
  console.log(JSON.stringify(sampleUpdates, null, 2));
}

analyzeUpdates().catch(console.error);
