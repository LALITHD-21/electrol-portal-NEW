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

async function checkNullEpic() {
  const { data, count, error } = await supabase
    .from('electors')
    .select('id, epic_number, name', { count: 'exact' })
    .is('epic_number', null)
    .limit(5);

  if (error) {
    console.log('Error checking null epic:', error.message);
  } else {
    console.log(`Electors with null epic_number in DB: ${count}`);
    if (data.length > 0) {
      console.log('Sample null epic record:', data[0]);
    }
  }

  // Also check empty string epic
  const { count: emptyCount } = await supabase
    .from('electors')
    .select('id', { count: 'exact', head: true })
    .eq('epic_number', '');
  console.log(`Electors with empty string '' epic_number: ${emptyCount}`);
}

checkNullEpic().catch(console.error);
