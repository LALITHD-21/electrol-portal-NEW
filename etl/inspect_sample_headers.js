const path = require('path');
const fs = require('fs');
const XLSX = require(path.resolve(__dirname, '../web/node_modules/xlsx'));

const ROOT = path.resolve(__dirname, '..');
const NEW_EXCEL_DIR = path.join(ROOT, 'uptaed voter list');

const sampleFiles = [
  '100_1791587428.xlsx',
  '105_1791587543.xlsx',
  '40_1791587153.xlsx',
  '3_1791586937.xlsx',
  '99_1791587428.xlsx'
];

for (const f of sampleFiles) {
  console.log(`\n================== FILE: ${f} ==================`);
  const wb = XLSX.readFile(path.join(NEW_EXCEL_DIR, f));
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  for (let i = 0; i < Math.min(10, rows.length); i++) {
    const nonEmpties = rows[i]
      .map((c, colIdx) => ({ colIdx, val: String(c).trim() }))
      .filter(item => item.val.length > 0);
    if (nonEmpties.length > 0) {
      console.log(`Row [${i}]:`);
      nonEmpties.forEach(item => {
        console.log(`   col[${item.colIdx}]: "${item.val.replace(/[\r\n]+/g, ' ')}"`);
      });
    }
  }
}
