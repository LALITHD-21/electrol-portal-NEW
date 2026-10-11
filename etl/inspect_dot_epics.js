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

async function inspectDotEpics() {
  const { data, count } = await supabase
    .from('quarantine_rows')
    .select('*', { count: 'exact' })
    .eq('reason', 'invalid_epic')
    .limit(10);

  console.log(`Total invalid_epic rows in quarantine_rows: ${count}`);
  data.forEach((r, idx) => {
    console.log(`[${idx}] ${r.source_file} ${r.source_page_or_row}: Name: "${r.raw_data.rawName}", Age: "${r.raw_data.rawAge}", Sex: "${r.raw_data.rawSex}", EPIC: "${r.raw_data.rawEpic}"`);
  });
}

inspectDotEpics().catch(console.error);
