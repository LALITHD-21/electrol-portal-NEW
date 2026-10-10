const fs = require('fs');
const path = require('path');

// Resolve packages from web/node_modules
const webNodeModules = path.join(__dirname, '../web/node_modules');
if (fs.existsSync(webNodeModules)) {
  module.paths.push(webNodeModules);
}

const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');

// 1. Load Supabase Environment Variables
let env = {};
const envPaths = [
  path.join(__dirname, '../web/.env.local'),
  path.join(__dirname, '../etl/.env'),
  path.join(__dirname, '../.env')
];

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        let val = match[2] || '';
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        env[match[1]] = val.trim();
      }
    }
  }
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Error: Missing Supabase credentials in web/.env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

// 2. Identify Target Excel File
const targetArg = process.argv[2];
let targetFilePath = null;

if (targetArg) {
  targetFilePath = path.isAbsolute(targetArg) ? targetArg : path.join(process.cwd(), targetArg);
} else {
  // Check for newly added excel files in root or excle-formate
  const searchDirs = [process.cwd(), path.join(process.cwd(), 'excle-formate')];
  for (const dir of searchDirs) {
    if (fs.existsSync(dir)) {
      const xlsxFiles = fs.readdirSync(dir).filter(f => (f.endsWith('.xlsx') || f.endsWith('.xls')) && !f.startsWith('~$') && !f.includes('MLC_Voters_ALL_Filtered'));
      if (xlsxFiles.length > 0) {
        targetFilePath = path.join(dir, xlsxFiles[0]);
        break;
      }
    }
  }
}

if (!targetFilePath || !fs.existsSync(targetFilePath)) {
  console.log(`
===========================================================
  📥 ELECTORAL EXCEL VOTER INGESTION UTILITY
===========================================================
Usage:
  node scripts/ingest-new-excel.js "<path-to-your-excel-file.xlsx>"

Example:
  node scripts/ingest-new-excel.js "new_voter_list_2026.xlsx"
  node scripts/ingest-new-excel.js "c:/Users/techb/Desktop/updated_voters.xlsx"
===========================================================
`);
  process.exit(0);
}

console.log(`\n📂 Reading Excel dataset: ${targetFilePath}`);
const workbook = XLSX.readFile(targetFilePath);

const validRecords = [];
const seenEpics = new Set();
let scannedRowCount = 0;

for (const sheetName of workbook.SheetNames) {
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  console.log(`📊 Processing Sheet: "${sheetName}" (${rows.length} rows)`);

  let currentPartNo = null;

  for (const row of rows) {
    if (!row || !Array.isArray(row) || row.length === 0) continue;
    scannedRowCount++;

    const rowString = row.map(c => String(c || '').trim()).join(' ');

    // Part number detection
    const partMatch = rowString.match(/Part\s*N?\s*o?\s*[:\.\·\-\s]\s*(\d+[A-Za-z0-9\/\-]*)/i);
    if (partMatch) {
      currentPartNo = partMatch[1].trim();
    }

    // EPIC card number detection (3 letters followed by 7 digits or standard formats)
    let epicVal = null;
    for (let idx = 0; idx < row.length; idx++) {
      const cellText = String(row[idx] || '').trim();
      if (!cellText) continue;

      const epicMatch = cellText.match(/\b([A-Z]{3}\d{7})\b/i);
      if (epicMatch) {
        epicVal = epicMatch[1].toUpperCase();
        break;
      }
    }

    if (!epicVal || seenEpics.has(epicVal)) continue;

    // Smart Field Extraction
    let nameVal = '';
    let relVal = '';
    let addrVal = '';
    let qualVal = '';
    let occVal = '';
    let ageVal = null;
    let sexVal = null;
    let snoVal = null;
    let phoneVal = null;

    for (let idx = 0; idx < row.length; idx++) {
      const val = String(row[idx] || '').trim();
      if (!val) continue;

      // Serial Number
      if (/^\d{1,5}$/.test(val) && !snoVal && (idx === 0 || idx === 1)) {
        const num = parseInt(val, 10);
        if (num > 0 && num < 20000) snoVal = num;
      }

      // Age
      if (/\b(1[89]|[2-9]\d|1[01]\d)\b/.test(val) && !ageVal && val !== String(snoVal)) {
        const num = parseInt(val, 10);
        if (num >= 18 && num <= 120) ageVal = num;
      }

      // Gender / Sex
      if (/^(M|F|O|Male|Female|Other)$/i.test(val) && !sexVal) {
        sexVal = val.toUpperCase().startsWith('M') ? 'M' : val.toUpperCase().startsWith('F') ? 'F' : 'O';
      }

      // 10-digit Mobile Phone
      if (/^[6-9]\d{9}$/.test(val) && !phoneVal) {
        phoneVal = val;
      }

      // Name & Relation & Address extraction
      if (val.length > 2 && !/^\d+$/.test(val) && val !== epicVal) {
        const lower = val.toLowerCase();
        if (lower.startsWith('name') || lower.startsWith('s/o') || lower.startsWith('d/o') || lower.startsWith('w/o')) {
          continue;
        }

        if (!nameVal && /^[a-zA-Z\s\.\,\'-]+$/.test(val) && val.length <= 60 && idx <= 4) {
          nameVal = val;
        } else if (!relVal && /^[a-zA-Z\s\.\,\'-]+$/.test(val) && val.length <= 60 && idx <= 6) {
          relVal = val;
        } else if (!addrVal && (val.length > 5 || /\d/.test(val))) {
          addrVal = val;
        }
      }
    }

    if (!nameVal || nameVal.toLowerCase().includes('name of') || nameVal.toLowerCase().includes('slno')) {
      continue;
    }

    seenEpics.add(epicVal);
    validRecords.push({
      epic_number: epicVal,
      name: nameVal,
      relative_name: relVal || null,
      address: addrVal || null,
      qualification: qualVal || null,
      occupation: occVal || null,
      age: ageVal || null,
      sex: sexVal || null,
      serial_number: snoVal || null,
      part_number: currentPartNo || null,
      whatsapp_mob: phoneVal || null
    });
  }
}

console.log(`\n✅ Finished Scanning: ${scannedRowCount} total rows.`);
console.log(`⭐ Extracted ${validRecords.length} unique voter records ready for ingestion.`);

if (validRecords.length === 0) {
  console.log('⚠️ No valid voters with EPIC numbers found. Please verify the Excel sheet structure.');
  process.exit(0);
}

// 3. Batch UPSERT into Supabase
async function runUpsert() {
  const batchSize = 250;
  let inserted = 0;

  console.log(`\n🚀 Upserting into Supabase electors database table in batches of ${batchSize}...`);

  for (let i = 0; i < validRecords.length; i += batchSize) {
    const chunk = validRecords.slice(i, i + batchSize);
    const { error } = await supabase.from('electors').upsert(chunk, { onConflict: 'epic_number' });

    if (error) {
      console.error(`\n❌ Error ingesting batch ${i}..${i + batchSize}:`, error.message);
      process.exit(1);
    }
    inserted += chunk.length;
    process.stdout.write(`   Progress: ${inserted}/${validRecords.length} voters upserted...\r`);
  }

  console.log(`\n\n🎉 SUCCESS! All ${validRecords.length} voters have been updated and are instantly searchable!`);

  const { count, error: countErr } = await supabase.from('electors').select('*', { count: 'exact', head: true });
  if (!countErr) {
    console.log(`📊 Total verified voters in database: ${count}`);
  }
}

runUpsert();
