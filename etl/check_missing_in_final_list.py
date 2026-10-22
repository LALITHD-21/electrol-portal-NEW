import os
import sys
import re
from collections import defaultdict, Counter
from ingest_final_voters_delta import (
    read_xlsx_rows, detect_header_mapping, is_metadata_or_header_row,
    clean_text, clean_name, extract_epic, parse_age, parse_sex, norm_str
)

sys.stdout.reconfigure(encoding='utf-8')

FINAL_LIST_DIR = r"C:\Users\techb\Desktop\electrol-portal-NEW-main\electrol-portal-NEW-main\final list"

OCR_DIGIT_FIX = str.maketrans({'O': '0', 'o': '0', 'I': '1', 'l': '1', 'S': '5', 'B': '8', 'Z': '2'})

def parse_serial_lenient(s):
    if not s:
        return None
    # Strip '#', '*', spaces, punctuation
    s_clean = re.sub(r'^[#\s\*\.\,\-\|\[\]\(\)\:\/\\]+|[#\s\*\.\,\-\|\[\]\(\)\:\/\\]+$', '', str(s)).strip()
    if re.match(r'^\d+(\.0+)?$', s_clean):
        val = int(float(s_clean))
        if 1 <= val <= 50000:
            return val
    # Check if '# 123' or '123' is inside
    m = re.search(r'(\d{1,4})', s_clean)
    if m and len(s_clean) <= 7:
        val = int(m.group(1))
        if 1 <= val <= 50000:
            return val
    return None

def get_part_for_file(fpath, rows):
    for r in rows[:15]:
        txt = " ".join(r.values())
        m = re.search(r'Part\s*No\s*[:\.\-]?\s*(\d+)', txt, re.IGNORECASE)
        if m and 1 <= int(m.group(1)) <= 151:
            return str(int(m.group(1)))
    fn = os.path.basename(fpath)
    m = re.match(r'^(\d{1,3})_\d+', fn)
    if m and 1 <= int(m.group(1)) <= 151:
        return str(int(m.group(1)))
    m2 = re.search(r'Part[_\s\-]*(\d{1,3})', fn, re.IGNORECASE)
    if m2 and 1 <= int(m2.group(1)) <= 151:
        return str(int(m2.group(1)))
    return None

def scan_all_448():
    files = sorted([f for f in os.listdir(FINAL_LIST_DIR) if f.lower().endswith('.xlsx')])
    stats = Counter()
    sample_recovered_serial = []
    sample_no_serial_voters = []
    sample_shifted_name = []

    # Per part: track distinct serials and unnumbered voters
    part_serials = defaultdict(dict) # part -> {serial: best_record}
    part_unnumbered = defaultdict(list)

    for fn in files:
        fpath = os.path.join(FINAL_LIST_DIR, fn)
        try:
            rows = read_xlsx_rows(fpath)
        except Exception:
            continue
        if not rows:
            continue
        pno = get_part_for_file(fpath, rows)
        header_cols = None
        last_sl = 0

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

            if pno is None and 'part_no' in field_vals:
                p_cand = clean_text(" ".join(field_vals['part_no']))
                if p_cand and p_cand.isdigit():
                    pno = str(int(p_cand))

            raw_sl = " ".join(field_vals.get('serial_number', []))
            sl_no = parse_serial_lenient(raw_sl)
            if sl_no is None and 0 in r:
                sl_no = parse_serial_lenient(r[0])

            name = clean_name(" ".join(field_vals.get('name', [])))
            rel_name = clean_name(" ".join(field_vals.get('relative_name', [])))
            address = clean_text(" ".join(field_vals.get('address', [])))
            qualification = clean_text(" ".join(field_vals.get('qualification', [])))
            occupation = clean_text(" ".join(field_vals.get('occupation', [])))
            age = parse_age(" ".join(field_vals.get('age', [])))
            sex = parse_sex(" ".join(field_vals.get('sex', [])))
            epic = extract_epic(" ".join(field_vals.get('epic_number', [])))

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

            # If name is empty but rel_name + address + (sex or age or epic) is present, name shifted into rel_name!
            if not name and rel_name and (address or epic or sex):
                name = rel_name
                rel_name = None
                stats['recovered_shifted_name'] += 1
                if len(sample_shifted_name) < 10:
                    sample_shifted_name.append((fn, pno, sl_no, name, epic))

            # Filter out summary/footer rows
            if not name and not epic:
                continue
            if name and re.match(r'^[\d\s\.\-\/\#]+$', name):
                continue
            if not address and not epic and not rel_name and not sex:
                continue

            if sl_no is None:
                # Valid voter row whose serial number cell was blank or '#' in OCR!
                if address and (sex or age or epic):
                    stats['valid_voter_missing_serial'] += 1
                    inferred_sl = last_sl + 1 if last_sl > 0 else None
                    if len(sample_no_serial_voters) < 15:
                        sample_no_serial_voters.append((fn, pno, raw_sl, inferred_sl, name, rel_name, epic, sex, age))
                    part_unnumbered[pno].append({
                        'part_number': pno,
                        'serial_number': inferred_sl,
                        'epic_number': epic,
                        'name': name or '',
                        'relative_name': rel_name,
                        'address': address,
                        'qualification': qualification,
                        'occupation': occupation,
                        'age': age,
                        'sex': sex,
                    })
                continue

            last_sl = sl_no
            stats['valid_voter_with_serial'] += 1
            rec = {
                'part_number': pno,
                'serial_number': sl_no,
                'epic_number': epic,
                'name': name or '',
                'relative_name': rel_name,
                'address': address,
                'qualification': qualification,
                'occupation': occupation,
                'age': age,
                'sex': sex,
            }
            existing = part_serials[pno].get(sl_no)
            if existing is None or (not existing['epic_number'] and epic) or (len(existing['name']) < len(rec['name'])):
                part_serials[pno][sl_no] = rec

    total_unique_by_part_serial = sum(len(d) for d in part_serials.values())
    print("=== 448 FILES DEEP SCAN SUMMARY ===")
    for k, v in stats.items():
        print(f"  {k:36s}: {v:,}")
    print(f"  {'unique_(part, serial)_across_151':36s}: {total_unique_by_part_serial:,}")
    print(f"  {'unnumbered_valid_voter_rows':36s}: {sum(len(v) for v in part_unnumbered.values()):,}")

    print("\nSample valid voters that were missing serial_number in col 0:")
    for item in sample_no_serial_voters[:10]:
        print(" ", item)

    print("\nSample voters where name shifted into rel_name:")
    for item in sample_shifted_name[:10]:
        print(" ", item)

if __name__ == '__main__':
    scan_all_448()
