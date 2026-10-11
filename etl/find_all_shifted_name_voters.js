const path = require('path');
const fs = require('fs');
const XLSX = require(path.resolve(__dirname, '../web/node_modules/xlsx'));

const ROOT = path.resolve(__dirname, '..');
const NEW_EXCEL_DIR = path.join(ROOT, 'uptaed voter list');

async function scanAllFilesForShiftedVoters() {
  const allFiles = fs.readdirSync(NEW_EXCEL_DIR)
    .filter(f => f.toLowerCase().endsWith('.xlsx') && !f.startsWith('~$') && f !== '2nd page.xlsx')
    .sort();

  console.log(`Scanning all ${allFiles.length} Excel files for any shifted or misaligned voter rows...`);

  const recoveredVoters = [];

  for (const fname of allFiles) {
    const fpath = path.join(NEW_EXCEL_DIR, fname);
    const wb = XLSX.readFile(fpath);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

    // Find header
    let headerRowIdx = -1;
    let colName = 1;
    let colRel = 3;
    let colAddr = 5;
    let colQual = 9;
    let colOcc = 11;
    let colAge = 14;
    let colSex = 15;
    let colEpic = 16;

    for (let i = 0; i < Math.min(20, rows.length); i++) {
      const r = rows[i];
      for (let j = 0; j < r.length; j++) {
        const v = String(r[j]).toLowerCase();
        if (v.includes('name of the elector') || v.includes('elector name')) colName = j;
        else if (v.includes('father') || v.includes('husband') || v.includes('mother')) colRel = j;
        else if (v.includes('address')) colAddr = j;
        else if (v.includes('qualification')) colQual = j;
        else if (v.includes('occupation')) colOcc = j;
        else if (v.includes('age')) colAge = j;
        else if (v.includes('sex') || v.includes('gender')) colSex = j;
        else if (v.includes('epic')) colEpic = j;
      }
      if (r.some(v => String(v).toLowerCase().includes('epic'))) {
        headerRowIdx = i;
        break;
      }
    }

    const startRow = headerRowIdx >= 0 ? headerRowIdx + 1 : 8;

    for (let r = startRow; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length === 0) continue;

      const valName = String(row[colName] || '').trim();
      const valRel = String(row[colRel] || '').trim();
      const valAddr = String(row[colAddr] || '').trim();
      const valAge = String(row[colAge] || '').trim();
      const valSex = String(row[colSex] || '').trim().toUpperCase();
      const valEpic = String(row[colEpic] || '').trim();

      const nonEmpties = row.map(c => String(c).trim()).filter(c => c.length > 0);
      const rowText = nonEmpties.join(' ');

      // If name is blank, but there's a relative name, or age/sex, or address
      if (!valName && (valRel || valAddr || valAge || valEpic)) {
        // Skip header/footer/statistical summaries
        if (/mother roll|additions list|deletions list|summary of electors|net electors|qualifying date|type of revision|electoral rolls|page \d/i.test(rowText)) {
          continue;
        }

        // Check if there is a person name in valRel or any other cell
        const candidateName = valRel || nonEmpties.find(c => /^[A-Z\s\.]{3,35}$/i.test(c) && !/male|female|msc|bcom|ba|bed|bsc|photo|available/i.test(c));

        const ageNum = parseInt(valAge, 10);
        const isValidAge = !isNaN(ageNum) && ageNum >= 18 && ageNum <= 120;
        const isValidSex = ['M', 'F', 'O'].includes(valSex);

        if (candidateName && (isValidAge || isValidSex || valAddr)) {
          recoveredVoters.push({
            file: fname,
            rowIndex: r,
            candidateName,
            address: valAddr,
            age: isValidAge ? ageNum : null,
            sex: isValidSex ? valSex : null,
            rawEpic: valEpic,
            qualification: String(row[colQual] || '').trim(),
            occupation: String(row[colOcc] || '').trim(),
            fullRow: nonEmpties
          });
        }
      }
    }
  }

  console.log(`\nTOTAL Shifted / Missed voters found across all 144 files: ${recoveredVoters.length}`);
  console.log(JSON.stringify(recoveredVoters, null, 2));

  fs.writeFileSync(
    path.join(__dirname, 'reports/shifted_voters_scan.json'),
    JSON.stringify(recoveredVoters, null, 2)
  );
}

scanAllFilesForShiftedVoters().catch(console.error);
