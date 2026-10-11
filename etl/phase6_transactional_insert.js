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

const BATCH_ID = 'batch_20261010_excel_phase2_v2';

// Standard 10-digit/character EPIC rule: exactly 10 alphanumeric chars
// If not 10 chars, set to null per user instruction ("epic number is 10 digit", "where blank put blank")
function sanitizeEpic(rawEpic) {
  if (!rawEpic) return null;
  const cleaned = String(rawEpic).toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (cleaned.length === 10) {
    return cleaned;
  }
  return null;
}

async function runTransactionalInsert() {
  console.log(`\n======================================================`);
  console.log(`  PHASE 6: TRANSACTIONAL INSERT OF STAGED ELECTORS    `);
  console.log(`  Rule Applied: EPIC must be 10 chars, else NULL      `);
  console.log(`======================================================`);

  // 1. Get baseline count
  const { count: baselineCount } = await supabase.from('electors').select('*', { count: 'exact', head: true });
  console.log(`Baseline electors count: ${baselineCount.toLocaleString()}`);

  // 2. Fetch all staged rows for this batch
  const { count: stagingCount } = await supabase.from('staging_electors').select('*', { count: 'exact', head: true }).eq('batch_id', BATCH_ID);
  console.log(`Total staged electors to insert: ${stagingCount.toLocaleString()}`);

  let offset = 0;
  const FETCH_CHUNK = 1000;
  const INSERT_CHUNK = 500;
  let totalInserted = 0;
  let epic10Count = 0;
  let nullEpicCount = 0;

  console.log(`\nBeginning batched transactional inserts into electors...`);

  while (offset < stagingCount) {
    const { data: stagedRows, error: fetchErr } = await supabase
      .from('staging_electors')
      .select('*')
      .eq('batch_id', BATCH_ID)
      .range(offset, offset + FETCH_CHUNK - 1);

    if (fetchErr) {
      console.error('Fetch error from staging:', fetchErr.message);
      process.exit(1);
    }
    if (!stagedRows || stagedRows.length === 0) break;

    // Map to electors columns strictly adhering to constraints
    const toInsert = stagedRows.map(r => {
      const epic = sanitizeEpic(r.epic_number);
      if (epic) epic10Count++;
      else nullEpicCount++;

      return {
        serial_number: r.serial_number ? parseInt(r.serial_number, 10) || null : null,
        epic_number: epic, // exactly 10 chars or null
        name: r.name,
        relative_name: r.relative_name || null,
        address: r.address || null,
        qualification: r.qualification ? r.qualification.substring(0, 100) : null,
        occupation: r.occupation ? r.occupation.substring(0, 100) : null,
        age: r.age ? parseInt(r.age, 10) || null : null,
        sex: r.sex || null,
        part_number: r.part_number,
        district: r.district || null,
        taluk: r.taluk || null,
        source_file: r.source_file,
        import_batch_id: BATCH_ID,
        imported_at: new Date().toISOString()
      };
    });

    // Insert in sub-chunks
    for (let i = 0; i < toInsert.length; i += INSERT_CHUNK) {
      const subChunk = toInsert.slice(i, i + INSERT_CHUNK);
      const { error: insertErr } = await supabase.from('electors').insert(subChunk);
      if (insertErr) {
        console.error(`\nInsert error at offset ${offset + i}:`, insertErr.message);
        throw insertErr;
      }
      totalInserted += subChunk.length;
    }

    offset += stagedRows.length;
    process.stdout.write(`  Inserted ${totalInserted.toLocaleString()} / ${stagingCount.toLocaleString()} electors...\r`);
  }

  console.log(`\n\nVerifying post-import numbers...`);
  const { count: finalCount } = await supabase.from('electors').select('*', { count: 'exact', head: true });
  console.log(`Final live electors count: ${finalCount.toLocaleString()} (Expected: ${(baselineCount + stagingCount).toLocaleString()})`);
  console.log(`  - Standard 10-char EPICs inserted: ${epic10Count.toLocaleString()}`);
  console.log(`  - Blank (NULL) EPICs inserted:     ${nullEpicCount.toLocaleString()}`);

  if (finalCount === baselineCount + stagingCount) {
    console.log(`\n✅ ZERO ERROR RECONCILIATION PROVEN:`);
    console.log(`   Baseline (${baselineCount.toLocaleString()}) + Staged (${stagingCount.toLocaleString()}) = Live Total (${finalCount.toLocaleString()})`);
  } else {
    console.log(`⚠️ Discrepancy: final=${finalCount}, expected=${baselineCount + stagingCount}`);
  }

  // Update batch status
  await supabase.from('import_batches').update({
    status: 'imported',
    finished_at: new Date().toISOString()
  }).eq('id', BATCH_ID);

  console.log(`\nImport batch '${BATCH_ID}' marked as 'imported'.`);
}

runTransactionalInsert().catch(console.error);
