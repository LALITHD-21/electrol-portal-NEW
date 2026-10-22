import os
import sys
import re
import sqlite3
import zipfile
import xml.etree.ElementTree as ET
from collections import defaultdict, Counter
from ingest_final_voters_delta import (
    WEB_DB_PATH, parse_file, read_xlsx_rows, detect_header_mapping,
    epic_variants, norm_str, is_db_synthetic_epic
)

sys.stdout.reconfigure(encoding='utf-8')

FINAL_LIST_DIR = r"C:\Users\techb\Desktop\electrol-portal-NEW-main\electrol-portal-NEW-main\final list"

def get_part_for_file(fpath, pno_from_content):
    if pno_from_content and str(pno_from_content).isdigit() and 1 <= int(pno_from_content) <= 151:
        return str(int(pno_from_content))
    fn = os.path.basename(fpath)
    # e.g. "100_1791587428.xlsx", "32_1791587153.pdf.pdf.xlsx", "Part_59_..."
    m = re.match(r'^(\d{1,3})_\d+', fn)
    if m and 1 <= int(m.group(1)) <= 151:
        return str(int(m.group(1)))
    m2 = re.search(r'Part[_\s\-]*(\d{1,3})', fn, re.IGNORECASE)
    if m2 and 1 <= int(m2.group(1)) <= 151:
        return str(int(m2.group(1)))
    return None

def audit_448():
    files = sorted([f for f in os.listdir(FINAL_LIST_DIR) if f.lower().endswith('.xlsx')])
    print(f"Total .xlsx files in 'final list': {len(files)}")

    zero_rec_files = []
    no_part_files = []
    part_files_map = defaultdict(list)
    part_max_serial = Counter()
    all_parsed_by_file = {}

    total_raw_rows = 0
    for fn in files:
        fpath = os.path.join(FINAL_LIST_DIR, fn)
        try:
            pno_content, recs = parse_file(fpath)
        except Exception as e:
            print(f"Error parsing {fn}: {e}")
            continue
        pno = get_part_for_file(fpath, pno_content)
        if pno:
            for r in recs:
                r['part_number'] = pno
                if r['serial_number'] and r['serial_number'] > part_max_serial[pno]:
                    part_max_serial[pno] = r['serial_number']
            part_files_map[pno].append((fn, len(recs)))
        else:
            no_part_files.append((fn, pno_content, len(recs)))

        if not recs:
            zero_rec_files.append((fn, pno))
        total_raw_rows += len(recs)
        all_parsed_by_file[fn] = (pno, recs)

    print(f"Total voter rows parsed across {len(files)} files: {total_raw_rows:,}")
    print(f"Distinct Parts (1..151) found in 'final list': {len(part_files_map)} / 151")
    missing_parts = [str(i) for i in range(1, 152) if str(i) not in part_files_map]
    print(f"Missing Parts in 'final list': {missing_parts}")
    print(f"Sum of MAX(serial_number) across all {len(part_max_serial)} parts: {sum(part_max_serial.values()):,}")

    if no_part_files:
        print(f"\nFiles without detected Part No ({len(no_part_files)}):")
        for item in no_part_files[:30]:
            print(" ", item)

    if zero_rec_files:
        print(f"\nFiles with 0 parsed voter rows ({len(zero_rec_files)}):")
        for item in zero_rec_files[:30]:
            print(" ", item)

if __name__ == '__main__':
    audit_448()
