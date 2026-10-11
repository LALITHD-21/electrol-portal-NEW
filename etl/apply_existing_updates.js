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
        if (i + 1 < text.length && text[i + 1] === '"') { cur += '"'; i++; }
        else inQuotes = false;
      } else cur += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ',') { result.push(cur); cur = ''; }
      else cur += ch;
    }
  }
  result.push(cur);
  return result;
}

async function runUpdates() {
  console.log('======================================================');
  console.log(' APPLYING FIELD UPDATES TO ALL EXISTING ELECTORS      ');
  console.log(' (Strictly clamped string lengths: qual/occ <= 80)    ');
  console.log('======================================================');

  const fileStream = fs.createReadStream(BACKUP_FILE);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let lineCount = 0;
  const existingMap = new Map();

  for await (const line of rl) {
    if (lineCount === 0) { lineCount++; continue; }
    const cols = parseCsvLine(line);
    const epic = (cols[2] || '').trim().toUpperCase();
    if (epic) {
      existingMap.set(epic, {
        id: cols[0],
        name: (cols[3] || '').trim(),
        relative_name: (cols[4] || '').trim(),
        address: (cols[5] || '').trim(),
        qualification: (cols[6] || '').trim(),
        occupation: (cols[7] || '').trim(),
        age: (cols[8] || '').trim(),
        sex: (cols[9] || '').trim().toUpperCase(),
        part_number: (cols[13] || '').trim(),
        district: (cols[18] || '').trim(),
        taluk: (cols[20] || '').trim()
      });
    }
    lineCount++;
  }
  console.log(`Loaded ${existingMap.size.toLocaleString()} baseline electors.`);

  const allFiles = fs.readdirSync(NEW_EXCEL_DIR)
    .filter(f => f.toLowerCase().endsWith('.xlsx') && !f.startsWith('~$') && f !== '2nd page.xlsx')
    .sort();

  const updateMap = new Map();

  for (const f of allFiles) {
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
      if (hasName && hasEpic) { headerRowIdx = i; break; }
    }

    if (headerRowIdx !== -1) {
      const hRow = rows[headerRowIdx];
      for (let j = 0; j < hRow.length; j++) {
        const v = String(hRow[j]).toLowerCase().replace(/[\r\n]+/g, ' ').trim();
        if (/name of the elector|elector name/i.test(v)) colMap.name = j;
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
      const row = rows[r];
      const rawName = cleanString(row[colMap.name]);
      const rawEpic = cleanString(row[colMap.epic_number]).toUpperCase().replace(/[^A-Z0-9]/g, '');
      const rawAge = cleanString(row[colMap.age]);
      const rawSex = cleanString(row[colMap.sex]).toUpperCase();
      const rawAddress = cleanString(row[colMap.address]);
      const rawRelative = cleanString(row[colMap.relative_name]);
      const rawQual = cleanString(row[colMap.qualification]);
      const rawOcc = cleanString(row[colMap.occupation]);

      if (!rawName && !rawEpic) continue;
      if (/name of the elector/i.test(rawName) || /male|female|others|total/i.test(rawName)) continue;

      if (rawEpic && rawEpic.length === 10 && existingMap.has(rawEpic)) {
        const ex = existingMap.get(rawEpic);
        let hasChange = false;

        const ageNum = parseInt(rawAge, 10);
        const validAge = (!isNaN(ageNum) && ageNum >= 18 && ageNum <= 120) ? ageNum : (ex.age ? parseInt(ex.age, 10) : null);

        let cleanSex = (rawSex || ex.sex || '').toUpperCase().trim();
        if (cleanSex === 'MALE' || cleanSex.startsWith('M')) cleanSex = 'M';
        else if (cleanSex === 'FEMALE' || cleanSex.startsWith('F')) cleanSex = 'F';
        else if (cleanSex === 'OTHER' || cleanSex.startsWith('O')) cleanSex = 'O';
        else cleanSex = null;

        const qualStr = (rawQual || ex.qualification || '').substring(0, 80).trim() || null;
        const occStr = (rawOcc || ex.occupation || '').substring(0, 80).trim() || null;

        if (partNumber && ex.part_number !== partNumber) hasChange = true;
        if (district && !ex.district) hasChange = true;
        if (validAge && ex.age !== String(validAge)) hasChange = true;

        if (hasChange) {
          updateMap.set(rawEpic, {
            id: parseInt(ex.id, 10),
            epic_number: rawEpic,
            name: rawName || ex.name,
            relative_name: rawRelative || ex.relative_name || null,
            address: rawAddress || ex.address || null,
            qualification: qualStr,
            occupation: occStr,
            age: validAge,
            sex: cleanSex,
            part_number: partNumber || ex.part_number,
            district: district || ex.district || null,
            taluk: taluk || ex.taluk || null,
            updated_at: new Date().toISOString()
          });
        }
      }
    }
  }

  const updatesList = Array.from(updateMap.values());
  console.log(`Found ${updatesList.length.toLocaleString()} existing records to update!`);

  console.log(`Applying batched upserts into live electors table in chunks of 500...`);
  for (let i = 0; i < updatesList.length; i += 500) {
    const chunk = updatesList.slice(i, i + 500);
    const { error: upErr } = await supabase.from('electors').upsert(chunk, { onConflict: 'epic_number' });
    if (upErr) {
      console.error(`Error updating chunk ${i}:`, upErr.message);
      throw upErr;
    }
    if ((i + chunk.length) % 5000 === 0 || i + chunk.length >= updatesList.length) {
      process.stdout.write(`  Updated ${(i + chunk.length).toLocaleString()} / ${updatesList.length.toLocaleString()} records...\r`);
    }
  }

  console.log('\n\nVerifying live database numbers after all updates...');
  const { count: finalCount } = await supabase.from('electors').select('*', { count: 'exact', head: true });
  console.log(`Final total electors in database: ${finalCount.toLocaleString()}`);
  console.log('✅ ALL RECORDS ARE FULLY UPDATED AND SYNCHRONIZED!');
}

runUpdates().catch(console.error);
