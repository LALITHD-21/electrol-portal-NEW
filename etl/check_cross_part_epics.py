import sqlite3

db_path = 'c:/Users/techb/Desktop/electrol-portal-NEW-main/electrol-portal-NEW-main/web/electors.db'
conn = sqlite3.connect(db_path)
c = conn.cursor()

c.execute("""
    SELECT epic_number, count(DISTINCT part_number), GROUP_CONCAT(part_number)
    FROM electors
    WHERE CAST(part_number AS INTEGER) BETWEEN 30 AND 51
    GROUP BY epic_number
    HAVING count(DISTINCT part_number) > 1
""")
cross_dups = c.fetchall()
print(f"EPICs appearing in multiple parts between 30 and 51: {len(cross_dups)}")
for cd in cross_dups[:10]:
    print(cd)

conn.close()
