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

async function testUpsert() {
  console.log('Testing upsert on test elector...');
  // 1. Insert test elector
  await supabase.from('electors').insert([{
    epic_number: 'TESTUPSERT1',
    name: 'Old Name',
    age: 30,
    district: null
  }]);

  // 2. Upsert with updated values
  const { error: upsertErr } = await supabase.from('electors').upsert([{
    epic_number: 'TESTUPSERT1',
    name: 'Updated Name',
    age: 31,
    district: 'TUMKUR'
  }], { onConflict: 'epic_number' });

  if (upsertErr) {
    console.log('Upsert error:', upsertErr.message);
  } else {
    // 3. Verify
    const { data } = await supabase.from('electors').select('*').eq('epic_number', 'TESTUPSERT1').single();
    console.log('✅ Upsert succeeded! Result:', data.name, data.age, data.district);
    // Cleanup
    await supabase.from('electors').delete().eq('epic_number', 'TESTUPSERT1');
    console.log('Cleaned probe.');
  }
}

testUpsert().catch(console.error);
