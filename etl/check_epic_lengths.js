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

async function checkEpicLengths() {
  const { data } = await supabase
    .from('staging_electors')
    .select('epic_number')
    .eq('batch_id', 'batch_20261010_excel_phase2_v2')
    .not('epic_number', 'is', null);

  const lengthDist = {};
  let standard10 = 0;
  let non10 = 0;

  for (const r of data) {
    const len = r.epic_number.length;
    lengthDist[len] = (lengthDist[len] || 0) + 1;
    if (len === 10) standard10++;
    else non10++;
  }

  console.log('EPIC Length Distribution in staging_electors:');
  console.log(lengthDist);
  console.log(`Exactly 10 chars: ${standard10}`);
  console.log(`Not 10 chars:     ${non10}`);
}

checkEpicLengths().catch(console.error);
