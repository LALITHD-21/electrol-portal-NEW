const path = require('path');
const fs = require('fs');

const stations = require('./reports/parsed_polling_stations.json');

function extractRange(areaText) {
  if (!areaText) return null;
  // Match e.g. "SL No. 1-850" or "Sl.No. 751-1500" or "SL  No. 508-1014"
  const mBetween = areaText.match(/s[li]\.?\s*no\.?\s*(\d+)\s*[-–]\s*(\d+)/i);
  if (mBetween) {
    return { min: parseInt(mBetween[1], 10), max: parseInt(mBetween[2], 10) };
  }
  // Match e.g. "SL No. 851 Above" or "SL No. 967  Above"
  const mAbove = areaText.match(/s[li]\.?\s*no\.?\s*(\d+)\s*(?:and\s+)?above/i);
  if (mAbove) {
    return { min: parseInt(mAbove[1], 10), max: 999999 };
  }
  return null;
}

const boothRules = {};

for (const s of stations) {
  // skip header artifact rows
  if (s.building === '3' && s.location === '2') continue;

  const basePart = s.ps.replace(/[A-Z]+$/i, '');
  if (!boothRules[basePart]) boothRules[basePart] = [];

  const range = extractRange(s.area);
  boothRules[basePart].push({
    boothCode: s.ps,
    building: s.building,
    location: s.location,
    area: s.area,
    range: range // { min, max } or null
  });
}

console.log('Total base parts with booth rules:', Object.keys(boothRules).length);

let totalWithRanges = 0;
for (const [part, booths] of Object.entries(boothRules)) {
  if (booths.length > 1) {
    const hasRanges = booths.filter(b => b.range !== null);
    totalWithRanges += hasRanges.length;
    console.log(`Part ${part} (${booths.length} booths):`);
    booths.forEach(b => {
      console.log(`   Booth ${b.boothCode}: Range = ${b.range ? `[${b.range.min} - ${b.range.max}]` : 'DEFAULT'}, Building: "${b.building.substring(0, 45)}"`);
    });
  }
}

console.log(`\nAuxiliary booths with cleanly parsed serial ranges: ${totalWithRanges}`);
