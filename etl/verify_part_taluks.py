import sqlite3

db_path = 'c:/Users/techb/Desktop/electrol-portal-NEW-main/electrol-portal-NEW-main/web/electors.db'
conn = sqlite3.connect(db_path)
c = conn.cursor()

print("Part | Sample Station Name | Sample Polling Address")
print("-" * 80)
for p in range(30, 52):
    c.execute("SELECT polling_station_name, polling_address FROM electors WHERE CAST(part_number AS INTEGER) = ? AND polling_station_name IS NOT NULL LIMIT 1", (p,))
    row = c.fetchone()
    if row:
        st, addr = row
        print(f"{p:4} | {st[:35]} | {addr[:40]}")
    else:
        print(f"{p:4} | NONE")

conn.close()
