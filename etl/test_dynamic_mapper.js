const path = require('path');
const fs = require('fs');
const XLSX = require(path.resolve(__dirname, '../web/node_modules/xlsx'));

const ROOT = path.resolve(__dirname, '..');
const NEW_EXCEL_DIR = path.join(ROOT, 'uptaed voter list');

function inspectAllHeaders() {
  const allFiles = fs.readdirSync(NEW_EXCEL_DIR)
    .filter(f => f.toLowerCase().endsWith('.xlsx') && !f.startsWith('~$'))
    .sort();

  let unmappedFiles = [];
  let successCount = 0;

  for (const f of allFiles) {
    if (f === '2nd page.xlsx') continue;

    const wb = XLSX.readFile(path.join(NEW_EXCEL_DIR, f));
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

    let headerRowIdx = -1;
    let colMap = {};
    let partNumber = null;
    let district = null;
    let taluk = null;

    // Scan for metadata row
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

    // Fallback part number from file name
    if (!partNumber) {
      const fnMatch = f.match(/^(\d+)_/);
      if (fnMatch) partNumber = fnMatch[1];
    }

    // Find row with "Name of the Elector" or "EPIC"
    for (let i = 0; i < Math.min(20, rows.length); i++) {
      const row = rows[i];
      let hasName = false;
      let hasEpic = false;
      for (let j = 0; j < row.length; j++) {
        const v = String(row[j]).toLowerCase();
        if (v.includes('name of the elector') || v.includes('elector name')) hasName = true;
        if (v.includes('epic') || v.includes('voter id')) hasEpic = true;
      }
      if (hasName && hasEpic) {
        headerRowIdx = i;
        break;
      }
    }

    if (headerRowIdx !== -1) {
      const hRow = rows[headerRowIdx];
      for (let j = 0; j < hRow.length; j++) {
        const v = String(hRow[j]).toLowerCase().replace(/[\r\n]+/g, ' ').trim();
        if (/s[i|l]\.?\s*no/i.test(v)) colMap.serial_number = j;
        else if (/name of the elector|elector name/i.test(v)) colMap.name = j;
        else if (/father|mother|husband/i.test(v)) colMap.relative_name = j;
        else if (/address/i.test(v)) colMap.address = j;
        else if (/qualification/i.test(v)) colMap.qualification = j;
        else if (/occupation/i.test(v)) colMap.occupation = j;
        else if (/age/i.test(v)) colMap.age = j;
        else if (/sex|gender/i.test(v)) colMap.sex = j;
        else if (/epic/i.test(v)) colMap.epic_number = j;
      }
    }

    // Verify all essential columns found
    const required = ['name', 'epic_number', 'age', 'sex'];
    const missing = required.filter(k => colMap[k] === undefined);

    if (missing.length > 0 || !partNumber) {
      unmappedFiles.push({ file: f, headerRowIdx, colMap, missing, partNumber, district });
    } else {
      successCount++;
    }
  }

  console.log(`\nHeader detection results across all 144 files:`);
  console.log(`✅ Fully mapped files: ${successCount} / 144`);
  console.log(`⚠️  Unmapped / Ambiguous files: ${unmappedFiles.length}`);
  if (unmappedFiles.length > 0) {
    console.log('Details:', JSON.stringify(unmappedFiles, null, 2));
  }
}

inspectAllHeaders();
