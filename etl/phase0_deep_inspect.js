/**
 * PHASE 0 — DEEP INSPECTION
 * Finds the actual voter data rows inside the complex multi-header Excel files.
 * These are Electoral Roll PDFs converted to Excel with title blocks at the top.
 * READ ONLY — NO WRITES.
 */
const path = require('path');
const fs = require('fs');
const XLSX = require(path.resolve(__dirname, '../web/node_modules/xlsx'));

const ROOT = path.resolve(__dirname, '..');
const NEW_EXCEL = path.join(ROOT, 'uptaed voter list');

/** Scan all rows to find where actual data starts */
function deepInspect(filePath) {
  const workbook = XLSX.readFile(filePath);
  const results = [];
  for (const sheetName of workbook.SheetNames) {
    const ws = workbook.Sheets[sheetName];
    const allRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

    // Find row containing EPIC-like identifiers or voter fields
    const EPIC_KEYWORDS = ['epic', 'serial', 'sl.no', 'sl no', 'voter id', 'id no', 'card no', 'elector'];
    const NAME_KEYWORDS = ['name', 'voter name', 'elector name', 'father', 'husband', 'relative'];

    let headerRowIdx = -1;
    for (let i = 0; i < Math.min(30, allRows.length); i++) {
      const row = allRows[i];
      const joined = row.map(c => String(c).toLowerCase()).join(' ');
      const hasEpic = EPIC_KEYWORDS.some(k => joined.includes(k));
      const hasName = NAME_KEYWORDS.some(k => joined.includes(k));
      if (hasEpic || hasName) {
        headerRowIdx = i;
        break;
      }
    }

    if (headerRowIdx === -1) {
      // Try to find row with many non-empty cells (likely a data header)
      for (let i = 0; i < Math.min(30, allRows.length); i++) {
        const row = allRows[i];
        const nonEmpty = row.filter(c => String(c).trim().length > 0);
        if (nonEmpty.length >= 5) {
          headerRowIdx = i;
          break;
        }
      }
    }

    const headerRow = headerRowIdx >= 0 ? allRows[headerRowIdx] : [];
    const dataRows = headerRowIdx >= 0
      ? allRows.slice(headerRowIdx + 1).filter(r => r.some(c => String(c).trim()))
      : [];

    // Scan dataRows for EPIC-like values (letters+digits, 10-15 chars)
    const epicPattern = /^[A-Z]{3,4}\d{7,10}$/i;
    let epicColIdx = -1;
    for (let col = 0; col < Math.min(20, headerRow.length); col++) {
      const vals = dataRows.slice(0, 10).map(r => String(r[col] || '').trim()).filter(v => v);
      if (vals.some(v => epicPattern.test(v))) {
        epicColIdx = col;
        break;
      }
    }

    results.push({
      sheetName,
      totalRows: allRows.length,
      headerRowIdx,
      headerRow,
      epicColIdx,
      sample3DataRows: dataRows.slice(0, 3),
      dataRowCount: dataRows.length,
    });
  }
  return results;
}

// Sample 3 files from the new Excel folder
const files = fs.readdirSync(NEW_EXCEL)
  .filter(f => f.endsWith('.xlsx'))
  .sort();

// Pick spread: first, ~1/3, ~2/3, last, and the odd-named ones
const toInspect = [
  files[0],
  files[Math.floor(files.length * 0.33)],
  files[Math.floor(files.length * 0.66)],
  files[files.length - 1],
  '2nd page.xlsx',
  '140_1791587656.pdf.pdf.xlsx',
].filter((f, i, a) => f && a.indexOf(f) === i);

console.log('\n' + '═'.repeat(70));
console.log(' PHASE 0 — DEEP COLUMN STRUCTURE INSPECTION');
console.log('═'.repeat(70));

for (const fname of toInspect) {
  const fpath = path.join(NEW_EXCEL, fname);
  if (!fs.existsSync(fpath)) { console.log(`\n❌ File not found: ${fname}`); continue; }
  console.log(`\n${'─'.repeat(70)}`);
  console.log(`📄 ${fname}`);
  try {
    const sheets = deepInspect(fpath);
    for (const s of sheets) {
      console.log(`  Sheet: "${s.sheetName}" — total raw rows: ${s.totalRows}`);
      console.log(`  Detected header at row index: ${s.headerRowIdx}`);
      console.log(`  Header row [${s.headerRow.length} cols]:`);
      s.headerRow.forEach((h, i) => {
        const v = String(h).trim();
        if (v) console.log(`    col[${i}]: ${JSON.stringify(v)}`);
      });
      console.log(`  EPIC-like column index: ${s.epicColIdx}`);
      console.log(`  Data rows found: ${s.dataRowCount}`);
      console.log(`  Sample data rows:`);
      s.sample3DataRows.forEach((r, i) => {
        console.log(`    row${i+1}: ${JSON.stringify(r)}`);
      });
    }
  } catch (e) {
    console.log(`  ❌ Error: ${e.message}`);
  }
}

// Also inspect the new polling address file more carefully
console.log(`\n${'═'.repeat(70)}`);
console.log(' DEEP INSPECT: new poling addres/update polling address.xlsx');
console.log('═'.repeat(70));
const pollFile = path.join(ROOT, 'new poling addres', 'update polling address.xlsx');
try {
  const wb = XLSX.readFile(pollFile);
  for (const sn of wb.SheetNames) {
    const ws = wb.Sheets[sn];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    console.log(`\nSheet: ${sn} — ${rows.length} rows`);
    // Find header (row with "Sl", "part", "polling station", "address")
    const POLL_KEYS = ['sl', 'part', 'polling', 'station', 'address', 'name', 'location'];
    let hIdx = -1;
    for (let i = 0; i < Math.min(10, rows.length); i++) {
      const joined = rows[i].map(c => String(c).toLowerCase()).join(' ');
      if (POLL_KEYS.filter(k => joined.includes(k)).length >= 2) { hIdx = i; break; }
    }
    if (hIdx === -1) hIdx = 0;
    console.log(`Header row index: ${hIdx}`);
    console.log(`Headers: ${JSON.stringify(rows[hIdx])}`);
    console.log(`Row ${hIdx+1}: ${JSON.stringify(rows[hIdx+1] || [])}`);
    console.log(`Row ${hIdx+2}: ${JSON.stringify(rows[hIdx+2] || [])}`);
    console.log(`Row ${hIdx+3}: ${JSON.stringify(rows[hIdx+3] || [])}`);
    const data = rows.slice(hIdx + 1).filter(r => r.some(c => String(c).trim()));
    console.log(`Data rows: ${data.length}`);
  }
} catch (e) {
  console.log(`❌ Error: ${e.message}`);
}

// Inspect one OLD polling address file
console.log(`\n${'═'.repeat(70)}`);
console.log(' DEEP INSPECT: poling addres/KOLAR.xlsx');
console.log('═'.repeat(70));
const kolarFile = path.join(ROOT, 'poling addres', 'KOLAR.xlsx');
try {
  const wb = XLSX.readFile(kolarFile);
  for (const sn of wb.SheetNames) {
    const ws = wb.Sheets[sn];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    console.log(`\nSheet: ${sn} — ${rows.length} rows`);
    rows.slice(0, 12).forEach((r, i) => console.log(`  row[${i}]: ${JSON.stringify(r)}`));
  }
} catch (e) {
  console.log(`❌ Error: ${e.message}`);
}

console.log('\n✅ Deep inspection complete. READ ONLY.\n');
