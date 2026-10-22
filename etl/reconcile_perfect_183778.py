import os
import sys
import re
import json
import shutil
import sqlite3
from collections import Counter, defaultdict

sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from ingest_final_voters_delta import (
    BASE_DIR, WEB_DB_PATH, ROOT_DB_PATH,
    load_booth_master, load_phone_lookup,
    resolve_station, resolve_phone, extract_epic, epic_variants,
    norm_str, is_db_synthetic_epic, clean_name, clean_text
)
from sync_polling_stations_from_master import load_polling_master as load_polling_station_master
from check_final_183893_math import recs as all_cached_recs

def valid_phone(val):
    if not val:
        return None
    d = re.sub(r'\D', '', str(val))
    if len(d) == 12 and d.startswith('91'):
        d = d[2:]
    elif len(d) == 11 and d.startswith('0'):
        d = d[1:]
    if len(d) == 10 and d[0] in '6789':
        return d
    return None

def names_compatible(n1, n2):
    k1 = norm_str(n1)
    k2 = norm_str(n2)
    if not k1 or not k2:
        return False
    if k1 == k2 or k1 in k2 or k2 in k1:
        return True
    if len(k1) >= 4 and len(k2) >= 4 and k1[:4] == k2[:4]:
        return True
    return False

def main():
    booth_master = load_booth_master()
    polling_master = load_polling_station_master()
    phone_lookup = load_phone_lookup()

    conn = sqlite3.connect(WEB_DB_PATH)
    cur = conn.cursor()

    # Load fallback part metadata from DB
    cur.execute("""
        SELECT part_number, district, ac_name, taluk, polling_station_name, polling_address
        FROM electors
        WHERE part_number IS NOT NULL AND district IS NOT NULL
        GROUP BY part_number
    """)
    db_part_meta = {}
    for pno, dist, ac, taluk, ps_name, ps_addr in cur.fetchall():
        db_part_meta[str(pno)] = {
            'district': dist,
            'ac_name': ac,
            'taluk': taluk,
            'polling_station_name': ps_name,
            'polling_address': ps_addr,
        }

    # Load all existing rows from DB to preserve IDs, phones, and any enriched fields
    cur.execute("""
        SELECT id, part_number, serial_number, epic_number, name, relative_name,
               address, qualification, occupation, age, sex, whatsapp_mob
        FROM electors
    """)
    db_rows = cur.fetchall()
    print(f"Loaded {len(db_rows):,d} existing rows from web/electors.db")

    db_by_ps = defaultdict(list)
    db_by_epic = {}
    db_by_pnr = {}
    db_by_pn = defaultdict(list)

    for r in db_rows:
        rid, pno, sl, epic, name, rel, addr, qual, occ, age, sex, mob = r
        p_s = str(pno).strip() if pno is not None else ''
        if p_s and sl is not None:
            db_by_ps[(p_s, int(sl))].append(r)
        if epic and not is_db_synthetic_epic(epic):
            c_ep = extract_epic(epic) or epic.strip().upper()
            for v in epic_variants(c_ep):
                if v not in db_by_epic or valid_phone(mob):
                    db_by_epic[v] = r
        nk = norm_str(name)
        rk = norm_str(rel)
        if p_s and nk:
            if (p_s, nk, rk) not in db_by_pnr or valid_phone(mob):
                db_by_pnr[(p_s, nk, rk)] = r
            db_by_pn[(p_s, nk)].append(r)

    # Filter to active (non-deleted) records and sort by (part_number, serial_number)
    active_recs = [r for r in all_cached_recs.values() if not r.get('is_deleted')]
    active_recs.sort(key=lambda r: (int(r['part_number']), int(r['serial_number'])))
    print(f"Total canonical active records across 151 parts: {len(active_recs):,d}")

    used_db_ids = set()
    final_rows = []
    stats = Counter()

    for rec in active_recs:
        p_s = str(rec['part_number'])
        sl = int(rec['serial_number'])
        epic = extract_epic(rec.get('epic_number')) if rec.get('epic_number') else None
        name = clean_name(rec.get('name')) or ''
        rel_name = clean_name(rec.get('relative_name'))
        address = clean_text(rec.get('address'))
        qualification = clean_text(rec.get('qualification'))
        occupation = clean_text(rec.get('occupation'))
        age = rec.get('age')
        sex = rec.get('sex')

        # Find best matching DB row to preserve id, phone, and any missing fields
        matched_db = None

        # 1. Match by (part_number, serial_number) with compatible name
        for cand in db_by_ps.get((p_s, sl), []):
            if cand[0] not in used_db_ids and names_compatible(name, cand[4]):
                matched_db = cand
                stats['matched_by_ps'] += 1
                break

        # 2. Match by EPIC variant
        if matched_db is None and epic:
            for v in epic_variants(epic):
                cand = db_by_epic.get(v)
                if cand is not None and cand[0] not in used_db_ids:
                    matched_db = cand
                    stats['matched_by_epic'] += 1
                    break

        # 3. Match by (part_number, norm_name, norm_rel)
        nk = norm_str(name)
        rk = norm_str(rel_name)
        if matched_db is None and nk:
            cand = db_by_pnr.get((p_s, nk, rk))
            if cand is not None and cand[0] not in used_db_ids:
                matched_db = cand
                stats['matched_by_pnr'] += 1

        # 4. Match by (part_number, norm_name)
        if matched_db is None and nk:
            for cand in db_by_pn.get((p_s, nk), []):
                if cand[0] not in used_db_ids:
                    matched_db = cand
                    stats['matched_by_pn'] += 1
                    break

        rid = None
        mob = None
        if matched_db is not None:
            rid, _, _, db_epic, db_name, db_rel, db_addr, db_qual, db_occ, db_age, db_sex, db_mob = matched_db
            used_db_ids.add(rid)
            mob = valid_phone(db_mob)
            if not epic and db_epic and not is_db_synthetic_epic(db_epic):
                epic = extract_epic(db_epic)
            if not rel_name and db_rel:
                rel_name = clean_name(db_rel)
            if not address and db_addr:
                address = clean_text(db_addr)
            if not qualification and db_qual:
                qualification = clean_text(db_qual)
            if not occupation and db_occ:
                occupation = clean_text(db_occ)
            if age is None and db_age is not None:
                age = db_age
            if not sex and db_sex in ('M', 'F', 'O'):
                sex = db_sex
        else:
            stats['newly_added'] += 1

        if not mob:
            mob = resolve_phone(phone_lookup, epic, name, p_s)
        if mob:
            stats['with_phone'] += 1

        b_info = booth_master.get(p_s) or db_part_meta.get(p_s) or {
            'district': 'Karnataka',
            'taluk': '',
            'ac_name': f'Part {p_s}',
        }
        ps_name, ps_addr = resolve_station(polling_master, p_s, sl, db_part_meta.get(p_s))

        final_rows.append((
            rid,
            sl,
            epic,
            name,
            rel_name,
            address,
            qualification,
            occupation,
            age,
            sex,
            p_s,
            ps_name,
            ps_addr,
            mob,
            b_info.get('district'),
            b_info.get('ac_name'),
            b_info.get('taluk'),
            None,  # village
        ))

    print("\n=== RECONCILIATION SUMMARY ===")
    for k, v in stats.items():
        print(f"  {k:30s}: {v:,d}")
    print(f"  {'total_final_rows':30s}: {len(final_rows):,d}")

    # Replace electors table contents cleanly in a transaction
    print("\nUpdating web/electors.db...")
    existing_id_rows = [r for r in final_rows if r[0] is not None]
    new_id_rows = [r[1:] for r in final_rows if r[0] is None]

    cur.execute("DELETE FROM electors;")
    cur.executemany("""
        INSERT INTO electors (
            id, serial_number, epic_number, name, relative_name, address,
            qualification, occupation, age, sex, part_number,
            polling_station_name, polling_address, whatsapp_mob,
            district, ac_name, taluk, village
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, existing_id_rows)
    cur.executemany("""
        INSERT INTO electors (
            serial_number, epic_number, name, relative_name, address,
            qualification, occupation, age, sex, part_number,
            polling_station_name, polling_address, whatsapp_mob,
            district, ac_name, taluk, village
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, new_id_rows)
    conn.commit()

    print("Rebuilding FTS5 full-text search index (electors_fts)...")
    cur.execute("INSERT INTO electors_fts(electors_fts) VALUES('rebuild');")
    cur.execute("ANALYZE;")
    conn.commit()

    cur.execute("SELECT COUNT(*), SUM(CASE WHEN sex='M' THEN 1 ELSE 0 END), SUM(CASE WHEN sex='F' THEN 1 ELSE 0 END), SUM(CASE WHEN whatsapp_mob IS NOT NULL AND whatsapp_mob != '' THEN 1 ELSE 0 END) FROM electors")
    tot, m_cnt, f_cnt, ph_cnt = cur.fetchone()
    print(f"Final DB Verified: Total={tot:,d} (M={m_cnt:,d}, F={f_cnt:,d}), With Phone={ph_cnt:,d}")
    conn.close()

    print("Syncing web/electors.db -> root electors.db...")
    shutil.copy2(WEB_DB_PATH, ROOT_DB_PATH)
    print("Done!")

if __name__ == '__main__':
    main()
