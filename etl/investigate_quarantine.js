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

const BATCH_ID = 'batch_20261010_excel_phase2_v2';

async function investigateQuarantine() {
  console.log('=== INVESTIGATING QUARANTINED ROWS ===\n');

  // 1. missing_required_name
  const { data: missingNameRows, count: missingNameCount } = await supabase
    .from('quarantine_rows')
    .select('source_file, source_page_or_row, raw_data', { count: 'exact' })
    .eq('batch_id', BATCH_ID)
    .eq('reason', 'missing_required_name')
    .limit(20);

  console.log(`Total missing_required_name rows: ${missingNameCount}`);
  console.log('Sample missing_required_name rows:');
  missingNameRows.forEach(r => {
    console.log(`  [${r.source_file} ${r.source_page_or_row}]:`, JSON.stringify(r.raw_data));
  });

  // 2. invalid_epic
  const { data: invalidEpicRows, count: invalidEpicCount } = await supabase
    .from('quarantine_rows')
    .select('source_file, source_page_or_row, raw_data', { count: 'exact' })
    .eq('batch_id', BATCH_ID)
    .eq('reason', 'invalid_epic')
    .limit(20);

  console.log(`\nTotal invalid_epic rows: ${invalidEpicCount}`);
  console.log('Sample invalid_epic rows:');
  invalidEpicRows.forEach(r => {
    console.log(`  [${r.source_file} ${r.source_page_or_row}]:`, JSON.stringify(r.raw_data));
  });

  // 3. Check distribution of quarantine across files
  // Which files have the most missing_required_name?
  const fileCounts = {};
  let offset = 0;
  while (true) {
    const { data } = await supabase
      .from('quarantine_rows')
      .select('source_file, reason')
      .eq('batch_id', BATCH_ID)
      .range(offset, offset + 999);
    if (!data || data.length === 0) break;
    data.forEach(r => {
      fileCounts[r.source_file] = (fileCounts[r.source_file] || 0) + 1;
    });
    offset += data.length;
    if (data.length < 1000) break;
  }

  console.log('\nTop 10 files with highest quarantine counts:');
  const sortedFiles = Object.entries(fileCounts).sort((a,b)=>b[1]-a[1]).slice(0, 10);
  sortedFiles.forEach(([f, cnt]) => console.log(`  ${f}: ${cnt} rows`));
}

investigateQuarantine().catch(console.error);
