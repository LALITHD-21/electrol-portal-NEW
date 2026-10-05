"""
ETL Pipeline: Ingest MLC Voters Excel with WhatsApp, Caste, and Location Details
File: MLC_Voters_ALL_Filtered_2026-10-05.xlsx
"""

import os
import sys
import re
import math
import time
from pathlib import Path
import pandas as pd
from dotenv import load_dotenv
from supabase import create_client, Client

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# 1. Environment & Supabase Setup
load_dotenv()
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not supabase_url or not supabase_key:
    print("❌ Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing from .env")
    sys.exit(1)

supabase: Client = create_client(supabase_url, supabase_key)

# 2. Smart EPIC Normalizer
def normalize_epic_smart(raw_epic) -> str:
    if raw_epic is None or pd.isna(raw_epic):
        return ""
    ep = str(raw_epic).strip().upper()
    ep = re.sub(r'[^A-Z0-9]', '', ep)
    
    # 1. Exact match 3 letters + 7 digits
    if re.match(r'^[A-Z]{3}\d{7}$', ep):
        return ep
    
    # 2. 3 letters + 6 digits (leading 0 was stripped)
    if re.match(r'^[A-Z]{3}\d{6}$', ep):
        return ep[:3] + '0' + ep[3:]
    
    # 3. NM0 (digit 0 instead of letter O) + 7 digits
    if re.match(r'^NM0\d{7}$', ep):
        return 'NMO' + ep[3:]
    
    # 4. NM0 + 6 digits
    if re.match(r'^NM0\d{6}$', ep):
        return 'NMO0' + ep[3:]

    # 5. NM00 or NMO0 with 8 digits (extra 0)
    m = re.match(r'^(NM0|NMO)0(\d{7})$', ep)
    if m:
        return 'NMO' + m.group(2)
        
    return ""

def clean_str(val) -> str | None:
    if val is None or pd.isna(val):
        return None
    s = str(val).strip()
    if not s or s.lower() in ('nan', 'none', 'null', '-'):
        return None
    return s

def clean_phone(val) -> str | None:
    if val is None or pd.isna(val):
        return None
    digits = re.sub(r'\D', '', str(val))
    if len(digits) >= 10:
        return digits[-10:] # standard 10 digit Indian mobile
    elif len(digits) > 0:
        return digits
    return None

def clean_age(val) -> int | None:
    if val is None or pd.isna(val):
        return None
    try:
        a = int(float(val))
        if 18 <= a <= 125:
            return a
    except (ValueError, TypeError):
        pass
    return None

def clean_sex(val) -> str | None:
    if val is None or pd.isna(val):
        return None
    s = str(val).strip().upper()
    if s.startswith('M'):
        return 'M'
    elif s.startswith('F'):
        return 'F'
    return None

def clean_sl(val) -> int | None:
    if val is None or pd.isna(val):
        return None
    try:
        s = int(float(val))
        if s > 0:
            return s
    except (ValueError, TypeError):
        pass
    return None

def main():
    excel_path = Path('MLC_Voters_ALL_Filtered_2026-10-05.xlsx')
    if not excel_path.exists():
        excel_path = Path('../MLC_Voters_ALL_Filtered_2026-10-05.xlsx')
    
    if not excel_path.exists():
        print(f"❌ Excel file not found: {excel_path}")
        sys.exit(1)

    print(f"📂 Reading Excel file: {excel_path}")
    start_time = time.time()
    df = pd.read_excel(excel_path)
    total_raw = len(df)
    print(f"📊 Total raw rows loaded: {total_raw}")

    # Process and clean records
    cleaned_records: dict[str, dict] = {}
    invalid_rows = 0
    phone_count = 0
    caste_count = 0

    for idx, row in df.iterrows():
        raw_epic = row.get('epic_number')
        epic = normalize_epic_smart(raw_epic)

        if not epic:
            invalid_rows += 1
            continue

        raw_name = clean_str(row.get('elector_name'))
        name = raw_name if raw_name else f"Elector ({epic})"

        rel_name = clean_str(row.get('relation_name'))
        sex = clean_sex(row.get('sex'))
        age = clean_age(row.get('age'))
        district = clean_str(row.get('district'))
        taluk = clean_str(row.get('taluk'))
        ac_name = clean_str(row.get('AC_NAME'))
        hobli = clean_str(row.get('HOBLI'))
        gp = clean_str(row.get('GRAMA_PANCHAYTH'))
        village = clean_str(row.get('VILLAGE'))
        area_ward = clean_str(row.get('area'))
        part_no = clean_str(row.get('part_no'))
        mob = clean_phone(row.get('mob'))
        caste = clean_str(row.get('caste'))
        qualification = clean_str(row.get('qualification'))
        occupation = clean_str(row.get('occupation'))
        address = clean_str(row.get('address'))
        sl_no = clean_sl(row.get('sl_no'))

        record = {
            'epic_number': epic,
            'name': name,
            'relative_name': rel_name,
            'sex': sex,
            'age': age,
            'serial_number': sl_no,
            'district': district,
            'taluk': taluk,
            'ac_name': ac_name,
            'hobli': hobli,
            'grama_panchayath': gp,
            'village': village,
            'area_ward': area_ward,
            'part_number': part_no,
            'whatsapp_mob': mob,
            'caste': caste,
            'qualification': qualification,
            'occupation': occupation,
            'address': address,
        }

        # If duplicate in Excel, merge non-null fields
        if epic in cleaned_records:
            existing = cleaned_records[epic]
            for k, v in record.items():
                if v is not None and existing.get(k) is None:
                    existing[k] = v
        else:
            cleaned_records[epic] = record

    total_valid = len(cleaned_records)
    print(f"✅ Successfully validated & normalized {total_valid} unique elector records")
    print(f"⚠️  Skipped {invalid_rows} rows lacking valid 10-char EPIC identifiers")

    # Metrics count
    with_mob = sum(1 for r in cleaned_records.values() if r.get('whatsapp_mob'))
    with_caste = sum(1 for r in cleaned_records.values() if r.get('caste'))
    with_district = sum(1 for r in cleaned_records.values() if r.get('district'))
    print(f"📱 Records with WhatsApp / Mobile: {with_mob}")
    print(f"🏷️  Records with Caste: {with_caste}")
    print(f"🏛️  Records with District / Constituency: {with_district}")

    # Batch Upsert into Supabase
    records_list = list(cleaned_records.values())
    batch_size = 100
    total_batches = math.ceil(total_valid / batch_size)
    upserted_count = 0

    print(f"\n🚀 Ingesting {total_valid} records into Supabase in {total_batches} batches...")

    for i in range(0, total_valid, batch_size):
        batch = records_list[i : i + batch_size]
        batch_num = (i // batch_size) + 1
        
        # Strip keys that are None for cleaner upsert
        cleaned_batch = []
        for r in batch:
            cleaned_batch.append({k: v for k, v in r.items() if v is not None or k in ('whatsapp_mob', 'caste')})

        try:
            res = supabase.table('electors').upsert(
                cleaned_batch,
                on_conflict='epic_number'
            ).execute()

            if res.data:
                upserted_count += len(res.data)
            else:
                upserted_count += len(cleaned_batch)
                
            print(f"  [Batch {batch_num}/{total_batches}] Upserted {len(cleaned_batch)} records (Cumulative: {upserted_count}/{total_valid})")
        except Exception as e:
            print(f"  ❌ Batch {batch_num} error: {e}")
            # Try 1-by-1 fallback for this batch to isolate any problematic row
            print(f"  🔄 Retrying batch {batch_num} row by row...")
            for r in cleaned_batch:
                try:
                    supabase.table('electors').upsert([r], on_conflict='epic_number').execute()
                    upserted_count += 1
                except Exception as row_err:
                    print(f"    Failed row {r.get('epic_number')}: {row_err}")

    elapsed = time.time() - start_time
    print(f"\n🎉 Ingestion complete in {elapsed:.1f}s!")
    print(f"📈 Total records upserted to database: {upserted_count}")

if __name__ == '__main__':
    main()
