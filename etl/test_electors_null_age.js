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

async function testElectorsNullAge() {
  const dummyEpic = 'TESTNULLAGE';
  const { data, error } = await supabase.from('electors').insert([{
    name: 'TEST NULL AGE PROBE',
    epic_number: dummyEpic,
    part_number: '999',
    age: null
  }]).select();

  if (error) {
    console.log('Error inserting null age:', error.message);
  } else {
    console.log('electors ALLOWS null age: YES! Successfully inserted!');
    await supabase.from('electors').delete().eq('epic_number', dummyEpic);
    console.log('Cleaned probe.');
  }
}

testElectorsNullAge().catch(console.error);
