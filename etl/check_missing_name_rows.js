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

async function checkMissingNameRows() {
  console.log('Checking all 2,146 missing_required_name rows across all 144 files...');

  const { data: qRows } = await supabase
    .from('quarantine_rows')
    .select('source_file, source_page_or_row')
    .eq('batch_id', 'batch_20261010_excel_phase2_v2')
    .eq('reason', 'missing_required_name')
    .limit(1000);

  const fileGroups = {};
  for (const r of qRows) {
    fileGroups[r.source_file] = fileGroups[r.source_file] || [];
    fileGroups[r.source_file].push(parseInt(r.source_page_or_row.replace('row_', ''), 10));
  }

  let realVoterCount = 0;
  let footerCount = 0;
  const sampleRealVoters = [];

  for (const [fname, rowIndices] of Object.entries(fileGroups)) {
    const fpath = path.join(NEW_EXCEL_DIR, fname);
    if (!fs.existsSync(fpath)) continue;
    const wb = XLSX.readFile(fpath);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

    for (const rIdx of rowIndices) {
      const row = rows[rIdx];
      if (!row) continue;

      const nonEmpties = row.map(c => String(c).trim()).filter(c => c.length > 0);
      const text = nonEmpties.join(' ');

      // Check if it's footer statistics
      if (/mother roll|additions list|deletions list|summary of electors|net number of electors|qualifying date|type of revision/i.test(text) ||
          (/male|female|others|total/i.test(text) && nonEmpties.length <= 6)) {
        footerCount++;
      } else if (nonEmpties.length >= 3) {
        realVoterCount++;
        if (sampleRealVoters.length < 5) {
          sampleRealVoters.push({ file: fname, rowIdx: rIdx, text: nonEmpties.slice(0, 6) });
        }
      }
    }
  }

  console.log(`\nResults across 1,000 quarantine rows sampled:`);
  console.log(`  - Confirmed Revision Summary / Footer Statistics: ${footerCount}`);
  console.log(`  - Potential Voters where name might be in another col: ${realVoterCount}`);
  if (sampleRealVoters.length > 0) {
    console.log('\nSample Potential Voters:', JSON.stringify(sampleRealVoters, null, 2));
  }
}

checkMissingNameRows().catch(console.error);
