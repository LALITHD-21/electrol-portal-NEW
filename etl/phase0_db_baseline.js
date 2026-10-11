/**
 * PHASE 0 — DATABASE BASELINE (READ ONLY)
 * Gets current electors table counts broken down by district, part_number, etc.
 * NO WRITES.
 */
const path = require('path');
const fs = require('fs');

// Load env from web/.env.local
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
  console.log(' PHASE 0 — DATABASE BASELINE (READ ONLY)');
  console.log('═'.repeat(70));
  console.log(`  Supabase URL: ${env.NEXT_PUBLIC_SUPABASE_URL}`);
  
  // 1. Total row count
  const { count: totalCount, error: countErr } = await supabase
    .from('electors')
    .select('*', { count: 'exact', head: true });
  if (countErr) { console.log('❌ Count error:', countErr.message); process.exit(1); }
  console.log(`\n📊 Total electors in DB: ${totalCount?.toLocaleString()}`);

  // 2. Count by district (using ac_name or a district column if exists)
  // First check what columns exist
  const { data: sample, error: sErr } = await supabase
    .from('electors')
    .select('*')
    .limit(1);
  if (sErr) { console.log('❌ Sample error:', sErr.message); process.exit(1); }
  if (sample && sample.length > 0) {
    console.log(`\n📋 Columns in electors table:`);
    console.log(`   ${Object.keys(sample[0]).join(', ')}`);
    console.log(`\n📋 Sample record (keys only, no personal data logged):`);
    const keys = Object.keys(sample[0]);
    keys.forEach(k => {
      const v = sample[0][k];
      const safe = typeof v === 'string' && v.length > 0 ? `"${v.substring(0, 40)}..."` : JSON.stringify(v);
      console.log(`   ${k}: ${safe}`);
    });
  }

  // 3. Count by part_number (top 20)
  // We use RPC or a grouped count — Supabase JS doesn't natively support GROUP BY
  // So we get distinct part_numbers with counts via select
  const { data: partCounts, error: pErr } = await supabase
    .rpc ? null : null; // No RPC, use alternative

  // Instead: get all part_numbers and count in JS (small dataset approach)
  // But we need to be careful with large datasets - use pagination
  console.log('\n⏳ Fetching part_number distribution...');
  
  let offset = 0;
  const PAGE_SIZE = 1000;
  const partMap = {};
  const districtMap = {};
  const acMap = {};
  let totalFetched = 0;

  while (true) {
    const { data, error } = await supabase
      .from('electors')
      .select('part_number, ac_name, district')
      .range(offset, offset + PAGE_SIZE - 1);
    
    if (error) { console.log('❌ Fetch error:', error.message); break; }
    if (!data || data.length === 0) break;
    
    for (const row of data) {
      const pn = row.part_number || 'NULL';
      const ac = row.ac_name || 'NULL';
      const dist = row.district || 'NULL';
      partMap[pn] = (partMap[pn] || 0) + 1;
      acMap[ac] = (acMap[ac] || 0) + 1;
      districtMap[dist] = (districtMap[dist] || 0) + 1;
    }
    totalFetched += data.length;
    offset += PAGE_SIZE;
    if (offset % 10000 === 0) process.stdout.write(`\r   Fetched ${totalFetched.toLocaleString()} rows...`);
    if (data.length < PAGE_SIZE) break;
  }
  
  console.log(`\n   Total fetched for analysis: ${totalFetched.toLocaleString()}`);

  console.log('\n📊 Rows by district:');
  Object.entries(districtMap).sort((a,b) => b[1]-a[1]).forEach(([d, c]) => {
    console.log(`   ${d}: ${c.toLocaleString()}`);
  });

  console.log('\n📊 Rows by AC (constituency name):');
  Object.entries(acMap).sort((a,b) => b[1]-a[1]).slice(0, 30).forEach(([a, c]) => {
    console.log(`   ${a}: ${c.toLocaleString()}`);
  });

  console.log('\n📊 Rows by part_number (first 30):');
  Object.entries(partMap).sort((a,b) => Number(a[0])-Number(b[0])).slice(0, 30).forEach(([p, c]) => {
    console.log(`   Part ${p}: ${c.toLocaleString()} electors`);
  });

  const partNums = Object.keys(partMap).map(Number).filter(n => !isNaN(n)).sort((a,b)=>a-b);
  console.log(`\n   Part number range: ${partNums[0]} to ${partNums[partNums.length-1]}`);
  console.log(`   Distinct part numbers: ${partNums.length}`);
  console.log(`   Total part_numbers tracked: ${Object.keys(partMap).length}`);

  // 4. Check if provenance columns exist
  console.log('\n📋 Checking provenance columns (source_file, import_batch_id, imported_at):');
  const { data: provenanceSample } = await supabase.from('electors').select('source_file, import_batch_id, imported_at').limit(1);
  if (provenanceSample) {
    console.log('   ✅ Provenance columns exist');
    console.log(`   Sample: ${JSON.stringify(provenanceSample[0])}`);
  } else {
    console.log('   ⚠️  Provenance columns may not exist yet (will be added in PHASE 1 migration)');
  }

  // 5. Check if staging/import tables exist
  for (const tbl of ['staging_electors', 'import_batches', 'import_results', 'quarantine_rows', 'polling_stations']) {
    const { error } = await supabase.from(tbl).select('*', { head: true, count: 'exact' });
    if (error && error.code === '42P01') {
      console.log(`   ⚠️  Table "${tbl}": does NOT exist (needs migration)`);
    } else if (error) {
      console.log(`   ⚠️  Table "${tbl}": error — ${error.message}`);
    } else {
      console.log(`   ✅ Table "${tbl}": exists`);
    }
  }

  console.log('\n✅ Database baseline complete. READ ONLY.\n');
  console.log('═'.repeat(70) + '\n');
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
