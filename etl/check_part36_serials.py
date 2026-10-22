import sqlite3

db_path = 'c:/Users/techb/Desktop/electrol-portal-NEW-main/electrol-portal-NEW-main/web/electors.db'
conn = sqlite3.connect(db_path)
c = conn.cursor()

c.execute("SELECT id, serial_number, epic_number, name FROM electors WHERE CAST(part_number AS INTEGER) = 36 ORDER BY id LIMIT 30")
rows = c.fetchall()
print("First 30 rows in Part 36 by id:")
for r in rows[:15]:
    print(r)

c.execute("SELECT count(*) FROM electors WHERE CAST(part_number AS INTEGER) = 36 AND serial_number IS NOT NULL")
print("Rows with non-null serial in Part 36:", c.fetchone()[0])

c.execute("SELECT serial_number, epic_number, name FROM electors WHERE CAST(part_number AS INTEGER) = 36 AND serial_number IS NOT NULL ORDER BY CAST(serial_number AS INTEGER) LIMIT 15")
print("First 15 with non-null serial:")
for r in c.fetchall():
    print(r)

c.execute("SELECT serial_number, epic_number, name FROM electors WHERE CAST(part_number AS INTEGER) = 36 AND serial_number IS NOT NULL ORDER BY CAST(serial_number AS INTEGER) DESC LIMIT 15")
print("Last 15 with non-null serial:")
for r in c.fetchall():
    print(r)

conn.close()
