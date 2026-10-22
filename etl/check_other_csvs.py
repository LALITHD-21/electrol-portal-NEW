import sqlite3
import csv
import re

db_path = 'c:/Users/techb/Desktop/electrol-portal-NEW-main/electrol-portal-NEW-main/web/electors.db'
conn = sqlite3.connect(db_path)
c = conn.cursor()

c.execute("SELECT epic_number, whatsapp_mob FROM electors WHERE CAST(part_number AS INTEGER) BETWEEN 30 AND 51")
db_data = {row[0]: (row[1] or '').strip() for row in c.fetchall()}

for filename in ['new_members_added_list.csv', 'new_members_complete_list_2026.csv']:
    path = f'c:/Users/techb/Desktop/electrol-portal-NEW-main/electrol-portal-NEW-main/{filename}'
    added = 0
    try:
        with open(path, mode='r', encoding='utf-8', errors='ignore') as f:
            reader = csv.DictReader(f)
            for row in reader:
                epic = (row.get('epic_number') or row.get('EPIC Number') or '').strip().upper()
                phone = (row.get('whatsapp_mob') or row.get('Mobile Number') or row.get('phone') or '').strip()
                if epic and phone and epic in db_data and not db_data[epic]:
                    digits = re.sub(r'\D', '', phone)
                    if len(digits) == 10 and digits[0] in '6789':
                        added += 1
        print(f"File {filename}: could add {added} phones to parts 30-51")
    except Exception as e:
        print(f"Error checking {filename}: {e}")

conn.close()
