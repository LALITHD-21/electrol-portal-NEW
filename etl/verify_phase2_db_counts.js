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

async function check() {
  const electors = await supabase.from('electors').select('*', { count: 'exact', head: true });
  const staging = await supabase.from('staging_electors').select('*', { count: 'exact', head: true });
  const quarantine = await supabase.from('quarantine_rows').select('*', { count: 'exact', head: true });
  const results = await supabase.from('import_results').select('*', { count: 'exact', head: true });
  const batch = await supabase.from('import_batches').select('*').eq('id', 'batch_20261010_excel_phase2').single();

  console.log('=== SUPABASE LIVE ROW COUNTS ===');
  console.log('electors (live table):   ', electors.count, '(MUST BE 223,789)');
  console.log('staging_electors:        ', staging.count, '(MUST BE 14,467)');
  console.log('quarantine_rows:         ', quarantine.count, '(MUST BE 23,472)');
  console.log('import_results:          ', results.count, '(MUST BE 138,051)');
  console.log('import_batches status:   ', batch.data ? batch.data.status : 'not found');
}

check().catch(console.error);
