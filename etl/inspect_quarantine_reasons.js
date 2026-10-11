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

async function inspectQuarantined() {
  const { data: ageRows } = await supabase
    .from('quarantine_rows')
    .select('*')
    .eq('reason', 'invalid_age')
    .limit(10);

  console.log('Sample invalid_age quarantined rows (Total: 6,981):');
  ageRows.forEach(r => console.log(r.source_file, r.source_page_or_row, r.raw_data));

  const { data: epicRows } = await supabase
    .from('quarantine_rows')
    .select('*')
    .eq('reason', 'invalid_epic')
    .limit(10);

  console.log('\nSample invalid_epic quarantined rows (Total: 16,319):');
  epicRows.forEach(r => console.log(r.source_file, r.source_page_or_row, r.raw_data));
}

inspectQuarantined().catch(console.error);
