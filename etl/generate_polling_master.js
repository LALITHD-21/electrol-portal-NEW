const fs = require('fs');
const path = require('path');
const stations = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'stations_dump.json'), 'utf8'));

const parsedStations = stations.map(s => {
  const isAux = /[A-Z]/i.test(s.part_number);
  const basePart = s.part_number.replace(/[A-Z]+$/i, '');
  const commaIdx = s.address.indexOf(',');
  const location = commaIdx !== -1 ? s.address.slice(0, commaIdx).trim() : s.address.trim();
  const pollingArea = commaIdx !== -1 ? s.address.slice(commaIdx + 1).trim() : s.address.trim();

  let min = null, max = null, rangeText = null;
  const mBetween = s.address.match(/s[li]\.?\s*no\.?\s*(\d+)\s*(?:[-–]|to)\s*(\d+)/i);
  if (mBetween) {
    min = parseInt(mBetween[1], 10);
    max = parseInt(mBetween[2], 10);
    rangeText = 'SL No. ' + min + ' – ' + max;
  } else {
    const mAbove = s.address.match(/s[li]\.?\s*no\.?\s*(\d+)\s*(?:and\s+)?above/i);
    if (mAbove) {
      min = parseInt(mAbove[1], 10);
      max = 999999;
      rangeText = 'SL No. ' + min + ' & Above';
    }
  }

  // Room number detection
  const roomMatch = s.name.match(/room[\s\.\-_]*(?:no[\.\-_]*)?\s*([0-9ivx]+)/i);
  const roomNumber = roomMatch ? ('Room ' + roomMatch[1].toUpperCase()) : null;

  return {
    boothCode: s.part_number,
    basePart,
    isAuxiliary: isAux,
    buildingName: s.name,
    location,
    pollingArea,
    roomNumber,
    minSerial: min,
    maxSerial: max,
    rangeText
  };
});

const fileHeader = `/**
 * Master Polling Station Directory & Auxiliary Booth Resolution Engine
 * Contains all 239 Primary & Auxiliary Polling Booths parsed from
 * 'new poling addres/update polling address.xlsx'.
 */

export interface MasterPollingBooth {
  boothCode: string;
  basePart: string;
  isAuxiliary: boolean;
  buildingName: string;
  location: string;
  pollingArea: string;
  roomNumber: string | null;
  minSerial: number | null;
  maxSerial: number | null;
  rangeText: string | null;
}

export interface PollingStationDetails {
  basePartNumber: string;
  boothCode: string;
  boothLabel: string;
  isAuxiliary: boolean;
  boothType: 'Primary Booth' | 'Auxiliary Booth';
  buildingName: string;
  location: string;
  pollingArea: string;
  serialRangeText: string | null;
  thresholdNotice: string | null;
  roomNumber: string | null;
}

export const POLLING_BOOTHS_MASTER: MasterPollingBooth[] = ${JSON.stringify(parsedStations, null, 2)};

// Fast lookup structures
const BOOTH_BY_CODE = new Map<string, MasterPollingBooth>();
const BOOTH_BY_NAME = new Map<string, MasterPollingBooth>();
const BOOTH_BY_ADDRESS = new Map<string, MasterPollingBooth>();
const BOOTHS_BY_BASE_PART = new Map<string, MasterPollingBooth[]>();

for (const b of POLLING_BOOTHS_MASTER) {
  BOOTH_BY_CODE.set(b.boothCode.toUpperCase(), b);
  BOOTH_BY_NAME.set(b.buildingName.toLowerCase().trim(), b);
  BOOTH_BY_ADDRESS.set(\`\${b.location}, \${b.pollingArea}\`.toLowerCase().trim(), b);
  BOOTH_BY_ADDRESS.set(b.pollingArea.toLowerCase().trim(), b);

  if (!BOOTHS_BY_BASE_PART.has(b.basePart)) {
    BOOTHS_BY_BASE_PART.set(b.basePart, []);
  }
  BOOTHS_BY_BASE_PART.get(b.basePart)!.push(b);
}

/**
 * Resolves full polling station details for an elector.
 * Accurately determines Primary vs Auxiliary Booth (e.g. Part 1 vs 1A, 5 vs 5A/5B, 112 vs 112A-112D)
 * and cleanly extracts Building Name, Location, and Polling Area.
 */
export function resolvePollingStationDetails(elector: {
  part_number?: string | number | null;
  serial_number?: number | null;
  polling_station_name?: string | null;
  polling_address?: string | null;
  village?: string | null;
  taluk?: string | null;
  district?: string | null;
}): PollingStationDetails {
  const rawPart = String(elector.part_number || '').trim();
  const rawSerial = typeof elector.serial_number === 'number' ? elector.serial_number : null;
  const rawStationName = String(elector.polling_station_name || '').trim();
  const rawAddress = String(elector.polling_address || '').trim();

  const basePart = rawPart.replace(/[A-Z]+$/i, '') || '1';
  const partCandidates = BOOTHS_BY_BASE_PART.get(basePart) || [];

  // 1. Direct match by booth code if part_number already contains suffix (e.g. '1A', '5B')
  let matched: MasterPollingBooth | undefined;
  if (rawPart && BOOTH_BY_CODE.has(rawPart.toUpperCase())) {
    const direct = BOOTH_BY_CODE.get(rawPart.toUpperCase())!;
    if (direct.isAuxiliary) {
      matched = direct;
    }
  }

  // 2. If part has multiple booths (split into auxiliary booths), resolve among candidate booths
  if (!matched && partCandidates.length > 1) {
    // 2a. Match by voter serial number range (e.g. 1-850 vs 851 Above)
    if (rawSerial !== null) {
      matched = partCandidates.find(c =>
        c.minSerial !== null &&
        c.maxSerial !== null &&
        rawSerial >= c.minSerial &&
        rawSerial <= c.maxSerial
      );

      // If serial is higher than all defined ranges, assign to highest auxiliary booth
      if (!matched) {
        const sorted = [...partCandidates].sort((a, b) => (b.maxSerial || 0) - (a.maxSerial || 0));
        if (sorted[0] && sorted[0].maxSerial && rawSerial > sorted[0].maxSerial) {
          matched = sorted[0];
        }
      }
    }

    // 2b. Match by address within this part's candidate booths
    if (!matched && rawAddress) {
      matched = partCandidates.find(c => {
        const full = (c.location + ', ' + c.pollingArea).toLowerCase().trim();
        return rawAddress.toLowerCase().trim() === full ||
               rawAddress.toLowerCase().includes(c.pollingArea.toLowerCase().trim());
      });
    }

    // 2c. Match by room number in building name (e.g. Room no.1 vs Room no.2)
    if (!matched && rawStationName) {
      matched = partCandidates.find(c =>
        c.roomNumber && rawStationName.toLowerCase().includes(c.roomNumber.toLowerCase())
      );
    }

    // 2d. Default to primary booth for this part
    if (!matched) {
      matched = partCandidates.find(c => !c.isAuxiliary) || partCandidates[0];
    }
  }

  // 3. Single booth part
  if (!matched && partCandidates.length === 1) {
    matched = partCandidates[0];
  }

  // 4. Global match by building name or address if part number was missing
  if (!matched && rawStationName) {
    matched = BOOTH_BY_NAME.get(rawStationName.toLowerCase().trim());
  }
  if (!matched && rawAddress) {
    matched = BOOTH_BY_ADDRESS.get(rawAddress.toLowerCase().trim());
  }

  // 5. Construct comprehensive details
  if (matched) {
    return {
      basePartNumber: matched.basePart,
      boothCode: matched.boothCode,
      boothLabel: matched.isAuxiliary ? \`Part \${matched.boothCode} (Auxiliary)\` : \`Part \${matched.boothCode}\`,
      isAuxiliary: matched.isAuxiliary,
      boothType: matched.isAuxiliary ? 'Auxiliary Booth' : 'Primary Booth',
      buildingName: rawStationName || matched.buildingName,
      location: matched.location,
      pollingArea: matched.pollingArea,
      serialRangeText: matched.rangeText,
      thresholdNotice: matched.isAuxiliary
        ? 'Auxiliary Booth created for rolls exceeding 750–850 voters'
        : null,
      roomNumber: matched.roomNumber
    };
  }

  // Generic fallback if not found in master
  let loc = rawAddress;
  let area = rawAddress;
  if (rawAddress.includes(',')) {
    const idx = rawAddress.indexOf(',');
    loc = rawAddress.slice(0, idx).trim();
    area = rawAddress.slice(idx + 1).trim();
  }

  const isAux = /[A-Z]/i.test(rawPart);
  return {
    basePartNumber: rawPart.replace(/[A-Z]+$/i, '') || '1',
    boothCode: rawPart || '1',
    boothLabel: isAux ? \`Part \${rawPart} (Auxiliary)\` : \`Part \${rawPart || '1'}\`,
    isAuxiliary: isAux,
    boothType: isAux ? 'Auxiliary Booth' : 'Primary Booth',
    buildingName: rawStationName || \`Polling Station \${rawPart || '1'}\`,
    location: loc || elector.taluk || elector.district || 'Karnataka',
    pollingArea: area || elector.village || 'Designated Station Area',
    serialRangeText: null,
    thresholdNotice: isAux ? 'Auxiliary Booth created for rolls exceeding 750–850 voters' : null,
    roomNumber: null
  };
}

export function getAllPollingBooths(): MasterPollingBooth[] {
  return POLLING_BOOTHS_MASTER;
}

export function getBoothsForPart(partNumber: string | number): MasterPollingBooth[] {
  const p = String(partNumber).trim().replace(/[A-Z]+$/i, '');
  return BOOTHS_BY_BASE_PART.get(p) || [];
}
`;

fs.writeFileSync(path.resolve(__dirname, '../web/lib/pollingStationMaster.ts'), fileHeader, 'utf8');
console.log('Successfully generated web/lib/pollingStationMaster.ts!');
