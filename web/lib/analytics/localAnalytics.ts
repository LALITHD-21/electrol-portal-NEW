/**
 * Real-time analytics engine backed by the local `electors.db` SQLite roll.
 *
 * Every number on the analytics dashboard is computed directly from the
 * live database — no hardcoded snapshots. Results are memoised per
 * (database version, filter) so repeated polls are instant, and the cache
 * is invalidated automatically the moment the database file changes
 * (ETL re-ingest, phone sync, inserts, deletes, etc.).
 */
import path from 'path';
import fs from 'fs';
import type {
  DashboardStatsResponse,
  DistributionItem,
  AgeBracketNode,
  DistrictStrengthNode,
  AcStrengthNode,
  BoothTableRow,
  DataQualityReport,
  LiveActivityBucket,
} from '@/features/analytics/types';

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface LocalAnalyticsFilters {
  district?: string;
  ac?: string;
  taluk?: string;
  part?: string;
}

interface DbHandle {
  db: any;
  path: string;
  mtimeMs: number;
  size: number;
}

let handle: DbHandle | null = null;
let resolvedPath: string | null | undefined;

function resolveDbPath(): string | null {
  if (resolvedPath !== undefined) return resolvedPath;
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
  resolvedPath =
    candidates.find((c) => {
      try {
        return fs.existsSync(c) && fs.statSync(c).size > 1000;
      } catch {
        return false;
      }
    }) ?? null;
  return resolvedPath;
}

/**
 * Returns an open DB connection, transparently reopening it whenever the
 * underlying file has been modified or replaced so the dashboard always
 * reflects the latest committed data.
 */
function getDb(): DbHandle | null {
  const p = resolveDbPath();
  if (!p) return null;
  let stat: fs.Stats;
  try {
    stat = fs.statSync(p);
  } catch {
    return null;
  }

  if (handle && handle.path === p && handle.mtimeMs === stat.mtimeMs && handle.size === stat.size) {
    return handle;
  }

  try {
    if (handle?.db) {
      try {
        handle.db.close();
      } catch {
        /* ignore */
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { DatabaseSync } = require('node:sqlite');
    const db = new DatabaseSync(p, { open: true, readOnly: true });
    handle = { db, path: p, mtimeMs: stat.mtimeMs, size: stat.size };
    statsCache.clear();
    boothsCache = null;
    qualityCache = null;
    return handle;
  } catch (e) {
    console.warn('Local analytics DB unavailable:', (e as Error)?.message);
    return null;
  }
}

export function isLocalAnalyticsReady(): boolean {
  return getDb() !== null;
}

/* ------------------------------------------------------------------ */
/* Version token + activity history (powers the LIVE indicator)       */
/* ------------------------------------------------------------------ */

interface VersionInfo {
  version: string;
  total: number;
  maxId: number;
  mtime: string;
}

let lastVersion: VersionInfo | null = null;
let lastVersionCheck = 0;
const VERSION_TTL_MS = 1500;

const WINDOW_MINUTES = 30;
const changeLog: { t: number; delta: number }[] = [];

export function getLocalVersion(force = false): VersionInfo | null {
  const h = getDb();
  if (!h) return null;
  const now = Date.now();
  if (!force && lastVersion && now - lastVersionCheck < VERSION_TTL_MS && lastVersion.mtime === new Date(h.mtimeMs).toISOString()) {
    return lastVersion;
  }
  const row = h.db.prepare('SELECT COUNT(*) AS c, COALESCE(MAX(id), 0) AS m FROM electors').get();
  const total = Number(row.c);
  const maxId = Number(row.m);
  const mtime = new Date(h.mtimeMs).toISOString();
  const info: VersionInfo = { version: `${total}:${maxId}:${h.mtimeMs}`, total, maxId, mtime };

  if (lastVersion && lastVersion.version !== info.version) {
    // Any change (insert/update/delete) counts as activity; record absolute row delta (min 1)
    changeLog.push({ t: now, delta: Math.max(1, Math.abs(total - lastVersion.total)) });
  }
  const cutoff = now - WINDOW_MINUTES * 60 * 1000;
  while (changeLog.length && changeLog[0].t < cutoff) changeLog.shift();

  lastVersion = info;
  lastVersionCheck = now;
  return info;
}

export function getLocalActivity(): { buckets: LiveActivityBucket[]; addedLastWindow: number; windowMinutes: number } {
  const now = Date.now();
  const windowStart = now - WINDOW_MINUTES * 60 * 1000;
  const bucketStart = Math.floor(windowStart / 60000) * 60000;
  const buckets = Array.from({ length: WINDOW_MINUTES }, (_, i) => ({
    t: new Date(bucketStart + (i + 1) * 60000).toISOString(),
    count: 0,
  }));
  let added = 0;
  for (const c of changeLog) {
    const idx = Math.min(WINDOW_MINUTES - 1, Math.max(0, Math.floor((c.t - bucketStart) / 60000) - 1));
    buckets[idx].count += c.delta;
    added += c.delta;
  }
  return { buckets, addedLastWindow: added, windowMinutes: WINDOW_MINUTES };
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function buildWhere(f: LocalAnalyticsFilters): { sql: string; args: any[] } {
  const cond: string[] = [];
  const args: any[] = [];
  if (f.district) {
    cond.push('LOWER(TRIM(district)) = LOWER(TRIM(?))');
    args.push(f.district);
  }
  if (f.ac) {
    cond.push('LOWER(TRIM(ac_name)) = LOWER(TRIM(?))');
    args.push(f.ac);
  }
  if (f.taluk) {
    cond.push('LOWER(TRIM(taluk)) = LOWER(TRIM(?))');
    args.push(f.taluk);
  }
  if (f.part) {
    cond.push('TRIM(part_number) = TRIM(?)');
    args.push(String(f.part));
  }
  return { sql: cond.length ? `WHERE ${cond.join(' AND ')}` : '', args };
}

const pct = (n: number, d: number, digits = 1) => (d > 0 ? Math.round((n / d) * 100 * 10 ** digits) / 10 ** digits : 0);

const MOBILE_RE = /^[6-9]\d{9}$/;
function isValidMobile(v: unknown): boolean {
  if (!v) return false;
  let d = String(v).replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
  return MOBILE_RE.test(d);
}

const EPIC_RE = /^[A-Z]{3}\d{7}$/;
function isRealEpic(e: unknown): boolean {
  if (!e) return false;
  const s = String(e).trim().toUpperCase();
  if (s.startsWith('NOP') || /^[DE]\d{2}\d+$/.test(s)) return false;
  return /^[A-Z]{2,4}\d{6,8}$/.test(s);
}

function cleanLabel(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).replace(/\s+/g, ' ').trim();
  if (!s || /^[.\-_0]+$/.test(s) || /^(null|none|na|n\/a|nil)$/i.test(s)) return null;
  return s;
}

function extractToken(address: string | null, marker: string): string | null {
  if (!address) return null;
  const idx = address.indexOf(marker);
  if (idx <= 0) return null;
  const before = address.slice(0, idx).trim();
  const parts = before.split(/\)\s*|,/);
  const last = parts[parts.length - 1]?.trim();
  if (!last) return null;
  const words = last.split(/\s+/);
  return words[words.length - 1].toUpperCase().replace(/[^A-Z]/g, '') || null;
}

function topN(map: Map<string, number>, total: number, n = 10): DistributionItem[] {
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([label, count]) => ({ label, count, pct: pct(count, total) }));
}

/* ------------------------------------------------------------------ */
/* Dashboard stats                                                     */
/* ------------------------------------------------------------------ */

const statsCache = new Map<string, DashboardStatsResponse>();

export function getLocalDashboardStats(filters: LocalAnalyticsFilters = {}): DashboardStatsResponse | null {
  const h = getDb();
  if (!h) return null;
  const v = getLocalVersion();
  const key = `${v?.version}|${filters.district || ''}|${filters.ac || ''}|${filters.taluk || ''}|${filters.part || ''}`;
  const cached = statsCache.get(key);
  if (cached) return JSON.parse(JSON.stringify(cached));

  const { sql, args } = buildWhere(filters);
  const rows: any[] = h.db
    .prepare(
      `SELECT epic_number, name, relative_name, address, qualification, occupation,
              age, sex, part_number, polling_station_name, whatsapp_mob,
              district, ac_name, taluk, village
         FROM electors ${sql}`
    )
    .all(...args);

  const total = rows.length;
  let male = 0;
  let female = 0;
  let mobile = 0;
  let occCount = 0;
  let qualCount = 0;

  const districts = new Map<string, { total: number; male: number; female: number }>();
  const acs = new Map<string, { total: number; male: number; female: number }>();
  const taluks = new Set<string>();
  const booths = new Set<string>();
  const stations = new Set<string>();
  const villages = new Set<string>();
  const posts = new Set<string>();
  const occMap = new Map<string, number>();
  const qualMap = new Map<string, number>();
  const dupKeys = new Map<string, number>();

  const brackets: { label: string; min: number; max: number }[] = [
    { label: '18-25', min: 18, max: 25 },
    { label: '26-35', min: 26, max: 35 },
    { label: '36-45', min: 36, max: 45 },
    { label: '46-60', min: 46, max: 60 },
    { label: '60+', min: 61, max: 200 },
  ];
  const ageAgg = brackets.map((b) => ({ ...b, total: 0, male: 0, female: 0, unspecified: 0 }));

  for (const r of rows) {
    const sex = r.sex === 'M' || r.sex === 'F' ? r.sex : null;
    if (sex === 'M') male++;
    else if (sex === 'F') female++;

    if (isValidMobile(r.whatsapp_mob)) mobile++;

    const occ = cleanLabel(r.occupation);
    if (occ) {
      occCount++;
      const k = occ.toUpperCase();
      occMap.set(k, (occMap.get(k) || 0) + 1);
    }
    const qual = cleanLabel(r.qualification);
    if (qual) {
      qualCount++;
      const k = qual.toUpperCase().replace(/[.\s]/g, '');
      qualMap.set(k, (qualMap.get(k) || 0) + 1);
    }

    const dName = cleanLabel(r.district);
    if (dName) {
      const d = districts.get(dName) || { total: 0, male: 0, female: 0 };
      d.total++;
      if (sex === 'M') d.male++;
      else if (sex === 'F') d.female++;
      districts.set(dName, d);
    }
    const aName = cleanLabel(r.ac_name);
    if (aName) {
      const a = acs.get(aName) || { total: 0, male: 0, female: 0 };
      a.total++;
      if (sex === 'M') a.male++;
      else if (sex === 'F') a.female++;
      acs.set(aName, a);
    }
    const t = cleanLabel(r.taluk);
    if (t) taluks.add(t.toLowerCase());
    if (r.part_number) booths.add(String(r.part_number).trim());
    const ps = cleanLabel(r.polling_station_name);
    if (ps) stations.add(ps.toLowerCase());

    const vill = cleanLabel(r.village) || extractToken(r.address, '(VTC)');
    if (vill) villages.add(vill.toLowerCase());
    const post = extractToken(r.address, '(Post)');
    if (post) posts.add(post);

    const age = r.age === null || r.age === undefined ? null : Number(r.age);
    if (age !== null && age >= 18) {
      const b = ageAgg.find((x) => age >= x.min && age <= x.max);
      if (b) {
        b.total++;
        if (sex === 'M') b.male++;
        else if (sex === 'F') b.female++;
        else b.unspecified++;
      }
    }

    // Duplicate detection (Rule A): same real EPIC, or same part + name + relative + age
    const epic = isRealEpic(r.epic_number) ? String(r.epic_number).trim().toUpperCase() : null;
    const dk = epic
      ? `E:${epic}`
      : `N:${r.part_number}|${String(r.name || '').toLowerCase().replace(/[^a-z]/g, '')}|${String(r.relative_name || '')
          .toLowerCase()
          .replace(/[^a-z]/g, '')}|${r.age ?? ''}`;
    if (epic || String(r.name || '').trim()) dupKeys.set(dk, (dupKeys.get(dk) || 0) + 1);
  }

  let dupGroups = 0;
  let dupRows = 0;
  dupKeys.forEach((c) => {
    if (c > 1) {
      dupGroups++;
      dupRows += c;
    }
  });

  const age_brackets: AgeBracketNode[] = ageAgg.map((b) => ({
    bracket: b.label,
    total: b.total,
    male: b.male,
    female: b.female,
    unspecified: b.unspecified,
    pct: pct(b.total, total, 2),
  }));

  const district_strength: DistrictStrengthNode[] = Array.from(districts.entries())
    .map(([district, d]) => ({ district, total: d.total, male: d.male, female: d.female, pct: pct(d.total, total) }))
    .sort((a, b) => b.total - a.total);

  const ac_strength: AcStrengthNode[] = Array.from(acs.entries())
    .map(([ac_name, a]) => ({ ac_name, total: a.total, male: a.male, female: a.female, pct: pct(a.total, total) }))
    .sort((a, b) => b.total - a.total);

  const stats: DashboardStatsResponse = {
    totals: { total, male, female, unspecified: Math.max(0, total - male - female) },
    hierarchy: {
      districts: districts.size,
      ac_names: acs.size,
      taluks: taluks.size,
      hoblis: stations.size,
      grama_panchayaths: posts.size,
      villages: villages.size,
      booths: booths.size,
    },
    coverage: {
      mobile: { count: mobile, pct: pct(mobile, total) },
      photo: { count: 0, pct: 0 },
      caste: { count: 0, pct: 0 },
      occupation: { count: occCount, pct: pct(occCount, total, 2) },
      qualification: { count: qualCount, pct: pct(qualCount, total, 2) },
    },
    duplicates: { groups: dupGroups, rows: dupRows },
    age_brackets,
    district_strength,
    ac_strength,
    caste_majority: [],
    occupations: topN(occMap, total, 12),
    qualifications: topN(qualMap, total, 12),
    refreshed_at: v?.mtime ?? new Date().toISOString(),
  };

  statsCache.set(key, stats);
  if (statsCache.size > 200) {
    const first = statsCache.keys().next().value;
    if (first) statsCache.delete(first);
  }
  return JSON.parse(JSON.stringify(stats));
}

/* ------------------------------------------------------------------ */
/* Booth table                                                         */
/* ------------------------------------------------------------------ */

let boothsCache: { version: string; rows: BoothTableRow[] } | null = null;

export function getLocalBooths(): BoothTableRow[] | null {
  const h = getDb();
  if (!h) return null;
  const v = getLocalVersion();
  if (boothsCache && boothsCache.version === v?.version) return boothsCache.rows.map((r) => ({ ...r }));

  const raw: any[] = h.db
    .prepare(
      `SELECT TRIM(part_number) AS part_number,
              MAX(polling_station_name) AS polling_station_name,
              MAX(polling_address) AS polling_address,
              MAX(district) AS district,
              MAX(ac_name) AS ac_name,
              COUNT(*) AS total_electors,
              SUM(CASE WHEN sex = 'M' THEN 1 ELSE 0 END) AS male_count,
              SUM(CASE WHEN sex = 'F' THEN 1 ELSE 0 END) AS female_count,
              SUM(CASE WHEN LENGTH(REPLACE(COALESCE(whatsapp_mob,''),' ','')) = 10
                        AND SUBSTR(whatsapp_mob,1,1) IN ('6','7','8','9') THEN 1 ELSE 0 END) AS mobile_count
         FROM electors
        WHERE part_number IS NOT NULL AND TRIM(part_number) != ''
        GROUP BY TRIM(part_number)`
    )
    .all();

  const rows: BoothTableRow[] = raw.map((r) => {
    const total = Number(r.total_electors) || 0;
    const m = Number(r.male_count) || 0;
    const f = Number(r.female_count) || 0;
    const mob = Number(r.mobile_count) || 0;
    return {
      part_number: String(r.part_number),
      polling_station_name: r.polling_station_name,
      polling_address: r.polling_address,
      district: r.district,
      ac_name: r.ac_name,
      total_electors: total,
      male_count: m,
      female_count: f,
      gender_ratio: m > 0 ? Math.round((f / m) * 1000) : 0,
      mobile_count: mob,
      mobile_pct: pct(mob, total),
    };
  });

  boothsCache = { version: v?.version || '', rows };
  return rows.map((r) => ({ ...r }));
}

/* ------------------------------------------------------------------ */
/* Data quality                                                        */
/* ------------------------------------------------------------------ */

let qualityCache: { version: string; report: DataQualityReport } | null = null;

export function getLocalQualityReport(): DataQualityReport | null {
  const h = getDb();
  if (!h) return null;
  const v = getLocalVersion();
  if (qualityCache && qualityCache.version === v?.version) return JSON.parse(JSON.stringify(qualityCache.report));

  const nonEmpty = (col: string) => `SUM(CASE WHEN ${col} IS NOT NULL AND TRIM(CAST(${col} AS TEXT)) NOT IN ('', '.', '-') THEN 1 ELSE 0 END)`;
  const r: any = h.db
    .prepare(
      `SELECT COUNT(*) AS total,
              ${nonEmpty('serial_number')} AS serial_number,
              ${nonEmpty('epic_number')} AS epic_number,
              ${nonEmpty('name')} AS name,
              ${nonEmpty('relative_name')} AS relative_name,
              ${nonEmpty('address')} AS address,
              ${nonEmpty('age')} AS age,
              SUM(CASE WHEN sex IN ('M','F','O') THEN 1 ELSE 0 END) AS sex,
              ${nonEmpty('occupation')} AS occupation,
              ${nonEmpty('qualification')} AS qualification,
              ${nonEmpty('part_number')} AS part_number,
              ${nonEmpty('polling_station_name')} AS polling_station_name,
              SUM(CASE WHEN LENGTH(COALESCE(whatsapp_mob,'')) = 10 THEN 1 ELSE 0 END) AS whatsapp_mob,
              ${nonEmpty('district')} AS district,
              ${nonEmpty('ac_name')} AS ac_name,
              ${nonEmpty('taluk')} AS taluk,
              SUM(CASE WHEN age IS NOT NULL AND age < 18 THEN 1 ELSE 0 END) AS age_under_18,
              SUM(CASE WHEN age IS NOT NULL AND age > 110 THEN 1 ELSE 0 END) AS age_over_110,
              SUM(CASE WHEN age IS NULL THEN 1 ELSE 0 END) AS age_null,
              SUM(CASE WHEN sex IS NULL OR sex NOT IN ('M','F','O') THEN 1 ELSE 0 END) AS sex_invalid,
              SUM(CASE WHEN part_number IS NULL OR TRIM(part_number) = '' THEN 1 ELSE 0 END) AS part_missing,
              SUM(CASE WHEN name IS NULL OR TRIM(name) = '' THEN 1 ELSE 0 END) AS name_blank
         FROM electors`
    )
    .get();

  const total = Number(r.total) || 0;
  const p = (k: string) => pct(Number(r[k]) || 0, total, 2);

  // EPIC format + shared-mobile anomalies need row-level checks
  const epics: any[] = h.db.prepare(`SELECT epic_number FROM electors WHERE epic_number IS NOT NULL AND TRIM(epic_number) != ''`).all();
  const epicInvalid = epics.filter((e) => !EPIC_RE.test(String(e.epic_number).trim().toUpperCase())).length;
  const shared: any = h.db
    .prepare(
      `SELECT COUNT(*) AS c FROM (
         SELECT whatsapp_mob FROM electors
          WHERE whatsapp_mob IS NOT NULL AND LENGTH(whatsapp_mob) = 10
          GROUP BY whatsapp_mob HAVING COUNT(*) >= 10)`
    )
    .get();

  const stats = getLocalDashboardStats({});

  const report: DataQualityReport = {
    total_electors: total,
    refreshed_at: v?.mtime ?? new Date().toISOString(),
    completeness: {
      serial_number: p('serial_number'),
      epic_number: p('epic_number'),
      name: p('name'),
      relative_name: p('relative_name'),
      address: p('address'),
      age: p('age'),
      sex: p('sex'),
      occupation: p('occupation'),
      qualification: p('qualification'),
      part_number: p('part_number'),
      polling_station_name: p('polling_station_name'),
      whatsapp_mob: p('whatsapp_mob'),
      caste: 0,
      district: p('district'),
      ac_name: p('ac_name'),
      taluk: p('taluk'),
      photo_url: 0,
    },
    anomalies: {
      age_under_18: Number(r.age_under_18) || 0,
      age_over_110: Number(r.age_over_110) || 0,
      age_null: Number(r.age_null) || 0,
      sex_invalid: Number(r.sex_invalid) || 0,
      part_missing: Number(r.part_missing) || 0,
      epic_invalid_format: epicInvalid,
      name_blank: Number(r.name_blank) || 0,
      shared_mobile_10plus: Number(shared?.c) || 0,
    },
    duplicates: {
      rule_a_clusters: stats?.duplicates.groups ?? 0,
      rule_a_voters_affected: stats?.duplicates.rows ?? 0,
    },
  };

  qualityCache = { version: v?.version || '', report };
  return JSON.parse(JSON.stringify(report));
}
