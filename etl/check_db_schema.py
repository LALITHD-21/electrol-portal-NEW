import sqlite3

db_path = r'c:\Users\techb\Desktop\electrol-portal-NEW-main\electrol-portal-NEW-main\web\electors.db'
conn = sqlite3.connect(db_path)
c = conn.cursor()

c.execute("SELECT type, name, sql FROM sqlite_master WHERE tbl_name='electors' OR name LIKE '%electors%'")
for r in c.fetchall():
    print(r)

c.execute("SELECT count(*), count(epic_number), count(CASE WHEN epic_number IS NULL OR TRIM(epic_number) = '' THEN 1 END) FROM electors")
print("\nTotal rows, with epic, blank epic:", c.fetchone())

c.execute("SELECT MAX(id) FROM electors")
print("Max id:", c.fetchone()[0])

conn.close()
