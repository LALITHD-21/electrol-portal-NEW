const path = require('path');
const fs = require('fs');
const XLSX = require(path.resolve(__dirname, '../web/node_modules/xlsx'));

const ROOT = path.resolve(__dirname, '..');
const NEW_EXCEL_DIR = path.join(ROOT, 'uptaed voter list');

const EPIC_REGEX = /^[A-Z]{2,4}\d{6,10}$/i;

function cleanString(val) {
  if (val === null || val === undefined) return '';
  return String(val).replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function parseFileStructure(filePath, fileName) {
  const wb = XLSX.readFile(filePath);
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  // 1. Extract metadata from header area (rows 0 to 15)
  let partNumber = null;
  let district = null;
  let taluk = null;

  for (let i = 0; i < Math.min(15, rows.length); i++) {
    const rowStr = rows[i].map(c => String(c)).join(' ');
    
    // Part number
    const partMatch = rowStr.match(/part\s*(?:no\.?|number)?\s*[:\-\s]*(\d+)/i);
    if (partMatch && !partNumber) {
      partNumber = partMatch[1].trim();
    }

    // District
    const distMatch = rowStr.match(/district\s*[:\-\s]*([A-Za-z\s]+?)(?:\s+area|\s+taluk|\s+constituency|\s+hobli|\r|\n|$)/i);
    if (distMatch && !district) {
      district = distMatch[1].trim();
    }

    // Taluk
    const talukMatch = rowStr.match(/taluk(?:\/town\/city)?\s*[:\-\s]*([A-Za-z\s]+?)(?:\s+district|\s+area|\r|\n|$)/i);
    if (talukMatch && !taluk) {
      taluk = talukMatch[1].trim();
    }
  }

  // Fallback part number from file name if not found in header
  if (!partNumber) {
    const fnMatch = fileName.match(/^(\d+)_/);
    if (fnMatch) partNumber = fnMatch[1];
  }

  // 2. Find row indices that contain EPICs
  let firstVoterRowIdx = -1;
  let sampleVoterRows = [];
  let epicColCounts = {};

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    let foundEpicInRow = false;
    for (let j = 0; j < row.length; j++) {
      const cellVal = cleanString(row[j]).toUpperCase();
      if (EPIC_REGEX.test(cellVal)) {
        if (firstVoterRowIdx === -1) firstVoterRowIdx = i;
        foundEpicInRow = true;
        epicColCounts[j] = (epicColCounts[j] || 0) + 1;
      }
    }
    if (foundEpicInRow && sampleVoterRows.length < 3) {
      sampleVoterRows.push({ rowIndex: i, row });
    }
  }

  // Primary EPIC column
  let epicColIdx = -1;
  let maxEpicCount = 0;
  for (const [col, count] of Object.entries(epicColCounts)) {
    if (count > maxEpicCount) {
      maxEpicCount = count;
      epicColIdx = parseInt(col, 10);
    }
  }

  // Check column layout relative to EPIC col
  // In typical sheets:
  // [0] = Serial
  // [1] = Name
  // [3] or [4] = Relative Name
  // [5] or [6] = Address
  // Qualification / Occupation
  // Age / Sex
  // EPIC
  let layoutSummary = {
    firstVoterRowIdx,
    epicColIdx,
    epicCount: maxEpicCount,
    totalRows: rows.length,
    partNumber,
    district,
    taluk
  };

  return { layoutSummary, sampleVoterRows };
}

async function run() {
  const allFiles = fs.readdirSync(NEW_EXCEL_DIR)
    .filter(f => f.toLowerCase().endsWith('.xlsx') && !f.startsWith('~$'))
    .sort();

  console.log(`Total Excel files found: ${allFiles.length}`);

  let missingMetadata = [];
  let noEpicFound = [];
  let validFiles = [];

  for (const f of allFiles) {
    if (f === '2nd page.xlsx') {
      console.log(`Skipping excluded duplicate file: ${f}`);
      continue;
    }

    const fullPath = path.join(NEW_EXCEL_DIR, f);
    try {
      const { layoutSummary, sampleVoterRows } = parseFileStructure(fullPath, f);
      
      if (layoutSummary.epicCount === 0) {
        noEpicFound.push({ file: f, summary: layoutSummary });
      } else {
        validFiles.push({ file: f, summary: layoutSummary, sample: sampleVoterRows });
        if (!layoutSummary.partNumber || !layoutSummary.district) {
          missingMetadata.push({ file: f, summary: layoutSummary });
        }
      }
    } catch (err) {
      console.error(`Error parsing ${f}: ${err.message}`);
    }
  }

  console.log('\n--- SCAN SUMMARY ---');
  console.log(`Files with detected EPICs: ${validFiles.length}`);
  console.log(`Files with NO EPICs detected: ${noEpicFound.length}`);
  if (noEpicFound.length > 0) {
    console.log('Files with no EPIC:', noEpicFound);
  }
  console.log(`Files with missing header metadata (part or district): ${missingMetadata.length}`);
  if (missingMetadata.length > 0) {
    console.log('Files with missing metadata:', missingMetadata.map(m => m.file));
  }

  // Check unique EPIC columns
  const colDistribution = {};
  for (const vf of validFiles) {
    const c = vf.summary.epicColIdx;
    colDistribution[c] = (colDistribution[c] || 0) + 1;
  }
  console.log('\nEPIC Column Index distribution across files:', colDistribution);

  // Show a couple of sample extracts
  console.log('\nSample extracted row structure from first valid file:');
  const sample = validFiles[0];
  console.log(`File: ${sample.file}, Part: ${sample.summary.partNumber}, District: ${sample.summary.district}`);
  if (sample.sample.length > 0) {
    const row = sample.sample[0].row;
    row.forEach((val, idx) => {
      const v = cleanString(val);
      if (v) console.log(`  Col [${idx}]: "${v.length > 50 ? v.substring(0, 50) + '...' : v}"`);
    });
  }
}

run().catch(console.error);
