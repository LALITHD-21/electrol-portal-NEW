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

async function checkNullable() {
  // Let's test by checking staging_electors first
  const { data: stProbe, error: stErr } = await supabase.from('staging_electors').insert([{
    batch_id: 'batch_20261010_excel_phase2',
    name: 'TEST_PROBE',
    epic_number: null,
    age: null,
    sex: 'M',
    part_number: '999'
  }]).select();

  if (stErr) {
    console.log('staging_electors nullable probe error:', stErr.message);
  } else {
    console.log('staging_electors allows null epic_number and null age: YES');
    // clean up probe
    await supabase.from('staging_electors').delete().eq('id', stProbe[0].id);
  }
}

checkNullable().catch(console.error);
