const path = require('path');
const fs = require('fs');

const stations = require('./reports/parsed_polling_stations.json');

const groups = {};
for (const s of stations) {
  const base = s.ps.replace(/[A-Z]+$/i, '');
  if (!groups[base]) groups[base] = [];
  groups[base].push(s);
}

const multiBooths = Object.entries(groups).filter(([k, v]) => v.length > 1);
console.log('Parts with Auxiliary Booths count: ' + multiBooths.length);

for (const [part, list] of multiBooths.slice(0, 6)) {
  console.log('\n=== PART ' + part + ' (' + list.length + ' booths) ===');
  list.forEach(item => {
    console.log('  Booth ' + item.ps + ':');
    console.log('    Building: ' + item.building);
    console.log('    Location: ' + item.location);
    console.log('    Area:     ' + item.area);
  });
}
