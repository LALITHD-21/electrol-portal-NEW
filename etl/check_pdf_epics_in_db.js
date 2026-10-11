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

const testEpics = [
  // Part 32
  'ZFB3924354', 'ZFB2712651', 'ZFB3535515', 'ZFB3450962', 'ZFB2548368', 'FVB2147692', 'ZFB2859114',
  // Part 36
  'BJX2761773', 'LBQ3904521', 'BJX1683390', 'BJX1507664', 'DYK1342039'
];

async function checkInDb() {
  console.log(`Checking ${testEpics.length} extracted sample EPICs in live database electors table...\n`);

  let matchCount = 0;
  for (const epic of testEpics) {
    const { data } = await supabase
      .from('electors')
      .select('id, name, relative_name, part_number, age, sex')
      .eq('epic_number', epic)
      .limit(1);

    if (data && data.length > 0) {
      matchCount++;
      const r = data[0];
      console.log(`✅ MATCH: [${epic}] -> Name: "${r.name}", Relative: "${r.relative_name}", Part: ${r.part_number}, Age: ${r.age}, Sex: ${r.sex}`);
    } else {
      console.log(`❌ NOT IN DB: [${epic}]`);
    }
  }

  console.log(`\nResults: ${matchCount} / ${testEpics.length} sample EPICs (${(matchCount / testEpics.length * 100).toFixed(1)}%) match live database records exactly!`);
}

checkInDb().catch(console.error);
