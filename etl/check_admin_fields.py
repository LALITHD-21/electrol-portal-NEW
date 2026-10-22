import sqlite3

db_path = 'c:/Users/techb/Desktop/electrol-portal-NEW-main/electrol-portal-NEW-main/web/electors.db'
conn = sqlite3.connect(db_path)
c = conn.cursor()

c.execute("""
    SELECT DISTINCT part_number, district, taluk, ac_name, village
    FROM electors
    WHERE CAST(part_number AS INTEGER) BETWEEN 30 AND 51
    ORDER BY CAST(part_number AS INTEGER)
""")
rows = c.fetchall()
for r in rows:
    print(r)

conn.close()
