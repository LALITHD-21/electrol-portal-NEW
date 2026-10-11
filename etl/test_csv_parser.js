const fs = require('fs');
const readline = require('readline');
const path = require('path');

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
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        result.push(cur);
        cur = '';
      } else {
        cur += ch;
      }
    }
  }
  result.push(cur);
  return result;
}

async function testParser() {
  const fileStream = fs.createReadStream(BACKUP_FILE);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let lineCount = 0;
  let sampleRecord = null;
  const epicMap = new Map();

  for await (const line of rl) {
    if (lineCount === 0) {
      lineCount++;
      continue;
    }
    const cols = parseCsvLine(line);
    const epic = (cols[2] || '').trim().toUpperCase();
    if (epic) {
      epicMap.set(epic, {
        id: cols[0],
        name: cols[3],
        relative_name: cols[4],
        age: cols[8],
        sex: cols[9],
        part_number: cols[13]
      });
      if (!sampleRecord) sampleRecord = { epic, record: epicMap.get(epic) };
    }
    lineCount++;
  }

  console.log(`Parsed ${lineCount.toLocaleString()} lines.`);
  console.log(`Unique EPICs in database: ${epicMap.size.toLocaleString()}`);
  console.log('Sample record from map:', sampleRecord);
}

testParser().catch(console.error);
