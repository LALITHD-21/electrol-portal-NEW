import sqlite3
import re
import os

db_path = 'c:/Users/techb/Desktop/electrol-portal-NEW-main/electrol-portal-NEW-main/web/electors.db'
conn = sqlite3.connect(db_path)
c = conn.cursor()

print("--- Checking duplicate EPICs or duplicate serials in Parts 30 to 51 ---")
c.execute("""
    SELECT part_number, epic_number, count(*) 
    FROM electors 
    WHERE CAST(part_number AS INTEGER) BETWEEN 30 AND 51 
    GROUP BY part_number, epic_number 
    HAVING count(*) > 1
""")
dup_epics = c.fetchall()
print(f"Duplicate EPICs in same part: {len(dup_epics)}")
if dup_epics[:5]:
    print("Sample dup epics:", dup_epics[:5])

c.execute("""
    SELECT part_number, serial_number, count(*) 
    FROM electors 
    WHERE CAST(part_number AS INTEGER) BETWEEN 30 AND 51 
    GROUP BY part_number, serial_number 
    HAVING count(*) > 1
""")
dup_serials = c.fetchall()
print(f"Duplicate Serials in same part: {len(dup_serials)}")
if dup_serials[:5]:
    print("Sample dup serials:", dup_serials[:5])

print("\n--- Checking phone numbers in Parts 30 to 51 ---")
c.execute("""
    SELECT whatsapp_mob, count(*) 
    FROM electors 
    WHERE CAST(part_number AS INTEGER) BETWEEN 30 AND 51 
      AND whatsapp_mob IS NOT NULL 
      AND TRIM(whatsapp_mob) != ''
    GROUP BY whatsapp_mob
    LIMIT 20
""")
phones = c.fetchall()
print("Sample phone values:")
for p, cnt in phones[:10]:
    print(f"  '{p}' (count: {cnt})")

c.execute("""
    SELECT whatsapp_mob 
    FROM electors 
    WHERE CAST(part_number AS INTEGER) BETWEEN 30 AND 51 
      AND whatsapp_mob IS NOT NULL 
      AND TRIM(whatsapp_mob) != ''
""")
all_phones = [row[0] for row in c.fetchall()]

valid_phones = []
invalid_phones = []
for p in all_phones:
    # clean to digits
    digits = re.sub(r'\D', '', str(p))
    if len(digits) == 10 and digits[0] in '6789':
        valid_phones.append(digits)
    else:
        invalid_phones.append(p)

print(f"Total non-empty phone rows: {len(all_phones)}")
print(f"Valid 10-digit Indian numbers (starting with 6-9): {len(valid_phones)}")
print(f"Invalid phone values: {len(invalid_phones)}")
if invalid_phones[:10]:
    print("Sample invalid phones:", invalid_phones[:10])

print("\n--- Checking polling station info in Parts 30 to 51 ---")
c.execute("""
    SELECT part_number, polling_station_name, polling_address, count(*)
    FROM electors
    WHERE CAST(part_number AS INTEGER) BETWEEN 30 AND 51
    GROUP BY part_number, polling_station_name, polling_address
    ORDER BY CAST(part_number AS INTEGER)
""")
stations = c.fetchall()
print(f"Distinct part & station combinations: {len(stations)}")
for s in stations[:10]:
    print(f"Part {s[0]}: Station='{s[1][:40]}...', Address='{s[2][:40]}...', Count={s[3]}")

conn.close()
