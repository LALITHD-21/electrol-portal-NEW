import os
import sys
import re
from collections import Counter
from check_448_reconciliation import FINAL_LIST_DIR, read_xlsx_rows, parse_file_fixed

sys.stdout.reconfigure(encoding='utf-8')

files_151 = sorted(
    [f for f in os.listdir(FINAL_LIST_DIR) if re.match(r'^\d{1,3}_', f) and f.lower().endswith('.xlsx')],
    key=lambda x: int(re.match(r'^(\d{1,3})_', x).group(1))
)

tot_parsed_151 = 0
tot_m_151 = 0
tot_f_151 = 0
tot_del_m = 0
tot_del_f = 0

for fn in files_151:
    fpath = os.path.join(FINAL_LIST_DIR, fn)
    pno, recs = parse_file_fixed(fpath)
    by_sl = {r['serial_number']: r for r in recs}
    tot_parsed_151 += len(by_sl)
    for r in by_sl.values():
        if r['sex'] == 'M':
            tot_m_151 += 1
        elif r['sex'] == 'F':
            tot_f_151 += 1

print(f"151 Numbered Files Only -> Total Unique (part, sl): {tot_parsed_151:,} (M={tot_m_151:,}, F={tot_f_151:,})")
print(f"Diff from 183,893 (M=104,096, F=79,797): Total={tot_parsed_151 - 183893:+,d} (M={tot_m_151 - 104096:+,d}, F={tot_f_151 - 79797:+,d})")
