const path = require('path');
const fs = require('fs');

const stations = require('./reports/parsed_polling_stations.json');

// Group stations by base part number
const groups = {};
for (const s of stations) {
  if (s.building === '3' && s.location === '2') continue;
  const base = s.ps.replace(/[A-Z]+$/i, '');
  if (!groups[base]) groups[base] = [];
  groups[base].push(s);
}

// Inspect parts that have multi-booths without explicit ranges
function extractRange(areaText) {
  if (!areaText) return null;
  const mBetween = areaText.match(/s[li]\.?\s*no\.?\s*(\d+)\s*[-–]\s*(\d+)/i);
  if (mBetween) return { min: parseInt(mBetween[1], 10), max: parseInt(mBetween[2], 10) };
  const mAbove = areaText.match(/s[li]\.?\s*no\.?\s*(\d+)\s*(?:and\s+)?above/i);
  if (mAbove) return { min: parseInt(mAbove[1], 10), max: 999999 };
  return null;
}

const unrangedMulti = [];
for (const [part, list] of Object.entries(groups)) {
  if (list.length > 1) {
    const hasRanges = list.some(b => extractRange(b.area) !== null);
    if (!hasRanges) {
      unrangedMulti.push({
        part,
        count: list.length,
        booths: list.map(b => ({ ps: b.ps, bld: b.building, area: b.area, voters: b.voters }))
      });
    }
  }
}

console.log('Multi-booth parts without explicit ranges in Area text: ' + unrangedMulti.length);
console.log(JSON.stringify(unrangedMulti, null, 2));
