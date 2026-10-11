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
  const { data: p56aux } = await supabase.from('electors').select('epic_number, part_number, serial_number, polling_station_name, polling_address').eq('part_number', 56).gt('serial_number', 600).limit(5);
  console.log('Part 56 aux electors:', p56aux);
}
check();
