import openpyxl
import os
import re

dir_path = 'c:/Users/techb/Desktop/electrol-portal-NEW-main/exports/Parts_30_to_51'

all_passed = True
total_voters_checked = 0
total_phones_checked = 0

print(f"{'Part':<5} | {'File Name':<20} | {'Rows':<6} | {'Phones':<6} | {'Dup EPICs':<9} | {'Sl No 1..N':<10} | {'Phone Validity':<14} | Status")
print("-" * 95)

for part in range(30, 52):
    fname = f"Part_{part}_Voters.xlsx"
    fpath = os.path.join(dir_path, fname)
    if not os.path.exists(fpath):
        print(f"FAILED: {fname} does not exist!")
        all_passed = False
        continue
        
    wb = openpyxl.load_workbook(fpath, read_only=True)
    ws = wb.active
    
    rows = list(ws.iter_rows(values_only=True))
    wb.close()
    
    header = rows[0]
    data = rows[1:]
    
    voter_count = len(data)
    total_voters_checked += voter_count
    
    # 1. Check Sl No sequence
    sl_nos = [r[0] for r in data]
    expected_sl = list(range(1, voter_count + 1))
    sl_ok = (sl_nos == expected_sl)
    
    # 2. Check EPIC uniqueness
    epics = [r[2] for r in data if r[2]]
    dup_epics = len(epics) - len(set(epics))
    
    # 3. Check Phone validity
    phones = [str(r[7]).strip() for r in data if r[7] is not None and str(r[7]).strip() != '']
    phone_count = len(phones)
    total_phones_checked += phone_count
    
    invalid_phones = []
    for p in phones:
        if not (len(p) == 10 and p[0] in '6789' and p.isdigit()):
            invalid_phones.append(p)
            
    phone_ok = (len(invalid_phones) == 0)
    
    status = "OK" if (sl_ok and dup_epics == 0 and phone_ok) else "FAIL"
    if status == "FAIL":
        all_passed = False
        
    print(f"{part:<5} | {fname:<20} | {voter_count:<6} | {phone_count:<6} | {dup_epics:<9} | {'PASS' if sl_ok else 'FAIL':<10} | {'100% VALID' if phone_ok else f'INVALID {len(invalid_phones)}':<14} | {status}")

print("-" * 95)
print(f"Grand Total Electors Verified: {total_voters_checked:,}")
print(f"Grand Total Verified Phones:   {total_phones_checked:,}")
print(f"Overall Verification Result:   {'ALL 22 FILES 100% PERFECT & VERIFIED' if all_passed else 'SOME CHECKS FAILED'}")
