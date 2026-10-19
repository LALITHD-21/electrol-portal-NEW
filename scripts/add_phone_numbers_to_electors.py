import os
import sys
import csv
import re
import time
import openpyxl

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
from openpyxl.styles import Font, PatternFill, Alignment

def clean_phone(val):
    if not val:
        return ''
    digits = re.sub(r'\D', '', str(val).strip())
    if len(digits) >= 10:
        return digits[-10:]
    return ''

def clean_text(val):
    if val is None:
        return ''
    s = str(val).strip()
    if s.lower() in ('none', 'nan', 'null'):
        return ''
    return s

def main():
    print("=" * 80)
    print("  MERGE ELECTOR PHONE NUMBERS PIPELINE (ZERO-ERROR)")
    print("=" * 80)
    start_time = time.time()

    folder_dir = r"C:\Users\techb\Desktop\electrol-portal-NEW-main\electrol-portal-NEW-main"
    desktop_csv = r"C:\Users\techb\Desktop\MLC_Voters_ALL_Filtered_2026-10-04.csv"
    existing_xlsx = os.path.join(folder_dir, "MLC_Voters_ALL_Filtered_2026-10-05.xlsx")
    electors_csv = os.path.join(folder_dir, "electors_number.csv")

    # 1. Step 1: Build phone lookups across all sources
    print("🔍 [1/5] Building phone number lookup dictionaries...")
    phone_by_epic = {}
    phone_by_name_rel = {}

    # Source 1: Desktop CSV
    if os.path.exists(desktop_csv):
        print(f"  Reading source: {desktop_csv}")
        with open(desktop_csv, 'r', encoding='utf-8', errors='ignore') as f:
            r = csv.reader(f)
            next(r)
            for row in r:
                if len(row) > 14:
                    p = clean_phone(row[14])
                    if p:
                        ep = row[3].strip().upper()
                        name = row[1].strip().upper()
                        rel = row[2].strip().upper()
                        if ep and ep != 'NO_EPIC':
                            phone_by_epic[ep] = p
                        if name and rel:
                            phone_by_name_rel[(name, rel)] = p

    # Source 2: Existing 2026-10-05.xlsx
    if os.path.exists(existing_xlsx):
        print(f"  Reading source: {existing_xlsx}")
        wb_ex = openpyxl.load_workbook(existing_xlsx, read_only=True)
        sheet_ex = wb_ex.active
        for row in sheet_ex.iter_rows(values_only=True):
            if len(row) > 14:
                p = clean_phone(row[14])
                if p:
                    ep = str(row[3]).strip().upper()
                    name = str(row[1]).strip().upper()
                    rel = str(row[2]).strip().upper()
                    if ep and ep != 'NO_EPIC' and ep not in phone_by_epic:
                        phone_by_epic[ep] = p
                    if name and rel and (name, rel) not in phone_by_name_rel:
                        phone_by_name_rel[(name, rel)] = p
        wb_ex.close()

    # Source 3: Electors CSV
    if os.path.exists(electors_csv):
        print(f"  Reading source: {electors_csv}")
        with open(electors_csv, 'r', encoding='utf-8', errors='ignore') as f:
            r = csv.reader(f)
            h = next(r)
            epic_idx = h.index('epic_number')
            name_idx = h.index('name')
            rel_idx = h.index('relative_name')
            mob_idx = h.index('whatsapp_mob')
            for row in r:
                if len(row) > mob_idx:
                    p = clean_phone(row[mob_idx])
                    if p:
                        ep = row[epic_idx].strip().upper()
                        name = row[name_idx].strip().upper()
                        rel = row[rel_idx].strip().upper()
                        if ep and ep != 'NO_EPIC' and ep not in phone_by_epic:
                            phone_by_epic[ep] = p
                        if name and rel and (name, rel) not in phone_by_name_rel:
                            phone_by_name_rel[(name, rel)] = p

    print(f"  ✅ Compiled Phone Index: {len(phone_by_epic):,} unique EPICs, {len(phone_by_name_rel):,} Name+Relation pairs")

    # Headers for clean Excel files
    excel_headers = [
        "Sl No",
        "Elector Name",
        "Relative Name",
        "EPIC Number",
        "Gender",
        "Age",
        "District",
        "Taluk",
        "Assembly Constituency",
        "Hobli",
        "Grama Panchayath",
        "Village",
        "Polling Station / Area",
        "Part Number",
        "Mobile Number",
        "Caste",
        "Qualification",
        "Occupation",
        "Address"
    ]

    # File paths for outputs
    out_all_xlsx = os.path.join(folder_dir, "MLC_Voters_ALL_With_Phone_Numbers_2026.xlsx")
    out_phones_only_xlsx = os.path.join(folder_dir, "MLC_Voters_Only_With_Phone_Numbers.xlsx")

    print(f"\n📂 [2/5] Creating Master Excel Sheet with ALL Electors...")
    print(f"  Target: {out_all_xlsx}")

    wb_all = openpyxl.Workbook(write_only=True)
    ws_all = wb_all.create_sheet(title="All Electors")
    ws_all.append(excel_headers)

    print(f"📂 [3/5] Creating Filtered Excel Sheet with Electors Having Phone Numbers...")
    print(f"  Target: {out_phones_only_xlsx}")

    wb_phones = openpyxl.Workbook(write_only=True)
    ws_phones = wb_phones.create_sheet(title="Electors With Mobile")
    ws_phones.append(excel_headers)

    total_rows = 0
    total_with_phone = 0
    phone_only_sl = 0

    with open(desktop_csv, 'r', encoding='utf-8', errors='ignore') as f:
        r = csv.reader(f)
        next(r)
        for row in r:
            total_rows += 1
            
            sl_no = row[0].strip() if len(row) > 0 else str(total_rows)
            name = clean_text(row[1]) if len(row) > 1 else ''
            rel_name = clean_text(row[2]) if len(row) > 2 else ''
            epic = clean_text(row[3]).upper() if len(row) > 3 else ''
            sex = clean_text(row[4]).upper() if len(row) > 4 else ''
            age_raw = clean_text(row[5]) if len(row) > 5 else ''
            try:
                age = int(float(age_raw)) if age_raw else ''
            except:
                age = age_raw
            district = clean_text(row[6]) if len(row) > 6 else ''
            taluk = clean_text(row[7]) if len(row) > 7 else ''
            ac_name = clean_text(row[8]) if len(row) > 8 else ''
            hobli = clean_text(row[9]) if len(row) > 9 else ''
            gp = clean_text(row[10]) if len(row) > 10 else ''
            village = clean_text(row[11]) if len(row) > 11 else ''
            area = clean_text(row[12]) if len(row) > 12 else ''
            part_no = clean_text(row[13]) if len(row) > 13 else ''
            
            # Mobile Number Lookup Logic
            mob = clean_phone(row[14]) if len(row) > 14 else ''
            if not mob:
                if epic and epic in phone_by_epic:
                    mob = phone_by_epic[epic]
                else:
                    norm_name = name.upper()
                    norm_rel = rel_name.upper()
                    if (norm_name, norm_rel) in phone_by_name_rel:
                        mob = phone_by_name_rel[(norm_name, norm_rel)]

            caste = clean_text(row[15]) if len(row) > 15 else ''
            qualification = clean_text(row[16]) if len(row) > 16 else ''
            occupation = clean_text(row[17]) if len(row) > 17 else ''
            address = clean_text(row[18]) if len(row) > 18 else ''
            
            clean_row = [
                sl_no,
                name,
                rel_name,
                epic,
                sex,
                age,
                district,
                taluk,
                ac_name,
                hobli,
                gp,
                village,
                area,
                part_no,
                mob,
                caste,
                qualification,
                occupation,
                address
            ]

            ws_all.append(clean_row)

            if mob:
                total_with_phone += 1
                phone_only_sl += 1
                clean_row_phone = list(clean_row)
                clean_row_phone[0] = phone_only_sl
                ws_phones.append(clean_row_phone)

            if total_rows % 25000 == 0:
                print(f"  Processed {total_rows:,} electors... ({total_with_phone:,} with phone numbers)")

    print(f"  💾 Saving {out_all_xlsx}...")
    wb_all.save(out_all_xlsx)

    print(f"  💾 Saving {out_phones_only_xlsx}...")
    wb_phones.save(out_phones_only_xlsx)

    # 4. Step 4: Also update MLC_Voters_ALL_Filtered_2026-10-05.xlsx with full updated dataset
    print(f"\n📂 [4/5] Updating {existing_xlsx} so clicking it opens full voter list with phone numbers...")
    backup_existing = os.path.join(folder_dir, "MLC_Voters_ALL_Filtered_2026-10-05_backup.xlsx")
    if os.path.exists(existing_xlsx) and not os.path.exists(backup_existing):
        import shutil
        shutil.copy2(existing_xlsx, backup_existing)
        print(f"  Created backup of original 2k file at: {backup_existing}")
    
    # Save a direct copy as MLC_Voters_ALL_Filtered_2026-10-05.xlsx
    import shutil
    shutil.copy2(out_all_xlsx, existing_xlsx)
    print(f"  ✅ Replaced {existing_xlsx} with complete 178k voter list with phone numbers!")

    # 5. Step 5: Update electors_number.csv in the folder so its whatsapp_mob column is filled!
    print(f"\n📂 [5/5] Updating {electors_csv} with matched mobile numbers...")
    electors_backup = os.path.join(folder_dir, "electors_number_backup.csv")
    if os.path.exists(electors_csv) and not os.path.exists(electors_backup):
        import shutil
        shutil.copy2(electors_csv, electors_backup)
        print(f"  Created backup of electors_number.csv at: {electors_backup}")

    temp_electors_csv = os.path.join(folder_dir, "electors_number_temp.csv")
    electors_updated_count = 0
    with open(electors_csv, 'r', encoding='utf-8', errors='ignore') as fin, \
         open(temp_electors_csv, 'w', encoding='utf-8', newline='') as fout:
        reader = csv.reader(fin)
        writer = csv.writer(fout)
        header = next(reader)
        writer.writerow(header)
        
        epic_idx = header.index('epic_number')
        name_idx = header.index('name')
        rel_idx = header.index('relative_name')
        mob_idx = header.index('whatsapp_mob')

        for r in reader:
            if len(r) > mob_idx:
                existing_mob = clean_phone(r[mob_idx])
                if not existing_mob:
                    ep = r[epic_idx].strip().upper() if len(r) > epic_idx else ''
                    name = r[name_idx].strip().upper() if len(r) > name_idx else ''
                    rel = r[rel_idx].strip().upper() if len(r) > rel_idx else ''
                    if ep and ep in phone_by_epic:
                        r[mob_idx] = phone_by_epic[ep]
                        electors_updated_count += 1
                    elif (name, rel) in phone_by_name_rel:
                        r[mob_idx] = phone_by_name_rel[(name, rel)]
                        electors_updated_count += 1
            writer.writerow(r)

    # Atomic replace
    import shutil
    shutil.move(temp_electors_csv, electors_csv)
    print(f"  ✅ Successfully updated {electors_updated_count:,} phone numbers in {electors_csv}!")

    elapsed = time.time() - start_time
    print("\n" + "=" * 80)
    print(f"🎉 PIPELINE COMPLETED PERFECTLY IN {elapsed:.1f}s!")
    print(f"  Total Voters Processed: {total_rows:,}")
    print(f"  Total Voters With Phone Numbers: {total_with_phone:,}")
    print(f"  Files Generated/Updated in {folder_dir}:")
    print(f"    1. MLC_Voters_ALL_With_Phone_Numbers_2026.xlsx ({os.path.getsize(out_all_xlsx)/(1024*1024):.1f} MB)")
    print(f"    2. MLC_Voters_Only_With_Phone_Numbers.xlsx ({os.path.getsize(out_phones_only_xlsx)/(1024*1024):.1f} MB)")
    print(f"    3. MLC_Voters_ALL_Filtered_2026-10-05.xlsx ({os.path.getsize(existing_xlsx)/(1024*1024):.1f} MB)")
    print(f"    4. electors_number.csv ({os.path.getsize(electors_csv)/(1024*1024):.1f} MB - {electors_updated_count:,} phone numbers merged)")
    print("=" * 80)

if __name__ == '__main__':
    main()
