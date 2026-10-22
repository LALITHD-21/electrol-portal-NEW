import sqlite3

conn = sqlite3.connect('c:/Users/techb/Desktop/electrol-portal-NEW-main/electrol-portal-NEW-main/web/electors.db')
c = conn.cursor()
c.execute("""
    SELECT 
        CAST(part_number AS INTEGER) as pnum,
        part_number, 
        count(*) as total, 
        count(CASE WHEN whatsapp_mob IS NOT NULL AND TRIM(whatsapp_mob) != '' THEN 1 END) as with_phone
    FROM electors 
    WHERE pnum BETWEEN 30 AND 51 
    GROUP BY pnum 
    ORDER BY pnum
""")
rows = c.fetchall()
print(f"Total parts found in 30..51: {len(rows)}")
for r in rows:
    print(f"Part {r[1]:>2}: total={r[2]:>5}, with_phone={r[3]:>5}")
