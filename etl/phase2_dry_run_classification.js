const path = require('path');
const fs = require('fs');
const readline = require('readline');
const XLSX = require(path.resolve(__dirname, '../web/node_modules/xlsx'));

const ROOT = path.resolve(__dirname, '..');
const NEW_EXCEL_DIR = path.join(ROOT, 'uptaed voter list');
const BACKUP_FILE = path.resolve(__dirname, 'reports/backup_2026-10-10/electors_backup.csv');

// Strict Validation Patterns
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
  // 1. Raw extraction
  const rawSerial = cleanString(row[colMap.serial_number]);
  const rawName = cleanString(row[colMap.name]);
  const rawRelative = cleanString(row[colMap.relative_name]);
  const rawAddress = cleanString(row[colMap.address]);
  const rawQual = cleanString(row[colMap.qualification]);
  const rawOcc = cleanString(row[colMap.occupation]);
  const rawAge = cleanString(row[colMap.age]);
  const rawSex = cleanString(row[colMap.sex]).toUpperCase();
  const rawEpic = cleanString(row[colMap.epic_number]).toUpperCase().replace(/[^A-Z0-9]/g, '');

  // Check if completely empty row or header row
  if (!rawName && !rawEpic && !rawSerial) {
    return { isSkip: true };
  }

  // Filter out table headers or summary lines that might repeat
  if (/name of the elector/i.test(rawName) || /epic number/i.test(rawEpic) || /male|female|others|total/i.test(rawName)) {
    return { isSkip: true };
  }

  // 2. Validate EPIC
  if (!rawEpic || (!EPIC_STANDARD_REGEX.test(rawEpic) && !EPIC_LEGACY_REGEX.test(rawEpic))) {
    return {
      isValid: false,
      reason: 'invalid_epic',
      raw: { rowNumber: rowIndex, rawEpic, rawName, rawAge, rawSex }
    };
  }

  // 3. Validate Name
  if (!rawName || rawName.length < 2 || /^\d+$/.test(rawName) || ['TEST', 'N/A', 'UNKNOWN', 'NULL', 'NONE'].includes(rawName.toUpperCase())) {
    return {
      isValid: false,
      reason: 'missing_required_name',
      raw: { rowNumber: rowIndex, rawEpic, rawName, rawAge, rawSex }
    };
  }

  // 4. Validate Age
  const ageNum = parseInt(rawAge, 10);
  if (isNaN(ageNum) || ageNum < 18 || ageNum > 120) {
    return {
      isValid: false,
      reason: 'invalid_age',
      raw: { rowNumber: rowIndex, rawEpic, rawName, rawAge, rawSex }
    };
  }

  // 5. Validate Sex
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

  // Valid record
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
      source_page_or_row: `row_${rowIndex}`
    }
  };
}

async function runDryRun() {
  const startTime = Date.now();
  const existingMap = await loadExistingElectors();

  const allFiles = fs.readdirSync(NEW_EXCEL_DIR)
    .filter(f => f.toLowerCase().endsWith('.xlsx') && !f.startsWith('~$'))
    .sort();

  console.log(`\nBeginning dry-run validation and classification across ${allFiles.length - 1} files...`);

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
      sexChanged: 0,
      addressChanged: 0
    }
  };

  const sampleDifferences = [];
  const sampleQuarantines = [];
  const sampleNewValid = [];

  const batchSeenEpics = new Map(); // epic -> record

  for (let fileIdx = 0; fileIdx < allFiles.length; fileIdx++) {
    const f = allFiles[fileIdx];
    if (f === '2nd page.xlsx') continue;

    summary.totalFilesProcessed++;
    const fullPath = path.join(NEW_EXCEL_DIR, f);
    const wb = XLSX.readFile(fullPath);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

    // File metadata extraction
    let partNumber = null;
    let district = null;
    let taluk = null;

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

    // Find header row
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

    // Process rows starting after header
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
        if (sampleQuarantines.length < 10) {
          sampleQuarantines.push({ file: f, row: r, reason: rowResult.reason, raw: rowResult.raw });
        }
        continue;
      }

      // Record is valid - classify it
      const voter = rowResult.data;
      const epic = voter.epic_number;

      // Check 1: Already exists in live database?
      if (existingMap.has(epic)) {
        summary.duplicateExisting++;
        const existing = existingMap.get(epic);
        
        // Difference comparison
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

        if (Object.keys(diffs).length > 0) {
          summary.differencesFound++;
          if (sampleDifferences.length < 15) {
            sampleDifferences.push({ epic, file: f, differences: diffs });
          }
        }
      }
      // Check 2: Already seen earlier in this batch?
      else if (batchSeenEpics.has(epic)) {
        const prev = batchSeenEpics.get(epic);
        const isIdentical = prev.name.toLowerCase() === voter.name.toLowerCase() &&
                            prev.part_number === voter.part_number &&
                            prev.age === voter.age &&
                            prev.sex === voter.sex;
        if (isIdentical) {
          summary.duplicateInBatchIdentical++;
        } else {
          summary.duplicateInBatchConflict++;
          summary.quarantined++;
          summary.quarantineReasons['duplicate_in_batch_conflict'] = (summary.quarantineReasons['duplicate_in_batch_conflict'] || 0) + 1;
        }
      }
      // Check 3: Brand new valid voter!
      else {
        summary.newValid++;
        batchSeenEpics.set(epic, voter);
        if (sampleNewValid.length < 10) {
          sampleNewValid.push({ epic, name: voter.name, part: voter.part_number, file: f });
        }
      }
    }

    if (summary.totalFilesProcessed % 20 === 0 || summary.totalFilesProcessed === allFiles.length - 1) {
      console.log(`Processed ${summary.totalFilesProcessed}/${allFiles.length - 1} files | New Valid: ${summary.newValid.toLocaleString()} | Duplicates: ${summary.duplicateExisting.toLocaleString()} | Quarantined: ${summary.quarantined.toLocaleString()}`);
    }
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);

  // Write comprehensive report
  const reportDir = path.resolve(__dirname, 'reports/dry_run_excel_phase2');
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
  const reportPath = path.join(reportDir, 'excel_pre_import_report.json');

  const fullReport = {
    generated_at: new Date().toISOString(),
    duration_seconds: durationSec,
    summary,
    sampleDifferences,
    sampleQuarantines,
    sampleNewValid
  };

  fs.writeFileSync(reportPath, JSON.stringify(fullReport, null, 2));

  console.log('\n======================================================');
  console.log('         PHASE 2 DRY RUN CLASSIFICATION SUMMARY        ');
  console.log('======================================================');
  console.log(`Files Processed:             ${summary.totalFilesProcessed}`);
  console.log(`Total Rows Read:             ${summary.totalRowsRead.toLocaleString()}`);
  console.log(`Skipped (headers/empty):     ${summary.skippedHeaderOrEmpty.toLocaleString()}`);
  console.log('------------------------------------------------------');
  console.log(`🟢 NEW VALID VOTERS:        ${summary.newValid.toLocaleString()}`);
  console.log(`🟡 DUPLICATE IN DB:          ${summary.duplicateExisting.toLocaleString()}`);
  console.log(`🟡 DUPLICATE IN BATCH (dup): ${summary.duplicateInBatchIdentical.toLocaleString()}`);
  console.log(`🔴 QUARANTINED ROWS:         ${summary.quarantined.toLocaleString()}`);
  console.log('------------------------------------------------------');
  console.log('Quarantine breakdown:');
  for (const [r, cnt] of Object.entries(summary.quarantineReasons)) {
    console.log(`  - ${r}: ${cnt.toLocaleString()}`);
  }
  console.log('------------------------------------------------------');
  console.log(`Differences in DB Duplicates: ${summary.differencesFound.toLocaleString()}`);
  for (const [cat, cnt] of Object.entries(summary.differenceCategories)) {
    console.log(`  - ${cat}: ${cnt.toLocaleString()}`);
  }
  console.log('======================================================');
  console.log(`Report JSON written to: ${reportPath}`);
  console.log(`Total execution time: ${durationSec}s`);
}

runDryRun().catch(console.error);
