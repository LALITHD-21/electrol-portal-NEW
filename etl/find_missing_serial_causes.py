import os
import sys
import re
from ingest_final_voters_delta import (
    read_xlsx_rows, detect_header_mapping, is_metadata_or_header_row
)

sys.stdout.reconfigure(encoding='utf-8')

FINAL_LIST_DIR = r"C:\Users\techb\Desktop\electrol-portal-NEW-main\electrol-portal-NEW-main\final list"

files = sorted([f for f in os.listdir(FINAL_LIST_DIR) if re.match(r'^\d{1,3}_', f) and f.lower().endswith('.xlsx')])

def extract_serial_fixed(c0, c1, prev_sl):
    for raw in (c0, f"{c0}{c1}" if str(c0).strip() in ('#', '*', 'DELE TED', 'DELETED') else ''):
        if not raw:
            continue
        s = re.sub(r'(?i)dele\s*ted', '', str(raw))
        s_trim = s.strip().lower()
        if s_trim == 'so' and prev_sl == 49:
            return 50
        # Remove #, *, spaces, newlines between digits
        s_digits = re.sub(r'[\s\r\n#\*\.\,\-\|\[\]\(\)\:\/\\]+', '', s)
        if s_digits.isdigit():
            val = int(s_digits)
            if 1 <= val <= 50000:
                return val
    return None

part_gaps = []
total_seen = 0
total_net_electors_reported = 0

for fn in files:
    pno = re.match(r'^(\d{1,3})_', fn).group(1)
    rows = read_xlsx_rows(os.path.join(FINAL_LIST_DIR, fn))
    header_cols = None
    seen_sls = set()
    max_sl = 0
    prev_sl = 0
    net_rep = None

    for r_idx, r in enumerate(rows):
        if r.get(0, '').strip().lower().startswith('net electors'):
            # Last numeric value in row is total net electors for this part
            nums = [int(re.sub(r'\D', '', v)) for k, v in sorted(r.items()) if k > 0 and re.sub(r'\D', '', str(v)).isdigit()]
            if nums:
                net_rep = nums[-1]
        hdr = detect_header_mapping(r)
        if hdr is not None:
            header_cols = hdr
            continue
        if header_cols is None or is_metadata_or_header_row(r):
            continue
        c0 = r.get(0, '')
        c1 = r.get(1, '')
        sl = extract_serial_fixed(c0, c1, prev_sl)
        if sl is not None:
            seen_sls.add(sl)
            prev_sl = sl
            if sl > max_sl:
                max_sl = sl

    total_seen += len(seen_sls)
    if net_rep:
        total_net_electors_reported += net_rep
    missing = [i for i in range(1, max_sl + 1) if i not in seen_sls]
    if len(missing) > 5:
        part_gaps.append((pno, fn, max_sl, net_rep, len(seen_sls), len(missing), missing[:10]))

print(f"Total seen across {len(files)} numbered files: {total_seen:,}")
print(f"Parts with >5 missing serials: {len(part_gaps)}")
for pno, fn, mx, nr, seen, miss_cnt, miss_sample in part_gaps[:20]:
    print(f"  Part {pno:3s} ({fn:25s}): max_sl={mx:4d}, net_electors={str(nr):5s}, seen={seen:4d}, missing={miss_cnt:4d} | {miss_sample}")
