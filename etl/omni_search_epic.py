import os
import glob
import openpyxl
import fitz # PyMuPDF
import re

target_epic = "YNT4252136"
target_num = "4252136"

print(f"--- 1. Searching all .xlsx files for {target_epic} or {target_num} ---")
base_dir = r"c:\Users\techb\Desktop\electrol-portal-NEW-main\electrol-portal-NEW-main"

xlsx_files = glob.glob(os.path.join(base_dir, "**/*.xlsx"), recursive=True)
print(f"Total .xlsx files to scan: {len(xlsx_files)}")

found_in = []
for xf in xlsx_files:
    try:
        wb = openpyxl.load_workbook(xf, read_only=True)
        for sname in wb.sheetnames:
            ws = wb[sname]
            for row in ws.iter_rows(values_only=True):
                r_str = " ".join([str(c) for c in row if c is not None])
                if target_epic in r_str or target_num in r_str:
                    print(f"FOUND in {os.path.relpath(xf, base_dir)}:")
                    print("  Row:", row)
                    found_in.append((xf, row))
                    break
        wb.close()
    except Exception as e:
        pass

print(f"\n--- 2. Searching all .pdf files for {target_epic} or {target_num} ---")
pdf_files = glob.glob(os.path.join(base_dir, "**/*.pdf"), recursive=True)
print(f"Total .pdf files to scan: {len(pdf_files)}")

for pf in pdf_files:
    try:
        doc = fitz.open(pf)
        for page_idx in range(len(doc)):
            page = doc[page_idx]
            text = page.get_text()
            if target_epic in text or target_num in text:
                print(f"FOUND in PDF {os.path.relpath(pf, base_dir)} (page {page_idx+1}):")
                for line in text.split('\n'):
                    if target_num in line:
                        print(f"  Line: {line}")
                found_in.append((pf, page_idx+1))
        doc.close()
    except Exception as e:
        pass

print("\n--- 3. Checking similar numbers in SQLite DB ---")
import sqlite3
db_path = os.path.join(base_dir, "web", "electors.db")
conn = sqlite3.connect(db_path)
c = conn.cursor()

# Check numbers ending in 2136 or with 4252
c.execute("SELECT part_number, serial_number, epic_number, name, relative_name FROM electors WHERE epic_number LIKE '%4252%' OR epic_number LIKE '%2136%'")
close_matches = c.fetchall()
print(f"Close numeric matches in DB: {len(close_matches)}")
for cm in close_matches[:10]:
    print(" ", cm)

conn.close()
print("\nDone searching.")
