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

async function checkLongEpics() {
  const { data } = await supabase
    .from('staging_electors')
    .select('epic_number, source_file, source_page_or_row')
    .eq('batch_id', 'batch_20261010_excel_phase2_v2')
    .not('epic_number', 'is', null)
    .limit(1000);

  const longEpics = data.filter(x => x.epic_number.length > 11);
  console.log('EPICs with length > 11 in first 1000 rows:', longEpics.length);
  if (longEpics.length > 0) {
    console.log('Sample long EPICs:', longEpics.slice(0, 10));
  }
}

checkLongEpics().catch(console.error);
