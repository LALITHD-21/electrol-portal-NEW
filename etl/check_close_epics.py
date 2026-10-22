import sqlite3

db = r"c:\Users\techb\Desktop\electrol-portal-NEW-main\electrol-portal-NEW-main\web\electors.db"
conn = sqlite3.connect(db)
c = conn.cursor()

target = "YNT4252136"

# Check prefix YNT42521
c.execute("SELECT part_number, serial_number, epic_number, name, relative_name, address FROM electors WHERE epic_number LIKE 'YNT42521%'")
print("Matches starting with YNT42521_:", c.fetchall())

# Check ending with 252136 or 425213
c.execute("SELECT part_number, serial_number, epic_number, name, relative_name, address FROM electors WHERE epic_number LIKE '%252136%' OR epic_number LIKE '%425213%'")
print("Matches with 252136 or 425213:", c.fetchall())

# Check 1 digit off
def dist1(s1, s2):
    if len(s1) != len(s2): return False
    diff = sum(1 for a, b in zip(s1, s2) if a != b)
    return diff == 1

c.execute("SELECT part_number, serial_number, epic_number, name, relative_name, address FROM electors WHERE epic_number LIKE 'YNT%'")
all_ynt = c.fetchall()
close_1_off = [r for r in all_ynt if dist1(r[2], target)]
print(f"\nExact 1-character typo matches for {target}: {len(close_1_off)}")
for r in close_1_off:
    print(" ", r)

# Check 2 digits off
close_2_off = [r for r in all_ynt if sum(1 for a, b in zip(r[2], target) if a != b) == 2 and len(r[2]) == len(target)]
print(f"\n2-character typo matches for {target}: {len(close_2_off)}")
for r in close_2_off[:10]:
    print(" ", r)

conn.close()
