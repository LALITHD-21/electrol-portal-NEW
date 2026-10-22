import sqlite3

conn = sqlite3.connect('c:/Users/techb/Desktop/electrol-portal-NEW-main/electrol-portal-NEW-main/web/electors.db')
c = conn.cursor()

c.execute("SELECT count(*) FROM electors WHERE epic_number LIKE 'YNT%'")
print("Total YNT records in DB:", c.fetchone()[0])

c.execute("SELECT part_number, count(*) FROM electors WHERE epic_number LIKE 'YNT%' GROUP BY part_number ORDER BY count(*) DESC LIMIT 15")
print("\nTop parts with YNT:")
for r in c.fetchall():
    print(f"  Part {r[0]}: {r[1]} voters")

c.execute("SELECT polling_station_name, polling_address, count(*) FROM electors WHERE epic_number LIKE 'YNT%' GROUP BY polling_station_name ORDER BY count(*) DESC LIMIT 5")
print("\nTop polling stations with YNT:")
for r in c.fetchall():
    print(f"  {r[0]} | {r[1][:50]} | count={r[2]}")

c.execute("SELECT epic_number, name, relative_name, part_number, address FROM electors WHERE epic_number LIKE 'YNT425%' LIMIT 10")
print("\nSample EPICs starting with YNT425:")
for r in c.fetchall():
    print(" ", r)

conn.close()
