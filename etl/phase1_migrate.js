/**
 * PHASE 1 — RUN MIGRATION
 * Adds provenance columns to electors table.
 * Idempotent — safe to run twice.
 */
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

async function main() {
  console.log('\n' + '═'.repeat(70));
  console.log(' PHASE 1 — MIGRATION: Add provenance columns to electors');
  console.log('═'.repeat(70));

  // Run migration via rpc (raw SQL)
  const sql = `
    ALTER TABLE electors
      ADD COLUMN IF NOT EXISTS source_file       TEXT,
      ADD COLUMN IF NOT EXISTS import_batch_id   TEXT,
      ADD COLUMN IF NOT EXISTS imported_at       TIMESTAMPTZ;
  `;

  console.log('\n⏳ Running ALTER TABLE...');
  const { error } = await supabase.rpc('exec_sql', { query: sql }).single();

  if (error) {
    // Try via direct postgres connection approach
    // Supabase JS doesn't expose raw DDL via rpc by default — use the REST API workaround
    console.log('   Note: rpc exec_sql not available, trying alternative...');

    // Try adding columns one by one via a workaround
    const cols = [
      { name: 'source_file',     type: 'TEXT' },
      { name: 'import_batch_id', type: 'TEXT' },
      { name: 'imported_at',     type: 'TIMESTAMPTZ' },
    ];

    let allOk = true;
    for (const col of cols) {
      // Test if column exists by selecting it
      const { error: selectErr } = await supabase
        .from('electors')
        .select(col.name)
        .limit(1);

      if (!selectErr) {
        console.log(`   ✅ Column "${col.name}": already exists`);
      } else if (selectErr.code === '42703') {
        console.log(`   ⚠️  Column "${col.name}": MISSING — needs manual SQL`);
        allOk = false;
      } else {
        console.log(`   ❓ Column "${col.name}": ${selectErr.message}`);
      }
    }

    if (!allOk) {
      console.log('\n⚠️  The Supabase JS client cannot run DDL directly.');
      console.log('   Please run this SQL in your Supabase Dashboard → SQL Editor:');
      console.log('\n' + '─'.repeat(60));
      console.log(`ALTER TABLE electors
  ADD COLUMN IF NOT EXISTS source_file       TEXT,
  ADD COLUMN IF NOT EXISTS import_batch_id   TEXT,
  ADD COLUMN IF NOT EXISTS imported_at       TIMESTAMPTZ;`);
      console.log('─'.repeat(60));
      console.log('\nThen reply "migration done" to continue to Phase 2.\n');
    } else {
      console.log('\n✅ All provenance columns already exist — migration not needed!');
    }
  } else {
    console.log('✅ ALTER TABLE executed successfully.');

    // Verify
    const cols = ['source_file', 'import_batch_id', 'imported_at'];
    for (const col of cols) {
      const { error: verifyErr } = await supabase.from('electors').select(col).limit(1);
      console.log(`   ${verifyErr ? '❌' : '✅'} "${col}": ${verifyErr ? verifyErr.message : 'confirmed'}`);
    }
  }

  console.log('\n' + '═'.repeat(70) + '\n');
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
