import os
import sys
import re
import json
from collections import Counter, defaultdict
from build_448_cache_and_audit import (
    FINAL_LIST_DIR, CACHE_PATH, read_xlsx_rows, detect_header_mapping,
    is_metadata_or_header_row, clean_name, clean_text, parse_age, parse_sex, extract_epic
)

sys.stdout.reconfigure(encoding='utf-8')

OCR_SERIAL_MAP = str.maketrans({
    'O': '0',
    'Q': '0',
    'D': '0',
    'I': '1',
    'L': '1',
    'Z': '2',
    'S': '5',
    'B': '8',
    'G': '6',
})

def extract_serial_perfect(c0, c1, prev_sl):
    for raw in (c0, f"{c0}{c1}" if str(c0).strip() in ('#', '*', 'DELE TED', 'DELETED') else ''):
        if not raw:
            continue
        s = re.sub(r'(?i)dele\s*ted', '', str(raw))
        s_clean = re.sub(r'[\s\r\n#\*\.\,\-\|\[\]\(\)\:\/\\]+', '', s)
        if not s_clean:
            continue
        if s_clean.isdigit():
            val = int(s_clean)
            if 1 <= val <= 50000:
                return val
        # Check OCR character substitutions (e.g. 'SB'->58, 'SO'->50, 'SOS'->505, '8S43'->8543, '103S4'->10354)
        if len(s_clean) <= 5:
            s_fixed = s_clean.upper().translate(OCR_SERIAL_MAP)
            if s_fixed.isdigit():
                val = int(s_fixed)
                if 1 <= val <= 50000 and (prev_sl == 0 or abs(val - (prev_sl + 1)) <= 5):
                    return val
    return None

def parse_primary_file(file_path, forced_part_no=None):
    rows = read_xlsx_rows(file_path)
    part_no = forced_part_no
    if part_no is None:
        for r in rows[:25]:
            txt = " ".join(r.values())
            m = re.search(r'Part\s*No\s*[:\.\-]?\s*(\d+)', txt, re.IGNORECASE)
            if m:
                part_no = str(int(m.group(1)))
                break
    fn = os.path.basename(file_path)
    if part_no is None:
        m_num = re.match(r'^(\d{1,3})_', fn)
        if m_num:
            part_no = str(int(m_num.group(1)))

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

        c0 = r.get(0, '')
        c1 = r.get(1, '')
        is_deleted = bool(re.search(r'(?i)dele\s*ted', f"{c0} {c1}"))

        field_vals = defaultdict(list)
        for c_idx, val in sorted(r.items()):
            chosen_field = header_cols[0][1]
            for h_col, h_field in header_cols:
                if c_idx >= h_col:
                    chosen_field = h_field
                else:
                    break
            field_vals[chosen_field].append(val)

        raw_sl = "\n".join(field_vals.get('serial_number', []))
        sl_no = extract_serial_perfect(raw_sl, '', prev_sl)
        if sl_no is None:
            sl_no = extract_serial_perfect(c0, c1, prev_sl)
        if sl_no is None:
            continue
        prev_sl = sl_no

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

        if not name and rel_name and (address or epic or sex):
            name, rel_name = rel_name, None

        if name:
            name = re.sub(r'(?i)\bdele\s*ted\b', '', name).strip()
            name = clean_name(name)

        if not name and not epic:
            continue

        parsed_records.append({
            'part_number': str(int(part_no)),
            'serial_number': sl_no,
            'epic_number': epic,
            'name': name or '',
            'relative_name': rel_name,
            'address': address,
            'qualification': qualification,
            'occupation': occupation,
            'age': age,
            'sex': sex,
            'is_deleted': is_deleted,
            'source_file': fn,
        })

    return part_no, parsed_records

def main():
    old_cache = json.load(open(CACHE_PATH, encoding='utf-8'))
    old_by_ps = {f"{r['part_number']}:{r['serial_number']}": r for r in old_cache['records']}

    primary_files = {}
    for f in os.listdir(FINAL_LIST_DIR):
        if not f.lower().endswith('.xlsx'):
            continue
        m = re.match(r'^(\d{1,3})_', f)
        if m:
            primary_files[str(int(m.group(1)))] = f

    fallback_unnumbered = {
        '2': 'Harihara city muncipal 18-31,2026.xlsx',
        '10': '2nd page.xlsx',
        '21': 'DVG 16.xlsx',
        '36': 'Chitradurga- Entire kasaba hobli.xlsx',
        '72': 'tiptur entire muncipal council & kasba hobli-2026.xlsx',
        '112': 'Chickkaballalpur-Nandi and Kasaba Hobli, Chickballapur Taluk.xlsx',
    }
    for p, fn in fallback_unnumbered.items():
        if p not in primary_files:
            primary_files[p] = fn

    print(f"Primary files mapped: {len(primary_files)} / 151")

    new_by_ps = {}
    for p in sorted(primary_files.keys(), key=lambda x: int(x)):
        fn = primary_files[p]
        fpath = os.path.join(FINAL_LIST_DIR, fn)
        _, recs = parse_primary_file(fpath, forced_part_no=p)
        for rec in recs:
            key = f"{rec['part_number']}:{rec['serial_number']}"
            if key not in new_by_ps:
                # Enrich any blank field from old_by_ps (which scanned all 448 files), EXCEPT is_deleted!
                if key in old_by_ps:
                    old_r = old_by_ps[key]
                    for fld in ('epic_number', 'name', 'relative_name', 'address', 'qualification', 'occupation', 'age', 'sex'):
                        if not rec.get(fld) and old_r.get(fld):
                            rec[fld] = old_r[fld]
                new_by_ps[key] = rec

    # Also keep any (part, serial) from old_by_ps that wasn't in primary file (if any)
    extra_from_secondary = 0
    for key, old_r in old_by_ps.items():
        if key not in new_by_ps:
            new_by_ps[key] = old_r
            extra_from_secondary += 1

    old_cache['records'] = list(new_by_ps.values())
    with open(CACHE_PATH, 'w', encoding='utf-8') as f:
        json.dump(old_cache, f, ensure_ascii=False)

    all_recs = list(new_by_ps.values())
    act_recs = [r for r in all_recs if not r.get('is_deleted')]
    del_recs = [r for r in all_recs if r.get('is_deleted')]

    by_p = defaultdict(set)
    for r in all_recs:
        by_p[r['part_number']].add(r['serial_number'])
    tot_miss = sum(len([i for i in range(1, max(sls)+1) if i not in sls]) for sls in by_p.values())

    sex_all = Counter(r.get('sex') for r in all_recs)
    sex_act = Counter(r.get('sex') for r in act_recs)
    sex_del = Counter(r.get('sex') for r in del_recs)

    print(f"Extra records from secondary files: {extra_from_secondary}")
    print(f"Total missing serials across all 151 parts (1..max_sl): {tot_miss}")
    print(f"ALL Unique (part, sl)   : {len(all_recs):,d} | M={sex_all['M']:,d}, F={sex_all['F']:,d}")
    print(f"DELETED (is_deleted)    : {len(del_recs):,d} | M={sex_del['M']:,d}, F={sex_del['F']:,d}")
    print(f"ACTIVE (non-deleted)    : {len(act_recs):,d} | M={sex_act['M']:,d}, F={sex_act['F']:,d}")
    print(f"Official ECI Target     : 183,893 | M=104,096, F=79,797")
    print(f"Diff (Active - Official): {len(act_recs) - 183893:+,d} | M={sex_act['M'] - 104096:+,d}, F={sex_act['F'] - 79797:+,d}")

if __name__ == '__main__':
    main()
