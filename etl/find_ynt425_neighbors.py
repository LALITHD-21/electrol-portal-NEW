import sqlite3

db = r"c:\Users\techb\Desktop\electrol-portal-NEW-main\electrol-portal-NEW-main\web\electors.db"
conn = sqlite3.connect(db)
c = conn.cursor()

c.execute("""
    SELECT part_number, serial_number, epic_number, name, relative_name, address
    FROM electors
    WHERE epic_number LIKE 'YNT425%'
    ORDER BY epic_number
""")
rows = c.fetchall()
print(f"Total YNT425% voters in DB: {len(rows)}")
for r in rows:
    print(f"Part {r[0]:>3} | Sl {str(r[1]):>4} | {r[2]} | {r[3]:<20} | Rel: {r[4]:<20} | {r[5][:40]}")

conn.close()
