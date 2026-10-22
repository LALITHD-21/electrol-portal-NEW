import sqlite3

db_path = 'c:/Users/techb/Desktop/electrol-portal-NEW-main/electrol-portal-NEW-main/web/electors.db'
conn = sqlite3.connect(db_path)
c = conn.cursor()

c.execute("SELECT serial_number FROM electors WHERE CAST(part_number AS INTEGER) = 36 AND serial_number IS NOT NULL")
serials = [int(row[0]) for row in c.fetchall() if str(row[0]).isdigit()]
serials.sort()
print(f"Total numeric serials in part 36: {len(serials)}")
print(f"Min serial: {min(serials)}, Max serial: {max(serials)}")

# Check gaps or ranges
print("First 20 serials:", serials[:20])
print("Last 20 serials:", serials[-20:])

# Let's check how the rows in Part 36 without serial numbers look
c.execute("SELECT id, epic_number, name, whatsapp_mob FROM electors WHERE CAST(part_number AS INTEGER) = 36 AND serial_number IS NULL LIMIT 20")
print("\nSample null-serial rows in part 36:")
for r in c.fetchall():
    print(r)

conn.close()
