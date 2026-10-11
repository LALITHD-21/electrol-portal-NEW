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

async function inspectTables() {
  const tables = ['staging_electors', 'import_batches', 'import_results', 'quarantine_rows', 'polling_stations'];
  for (const t of tables) {
    console.log(`\n--- Table: ${t} ---`);
    const { data, error } = await supabase.from(t).select('*').limit(1);
    if (error) {
      console.log(`Error: ${error.message} (code: ${error.code})`);
    } else {
      console.log(`Columns (${data.length > 0 ? Object.keys(data[0]).length : 'empty table, testing via insert probe'}):`);
      if (data.length > 0) {
        console.log(Object.keys(data[0]).join(', '));
      }
    }
  }
}

inspectTables().catch(console.error);
