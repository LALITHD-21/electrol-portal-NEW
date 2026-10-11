const path = require('path');
const fs = require('fs');

const envPath = path.resolve(__dirname, '../web/.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const m = line.match(/^([^=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
}

const { createClient } = require(path.resolve(__dirname, '../web/node_modules/@supabase/supabase-js'));
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const XLSX = require(path.resolve(__dirname, '../web/node_modules/xlsx'));
const ROOT = path.resolve(__dirname, '..');
const NEW_EXCEL_DIR = path.join(ROOT, 'uptaed voter list');

async function inspectRemainingQuarantine() {
  console.log('Fetching all remaining rows in quarantine_rows...');

  let offset = 0;
  const allQuarantine = [];
  while (true) {
    const { data } = await supabase
      .from('quarantine_rows')
      .select('*')
      .range(offset, offset + 999);
    if (!data || data.length === 0) break;
    allQuarantine.push(...data);
    offset += data.length;
    if (data.length < 1000) break;
  }

  console.log(`Total records in quarantine_rows: ${allQuarantine.length}`);

  // Inspect the raw Excel rows for these quarantined items!
  const byFile = {};
  for (const q of allQuarantine) {
    byFile[q.source_file] = byFile[q.source_file] || [];
    byFile[q.source_file].push(q);
  }

  console.log(`Quarantine spans ${Object.keys(byFile).length} files.`);

  // Sample inspection of actual Excel rows
  let genuineVoterInQuarantine = 0;
  const sampleReal = [];

  for (const [fname, items] of Object.entries(byFile).slice(0, 10)) {
    const fpath = path.join(NEW_EXCEL_DIR, fname);
    if (!fs.existsSync(fpath)) continue;
    const wb = XLSX.readFile(fpath);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

    for (const item of items) {
      const rowIdx = parseInt(item.source_page_or_row.replace('row_', ''), 10);
      const row = rows[rowIdx];
      if (!row) continue;

      // Check if any text in this row looks like a human name or address
      const nonEmpties = row.map(c => String(c).trim()).filter(c => c.length > 0);
      const rowText = nonEmpties.join(' | ');

      // Does it look like footer totals? e.g. "Male", "Female", "Total", numbers
      const isFooter = /total|male|female|others|qualifying date|type of revision/i.test(rowText) && nonEmpties.length < 5;
      
      if (!isFooter && nonEmpties.length > 2) {
        genuineVoterInQuarantine++;
        if (sampleReal.length < 10) {
          sampleReal.push({ file: fname, rowIdx, nonEmpties });
        }
      }
    }
  }

  console.log(`\nSample Real-looking rows in quarantine sample: ${genuineVoterInQuarantine}`);
  if (sampleReal.length > 0) {
    console.log(JSON.stringify(sampleReal, null, 2));
  }
}

inspectRemainingQuarantine().catch(console.error);
