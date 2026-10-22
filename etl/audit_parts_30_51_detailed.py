import sqlite3

db_path = 'c:/Users/techb/Desktop/electrol-portal-NEW-main/electrol-portal-NEW-main/web/electors.db'
conn = sqlite3.connect(db_path)
c = conn.cursor()

print("Part | Total | Valid Sl | Null Sl | Dup Serials | Dup EPICs | With Phone")
print("-" * 75)

for p in range(30, 52):
    p_str = str(p)
    # Total
    c.execute("SELECT count(*) FROM electors WHERE CAST(part_number AS INTEGER) = ?", (p,))
    total = c.fetchone()[0]
    
    # Valid Sl
    c.execute("SELECT count(*) FROM electors WHERE CAST(part_number AS INTEGER) = ? AND serial_number IS NOT NULL", (p,))
    valid_sl = c.fetchone()[0]
    
    # Null Sl
    null_sl = total - valid_sl
    
    # Dup serials among non-null
    c.execute("""
        SELECT count(*) FROM (
            SELECT serial_number FROM electors 
            WHERE CAST(part_number AS INTEGER) = ? AND serial_number IS NOT NULL 
            GROUP BY serial_number HAVING count(*) > 1
        )
    """, (p,))
    dup_sl = c.fetchone()[0]
    
    # Dup EPICs
    c.execute("""
        SELECT count(*) FROM (
            SELECT epic_number FROM electors 
            WHERE CAST(part_number AS INTEGER) = ? 
            GROUP BY epic_number HAVING count(*) > 1
        )
    """, (p,))
    dup_epic = c.fetchone()[0]
    
    # With phone
    c.execute("""
        SELECT count(*) FROM electors 
        WHERE CAST(part_number AS INTEGER) = ? 
          AND whatsapp_mob IS NOT NULL 
          AND TRIM(whatsapp_mob) != ''
    """, (p,))
    with_phone = c.fetchone()[0]
    
    print(f"{p:4} | {total:5} | {valid_sl:8} | {null_sl:7} | {dup_sl:11} | {dup_epic:9} | {with_phone:10}")

conn.close()
