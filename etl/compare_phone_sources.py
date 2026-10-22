import sqlite3
import csv
import re

db_path = 'c:/Users/techb/Desktop/electrol-portal-NEW-main/electrol-portal-NEW-main/web/electors.db'
conn = sqlite3.connect(db_path)
c = conn.cursor()

# Get map of epic -> phone in DB
c.execute("""
    SELECT epic_number, whatsapp_mob 
    FROM electors 
    WHERE CAST(part_number AS INTEGER) BETWEEN 30 AND 51
""")
db_data = {row[0]: (row[1] or '').strip() for row in c.fetchall()}
print(f"Total electors in DB parts 30-51: {len(db_data)}")
db_with_phone = sum(1 for p in db_data.values() if p != '')
print(f"Electors with phone in DB: {db_with_phone}")

# Check electors_number.csv
csv_path = 'c:/Users/techb/Desktop/electrol-portal-NEW-main/electrol-portal-NEW-main/electors_number.csv'
csv_phones = {}
with open(csv_path, mode='r', encoding='utf-8', errors='ignore') as f:
    reader = csv.DictReader(f)
    for row in reader:
        epic = (row.get('epic_number') or '').strip().upper()
        phone = (row.get('whatsapp_mob') or '').strip()
        if epic and phone and epic in db_data:
            digits = re.sub(r'\D', '', phone)
            if len(digits) == 10 and digits[0] in '6789':
                csv_phones[epic] = digits

print(f"Electors in parts 30-51 with valid phone in electors_number.csv: {len(csv_phones)}")
new_phones = {k: v for k, v in csv_phones.items() if not db_data.get(k)}
print(f"New phones in CSV not in DB: {len(new_phones)}")

conn.close()
