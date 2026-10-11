const path = require('path');
const fs = require('fs');
const readline = require('readline');
const XLSX = require(path.resolve(__dirname, '../web/node_modules/xlsx'));

const ROOT = path.resolve(__dirname, '..');
const NEW_EXCEL_DIR = path.join(ROOT, 'uptaed voter list');
const BACKUP_FILE = path.resolve(__dirname, 'reports/backup_2026-10-10/electors_backup.csv');

function parseCsvLine(text) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ',') { result.push(cur); cur = ''; }
      else cur += ch;
    }
  }
  result.push(cur);
  return result;
}

async function analyzeBlankFields() {
  console.log('Loading baseline electors from backup CSV...');
  const fileStream = fs.createReadStream(BACKUP_FILE);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  const existingEpics = new Set();
  let lineCount = 0;
  for await (const line of rl) {
    if (lineCount === 0) { lineCount++; continue; }
    const cols = parseCsvLine(line);
    const epic = (cols[2] || '').trim().toUpperCase();
    if (epic) existingEpics.add(epic);
    lineCount++;
  }
  console.log(`Loaded ${existingEpics.size} existing EPICs.`);

  // Now scan the quarantine_rows JSON report or inspect files directly
  const repPath = path.resolve(__dirname, 'reports/dry_run_excel_phase2/excel_pre_import_report.json');
  const rep = JSON.parse(fs.readFileSync(repPath, 'utf8'));

  console.log('\n--- QUARANTINE BREAKDOWN FROM PREVIOUS RUN ---');
  console.log('Total Quarantined:', rep.summary.quarantined);
  console.log(rep.summary.quarantineReasons);

  // Group 1: invalid_age (has valid EPIC, age is blank or invalid)
  // Let's see how many of invalid_age are in existing DB
  const sampleAge = rep.sampleQuarantines.filter(q => q.reason === 'invalid_age');
  console.log('\nSample invalid_age rows (they have valid EPICs):');
  sampleAge.slice(0, 5).forEach(s => {
    console.log(`  EPIC: ${s.raw.rawEpic}, Name: ${s.raw.rawName}, Age: "${s.raw.rawAge}", in DB? ${existingEpics.has(s.raw.rawEpic)}`);
  });
}

analyzeBlankFields().catch(console.error);
