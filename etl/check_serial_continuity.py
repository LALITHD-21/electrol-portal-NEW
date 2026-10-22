import sqlite3

db_path = 'c:/Users/techb/Desktop/electrol-portal-NEW-main/electrol-portal-NEW-main/web/electors.db'
conn = sqlite3.connect(db_path)
c = conn.cursor()

for p in [30, 31, 32, 33, 34, 35, 36, 40, 44, 51]:
    c.execute("SELECT serial_number FROM electors WHERE CAST(part_number AS INTEGER) = ? AND serial_number IS NOT NULL", (p,))
    serials = [int(r[0]) for r in c.fetchall() if str(r[0]).isdigit()]
    if serials:
        print(f"Part {p}: count={len(serials)}, min={min(serials)}, max={max(serials)}, len==max? {len(serials) == max(serials)}")
    else:
        print(f"Part {p}: no numeric serials")

conn.close()
