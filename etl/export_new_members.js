const path = require('path');
const fs = require('fs');
const XLSX = require(path.resolve(__dirname, '../web/node_modules/xlsx'));

const envPath = path.resolve(__dirname, '../web/.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const m = line.match(/^([^=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
}

const { createClient } = require(path.resolve(__dirname, '../web/node_modules/@supabase/supabase-js'));
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const ROOT = path.resolve(__dirname, '..');
const EXPORT_CSV = path.join(ROOT, 'new_members_complete_list_2026.csv');
const EXPORT_XLSX = path.join(ROOT, 'new_members_complete_list_2026.xlsx');

async function exportAllNewMembers() {
  console.log('Exporting all new and recovered electors...');

  const { count, error: countErr } = await supabase
    .from('electors')
    .select('id', { count: 'exact', head: true })
    .in('import_batch_id', ['batch_20261010_excel_phase2_v2', 'batch_quarantine_recovery', 'batch_zero_drop_recovery']);

  if (countErr) {
    console.error('Count error:', countErr);
    process.exit(1);
  }
  console.log(`Total new electors to export: ${(count || 0).toLocaleString()}`);

  let offset = 0;
  const CHUNK = 1000;
  const allRows = [];

  while (offset < count) {
    const { data, error } = await supabase
      .from('electors')
      .select('serial_number, epic_number, name, relative_name, age, sex, part_number, address, qualification, occupation, district, taluk, polling_station_name, polling_address, source_file')
      .in('import_batch_id', ['batch_20261010_excel_phase2_v2', 'batch_quarantine_recovery', 'batch_zero_drop_recovery'])
      .order('part_number', { ascending: true })
      .range(offset, offset + CHUNK - 1);

    if (error) {
      console.error('Fetch error:', error.message);
      process.exit(1);
    }
    if (!data || data.length === 0) break;

    allRows.push(...data);
    offset += data.length;
    process.stdout.write(`Fetched ${allRows.length.toLocaleString()} / ${count.toLocaleString()} rows...\r`);
  }

  console.log(`\nFetched all ${allRows.length.toLocaleString()} new electors.`);

  // 1. Export CSV
  const csvHeaders = ['Sl No', 'EPIC Number', 'Name', 'Relative Name', 'Age', 'Sex', 'Part Number', 'Polling Station Name', 'Polling Address', 'Address', 'Qualification', 'Occupation', 'District', 'Taluk', 'Source File'];
  const csvLines = [csvHeaders.join(',')];

  for (const r of allRows) {
    const vals = [
      r.serial_number ?? '',
      r.epic_number ?? 'NO_EPIC',
      r.name ? `"${r.name.replace(/"/g, '""')}"` : '',
      r.relative_name ? `"${r.relative_name.replace(/"/g, '""')}"` : '',
      r.age ?? '',
      r.sex ?? '',
      r.part_number ?? '',
      r.polling_station_name ? `"${r.polling_station_name.replace(/"/g, '""')}"` : '',
      r.polling_address ? `"${r.polling_address.replace(/"/g, '""')}"` : '',
      r.address ? `"${r.address.replace(/"/g, '""')}"` : '',
      r.qualification ? `"${r.qualification.replace(/"/g, '""')}"` : '',
      r.occupation ? `"${r.occupation.replace(/"/g, '""')}"` : '',
      r.district ?? '',
      r.taluk ?? '',
      r.source_file ?? ''
    ];
    csvLines.push(vals.join(','));
  }
  fs.writeFileSync(EXPORT_CSV, csvLines.join('\n'), 'utf8');

  // 2. Export Excel (.xlsx)
  const wsData = [csvHeaders];
  for (const r of allRows) {
    wsData.push([
      r.serial_number ?? '',
      r.epic_number ?? 'NO_EPIC',
      r.name ?? '',
      r.relative_name ?? '',
      r.age ?? '',
      r.sex ?? '',
      r.part_number ?? '',
      r.polling_station_name ?? '',
      r.polling_address ?? '',
      r.address ?? '',
      r.qualification ?? '',
      r.occupation ?? '',
      r.district ?? '',
      r.taluk ?? '',
      r.source_file ?? ''
    ]);
  }
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, 'New Members 2026');
  XLSX.writeFile(wb, EXPORT_XLSX);

  console.log(`\n✅ EXPORT SUCCESSFUL!`);
  console.log(`  - Excel File: ${EXPORT_XLSX} (${(fs.statSync(EXPORT_XLSX).size / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`  - CSV File:   ${EXPORT_CSV} (${(fs.statSync(EXPORT_CSV).size / 1024 / 1024).toFixed(2)} MB)`);
}

exportAllNewMembers().catch(console.error);
