import json
import re
from collections import Counter, defaultdict

data = json.load(open('electrol-portal-NEW-main/etl/parsed_448_cache.json', encoding='utf-8'))
recs = {f"{r['part_number']}:{r['serial_number']}": r for r in data['records']}

# 1. Add Part 46 Sl 505 (from hosadurga entire srirampura hobli-2026.xlsx)
recs['46:505'] = {
    'part_number': '46', 'serial_number': 505, 'epic_number': 'THT0013227',
    'name': 'Saritha Bm', 'relative_name': 'Ningappa B',
    'address': '9 Gandhi Nagara Hosadurga Taluk (VTC) Belaguru (Post) Hosadurga (Tq) CHITRADURGA (Dist) Karnataka',
    'qualification': 'BA', 'occupation': 'Supervisor', 'age': 40, 'sex': 'F',
    'is_deleted': False, 'source_file': 'hosadurga entire srirampura hobli-2026.xlsx'
}

# 2. Add Part 36 Sl 11043..11489 (from part_36_extracted.json)
d36 = json.load(open('electrol-portal-NEW-main/etl/reports/part_36_extracted.json', encoding='utf-8'))
for r in d36:
    sl = r.get('serial_number')
    if sl and sl > 11042:
        recs[f'36:{sl}'] = {
            'part_number': '36', 'serial_number': sl, 'epic_number': r.get('epic_number'),
            'name': r.get('name') or '', 'relative_name': r.get('relative_name'),
            'address': r.get('address'), 'qualification': r.get('qualification'),
            'occupation': r.get('occupation'), 'age': r.get('age'), 'sex': r.get('sex'),
            'is_deleted': False, 'source_file': '36e_1791966609.pdf'
        }

# 3. Add Part 72 Sl 2386..2571 (from part_72_extracted.json)
d72 = json.load(open('electrol-portal-NEW-main/etl/reports/part_72_extracted.json', encoding='utf-8'))
for r in d72:
    sl = r.get('serial_number')
    if sl and sl > 2385:
        nm = r.get('name') or ''
        rel = r.get('relative_name')
        addr = r.get('address')
        occ = r.get('occupation')
        if sl == 2386 and nm == 'Sl':
            nm = 'UMESH H B'
            rel = 'LATE BASAVAYYA'
            addr = '17 vinayaka nagara TIPTUR (VTC) TIPTUR (Post) Tiptur (Tq) TUMKUR (Dist) Karnataka'
            occ = 'TRANSPORT DEPT'
        recs[f'72:{sl}'] = {
            'part_number': '72', 'serial_number': sl, 'epic_number': r.get('epic_number'),
            'name': nm, 'relative_name': rel,
            'address': addr, 'qualification': r.get('qualification'),
            'occupation': occ, 'age': r.get('age'), 'sex': r.get('sex'),
            'is_deleted': False, 'source_file': '72e_1791875014.pdf'
        }

act = [r for r in recs.values() if not r.get('is_deleted')]
dels = [r for r in recs.values() if r.get('is_deleted')]
sex_act = Counter(r.get('sex') for r in act)
sex_all = Counter(r.get('sex') for r in recs.values())

print(f"Total All (1..max_sl) : {len(recs):,d} | M={sex_all['M']:,d}, F={sex_all['F']:,d}")
print(f"Total Deleted         : {len(dels):,d}")
print(f"Total Active          : {len(act):,d} | M={sex_act['M']:,d}, F={sex_act['F']:,d}")
print(f"Official ECI Target   : 183,893 | M=104,096, F=79,797")
print(f"Diff (Active-Official): {len(act) - 183893:+,d} | M={sex_act['M'] - 104096:+,d}, F={sex_act['F'] - 79797:+,d}")

# Check why Part 36 has 1061 deleted vs how many in Part 36 are in part_36_extracted.json
p36_act = [r for r in act if r['part_number'] == '36']
p36_del = [r for r in dels if r['part_number'] == '36']
print(f"Part 36: Active={len(p36_act):,d}, Deleted={len(p36_del):,d}, Total={len(p36_act)+len(p36_del):,d}")
