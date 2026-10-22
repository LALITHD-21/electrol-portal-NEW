import os
import sys
import re
import sqlite3
from collections import defaultdict, Counter
from ingest_final_voters_delta import (
    read_xlsx_rows, detect_header_mapping, is_metadata_or_header_row,
    clean_name, clean_text, parse_age, parse_sex, extract_epic, epic_variants,
    norm_str, is_db_synthetic_epic, WEB_DB_PATH
)

sys.stdout.reconfigure(encoding='utf-8')

FINAL_LIST_DIR = r"C:\Users\techb\Desktop\electrol-portal-NEW-main\electrol-portal-NEW-main\final list"

def extract_serial_fixed(c0, c1, prev_sl):
    for raw in (c0, f"{c0}{c1}" if str(c0).strip() in ('#', '*', 'DELE TED', 'DELETED') else ''):
        if not raw:
            continue
        s = re.sub(r'(?i)dele\s*ted', '', str(raw))
        s_trim = s.strip().lower()
        if s_trim == 'so' and prev_sl == 49:
            return 50
        s_digits = re.sub(r'[\s\r\n#\*\.\,\-\|\[\]\(\)\:\/\\]+', '', s)
        if s_digits.isdigit():
            val = int(s_digits)
            if 1 <= val <= 50000:
                return val
    return None

def parse_file_fixed(file_path):
    rows = read_xlsx_rows(file_path)
    part_no = None
    for r in rows[:20]:
        txt = " ".join(r.values())
        m = re.search(r'Part\s*No\s*[:\.\-]?\s*(\d+)', txt, re.IGNORECASE)
        if m:
            part_no = m.group(1)
            break

    fn = os.path.basename(file_path)
    if part_no is None:
        m_num = re.match(r'^(\d{1,3})_', fn)
        if m_num:
            part_no = str(int(m_num.group(1)))
        else:
            fn_m = re.search(r'Part[_\s\-]*(\d+)', fn, re.IGNORECASE)
            if fn_m:
                part_no = str(int(fn_m.group(1)))

    header_cols = None
    parsed_records = []
    prev_sl = 0

    for r in rows:
        hdr = detect_header_mapping(r)
        if hdr is not None:
            header_cols = hdr
            continue
        if header_cols is None or is_metadata_or_header_row(r):
            continue

        field_vals = defaultdict(list)
        for c_idx, val in sorted(r.items()):
            chosen_field = header_cols[0][1]
            for h_col, h_field in header_cols:
                if c_idx >= h_col:
                    chosen_field = h_field
                else:
                    break
            field_vals[chosen_field].append(val)

        c0 = r.get(0, '')
        c1 = r.get(1, '')
        raw_sl = "\n".join(field_vals.get('serial_number', []))
        sl_no = extract_serial_fixed(raw_sl, '', prev_sl)
        if sl_no is None:
            sl_no = extract_serial_fixed(c0, c1, prev_sl)
        if sl_no is None:
            continue
        prev_sl = sl_no

        row_part = part_no
        if 'part_no' in field_vals:
            p_cand = clean_text(" ".join(field_vals['part_no']))
            if p_cand and p_cand.isdigit():
                row_part = str(int(p_cand))

        if not row_part:
            continue

        name = clean_name(" ".join(field_vals.get('name', [])))
        rel_name = clean_name(" ".join(field_vals.get('relative_name', [])))
        address = clean_text(" ".join(field_vals.get('address', [])))
        qualification = clean_text(" ".join(field_vals.get('qualification', [])))
        occupation = clean_text(" ".join(field_vals.get('occupation', [])))

        raw_age = " ".join(field_vals.get('age', []))
        raw_sex = " ".join(field_vals.get('sex', []))
        raw_epic = " ".join(field_vals.get('epic_number', []))

        age = parse_age(raw_age)
        sex = parse_sex(raw_sex)
        epic = extract_epic(raw_epic)

        if epic is None or sex is None or age is None:
            tail_text = " | ".join(
                field_vals.get('occupation', []) +
                field_vals.get('age', []) +
                field_vals.get('sex', []) +
                field_vals.get('epic_number', []) +
                field_vals.get('photo', [])
            )
            if epic is None:
                epic = extract_epic(tail_text)
            if sex is None:
                for tok in (field_vals.get('age', []) + field_vals.get('sex', []) + field_vals.get('epic_number', [])):
                    s_cand = parse_sex(tok)
                    if s_cand:
                        sex = s_cand
                        break
            if age is None:
                for tok in (field_vals.get('occupation', []) + field_vals.get('age', []) + field_vals.get('sex', [])):
                    a_cand = parse_age(tok)
                    if a_cand:
                        age = a_cand
                        break

        # Shifted name column recovery
        if not name and rel_name and (address or epic or sex):
            name, rel_name = rel_name, None

        if not name and not epic:
            continue
        if name and re.match(r'^[\d\s\.\-\/]+$', name):
            continue
        if not address and not epic and not rel_name and not sex:
            continue

        parsed_records.append({
            'part_number': str(int(row_part)) if str(row_part).isdigit() else str(row_part),
            'serial_number': sl_no,
            'epic_number': epic,
            'name': name or '',
            'relative_name': rel_name,
            'address': address,
            'qualification': qualification,
            'occupation': occupation,
            'age': age,
            'sex': sex,
            'source_file': fn,
        })

    return part_no, parsed_records

def main():
    files = sorted([f for f in os.listdir(FINAL_LIST_DIR) if f.lower().endswith('.xlsx')])
    # Prioritize numbered official files (e.g. 100_1791587428.xlsx), then Part_X, then others
    def file_priority(fn):
        if re.match(r'^\d{1,3}_', fn):
            return (0, fn)
        if fn.lower().startswith('part'):
            return (1, fn)
        return (2, fn)

    files.sort(key=file_priority)

    by_ps = {}
    sex_counts = Counter()
    unparsed_files = []

    for fn in files:
        pno, recs = parse_file_fixed(os.path.join(FINAL_LIST_DIR, fn))
        if not recs:
            unparsed_files.append((fn, pno))
            continue
        for rec in recs:
            key = (rec['part_number'], rec['serial_number'])
            if key not in by_ps:
                by_ps[key] = rec
            else:
                # Merge any missing fields from secondary file
                cur = by_ps[key]
                for f in ('epic_number', 'name', 'relative_name', 'address', 'qualification', 'occupation', 'age', 'sex'):
                    if not cur.get(f) and rec.get(f):
                        cur[f] = rec[f]

    for rec in by_ps.values():
        sex_counts[rec.get('sex') or 'U'] += 1

    print(f"Total files scanned: {len(files)}")
    print(f"Unparsed files: {len(unparsed_files)} -> {unparsed_files[:10]}")
    print(f"Unique (part_number, serial_number) across all 448 files: {len(by_ps):,}")
    print(f"Sex distribution in 448 files: M={sex_counts['M']:,}, F={sex_counts['F']:,}, O={sex_counts['O']:,}, U={sex_counts['U']:,}")

    # Check against DB
    conn = sqlite3.connect(WEB_DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT part_number, COUNT(*), SUM(CASE WHEN serial_number IS NULL THEN 1 ELSE 0 END) FROM electors GROUP BY part_number")
    db_part_stats = {str(r[0]): (r[1], r[2]) for r in cur.fetchall()}

    excel_part_counts = Counter(k[0] for k in by_ps.keys())
    diffs = []
    for p in sorted(excel_part_counts.keys(), key=lambda x: int(x) if x.isdigit() else 9999):
        ex_c = excel_part_counts[p]
        db_c, db_null_sl = db_part_stats.get(p, (0, 0))
        if ex_c != db_c or db_null_sl > 0:
            diffs.append((p, ex_c, db_c, db_null_sl, ex_c - db_c))

    print(f"\nParts where Excel count != DB count or DB has null serials ({len(diffs)} parts):")
    for p, ex_c, db_c, db_null_sl, diff in diffs[:40]:
        print(f"  Part {p:3s}: Excel={ex_c:5,d} | DB={db_c:5,d} (null_sl={db_null_sl:4,d}) | Diff(Excel-DB)={diff:+5,d}")

if __name__ == '__main__':
    main()
