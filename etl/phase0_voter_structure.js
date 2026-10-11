/**
 * PHASE 0 — VOTER RECORD STRUCTURE FINDER
 * Finds the actual elector rows (EPIC number, name, serial, etc.)
 * READ ONLY — NO WRITES
 */
const path = require('path');
const fs = require('fs');
const XLSX = require(path.resolve(__dirname, '../web/node_modules/xlsx'));

const ROOT = path.resolve(__dirname, '..');
const NEW_EXCEL = path.join(ROOT, 'uptaed voter list');

const EPIC_PATTERN = /^[A-Z]{2,4}\d{6,10}$/i;

function findVoterRows(filePath) {
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const allRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  // Find first row that contains EPIC-like values
  let epicRowIdx = -1, epicColIdx = -1;
  for (let i = 0; i < allRows.length; i++) {
    const row = allRows[i];
    for (let j = 0; j < row.length; j++) {
      const val = String(row[j]).trim();
      if (EPIC_PATTERN.test(val)) {
        epicRowIdx = i;
        epicColIdx = j;
        break;
      }
    }
    if (epicRowIdx >= 0) break;
  }

  if (epicRowIdx < 0) return { found: false };

  // Look back up to 5 rows for the actual header
  let headerRowIdx = epicRowIdx - 1;
  for (let i = Math.max(0, epicRowIdx - 5); i < epicRowIdx; i++) {
    const row = allRows[i];
    const joined = row.map(c => String(c).toLowerCase()).join(' ');
    if (joined.includes('serial') || joined.includes('sl') || joined.includes('elector') || joined.includes('name') || joined.includes('epic')) {
      headerRowIdx = i;
      break;
    }
  }

  // Get header row
  const headerRow = allRows[headerRowIdx] || [];

  // Get sample voter rows (starting from epicRowIdx)
  const voterRows = allRows.slice(epicRowIdx, epicRowIdx + 5);

  // Count all voter rows from epicRowIdx onward (rows containing EPIC values)
  let voterCount = 0;
  for (let i = epicRowIdx; i < allRows.length; i++) {
    const row = allRows[i];
    if (row.some(c => EPIC_PATTERN.test(String(c).trim()))) voterCount++;
  }

  return {
    found: true,
    epicRowIdx,
    epicColIdx,
    headerRowIdx,
    headerRow,
    voterRows,
    voterCount,
    totalRawRows: allRows.length,
  };
}

// Test on multiple files
const files = fs.readdirSync(NEW_EXCEL).filter(f => f.endsWith('.xlsx')).sort();
const testFiles = [
  files[0], files[5], files[20], files[50], files[80], files[100], files[130],
  '2nd page.xlsx', '140_1791587656.pdf.pdf.xlsx'
].filter((f, i, a) => f && a.indexOf(f) === i);

console.log('\n' + '═'.repeat(70));
console.log(' PHASE 0 — ACTUAL VOTER RECORD STRUCTURE');
console.log('═'.repeat(70));

for (const fname of testFiles) {
  const fpath = path.join(NEW_EXCEL, fname);
  if (!fs.existsSync(fpath)) { console.log(`\n❌ Not found: ${fname}`); continue; }

  console.log(`\n${'─'.repeat(70)}`);
  console.log(`📄 ${fname}`);
  try {
    const result = findVoterRows(fpath);
    if (!result.found) {
      console.log('  ❌ No EPIC-like values found in this file!');
    } else {
      console.log(`  Total raw rows: ${result.totalRawRows}`);
      console.log(`  First EPIC found at row index: ${result.epicRowIdx}, col: ${result.epicColIdx}`);
      console.log(`  Header row index: ${result.headerRowIdx}`);
      console.log(`  Header values (non-empty):`);
      result.headerRow.forEach((h, i) => {
        if (String(h).trim()) console.log(`    col[${i}]: ${JSON.stringify(String(h).trim())}`);
      });
      console.log(`  Voter rows in file (rows with EPIC): ~${result.voterCount}`);
      console.log(`  Sample voter rows:`);
      result.voterRows.slice(0, 3).forEach((r, i) => {
        const nonEmpty = r.map((c, j) => `[${j}]=${JSON.stringify(String(c).trim())}`).filter(s => !s.includes('""'));
        console.log(`    row${i+1}: ${nonEmpty.join('  ')}`);
      });
    }
  } catch (e) {
    console.log(`  ❌ Error: ${e.message}`);
  }
}

console.log('\n✅ Done. READ ONLY.\n');
