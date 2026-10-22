import os
import re
import json
import shutil
import sqlite3
from collections import defaultdict

BASE_DIR = r"C:\Users\techb\Desktop\electrol-portal-NEW-main\electrol-portal-NEW-main"
WEB_DB_PATH = os.path.join(BASE_DIR, "web", "electors.db")
ROOT_DB_PATH = os.path.join(BASE_DIR, "electors.db")
POLLING_MASTER_TS = os.path.join(BASE_DIR, "web", "lib", "pollingStationMaster.ts")
BOOTH_MASTER_TS = os.path.join(BASE_DIR, "web", "lib", "boothMaster.ts")

def load_polling_master():
    txt = open(POLLING_MASTER_TS, encoding='utf-8').read()
    m = re.search(r'export const POLLING_BOOTHS_MASTER\s*:\s*MasterPollingBooth\[\]\s*=\s*(\[\s*\{.*?\n\]);', txt, re.DOTALL)
    items = json.loads(m.group(1))
    by_part = defaultdict(list)
    for item in items:
        by_part[str(item['basePart']).strip()].append(item)
    return by_part

def load_booth_master():
    txt = open(BOOTH_MASTER_TS, encoding='utf-8').read()
    booth_map = {}
    for m in re.finditer(r'"(\d+)"\s*:\s*\{\s*district:\s*"([^"]+)",\s*taluk:\s*"([^"]+)",\s*ac_name:\s*"([^"]+)"\s*\}', txt):
        booth_map[m.group(1)] = {
            'district': m.group(2),
            'taluk': m.group(3),
            'ac_name': m.group(4),
        }
    return booth_map

def run():
    by_part = load_polling_master()
    booth_map = load_booth_master()
    print(f"Loaded {len(by_part)} parts from pollingStationMaster.ts and {len(booth_map)} parts from boothMaster.ts")

    conn = sqlite3.connect(WEB_DB_PATH)
    cur = conn.cursor()

    cur.execute("SELECT id, part_number, serial_number, polling_station_name, polling_address, district, taluk, ac_name FROM electors")
    rows = cur.fetchall()

    updates = []
    for rid, pno, sl, ps_name, ps_addr, dist, taluk, ac in rows:
        p_s = str(pno).strip() if pno is not None else ''
        if not p_s or p_s not in by_part:
            continue
        stations = by_part[p_s]
        chosen = None
        if sl is not None:
            for st in stations:
                mn = st.get('minSerial')
                mx = st.get('maxSerial')
                if mn is not None and mx is not None and mn <= int(sl) <= mx:
                    chosen = st
                    break
        if chosen is None:
            prim = [st for st in stations if not st.get('isAuxiliary')] or stations
            chosen = prim[0]

        new_ps_name = chosen.get('buildingName') or ps_name
        new_ps_addr = chosen.get('pollingArea') or ps_addr
        bm = booth_map.get(p_s, {})
        new_dist = bm.get('district') or dist
        new_taluk = bm.get('taluk') or taluk
        new_ac = bm.get('ac_name') or ac

        if (new_ps_name != ps_name or new_ps_addr != ps_addr or new_dist != dist or new_taluk != taluk or new_ac != ac):
            updates.append((new_ps_name, new_ps_addr, new_dist, new_taluk, new_ac, rid))

    print(f"Updating polling station & location details on {len(updates):,} rows...")
    if updates:
        cur.executemany("""
            UPDATE electors
            SET polling_station_name = ?, polling_address = ?, district = ?, taluk = ?, ac_name = ?
            WHERE id = ?
        """, updates)
        conn.commit()

    conn.close()
    shutil.copy2(WEB_DB_PATH, ROOT_DB_PATH)
    print("Synced web/electors.db -> root electors.db!")

if __name__ == '__main__':
    run()
