import sqlite3
import csv
import os
import glob

target_epic = "YNT4252136"

print(f"=== CHECKING FOR EPIC: {target_epic} ===\n")

# 1. SQLite Database
db_paths = [
    'c:/Users/techb/Desktop/electrol-portal-NEW-main/electrol-portal-NEW-main/web/electors.db',
    'c:/Users/techb/Desktop/electrol-portal-NEW-main/electrol-portal-NEW-main/electors.db'
]

found_db = False
for dbp in db_paths:
    if os.path.exists(dbp):
        conn = sqlite3.connect(dbp)
        c = conn.cursor()
        c.execute("SELECT * FROM electors WHERE UPPER(TRIM(epic_number)) = ?", (target_epic,))
        rows = c.fetchall()
        # Also check column names
        c.execute("PRAGMA table_info(electors)")
        cols = [col[1] for col in c.fetchall()]
        conn.close()
        if rows:
            found_db = True
            print(f"FOUND in SQLite ({dbp}):")
            for r in rows:
                for col_name, val in zip(cols, r):
                    print(f"  {col_name}: {val}")
        else:
            print(f"Not found in SQLite ({dbp})")

# 2. Check LIKE / partial search in DB (e.g. YNT4252136 without letters or with typo)
conn = sqlite3.connect(db_paths[0])
c = conn.cursor()
c.execute("SELECT part_number, serial_number, epic_number, name, relative_name, whatsapp_mob FROM electors WHERE epic_number LIKE ? OR epic_number LIKE ?", ('%4252136%', '%YNT%'))
like_rows = c.fetchall()
conn.close()
print(f"\nLike query in DB (%4252136% or %YNT%): found {len(like_rows)} rows")
for lr in like_rows[:10]:
    print(" ", lr)

# 3. Check CSV files
csv_files = [
    'c:/Users/techb/Desktop/electrol-portal-NEW-main/electrol-portal-NEW-main/electors_number.csv',
    'c:/Users/techb/Desktop/electrol-portal-NEW-main/electrol-portal-NEW-main/electors_number_backup.csv',
    'c:/Users/techb/Desktop/electrol-portal-NEW-main/electrol-portal-NEW-main/new_members_added_list.csv',
    'c:/Users/techb/Desktop/electrol-portal-NEW-main/electrol-portal-NEW-main/new_members_complete_list_2026.csv'
]

for cp in csv_files:
    if os.path.exists(cp):
        found_in_csv = False
        with open(cp, 'r', encoding='utf-8', errors='ignore') as f:
            for idx, line in enumerate(f):
                if target_epic in line.upper():
                    print(f"FOUND in CSV ({os.path.basename(cp)}) at line {idx+1}:")
                    print("  ", line.strip())
                    found_in_csv = True
        if not found_in_csv:
            print(f"Not found in CSV ({os.path.basename(cp)})")

