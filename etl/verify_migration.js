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

async function verify() {
  console.log('Verifying provenance columns in electors table...');
  const columns = ['source_file', 'import_batch_id', 'imported_at'];
  let allOk = true;

  for (const col of columns) {
    const { error } = await supabase.from('electors').select(col).limit(1);
    if (error) {
      console.log(`❌ ${col}: NOT FOUND (${error.message})`);
      allOk = false;
    } else {
      console.log(`✅ ${col}: Present and accessible`);
    }
  }

  if (allOk) {
    console.log('\nMigration verified successfully! Ready for Phase 2.');
  } else {
    console.log('\nSome columns are still missing.');
    process.exit(1);
  }
}

verify().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
