import sqlite3

db_path = r'c:\Users\techb\Desktop\electrol-portal-NEW-main\electrol-portal-NEW-main\web\electors.db'
conn = sqlite3.connect(db_path)
c = conn.cursor()

for p in [99, 100, 101, 102, 103, 104]:
    c.execute("SELECT count(*), min(CAST(serial_number AS INTEGER)), max(CAST(serial_number AS INTEGER)) FROM electors WHERE CAST(part_number AS INTEGER) = ?", (p,))
    cnt, min_s, max_s = c.fetchone()
    c.execute("SELECT serial_number FROM electors WHERE CAST(part_number AS INTEGER) = ? AND serial_number IS NOT NULL", (p,))
    serials = sorted([int(r[0]) for r in c.fetchall() if str(r[0]).isdigit()])
    missing_count = 0
    if serials:
        full_set = set(range(min(serials), max(serials) + 1))
        missing = sorted(list(full_set - set(serials)))
        missing_count = len(missing)
    print(f"Part {p:3}: count={cnt:4}, min_s={min_s}, max_s={max_s}, missing serial gaps={missing_count}")
    if missing_count > 0 and missing_count <= 20:
        print(f"   Missing serials: {missing}")

conn.close()
