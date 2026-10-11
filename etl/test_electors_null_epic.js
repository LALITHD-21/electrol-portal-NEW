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

async function testElectorsConstraint() {
  // Let's test inserting a temporary dummy row with epic_number = null into electors
  const dummyEpic = 'TESTNULL999';
  const { error: insertErr } = await supabase.from('electors').insert([{
    name: 'TEST CONSTRAINT PROBE',
    epic_number: null,
    part_number: '999',
    age: null
  }]);

  if (insertErr) {
    console.log('Inserting NULL epic_number into electors failed as expected:');
    console.log('Error message:', insertErr.message);
    console.log('Error code:', insertErr.code);
  } else {
    console.log('electors ALLOWS null epic_number! Successfully inserted!');
    // Delete test row
    await supabase.from('electors').delete().eq('name', 'TEST CONSTRAINT PROBE').eq('part_number', '999');
  }
}

testElectorsConstraint().catch(console.error);
