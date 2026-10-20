import path from 'path';
import fs from 'fs';
import { SearchQueryParams } from '@/features/search/schema';
import { SearchApiResponse, SearchResultRow, SearchQueryType } from '@/features/search/types';
import { resolveElectorLocation, resolveElectorSerialNumber, BOOTH_MASTER_MAP } from './boothMaster';
import { normalizeEpic, isValidEpic, isSyntheticEpic, cleanIndianMobile, sanitizeDisplayLocation, formatElectorFullName } from './utils';
import { resolveElectorPhone, findEpicsByPhone } from './phoneMaster';

let sqliteDb: any = null;
let isDbAvailable: boolean | null = null;

function getSqliteDb(): any | null {
  if (sqliteDb) return sqliteDb;
  if (isDbAvailable === false) return null;

  try {
    const candidates = [
      path.join(process.cwd(), 'electors.db'),
      path.join(process.cwd(), 'web', 'electors.db'),
      path.join(process.cwd(), '..', 'electors.db'),
      path.resolve(process.cwd(), 'electors.db'),
      path.resolve(process.cwd(), 'web', 'electors.db'),
      path.join(__dirname, 'electors.db'),
      path.join(__dirname, '..', 'electors.db'),
      path.join(__dirname, '..', '..', 'electors.db'),
      path.join(__dirname, '..', '..', '..', 'electors.db'),
      path.join(__dirname, '..', '..', '..', '..', 'electors.db'),
      path.join(process.cwd(), '.next', 'server', 'electors.db'),
      path.join(process.cwd(), '.next', 'server', 'chunks', 'electors.db'),
      path.join(process.cwd(), 'public', 'electors.db'),
    ];

    let dbPath = '';
    for (const c of candidates) {
      if (fs.existsSync(c)) {
        dbPath = c;
        break;
      }
    }

    if (!dbPath) {
      isDbAvailable = false;
      return null;
    }

    // Dynamic require for node:sqlite to support Node 22+ native SQLite
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { DatabaseSync } = require('node:sqlite');
    sqliteDb = new DatabaseSync(dbPath, { open: true, readOnly: true });
    isDbAvailable = true;
    return sqliteDb;
  } catch (e) {
    console.warn('SQLite native database not available, falling back to Supabase:', e);
    isDbAvailable = false;
    return null;
  }
}

function buildFtsQuery(q: string): string | null {
  const clean = q.replace(/[^a-zA-Z0-9\s]/g, ' ').trim();
  const words = clean.split(/\s+/).filter(w => w.length >= 2);
  if (words.length === 0) return null;
  return words.map(w => `"${w}"*`).join(' ');
}

export function isLocalDbReady(): boolean {
  return Boolean(getSqliteDb());
}

/**
 * Ultra-fast local SQLite elector search (< 15ms)
 */
export function searchElectorsLocal(params: SearchQueryParams): SearchApiResponse | null {
  const db = getSqliteDb();
  if (!db) return null;

  const startTime = performance.now();
  const { q, relativeName, mobile, part, ac, district, taluk, village, page, pageSize } = params;

  const trimmedQ = (q || '').trim();
  const trimmedRel = (relativeName || '').trim();
  const normalizedQEpic = normalizeEpic(trimmedQ);
  const isEpicQuery = isValidEpic(normalizedQEpic);

  let queryType: SearchQueryType = 'filter';
  const conditions: string[] = [];
  const bindings: any[] = [];

  // Mode A: Exact EPIC number
  if (isEpicQuery) {
    queryType = 'epic';
    const variants = [normalizedQEpic];
    const m6 = normalizedQEpic.match(/^([A-Z]{2,4})(\d{6})$/);
    if (m6) variants.push(`${m6[1]}0${m6[2]}`);
    const m7 = normalizedQEpic.match(/^([A-Z]{2,4})0(\d{6})$/);
    if (m7) variants.push(`${m7[1]}${m7[2]}`);

    const placeholders = variants.map(() => '?').join(',');
    conditions.push(`epic_number IN (${placeholders})`);
    bindings.push(...variants);
  }
  // Mode B1: 10-digit mobile or 5+ digits
  else if (/^\d{5,12}$/.test(trimmedQ) || (mobile && /^\d{5,12}$/.test(mobile.replace(/\D/g, '')))) {
    queryType = 'mobile';
    const rawDigits = /^\d{5,12}$/.test(trimmedQ) ? trimmedQ : mobile.replace(/\D/g, '');
    const cleanPhone = rawDigits.length >= 10 ? rawDigits.slice(-10) : rawDigits;

    const matchedEpics = findEpicsByPhone(cleanPhone);
    if (matchedEpics.length > 0) {
      const placeholders = matchedEpics.slice(0, 50).map(() => '?').join(',');
      conditions.push(`(whatsapp_mob = ? OR whatsapp_mob LIKE ? OR epic_number IN (${placeholders}))`);
      bindings.push(cleanPhone, `%${cleanPhone}%`, ...matchedEpics.slice(0, 50));
    } else {
      conditions.push(`(whatsapp_mob = ? OR whatsapp_mob LIKE ?)`);
      bindings.push(cleanPhone, `%${cleanPhone}%`);
    }
  }
  // Mode B2: Compound Booth + Serial (e.g. "103 347", "103/347", "Part 103 Serial 347")
  else if (/^(?:part|booth)?\s*(\d{1,4})\s*[\s/,-]+\s*(?:serial|sl|s#?|no\.?)?\s*(\d{1,4})$/i.test(trimmedQ)) {
    queryType = 'booth';
    const m = trimmedQ.match(/^(?:part|booth)?\s*(\d{1,4})\s*[\s/,-]+\s*(?:serial|sl|s#?|no\.?)?\s*(\d{1,4})$/i)!;
    conditions.push(`part_number = ? AND serial_number = ?`);
    bindings.push(m[1], parseInt(m[2], 10));
  }
  // Mode B3: Explicit Serial Number query (e.g. "Serial 347", "#347")
  else if (/^(?:serial|sl|s#?|no\.?|#)\s*(\d{1,5})$/i.test(trimmedQ)) {
    queryType = 'booth';
    const m = trimmedQ.match(/^(?:serial|sl|s#?|no\.?|#)\s*(\d{1,5})$/i)!;
    const extractedSerial = parseInt(m[1], 10);
    if (part) {
      conditions.push(`part_number = ? AND serial_number = ?`);
      bindings.push(part, extractedSerial);
    } else {
      conditions.push(`serial_number = ?`);
      bindings.push(extractedSerial);
    }
  }
  // Mode B4: Numeric Serial with Part filter
  else if (/^\d{1,5}$/.test(trimmedQ) && part) {
    queryType = 'booth';
    conditions.push(`serial_number = ?`);
    bindings.push(parseInt(trimmedQ, 10));
  }
  // Mode B5: Standalone numeric serial
  else if (/^\d{1,5}$/.test(trimmedQ)) {
    queryType = 'booth';
    conditions.push(`(serial_number = ? OR name LIKE ?)`);
    bindings.push(parseInt(trimmedQ, 10), `%${trimmedQ}%`);
  }
  // Mode C1: Relative Name specified
  else if (trimmedRel.length > 0) {
    queryType = 'name';
    if (trimmedQ.length > 0) {
      conditions.push(`name LIKE ? AND relative_name LIKE ?`);
      bindings.push(`%${trimmedQ}%`, `%${trimmedRel}%`);
    } else {
      conditions.push(`relative_name LIKE ?`);
      bindings.push(`%${trimmedRel}%`);
    }
  }
  // Mode C2: Name search
  else if (trimmedQ.length > 0) {
    queryType = 'name';
    const words = trimmedQ.split(/\s+/).filter(w => w.length >= 2);
    if (words.length >= 2) {
      const [w1, w2] = words;
      conditions.push(`(name LIKE ? OR relative_name LIKE ? OR (name LIKE ? AND relative_name LIKE ?) OR (name LIKE ? AND relative_name LIKE ?))`);
      bindings.push(`%${trimmedQ}%`, `%${trimmedQ}%`, `%${w1}%`, `%${w2}%`, `%${w2}%`, `%${w1}%`);
    } else {
      conditions.push(`(name LIKE ? OR relative_name LIKE ?)`);
      bindings.push(`%${trimmedQ}%`, `%${trimmedQ}%`);
    }
  }
  // Mode D: Pure filter browse
  else if (part) {
    queryType = 'booth';
  }

  // Filter dropdowns
  if (district) {
    const districtParts = Object.entries(BOOTH_MASTER_MAP)
      .filter(([_, info]) => info.district.toLowerCase() === district.toLowerCase())
      .map(([p]) => p);
    if (districtParts.length > 0) {
      const ph = districtParts.map(() => '?').join(',');
      conditions.push(`part_number IN (${ph})`);
      bindings.push(...districtParts);
    } else {
      conditions.push(`district = ?`);
      bindings.push(district);
    }
  }

  if (taluk) {
    const talukParts = Object.entries(BOOTH_MASTER_MAP)
      .filter(([_, info]) =>
        info.taluk.toLowerCase() === taluk.toLowerCase() ||
        info.taluk.toLowerCase().includes(taluk.toLowerCase()) ||
        taluk.toLowerCase().includes(info.taluk.toLowerCase()) ||
        info.ac_name.toLowerCase() === taluk.toLowerCase()
      )
      .map(([p]) => p);
    if (talukParts.length > 0) {
      const ph = talukParts.map(() => '?').join(',');
      conditions.push(`part_number IN (${ph})`);
      bindings.push(...talukParts);
    } else {
      conditions.push(`taluk LIKE ?`);
      bindings.push(`%${taluk}%`);
    }
  }

  if (ac) {
    const cleanAc = ac.replace(/[\.\s_-]/g, '').toLowerCase();
    const acParts = Object.entries(BOOTH_MASTER_MAP)
      .filter(([_, info]) => {
        const infoCleanAc = info.ac_name.replace(/[\.\s_-]/g, '').toLowerCase();
        const infoCleanTaluk = info.taluk.replace(/[\.\s_-]/g, '').toLowerCase();
        return (
          infoCleanAc === cleanAc ||
          info.ac_name.toLowerCase() === ac.toLowerCase() ||
          infoCleanTaluk === cleanAc ||
          info.taluk.toLowerCase() === ac.toLowerCase() ||
          info.ac_name.toLowerCase().includes(ac.toLowerCase()) ||
          ac.toLowerCase().includes(info.ac_name.toLowerCase())
        );
      })
      .map(([p]) => p);
    if (acParts.length > 0) {
      const ph = acParts.map(() => '?').join(',');
      conditions.push(`part_number IN (${ph})`);
      bindings.push(...acParts);
    } else {
      conditions.push(`ac_name LIKE ?`);
      bindings.push(`%${ac}%`);
    }
  }

  if (part) {
    conditions.push(`part_number = ?`);
    bindings.push(part);
  }

  if (village) {
    conditions.push(`village LIKE ?`);
    bindings.push(`%${village}%`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get total count
  let total = 0;
  if (isEpicQuery) {
    total = 1; // Will be set from result length
  } else {
    try {
      const countStmt = db.prepare(`SELECT count(*) as cnt FROM electors ${whereClause}`);
      const countRow = countStmt.get(...bindings);
      total = countRow ? Number(countRow.cnt) : 0;
    } catch (e) {
      console.error('SQLite count error:', e);
      total = 0;
    }
  }

  // Get paginated rows
  const offset = (page - 1) * pageSize;
  const orderBy = queryType === 'booth'
    ? 'ORDER BY serial_number ASC, id ASC'
    : 'ORDER BY CAST(part_number AS INTEGER) ASC, serial_number ASC, id ASC';

  const selectSql = `
    SELECT id, serial_number, epic_number, name, relative_name, address,
           qualification, occupation, age, sex, part_number, polling_station_name,
           polling_address, whatsapp_mob, district, ac_name, taluk, village
    FROM electors
    ${whereClause}
    ${orderBy}
    LIMIT ? OFFSET ?
  `;

  let rawRows: any[] = [];
  try {
    const dataStmt = db.prepare(selectSql);
    rawRows = dataStmt.all(...bindings, pageSize, offset);
  } catch (e) {
    console.error('SQLite select error:', e);
    return null;
  }

  if (isEpicQuery) {
    total = rawRows.length;
  }

  // Resolve location, serial number, and verified phone
  const sanitizedRows: SearchResultRow[] = rawRows.map((r: any) => {
    const location = resolveElectorLocation(r);
    const serial = resolveElectorSerialNumber(r);
    const isSynthetic = isSyntheticEpic(r.epic_number);
    const cleanEpic = isSynthetic ? '' : (r.epic_number || '');
    const phone = resolveElectorPhone({
      ...r,
      epic_number: cleanEpic || r.epic_number,
    });
    const verifiedPhone = cleanIndianMobile(phone);

    return {
      id: Number(r.id),
      serial_number: serial,
      epic_number: cleanEpic,
      name: r.name ? formatElectorFullName(r.name) : '',
      relative_name: r.relative_name ? formatElectorFullName(r.relative_name) : null,
      age: r.age !== null ? Number(r.age) : null,
      sex: r.sex || null,
      whatsapp_mob: verifiedPhone,
      district: location.district || r.district || null,
      ac_name: location.ac_name || r.ac_name || null,
      taluk: location.taluk || r.taluk || null,
      village: r.village || null,
      part_number: r.part_number || null,
      polling_station_name: sanitizeDisplayLocation(r.polling_station_name) || null,
      polling_address: sanitizeDisplayLocation(r.polling_address) || null,
      address: sanitizeDisplayLocation(r.address) || null,
      qualification: r.qualification || null,
      occupation: r.occupation || null,
    };
  });

  // Booth info if searching/filtering by part
  let boothInfo: SearchApiResponse['boothInfo'] = null;
  if (part) {
    try {
      const boothStmt = db.prepare('SELECT part_number, polling_station_name, polling_address FROM electors WHERE part_number = ? LIMIT 1');
      const bRow = boothStmt.get(part);
      if (bRow) {
        boothInfo = {
          part_number: bRow.part_number || part,
          polling_station_name: bRow.polling_station_name,
          polling_address: bRow.polling_address,
        };
      }
    } catch {
      // Non-blocking
    }
  }

  const durationMs = Math.round(performance.now() - startTime);

  return {
    rows: sanitizedRows,
    total,
    page,
    pageSize,
    queryType,
    durationMs,
    boothInfo,
  };
}

/**
 * Ultra-fast local SQLite single elector lookup (< 1ms)
 */
export function getElectorByEpicLocal(rawEpic: string): any | null {
  const db = getSqliteDb();
  if (!db) return null;

  const epic = normalizeEpic(rawEpic);
  if (!epic) return null;

  try {
    const variants = [epic];
    const m6 = epic.match(/^([A-Z]{2,4})(\d{6})$/);
    if (m6) variants.push(`${m6[1]}0${m6[2]}`);
    const m7 = epic.match(/^([A-Z]{2,4})0(\d{6})$/);
    if (m7) variants.push(`${m7[1]}${m7[2]}`);

    const ph = variants.map(() => '?').join(',');
    const stmt = db.prepare(`SELECT * FROM electors WHERE epic_number IN (${ph}) LIMIT 1`);
    const row = stmt.get(...variants);
    if (!row) return null;

    const location = resolveElectorLocation(row);
    const serial = resolveElectorSerialNumber(row);
    const isSynthetic = isSyntheticEpic(row.epic_number);
    const cleanEpic = isSynthetic ? '' : (row.epic_number || '');
    const phone = resolveElectorPhone({
      ...row,
      epic_number: cleanEpic || row.epic_number,
    });

    return {
      ...row,
      name: row.name ? formatElectorFullName(row.name) : '',
      relative_name: row.relative_name ? formatElectorFullName(row.relative_name) : null,
      serial_number: serial,
      epic_number: cleanEpic,
      taluk: location.taluk || row.taluk,
      district: location.district || row.district,
      ac_name: location.ac_name || row.ac_name,
      whatsapp_mob: cleanIndianMobile(phone),
      polling_station_name: sanitizeDisplayLocation(row.polling_station_name) || null,
      polling_address: sanitizeDisplayLocation(row.polling_address) || null,
      address: sanitizeDisplayLocation(row.address) || null,
    };
  } catch (e) {
    console.error('SQLite getElectorByEpicLocal error:', e);
    return null;
  }
}
