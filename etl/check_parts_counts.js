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

async function checkParts() {
  for (const p of ['32', '36', '112']) {
    const { count } = await supabase.from('electors').select('*', { count: 'exact', head: true }).eq('part_number', p);
    console.log(`Part ${p} current electors in DB: ${count.toLocaleString()}`);
  }
}

checkParts().catch(console.error);
