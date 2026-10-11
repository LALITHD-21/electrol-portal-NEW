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

async function generatePhase5Report() {
  const electors = await supabase.from('electors').select('*', { count: 'exact', head: true });
  const staging = await supabase.from('staging_electors').select('*', { count: 'exact', head: true });
  const quarantine = await supabase.from('quarantine_rows').select('*', { count: 'exact', head: true });
  const polling = await supabase.from('polling_stations').select('*', { count: 'exact', head: true });
  const batch = await supabase.from('import_batches').select('*').eq('id', 'batch_20261010_excel_phase2_v2').single();

  const baseline = electors.count;
  const newValid = staging.count;
  const projected = baseline + newValid;

  console.log('=== PHASE 5 RECONCILIATION SUMMARY ===');
  console.log(`Baseline Electors:       ${baseline.toLocaleString()}`);
  console.log(`New Valid Staged:         ${newValid.toLocaleString()}`);
  console.log(`Projected Total:          ${projected.toLocaleString()}`);
  console.log(`Quarantined Rows:         ${quarantine.count.toLocaleString()}`);
  console.log(`Polling Stations:         ${polling.count.toLocaleString()}`);
}

generatePhase5Report().catch(console.error);
