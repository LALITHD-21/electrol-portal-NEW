const fs = require('fs');
const readline = require('readline');
const path = require('path');

const BACKUP_FILE = path.resolve(__dirname, 'reports/backup_2026-10-10/electors_backup.csv');

async function testBackupLoad() {
  const start = Date.now();
  console.log('Loading backup CSV into memory map...');
  const fileStream = fs.createReadStream(BACKUP_FILE);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let count = 0;
  let header = null;
  const map = new Map();

  for await (const line of rl) {
    if (!header) {
      header = line.split(',');
      continue;
    }
    // Extract epic_number (epic_number is col 2, but let's check index)
    // CSV format: id, serial_number, epic_number, ...
    count++;
    if (count % 50000 === 0) {
      process.stdout.write(`Loaded ${count.toLocaleString()} rows...\r`);
    }
  }

  console.log(`\nLoaded ${count.toLocaleString()} rows in ${(Date.now() - start) / 1000}s`);
}

testBackupLoad().catch(console.error);
