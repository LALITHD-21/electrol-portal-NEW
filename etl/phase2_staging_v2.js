const path = require('path');
const fs = require('fs');
const readline = require('readline');
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
const NEW_EXCEL_DIR = path.join(ROOT, 'uptaed voter list');
const BACKUP_FILE = path.resolve(__dirname, 'reports/backup_2026-10-10/electors_backup.csv');
const BATCH_ID = 'batch_20261010_excel_phase2_v2';

const EPIC_STANDARD_REGEX = /^[A-Z]{3}\d{7}$/;
const EPIC_LEGACY_REGEX = /^[A-Z0-9]{8,16}$/;

function cleanString(val) {
  if (val === null || val === undefined) return '';
  return String(val).replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function parseCsvLine(text) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ',') { result.push(cur); cur = ''; }
      else cur += ch;
    }
  }
  result.push(cur);
  return result;
}

async function loadExistingElectors() {
  console.log('Loading baseline electors from backup CSV...');
  const fileStream = fs.createReadStream(BACKUP_FILE);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let lineCount = 0;
  const epicMap = new Map();
  const namePartMap = new Set(); // "name|part_number"

  for await (const line of rl) {
    if (lineCount === 0) { lineCount++; continue; }
    const cols = parseCsvLine(line);
    const epic = (cols[2] || '').trim().toUpperCase();
    const name = (cols[3] || '').trim().toLowerCase();
    const part = (cols[13] || '').trim();

    if (epic) {
      epicMap.set(epic, {
        id: cols[0],
        serial_number: cols[1],
        epic_number: epic,
        name: (cols[3] || '').trim(),
        relative_name: (cols[4] || '').trim(),
        address: (cols[5] || '').trim(),
        qualification: (cols[6] || '').trim(),
        occupation: (cols[7] || '').trim(),
        age: (cols[8] || '').trim(),
        sex: (cols[9] || '').trim().toUpperCase(),
        part_number: part
      });
    }

    if (name && part) {
      namePartMap.add(`${name}|${part}`);
    }
    lineCount++;
  }

  console.log(`Loaded ${epicMap.size.toLocaleString()} existing electors into memory.`);
  return { epicMap, namePartMap };
}

function cleanAndValidateRow(row, colMap, fileMeta, rowIndex) {
  const rawSerial = cleanString(row[colMap.serial_number]);
  const rawName = cleanString(row[colMap.name]);
  const rawRelative = cleanString(row[colMap.relative_name]);
  const rawAddress = cleanString(row[colMap.address]);
  const rawQual = cleanString(row[colMap.qualification]);
  const rawOcc = cleanString(row[colMap.occupation]);
  const rawAge = cleanString(row[colMap.age]);
  const rawSex = cleanString(row[colMap.sex]).toUpperCase();
  const rawEpic = cleanString(row[colMap.epic_number]).toUpperCase().replace(/[^A-Z0-9]/g, '');

  if (!rawName && !rawEpic && !rawSerial) return { isSkip: true };
  if (/name of the elector/i.test(rawName) || /epic number/i.test(rawEpic) || /male|female|others|total/i.test(rawName)) return { isSkip: true };

  // Validate Name (mandatory)
  if (!rawName || rawName.length < 2 || /^\d+$/.test(rawName) || ['TEST', 'N/A', 'UNKNOWN', 'NULL', 'NONE'].includes(rawName.toUpperCase())) {
    return {
      isValid: false,
      reason: 'missing_required_name',
      raw: { rowNumber: rowIndex, rawEpic, rawName, rawAge, rawSex }
    };
  }

  // Validate Age (optional: if blank, set to null per Option A)
  let cleanAge = null;
  if (rawAge) {
    const ageNum = parseInt(rawAge, 10);
    if (!isNaN(ageNum) && ageNum >= 18 && ageNum <= 120) {
      cleanAge = String(ageNum);
    }
  }

  // Validate Sex (optional: if blank, set to null per Option A)
  let cleanSex = null;
  if (rawSex === 'M' || rawSex === 'MALE') cleanSex = 'M';
  else if (rawSex === 'F' || rawSex === 'FEMALE') cleanSex = 'F';
  else if (rawSex === 'O' || rawSex === 'OTHER' || rawSex === 'OTHERS') cleanSex = 'O';

  // Validate EPIC (optional: if blank / '.', set to null per Option A)
  let cleanEpic = null;
  if (rawEpic && rawEpic !== '.') {
    if (EPIC_STANDARD_REGEX.test(rawEpic) || EPIC_LEGACY_REGEX.test(rawEpic)) {
      cleanEpic = rawEpic;
    } else {
      // Malformed string that isn't a blank or valid epic
      return {
        isValid: false,
        reason: 'invalid_epic',
        raw: { rowNumber: rowIndex, rawEpic, rawName, rawAge, rawSex }
      };
    }
  }

  return {
    isValid: true,
    data: {
      serial_number: rawSerial || null,
      epic_number: cleanEpic, // null if blank
      name: rawName,
      relative_name: rawRelative || null,
      address: rawAddress || null,
      qualification: rawQual || null,
      occupation: rawOcc || null,
      age: cleanAge, // null if blank
      sex: cleanSex, // null if blank
      part_number: fileMeta.partNumber,
      district: fileMeta.district || null,
      taluk: fileMeta.taluk || null,
      source_file: fileMeta.fileName,
      source_page_or_row: `row_${rowIndex}`,
      batch_id: BATCH_ID
    }
  };
}

async function insertInBatches(table, items, batchSize = 500) {
  if (items.length === 0) return;
  console.log(`Writing ${items.length.toLocaleString()} rows into table '${table}' in chunks of ${batchSize}...`);
  for (let i = 0; i < items.length; i += batchSize) {
    const chunk = items.slice(i, i + batchSize);
    const { error } = await supabase.from(table).insert(chunk);
    if (error) {
      console.error(`Error inserting chunk ${i} - ${i + chunk.length} into ${table}:`, error.message);
      throw error;
    }
    if ((i + chunk.length) % 2500 === 0 || i + chunk.length >= items.length) {
      process.stdout.write(`  Wrote ${(i + chunk.length).toLocaleString()} / ${items.length.toLocaleString()} rows...\r`);
    }
  }
  console.log(`\nFinished writing ${items.length.toLocaleString()} rows into ${table}.`);
}

async function runUpdatedPipeline() {
  const startTime = Date.now();
  console.log(`\n======================================================`);
  console.log(`  STARTING PHASE 2 REFINED STAGING (${BATCH_ID}) `);
  console.log(`  Option A: Blank Age & Blank EPIC allowed as NULL   `);
  console.log(`======================================================`);

  const allFiles = fs.readdirSync(NEW_EXCEL_DIR)
    .filter(f => f.toLowerCase().endsWith('.xlsx') && !f.startsWith('~$') && f !== '2nd page.xlsx')
    .sort();

  // 1. Initialize batch
  console.log(`Initializing batch record in Supabase...`);
  await supabase.from('import_batches').upsert({
    id: BATCH_ID,
    started_at: new Date().toISOString(),
    status: 'processing',
    files: allFiles,
    operator: 'phase2_option_a'
  });

  // 2. Load existing DB electors
  const { epicMap, namePartMap } = await loadExistingElectors();

  // 3. Process all 144 files
  const stagingElectorsBuffer = [];
  const quarantineRowsBuffer = [];
  const importResultsBuffer = [];

  const summary = {
    totalFilesProcessed: 0,
    totalRowsRead: 0,
    skippedHeaderOrEmpty: 0,
    newValid: 0,
    newValidWithEpic: 0,
    newValidBlankEpic: 0,
    duplicateExisting: 0,
    duplicateInBatchIdentical: 0,
    duplicateInBatchConflict: 0,
    quarantined: 0,
    quarantineReasons: {}
  };

  const batchSeenEpics = new Map();
  const batchSeenNamePart = new Set();

  for (let fileIdx = 0; fileIdx < allFiles.length; fileIdx++) {
    const f = allFiles[fileIdx];
    summary.totalFilesProcessed++;

    const fullPath = path.join(NEW_EXCEL_DIR, f);
    const wb = XLSX.readFile(fullPath);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

    let partNumber = null, district = null, taluk = null;
    for (let i = 0; i < Math.min(15, rows.length); i++) {
      for (let j = 0; j < rows[i].length; j++) {
        const val = String(rows[i][j]).trim();
        if (/taluk\/town\/city/i.test(val)) {
          const tMatch = val.match(/taluk\/town\/city\s*:\s*([^:\r\n]+?)(?:\s+district|$)/i);
          if (tMatch) taluk = tMatch[1].trim();
          const dMatch = val.match(/district\s*:\s*([^:\r\n]+?)(?:$|\s+taluk)/i);
          if (dMatch) district = dMatch[1].trim();
        }
        if (/part\s*no\s*[:\s]*\d+/i.test(val)) {
          const pMatch = val.match(/part\s*no\s*[:\s]*(\d+)/i);
          if (pMatch) partNumber = pMatch[1].trim();
        }
      }
    }
    if (!partNumber) {
      const fnMatch = f.match(/^(\d+)_/);
      if (fnMatch) partNumber = fnMatch[1];
    }

    const fileMeta = { partNumber, district, taluk, fileName: f };

    let headerRowIdx = -1;
    let colMap = {};
    for (let i = 0; i < Math.min(20, rows.length); i++) {
      const row = rows[i];
      let hasName = false, hasEpic = false;
      for (let j = 0; j < row.length; j++) {
        const v = String(row[j]).toLowerCase();
        if (v.includes('name of the elector') || v.includes('elector name')) hasName = true;
        if (v.includes('epic') || v.includes('voter id')) hasEpic = true;
      }
      if (hasName && hasEpic) {
        headerRowIdx = i;
        break;
      }
    }

    if (headerRowIdx !== -1) {
      const hRow = rows[headerRowIdx];
      for (let j = 0; j < hRow.length; j++) {
        const v = String(hRow[j]).toLowerCase().replace(/[\r\n]+/g, ' ').trim();
        if (/s[i|l]\.?\s*no/i.test(v)) colMap.serial_number = j;
        else if (/name of the elector|elector name/i.test(v)) colMap.name = j;
        else if (/father|mother|husband/i.test(v)) colMap.relative_name = j;
        else if (/address/i.test(v)) colMap.address = j;
        else if (/qualification/i.test(v)) colMap.qualification = j;
        else if (/occupation/i.test(v)) colMap.occupation = j;
        else if (/age/i.test(v)) colMap.age = j;
        else if (/sex|gender/i.test(v)) colMap.sex = j;
        else if (/epic/i.test(v)) colMap.epic_number = j;
      }
    }

    const startRow = headerRowIdx >= 0 ? headerRowIdx + 1 : 9;
    for (let r = startRow; r < rows.length; r++) {
      summary.totalRowsRead++;
      const rowResult = cleanAndValidateRow(rows[r], colMap, fileMeta, r);

      if (rowResult.isSkip) {
        summary.skippedHeaderOrEmpty++;
        continue;
      }

      if (!rowResult.isValid) {
        summary.quarantined++;
        summary.quarantineReasons[rowResult.reason] = (summary.quarantineReasons[rowResult.reason] || 0) + 1;
        quarantineRowsBuffer.push({
          batch_id: BATCH_ID,
          source_file: f,
          source_page_or_row: `row_${r}`,
          raw_data: rowResult.raw,
          reason: rowResult.reason
        });
        continue;
      }

      const voter = rowResult.data;
      const epic = voter.epic_number;

      // Case 1: Voter HAS an EPIC number
      if (epic) {
        if (epicMap.has(epic)) {
          summary.duplicateExisting++;
          importResultsBuffer.push({
            batch_id: BATCH_ID,
            epic_number: epic,
            classification: 'duplicate_existing',
            reason: 'existing_in_db',
            source_file: f,
            source_page_or_row: `row_${r}`
          });
        } else if (batchSeenEpics.has(epic)) {
          const prev = batchSeenEpics.get(epic);
          if (prev.name.toLowerCase() === voter.name.toLowerCase() && prev.part_number === voter.part_number) {
            summary.duplicateInBatchIdentical++;
          } else {
            summary.duplicateInBatchConflict++;
            summary.quarantined++;
            summary.quarantineReasons['duplicate_in_batch_conflict'] = (summary.quarantineReasons['duplicate_in_batch_conflict'] || 0) + 1;
            quarantineRowsBuffer.push({
              batch_id: BATCH_ID,
              source_file: f,
              source_page_or_row: `row_${r}`,
              raw_data: { current: voter, previous: prev },
              reason: 'duplicate_in_batch_conflict'
            });
          }
        } else {
          summary.newValid++;
          summary.newValidWithEpic++;
          batchSeenEpics.set(epic, voter);
          stagingElectorsBuffer.push(voter);
          importResultsBuffer.push({
            batch_id: BATCH_ID,
            epic_number: epic,
            classification: 'new_valid',
            reason: 'new_with_epic',
            source_file: f,
            source_page_or_row: `row_${r}`
          });
        }
      }
      // Case 2: Voter has NO EPIC (blank / dot)
      else {
        const namePartKey = `${voter.name.toLowerCase()}|${voter.part_number}`;
        if (namePartMap.has(namePartKey)) {
          summary.duplicateExisting++;
          importResultsBuffer.push({
            batch_id: BATCH_ID,
            epic_number: null,
            classification: 'duplicate_existing',
            reason: 'matched_by_name_and_part_in_db',
            source_file: f,
            source_page_or_row: `row_${r}`
          });
        } else if (batchSeenNamePart.has(namePartKey)) {
          summary.duplicateInBatchIdentical++;
        } else {
          summary.newValid++;
          summary.newValidBlankEpic++;
          batchSeenNamePart.add(namePartKey);
          stagingElectorsBuffer.push(voter);
          importResultsBuffer.push({
            batch_id: BATCH_ID,
            epic_number: null,
            classification: 'new_valid',
            reason: 'new_without_epic',
            source_file: f,
            source_page_or_row: `row_${r}`
          });
        }
      }
    }

    if (summary.totalFilesProcessed % 25 === 0 || summary.totalFilesProcessed === allFiles.length) {
      console.log(`Parsed ${summary.totalFilesProcessed}/${allFiles.length} files...`);
    }
  }

  console.log('\n--- REFINED STAGING SUMMARY ---');
  console.log(`Total Rows Read:           ${summary.totalRowsRead.toLocaleString()}`);
  console.log(`🟢 NEW VALID VOTERS:      ${summary.newValid.toLocaleString()}`);
  console.log(`   - With Valid EPIC:      ${summary.newValidWithEpic.toLocaleString()}`);
  console.log(`   - Blank EPIC (NULL):    ${summary.newValidBlankEpic.toLocaleString()}`);
  console.log(`🟡 DUPLICATES (DB):        ${summary.duplicateExisting.toLocaleString()}`);
  console.log(`🟡 DUPLICATES (Batch):     ${summary.duplicateInBatchIdentical.toLocaleString()}`);
  console.log(`🔴 QUARANTINED ROWS:       ${summary.quarantined.toLocaleString()}`);
  console.log('Quarantine reasons:', summary.quarantineReasons);

  // Clear previous staging batch records from staging_electors, quarantine_rows, import_results
  console.log('\nCleaning up old staging batch records for fresh clean staging...');
  await supabase.from('staging_electors').delete().eq('batch_id', 'batch_20261010_excel_phase2');
  await supabase.from('quarantine_rows').delete().eq('batch_id', 'batch_20261010_excel_phase2');
  await supabase.from('import_results').delete().eq('batch_id', 'batch_20261010_excel_phase2');

  // Insert refined records
  console.log('\nInserting refined records into staging tables...');
  await insertInBatches('staging_electors', stagingElectorsBuffer, 500);
  await insertInBatches('quarantine_rows', quarantineRowsBuffer, 500);
  await insertInBatches('import_results', importResultsBuffer, 1000);

  // Update batch record
  await supabase.from('import_batches').update({
    finished_at: new Date().toISOString(),
    status: 'staged',
    counts: summary
  }).eq('id', BATCH_ID);

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\nRefined staging pipeline completed in ${durationSec}s.`);
}

runUpdatedPipeline().catch(console.error);
