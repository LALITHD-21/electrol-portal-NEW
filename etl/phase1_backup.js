/**
 * PHASE 1 — BACKUP electors table to CSV
 * Exports ALL rows to etl/reports/backup_2026-10-10/electors_backup.csv
 * READ: full table export. NO WRITES to DB.
 */
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const envPath = path.resolve(__dirname, '../web/.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const m = line.match(/^([^=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
}
const { createClient } = require(path.resolve(__dirname, '../web/node_modules/@supabase/supabase-js'));
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const BACKUP_DIR = path.resolve(__dirname, 'reports/backup_2026-10-10');
const BACKUP_FILE = path.join(BACKUP_DIR, 'electors_backup.csv');
const META_FILE = path.join(BACKUP_DIR, 'backup_meta.json');

async function main() {
  console.log('\n' + '═'.repeat(70));
  console.log(' PHASE 1 — ELECTORS TABLE BACKUP');
  console.log('═'.repeat(70));

  let offset = 0;
  const PAGE = 1000;
  let totalRows = 0;
  let firstBatch = true;
  let columns = [];
  const hash = crypto.createHash('md5');
  const writeStream = fs.createWriteStream(BACKUP_FILE, { encoding: 'utf8' });

  console.log(`\n⏳ Exporting electors → ${BACKUP_FILE}`);

  while (true) {
    const { data, error } = await supabase
      .from('electors')
      .select('*')
      .order('id', { ascending: true })
      .range(offset, offset + PAGE - 1);

    if (error) { console.error('❌ Fetch error:', error.message); process.exit(1); }
    if (!data || data.length === 0) break;

    if (firstBatch) {
      columns = Object.keys(data[0]);
      const headerLine = columns.map(c => JSON.stringify(c)).join(',') + '\n';
      writeStream.write(headerLine);
      hash.update(headerLine);
      firstBatch = false;
    }

    for (const row of data) {
      const line = columns.map(c => {
        const v = row[c];
        if (v === null || v === undefined) return '';
        const s = String(v);
        if (s.includes(',') || s.includes('"') || s.includes('\n')) return JSON.stringify(s);
        return s;
      }).join(',') + '\n';
      writeStream.write(line);
      hash.update(line);
      totalRows++;
    }

    offset += PAGE;
    if (totalRows % 10000 === 0) process.stdout.write(`\r   Exported ${totalRows.toLocaleString()} rows...`);
    if (data.length < PAGE) break;
  }

  await new Promise(res => writeStream.end(res));
  const checksum = hash.digest('hex');
  const fileSize = fs.statSync(BACKUP_FILE).size;

  const meta = {
    backup_date: new Date().toISOString(),
    total_rows: totalRows,
    columns,
    checksum_md5: checksum,
    file_size_bytes: fileSize,
    file_size_mb: (fileSize / 1024 / 1024).toFixed(2),
    backup_file: BACKUP_FILE,
  };
  fs.writeFileSync(META_FILE, JSON.stringify(meta, null, 2));

  console.log(`\n\n✅ BACKUP COMPLETE`);
  console.log(`   File:     ${BACKUP_FILE}`);
  console.log(`   Rows:     ${totalRows.toLocaleString()}`);
  console.log(`   Size:     ${meta.file_size_mb} MB`);
  console.log(`   MD5:      ${checksum}`);
  console.log(`   Metadata: ${META_FILE}`);
  console.log('═'.repeat(70) + '\n');
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
