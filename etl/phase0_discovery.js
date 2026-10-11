/**
 * PHASE 0 DISCOVERY — READ ONLY, NO WRITES
 * Inspects new Excel voter files, PDFs, polling address files.
 * Reports column headers, row counts, sample data for mapping.
 */
const path = require('path');
const fs = require('fs');

// Resolve xlsx from web/node_modules
const XLSX = require(path.resolve(__dirname, '../web/node_modules/xlsx'));

const ROOT = path.resolve(__dirname, '..');

const FOLDERS = {
  newExcel:     path.join(ROOT, 'uptaed voter list'),
  pdfFolder:    path.join(ROOT, 'updates voter list pdf'),
  pollingOld:   path.join(ROOT, 'poling addres'),
  pollingNew:   path.join(ROOT, 'new poling addres'),
  existingExcel:path.join(ROOT, 'excle-formate'),
};

function bytesToKB(b) { return (b / 1024).toFixed(1) + ' KB'; }
function bytesToMB(b) { return (b / 1024 / 1024).toFixed(2) + ' MB'; }

/** Read the first sheet of an xlsx, return { headers, sampleRows, totalRows, sheetNames } */
function inspectExcel(filePath, maxSampleRows = 3) {
  try {
    const workbook = XLSX.readFile(filePath, { sheetRows: 20 }); // only first 20 rows for speed
    const results = [];
    for (const sheetName of workbook.SheetNames) {
      const ws = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      // Find header row (first non-empty row)
      let headerIdx = 0;
      for (let i = 0; i < Math.min(5, rows.length); i++) {
        const row = rows[i];
        if (row.some(c => String(c).trim().length > 0)) { headerIdx = i; break; }
      }
      const headers = rows[headerIdx] ? rows[headerIdx].map(h => String(h).trim()) : [];
      const dataRows = rows.slice(headerIdx + 1).filter(r => r.some(c => String(c).trim()));
      results.push({
        sheetName,
        headers,
        sampleRows: dataRows.slice(0, maxSampleRows),
      });
    }
    return { sheets: results, sheetNames: workbook.SheetNames };
  } catch (e) {
    return { error: e.message };
  }
}

/** Get actual row count (all data rows) from first sheet */
function getExcelRowCount(filePath) {
  try {
    const workbook = XLSX.readFile(filePath);
    const ws = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    const nonEmpty = rows.filter(r => r.some(c => String(c).trim()));
    return Math.max(0, nonEmpty.length - 1); // minus header
  } catch (e) {
    return -1;
  }
}

function listFiles(dir, ext) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => ext ? f.toLowerCase().endsWith(ext) : true)
    .map(f => ({ name: f, fullPath: path.join(dir, f), size: fs.statSync(path.join(dir, f)).size }));
}

// ─── MAIN ───────────────────────────────────────────────────────────────────
console.log('\n' + '═'.repeat(70));
console.log(' PHASE 0 DISCOVERY REPORT — READ ONLY');
console.log('═'.repeat(70));

// ── A. New Excel voter files ─────────────────────────────────────────────────
const newExcelFiles = listFiles(FOLDERS.newExcel, '.xlsx');
console.log(`\n📁 Folder A: "uptaed voter list"`);
console.log(`   Total files: ${newExcelFiles.length} Excel files`);
const totalSizeA = newExcelFiles.reduce((s, f) => s + f.size, 0);
console.log(`   Total size:  ${bytesToMB(totalSizeA)} MB`);

// Sample 5 files spread across the list
const sampleIndices = [0, Math.floor(newExcelFiles.length * 0.25), Math.floor(newExcelFiles.length * 0.5), Math.floor(newExcelFiles.length * 0.75), newExcelFiles.length - 1];
const sampledFiles = [...new Set(sampleIndices)].map(i => newExcelFiles[i]).filter(Boolean);

console.log('\n   ── Sample file inspection (5 files sampled):');
let columnSets = new Set();
for (const f of sampledFiles) {
  const info = inspectExcel(f.fullPath);
  if (info.error) {
    console.log(`   ❌ ${f.name}: ${info.error}`);
  } else {
    const sheet = info.sheets[0];
    const rowCount = getExcelRowCount(f.fullPath);
    console.log(`\n   📄 ${f.name} (${bytesToKB(f.size)})`);
    console.log(`      Sheets: ${info.sheetNames.join(', ')}`);
    console.log(`      Headers [${sheet.headers.length}]: ${JSON.stringify(sheet.headers)}`);
    console.log(`      ~Rows: ${rowCount}`);
    console.log(`      Sample row 1: ${JSON.stringify(sheet.sampleRows[0] || [])}`);
    columnSets.add(JSON.stringify(sheet.headers));
  }
}

// Get ALL row counts in bulk
console.log('\n   ── Row count per file (all 145 files):');
let totalNewRows = 0;
const rowCountMap = {};
for (const f of newExcelFiles) {
  const rc = getExcelRowCount(f.fullPath);
  rowCountMap[f.name] = rc;
  if (rc > 0) totalNewRows += rc;
}
console.log(`   Total estimated rows across all new Excel files: ${totalNewRows.toLocaleString()}`);

// Show min/max/avg
const counts = Object.values(rowCountMap).filter(c => c >= 0);
console.log(`   Min rows in file: ${Math.min(...counts)}`);
console.log(`   Max rows in file: ${Math.max(...counts)}`);
console.log(`   Avg rows per file: ${Math.round(counts.reduce((a,b) => a+b, 0) / counts.length)}`);

// Find suspicious file
const bigFiles = newExcelFiles.filter(f => f.size > 900000);
if (bigFiles.length) {
  console.log(`\n   ⚠️  Large files (>900KB): ${bigFiles.map(f => f.name + ' ' + bytesToKB(f.size)).join(', ')}`);
}
const oddFiles = newExcelFiles.filter(f => !f.name.match(/^\d+_\d+\.xlsx$/));
if (oddFiles.length) {
  console.log(`   ⚠️  Non-standard names: ${oddFiles.map(f => f.name).join(', ')}`);
}

// ── B. PDF files ─────────────────────────────────────────────────────────────
const pdfFiles = listFiles(FOLDERS.pdfFolder);
console.log(`\n${'─'.repeat(70)}`);
console.log(`📁 Folder B: "updates voter list pdf"`);
console.log(`   Total files: ${pdfFiles.length}`);
for (const f of pdfFiles) {
  console.log(`   📄 ${f.name}`);
  console.log(`      Size: ${bytesToMB(f.size)} MB`);
  const ext = path.extname(f.name).toLowerCase();
  const looksLike = ext === '.pdf' ? 'PDF (needs OCR or text extraction)' : `Unknown extension: ${ext}`;
  console.log(`      Type: ${looksLike}`);
}

// ── C. Old Polling address files ─────────────────────────────────────────────
const pollingOldFiles = listFiles(FOLDERS.pollingOld, '.xlsx');
console.log(`\n${'─'.repeat(70)}`);
console.log(`📁 Folder C: "poling addres" (existing)`);
for (const f of pollingOldFiles) {
  console.log(`   📄 ${f.name} (${bytesToKB(f.size)})`);
  const info = inspectExcel(f.fullPath);
  if (!info.error) {
    const sheet = info.sheets[0];
    console.log(`      Headers: ${JSON.stringify(sheet.headers)}`);
    console.log(`      Sample: ${JSON.stringify(sheet.sampleRows[0] || [])}`);
    const rc = getExcelRowCount(f.fullPath);
    console.log(`      Rows: ~${rc}`);
  }
}

// ── D. New Polling address file ───────────────────────────────────────────────
const pollingNewFiles = listFiles(FOLDERS.pollingNew, '.xlsx');
console.log(`\n${'─'.repeat(70)}`);
console.log(`📁 Folder D: "new poling addres" (newly added)`);
for (const f of pollingNewFiles) {
  console.log(`   📄 ${f.name} (${bytesToKB(f.size)})`);
  const info = inspectExcel(f.fullPath);
  if (!info.error) {
    for (const sheet of info.sheets) {
      console.log(`   Sheet: ${sheet.sheetName}`);
      console.log(`   Headers [${sheet.headers.length}]: ${JSON.stringify(sheet.headers)}`);
      console.log(`   Sample row 1: ${JSON.stringify(sheet.sampleRows[0] || [])}`);
      console.log(`   Sample row 2: ${JSON.stringify(sheet.sampleRows[1] || [])}`);
    }
    const rc = getExcelRowCount(f.fullPath);
    console.log(`   Rows: ~${rc}`);
  } else {
    console.log(`   ❌ Error: ${info.error}`);
  }
}

// ── E. Existing excel-formate folder ─────────────────────────────────────────
const existingFiles = listFiles(FOLDERS.existingExcel);
console.log(`\n${'─'.repeat(70)}`);
console.log(`📁 Folder E: "excle-formate" (existing in DB already)`);
console.log(`   Total files: ${existingFiles.length} items`);

// ── F. Column mapping analysis ────────────────────────────────────────────────
console.log(`\n${'─'.repeat(70)}`);
console.log(`📊 Unique column-header sets found across sampled new Excel files:`);
let idx = 0;
for (const cs of columnSets) {
  console.log(`   Set ${++idx}: ${cs}`);
}

// Check part_number detection (first column or specific column)
console.log(`\n${'─'.repeat(70)}`);
console.log('✅ PHASE 0 COMPLETE — No writes performed. Awaiting your review.');
console.log('═'.repeat(70) + '\n');
