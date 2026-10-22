import sqlite3

db_path = 'c:/Users/techb/Desktop/electrol-portal-NEW-main/electrol-portal-NEW-main/web/electors.db'
conn = sqlite3.connect(db_path)
c = conn.cursor()

c.execute("""
    SELECT part_number, epic_number, name, age, sex, address, whatsapp_mob
    FROM electors
    WHERE CAST(part_number AS INTEGER) BETWEEN 30 AND 51
      AND serial_number IS NULL
      AND CAST(part_number AS INTEGER) != 36
    ORDER BY CAST(part_number AS INTEGER)
""")
rows = c.fetchall()
print(f"Total null serial rows outside part 36: {len(rows)}")
for r in rows:
    print(f"Part {r[0]}: EPIC={r[1]}, Name={r[2]}, Phone={r[6]}")

conn.close()
