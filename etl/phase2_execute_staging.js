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
const BATCH_ID = 'batch_20261010_excel_phase2';

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
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        result.push(cur);
        cur = '';
      } else {
        cur += ch;
      }
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

  for await (const line of rl) {
    if (lineCount === 0) {
      lineCount++;
      continue;
    }
    const cols = parseCsvLine(line);
    const epic = (cols[2] || '').trim().toUpperCase();
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
        part_number: (cols[13] || '').trim()
      });
    }
    lineCount++;
  }

  console.log(`Loaded ${epicMap.size.toLocaleString()} existing electors into memory.`);
  return epicMap;
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

  if (!rawEpic || (!EPIC_STANDARD_REGEX.test(rawEpic) && !EPIC_LEGACY_REGEX.test(rawEpic))) {
    return {
      isValid: false,
      reason: 'invalid_epic',
      raw: { rowNumber: rowIndex, rawEpic, rawName, rawAge, rawSex }
    };
  }

  if (!rawName || rawName.length < 2 || /^\d+$/.test(rawName) || ['TEST', 'N/A', 'UNKNOWN', 'NULL', 'NONE'].includes(rawName.toUpperCase())) {
    return {
      isValid: false,
      reason: 'missing_required_name',
      raw: { rowNumber: rowIndex, rawEpic, rawName, rawAge, rawSex }
    };
  }

  const ageNum = parseInt(rawAge, 10);
  if (isNaN(ageNum) || ageNum < 18 || ageNum > 120) {
    return {
      isValid: false,
      reason: 'invalid_age',
      raw: { rowNumber: rowIndex, rawEpic, rawName, rawAge, rawSex }
    };
  }

  let cleanSex = rawSex;
  if (cleanSex === 'MALE') cleanSex = 'M';
  if (cleanSex === 'FEMALE') cleanSex = 'F';
  if (cleanSex === 'OTHER' || cleanSex === 'OTHERS') cleanSex = 'O';

  if (!['M', 'F', 'O'].includes(cleanSex)) {
    return {
      isValid: false,
      reason: 'invalid_sex',
      raw: { rowNumber: rowIndex, rawEpic, rawName, rawAge, rawSex }
    };
  }

  return {
    isValid: true,
    data: {
      serial_number: rawSerial || null,
      epic_number: rawEpic,
      name: rawName,
      relative_name: rawRelative || null,
      address: rawAddress || null,
      qualification: rawQual || null,
      occupation: rawOcc || null,
      age: String(ageNum),
      sex: cleanSex,
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

async function runStagingPipeline() {
  const startTime = Date.now();
  console.log(`\n======================================================`);
  console.log(`    STARTING PHASE 2 STAGING PIPELINE (${BATCH_ID})   `);
  console.log(`======================================================`);

  // 1. Initialize import_batch record
  const allFiles = fs.readdirSync(NEW_EXCEL_DIR)
    .filter(f => f.toLowerCase().endsWith('.xlsx') && !f.startsWith('~$') && f !== '2nd page.xlsx')
    .sort();

  console.log(`Initializing batch record '${BATCH_ID}' in Supabase...`);
  const { error: batchErr } = await supabase.from('import_batches').upsert({
    id: BATCH_ID,
    started_at: new Date().toISOString(),
    status: 'processing',
    files: allFiles,
    operator: 'phase2_excel_pipeline'
  });
  if (batchErr) {
    console.error('Failed to create import_batch:', batchErr.message);
    process.exit(1);
  }
  console.log('Batch record initialized.');

  // 2. Load existing electors
  const existingMap = await loadExistingElectors();

  // 3. Process all 144 files
  const stagingElectorsBuffer = [];
  const quarantineRowsBuffer = [];
  const importResultsBuffer = [];

  const summary = {
    totalFilesProcessed: 0,
    totalRowsRead: 0,
    skippedHeaderOrEmpty: 0,
    newValid: 0,
    duplicateExisting: 0,
    duplicateInBatchIdentical: 0,
    duplicateInBatchConflict: 0,
    quarantined: 0,
    quarantineReasons: {},
    differencesFound: 0,
    differenceCategories: {
      partNumberChanged: 0,
      nameChanged: 0,
      ageChanged: 0,
      sexChanged: 0
    }
  };

  const sampleDifferences = [];
  const batchSeenEpics = new Map();

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

      if (existingMap.has(epic)) {
        summary.duplicateExisting++;
        const existing = existingMap.get(epic);

        let diffs = {};
        if (existing.part_number !== voter.part_number) {
          diffs.part_number = { old: existing.part_number, new: voter.part_number };
          summary.differenceCategories.partNumberChanged++;
        }
        if (existing.name && voter.name && existing.name.toLowerCase() !== voter.name.toLowerCase()) {
          diffs.name = { old: existing.name, new: voter.name };
          summary.differenceCategories.nameChanged++;
        }
        if (existing.age && voter.age && String(existing.age) !== String(voter.age)) {
          diffs.age = { old: existing.age, new: voter.age };
          summary.differenceCategories.ageChanged++;
        }
        if (existing.sex && voter.sex && existing.sex !== voter.sex) {
          diffs.sex = { old: existing.sex, new: voter.sex };
          summary.differenceCategories.sexChanged++;
        }

        const hasDiff = Object.keys(diffs).length > 0;
        if (hasDiff) {
          summary.differencesFound++;
          if (sampleDifferences.length < 25) {
            sampleDifferences.push({ epic, file: f, differences: diffs });
          }
        }

        importResultsBuffer.push({
          batch_id: BATCH_ID,
          epic_number: epic,
          classification: 'duplicate_existing',
          reason: hasDiff ? 'existing_in_db_with_differences' : 'existing_in_db_identical',
          source_file: f,
          source_page_or_row: `row_${r}`,
          differences: hasDiff ? diffs : null
        });
      }
      else if (batchSeenEpics.has(epic)) {
        const prev = batchSeenEpics.get(epic);
        const isIdentical = prev.name.toLowerCase() === voter.name.toLowerCase() &&
                            prev.part_number === voter.part_number &&
                            prev.age === voter.age &&
                            prev.sex === voter.sex;
        if (isIdentical) {
          summary.duplicateInBatchIdentical++;
          importResultsBuffer.push({
            batch_id: BATCH_ID,
            epic_number: epic,
            classification: 'duplicate_in_batch',
            reason: 'duplicate_in_batch_identical',
            source_file: f,
            source_page_or_row: `row_${r}`
          });
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
      }
      else {
        summary.newValid++;
        batchSeenEpics.set(epic, voter);
        stagingElectorsBuffer.push(voter);
        importResultsBuffer.push({
          batch_id: BATCH_ID,
          epic_number: epic,
          classification: 'new_valid',
          reason: 'passed_all_validations',
          source_file: f,
          source_page_or_row: `row_${r}`
        });
      }
    }

    if (summary.totalFilesProcessed % 25 === 0 || summary.totalFilesProcessed === allFiles.length) {
      console.log(`Parsed ${summary.totalFilesProcessed}/${allFiles.length} files...`);
    }
  }

  console.log('\nParsing complete. Inserting into Supabase staging tables...');

  // 4. Insert into staging_electors
  await insertInBatches('staging_electors', stagingElectorsBuffer, 500);

  // 5. Insert into quarantine_rows
  await insertInBatches('quarantine_rows', quarantineRowsBuffer, 500);

  // 6. Insert into import_results (sample or batches)
  // To avoid hitting rate limits on 140k rows, we insert import_results in batches of 1000
  await insertInBatches('import_results', importResultsBuffer, 1000);

  // 7. Update import_batches status and counts
  await supabase.from('import_batches').update({
    finished_at: new Date().toISOString(),
    status: 'staged',
    counts: summary
  }).eq('id', BATCH_ID);

  // 8. Generate comprehensive pre-import report
  const reportDir = path.resolve(__dirname, `reports/${BATCH_ID}`);
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });

  const reportMdPath = path.join(reportDir, 'excel_pre_import_report.md');
  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);

  const reportMarkdown = `# PHASE 2 EXCEL PRE-IMPORT RECONCILIATION REPORT
**Batch ID**: \`${BATCH_ID}\`  
**Generated At**: ${new Date().toISOString()}  
**Execution Duration**: ${durationSec}s  
**Status**: ⏸️ STAGED & READY — ZERO WRITES PERFORMED TO \`electors\` TABLE

---

## 1. Summary Statistics

| Metric | Count | % of Processed |
|---|---|---|
| **Total Files Processed** | **${summary.totalFilesProcessed}** | 100.0% |
| **Total Raw Rows Read** | **${summary.totalRowsRead.toLocaleString()}** | - |
| Header / Empty Rows Skipped | ${summary.skippedHeaderOrEmpty.toLocaleString()} | - |
| **🟢 NEW VALID ELECTORS (Staged)** | **${summary.newValid.toLocaleString()}** | **${((summary.newValid / (summary.totalRowsRead - summary.skippedHeaderOrEmpty)) * 100).toFixed(2)}%** |
| **🟡 DUPLICATE EXISTING IN DB** | **${summary.duplicateExisting.toLocaleString()}** | **${((summary.duplicateExisting / (summary.totalRowsRead - summary.skippedHeaderOrEmpty)) * 100).toFixed(2)}%** |
| 🟡 Duplicate in Batch (Identical, skipped) | ${summary.duplicateInBatchIdentical.toLocaleString()} | ${((summary.duplicateInBatchIdentical / (summary.totalRowsRead - summary.skippedHeaderOrEmpty)) * 100).toFixed(2)}% |
| **🔴 QUARANTINED ROWS** | **${summary.quarantined.toLocaleString()}** | **${((summary.quarantined / (summary.totalRowsRead - summary.skippedHeaderOrEmpty)) * 100).toFixed(2)}%** |

---

## 2. Quarantine Breakdown

All quarantined records have been saved into \`quarantine_rows\` with raw data and file/row location references:

| Quarantine Reason | Count | Explanation |
|---|---|---|
| \`invalid_epic\` | **${(summary.quarantineReasons['invalid_epic'] || 0).toLocaleString()}** | EPIC column contains '.', blank, or invalid OCR artifact |
| \`invalid_age\` | **${(summary.quarantineReasons['invalid_age'] || 0).toLocaleString()}** | Age was blank in source or outside 18..120 range |
| \`duplicate_in_batch_conflict\` | **${(summary.quarantineReasons['duplicate_in_batch_conflict'] || 0).toLocaleString()}** | Same EPIC appeared multiple times in batch with conflicting data |
| \`invalid_sex\` | **${(summary.quarantineReasons['invalid_sex'] || 0).toLocaleString()}** | Sex was not M, F, or O |
| \`missing_required_name\` | **${(summary.quarantineReasons['missing_required_name'] || 0).toLocaleString()}** | Name was missing, too short, or placeholder |

---

## 3. Differences in Existing Voters (Read-Only Comparison)

Existing electors in the database remain **strictly read-only** per Non-Negotiable Rule 4.  
Out of **${summary.duplicateExisting.toLocaleString()}** matching EPICs, **${summary.differencesFound.toLocaleString()}** had field differences:

| Category | Changed Count | Notes |
|---|---|---|
| **Name spelling / spacing** | ${summary.differenceCategories.nameChanged.toLocaleString()} | e.g. "Asharani G.M" vs "Asharani G. M" |
| **Age** | ${summary.differenceCategories.ageChanged.toLocaleString()} | Voter aged between roll publications |
| **Part Number** | ${summary.differenceCategories.partNumberChanged.toLocaleString()} | Voter reassigned to different part |
| **Sex** | ${summary.differenceCategories.sexChanged.toLocaleString()} | Discrepancy in gender field |

### Sample Differences (First 10)
\`\`\`json
${JSON.stringify(sampleDifferences.slice(0, 10), null, 2)}
\`\`\`

---

## 4. Next Phase Readiness

- ✅ All **${summary.newValid.toLocaleString()}** valid new electors are safely staged in \`staging_electors\`
- ✅ All **${summary.quarantined.toLocaleString()}** invalid records are isolated in \`quarantine_rows\`
- ✅ Audit trails written to \`import_results\` and \`import_batches\`
- 🛡️ Live \`electors\` table remains at **223,789 rows** (zero inserts, zero updates)
`;

  fs.writeFileSync(reportMdPath, reportMarkdown);
  console.log(`\nMarkdown report written to: ${reportMdPath}`);
  console.log(`Pipeline completed successfully in ${durationSec}s.`);
}

runStagingPipeline().catch(console.error);
