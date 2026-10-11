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

async function inspectAllQuarantine() {
  console.log('Fetching all 2,146 missing_required_name quarantine rows...');
  let offset = 0;
  const allRows = [];
  while (true) {
    const { data } = await supabase
      .from('quarantine_rows')
      .select('source_file, source_page_or_row, raw_data')
      .eq('batch_id', 'batch_20261010_excel_phase2_v2')
      .eq('reason', 'missing_required_name')
      .range(offset, offset + 999);
    if (!data || data.length === 0) break;
    allRows.push(...data);
    offset += data.length;
    if (data.length < 1000) break;
  }

  const cache = {};
  const notFooters = [];

  for (const r of allRows) {
    const fname = r.source_file;
    const rIdx = parseInt(r.source_page_or_row.replace('row_', ''), 10);
    if (!cache[fname]) {
      const fpath = path.join(NEW_EXCEL_DIR, fname);
      if (!fs.existsSync(fpath)) continue;
      cache[fname] = XLSX.utils.sheet_to_json(XLSX.readFile(fpath).Sheets[XLSX.readFile(fpath).SheetNames[0]], { header: 1, defval: '' });
    }
    const rows = cache[fname];
    const row = rows[rIdx];
    if (!row) continue;

    const nonEmpties = row.map(c => String(c).trim()).filter(c => c.length > 0);
    const text = nonEmpties.join(' | ');

    // Patterns that identify pure statistical revision summaries / table footers / headers:
    const isPureFooter = (
      /mother roll|additions list|deletions list|summary of electors|net electors|net number of electors|qualifying date|type of revision|continuous revision|summary revision|original roll/i.test(text) ||
      /page\s*\d+\s*of\s*\d+/i.test(text) ||
      /electoral rolls?,?\s*202/i.test(text) ||
      /section no|assembly constituency|constituency number|part no|polling station/i.test(text) ||
      /i\.\s*original|ii\.\s*additions|iii\.\s*deletions|i\.\s*modification/i.test(text) ||
      /a\.\s*number of electors|b\.\s*number of modifications/i.test(text) ||
      /karnataka\s+south\s+east/i.test(text) ||
      /name\s+of\s+graduate|constituency\s+number/i.test(text) ||
      /male\s*\|\s*female|men\s*\|\s*women/i.test(text) ||
      (/^(\d+\s*\|\s*)+\d+$/.test(text)) || // row of pure numbers like "10 | 20 | 0 | 30"
      (/photo\s*available/i.test(text) && nonEmpties.length <= 2)
    );

    if (!isPureFooter) {
      notFooters.push({ fname, rIdx, nonEmpties, text });
    }
  }

  console.log(`Total missing_required_name inspected: ${allRows.length}`);
  console.log(`Rows that are NOT pure headers/footers: ${notFooters.length}`);
  for (const item of notFooters) {
    console.log(`[${item.fname} row ${item.rIdx}]: ${item.text}`);
  }
}

inspectAllQuarantine().catch(console.error);
