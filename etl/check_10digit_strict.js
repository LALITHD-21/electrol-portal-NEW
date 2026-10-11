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

const STANDARD_EPIC_REGEX = /^[A-Z]{3}\d{7}$/;

async function test10DigitStrict() {
  let offset = 0;
  const CHUNK = 1000;
  let totalStandard10 = 0;
  let totalSetToNull = 0;
  let totalRows = 0;

  while (true) {
    const { data, error } = await supabase
      .from('staging_electors')
      .select('id, epic_number')
      .eq('batch_id', 'batch_20261010_excel_phase2_v2')
      .range(offset, offset + CHUNK - 1);

    if (error || !data || data.length === 0) break;

    for (const r of data) {
      totalRows++;
      if (r.epic_number && STANDARD_EPIC_REGEX.test(r.epic_number)) {
        totalStandard10++;
      } else {
        totalSetToNull++;
      }
    }

    offset += data.length;
    if (data.length < CHUNK) break;
  }

  console.log(`Total Staged Electors:      ${totalRows.toLocaleString()}`);
  console.log(`Standard 10-char EPICs:     ${totalStandard10.toLocaleString()} (3 letters + 7 digits)`);
  console.log(`Non-10 char / Blank (NULL):  ${totalSetToNull.toLocaleString()}`);
}

test10DigitStrict().catch(console.error);
