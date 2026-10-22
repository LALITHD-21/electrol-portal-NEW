import sqlite3

db = r"C:\Users\techb\Desktop\electoral-portal-main\web\data\electors.db"
conn = sqlite3.connect(db)
c = conn.cursor()
c.execute("SELECT * FROM electors WHERE epic_number = 'YNT4252136'")
rows = c.fetchall()
print(f"electoral-portal-main: {len(rows)} rows found for YNT4252136")
if rows:
    print(rows)

c.execute("SELECT epic_number, name, relative_name, part_number FROM electors WHERE epic_number LIKE '%4252136%'")
print("Like 4252136 in old db:", c.fetchall())

conn.close()
