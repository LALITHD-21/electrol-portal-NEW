/**
 * PHASE 0 — DATABASE BASELINE PART 2 (READ ONLY)
 * Part/district distribution + staging table checks
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
  console.log('\n📊 PART 2: Part/District counts + staging table check\n');

  // Count by part_number via pagination
  let offset = 0;
  const PAGE = 1000;
  const partMap = {}, distMap = {};
  let total = 0;
  
  while (true) {
    const { data, error } = await supabase
      .from('electors')
      .select('part_number, district')
      .range(offset, offset + PAGE - 1);
    if (error || !data || data.length === 0) break;
    for (const r of data) {
      partMap[r.part_number || 'NULL'] = (partMap[r.part_number || 'NULL'] || 0) + 1;
      distMap[r.district || 'NULL'] = (distMap[r.district || 'NULL'] || 0) + 1;
    }
    total += data.length;
    offset += PAGE;
    if (data.length < PAGE) break;
  }

  console.log(`Total fetched: ${total.toLocaleString()}`);
  
  console.log('\n📊 By district:');
  Object.entries(distMap).sort((a,b)=>b[1]-a[1]).forEach(([d,c]) => console.log(`   ${d}: ${c.toLocaleString()}`));
  
  const parts = Object.entries(partMap).sort((a,b) => Number(a[0])-Number(b[0]));
  console.log(`\n📊 By part_number (${parts.length} distinct parts):`);
  parts.forEach(([p,c]) => console.log(`   Part ${p}: ${c.toLocaleString()}`));
  
  const partNums = parts.map(([p]) => Number(p)).filter(n => !isNaN(n)).sort((a,b)=>a-b);
  console.log(`\n   Range: Part ${partNums[0]} to Part ${partNums[partNums.length-1]}`);

  // Check staging tables
  console.log('\n📋 Staging table existence check:');
  for (const tbl of ['staging_electors', 'import_batches', 'import_results', 'quarantine_rows', 'polling_stations']) {
    try {
      const r = await supabase.from(tbl).select('id', { count: 'exact', head: true });
      if (r.error && r.error.code === 'PGRST116') console.log(`   ⚠️  "${tbl}": does not exist`);
      else if (r.error) console.log(`   ⚠️  "${tbl}": ${r.error.message}`);
      else console.log(`   ✅ "${tbl}": exists (${r.count} rows)`);
    } catch(e) { console.log(`   ⚠️  "${tbl}": ${e.message}`); }
  }

  // Check provenance columns on electors
  console.log('\n📋 Provenance columns on electors:');
  const { data: probeRow } = await supabase.from('electors').select('source_file').limit(1);
  if (probeRow !== null) console.log('   ✅ source_file: exists');
  else console.log('   ⚠️  source_file: MISSING (needs migration)');
  
  const { data: probeRow2 } = await supabase.from('electors').select('import_batch_id').limit(1);
  if (probeRow2 !== null) console.log('   ✅ import_batch_id: exists');
  else console.log('   ⚠️  import_batch_id: MISSING (needs migration)');

  console.log('\n✅ PHASE 0 COMPLETE.\n');
}
main().catch(e => console.error('Fatal:', e));
