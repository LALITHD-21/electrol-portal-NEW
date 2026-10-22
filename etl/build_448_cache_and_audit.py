import os
import sys
import re
import json
from collections import defaultdict, Counter
from ingest_final_voters_delta import (
    read_xlsx_rows, detect_header_mapping, is_metadata_or_header_row,
    clean_name, clean_text, parse_age, parse_sex, extract_epic
)

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = r"C:\Users\techb\Desktop\electrol-portal-NEW-main\electrol-portal-NEW-main"
FINAL_LIST_DIR = os.path.join(BASE_DIR, "final list")
FINAL_VOTERS_DIR = os.path.join(BASE_DIR, "FINAL VOTERS")
CACHE_PATH = os.path.join(BASE_DIR, "etl", "parsed_448_cache.json")

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

def parse_file_full(file_path):
    rows = read_xlsx_rows(file_path)
    part_no = None
    net_electors_summary = None

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
        else:
            fn_m = re.search(r'Part[_\s\-]*(\d+)', fn, re.IGNORECASE)
            if fn_m:
                part_no = str(int(fn_m.group(1)))

    header_cols = None
    parsed_records = []
    prev_sl = 0

    for r in rows:
        c0_str = r.get(0, '').strip().lower()
        if c0_str.startswith('net electors'):
            nums = []
            for k, v in sorted(r.items()):
                if k > 0:
                    d = re.sub(r'\D', '', str(v))
                    if d.isdigit():
                        nums.append(int(d))
            if len(nums) >= 3:
                net_electors_summary = {'M': nums[-3], 'F': nums[-2], 'T': nums[-1]}

        hdr = detect_header_mapping(r)
        if hdr is not None:
            header_cols = hdr
            continue
        if header_cols is None or is_metadata_or_header_row(r):
            continue

        joined_row = " ".join(r.values())
        is_deleted = bool(re.search(r'(?i)\bdele\s*ted\b', joined_row))

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

        if not name and rel_name and (address or epic or sex):
            name, rel_name = rel_name, None

        if name:
            name = re.sub(r'(?i)\bdele\s*ted\b', '', name).strip()
            name = clean_name(name)

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
            'is_deleted': is_deleted,
            'source_file': fn,
        })

    return part_no, net_electors_summary, parsed_records

def main():
    files = [os.path.join(FINAL_LIST_DIR, f) for f in os.listdir(FINAL_LIST_DIR) if f.lower().endswith('.xlsx')]
    if os.path.exists(FINAL_VOTERS_DIR):
        files += [os.path.join(FINAL_VOTERS_DIR, f) for f in os.listdir(FINAL_VOTERS_DIR) if f.lower().endswith('.xlsx')]

    def file_priority(fpath):
        fn = os.path.basename(fpath)
        in_final_list = 0 if FINAL_LIST_DIR in fpath else 1
        if re.match(r'^\d{1,3}_', fn):
            return (0, in_final_list, fn)
        if fn.lower().startswith('part'):
            return (1, in_final_list, fn)
        return (2, in_final_list, fn)

    files.sort(key=file_priority)

    by_ps = {}
    part_summaries = {}

    for fpath in files:
        pno, net_sum, recs = parse_file_full(fpath)
        if pno and net_sum and pno not in part_summaries:
            part_summaries[pno] = net_sum
        for rec in recs:
            key = f"{rec['part_number']}:{rec['serial_number']}"
            if key not in by_ps:
                by_ps[key] = rec
            else:
                cur = by_ps[key]
                for f in ('epic_number', 'name', 'relative_name', 'address', 'qualification', 'occupation', 'age', 'sex'):
                    if not cur.get(f) and rec.get(f):
                        cur[f] = rec[f]
                if rec.get('is_deleted'):
                    cur['is_deleted'] = True

    data = {
        'part_summaries': part_summaries,
        'records': list(by_ps.values()),
    }
    with open(CACHE_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False)

    all_recs = list(by_ps.values())
    active_recs = [r for r in all_recs if not r.get('is_deleted')]
    del_recs = [r for r in all_recs if r.get('is_deleted')]

    sex_all = Counter(r.get('sex') for r in all_recs)
    sex_act = Counter(r.get('sex') for r in active_recs)
    sex_del = Counter(r.get('sex') for r in del_recs)

    print(f"Saved cache to {CACHE_PATH}")
    print(f"ALL Unique (part, sl)   : {len(all_recs):,d} | M={sex_all['M']:,d}, F={sex_all['F']:,d}")
    print(f"DELETED (is_deleted)    : {len(del_recs):,d} | M={sex_del['M']:,d}, F={sex_del['F']:,d}")
    print(f"ACTIVE (non-deleted)    : {len(active_recs):,d} | M={sex_act['M']:,d}, F={sex_act['F']:,d}")
    print(f"Official ECI Target     : 183,893 | M=104,096, F=79,797")
    print(f"Diff (Active - Official): {len(active_recs) - 183893:+,d} | M={sex_act['M'] - 104096:+,d}, F={sex_act['F'] - 79797:+,d}")

if __name__ == '__main__':
    main()
