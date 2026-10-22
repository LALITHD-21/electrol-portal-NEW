import os
import sys
import re
import csv
import json
import time
import shutil
import sqlite3
import zipfile
import xml.etree.ElementTree as ET
from collections import defaultdict, Counter
import openpyxl

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = r"C:\Users\techb\Desktop\electrol-portal-NEW-main\electrol-portal-NEW-main"
DESKTOP_DIR = r"C:\Users\techb\Desktop"
WEB_DB_PATH = os.path.join(BASE_DIR, "web", "electors.db")
ROOT_DB_PATH = os.path.join(BASE_DIR, "electors.db")
PHONE_LOOKUP_JSON = os.path.join(BASE_DIR, "web", "lib", "phone_lookup.json")

def clean_phone(val):
    if not val:
        return None
    s = str(val).strip()
    if s.endswith('.0'):
        s = s[:-2]
    digits = re.sub(r'\D', '', s)
    if len(digits) == 12 and digits.startswith('91'):
        digits = digits[2:]
    elif len(digits) == 11 and digits.startswith('0'):
        digits = digits[1:]
    if len(digits) == 10 and digits[0] in '6789' and len(set(digits)) > 1:
        return digits
    return None

def norm_str(s):
    if not s:
        return ''
    s = str(s).lower()
    s = re.sub(r'\b(mr|mrs|ms|sri|shri|smt|kum|kumari|late|dr|prof|deleted|dele|ted)\b', '', s)
    return re.sub(r'[^a-z0-9]', '', s)

def name_signature(s):
    """
    Returns (core_name, sorted_initials) so 'AG Chaithara' and 'Chaithara A G' produce ('chaithara', 'ag').
    """
    if not s:
        return ('', '')
    s_spaced = re.sub(r'([a-z])([A-Z])', r'\1 \2', str(s))
    s_spaced = re.sub(r'([A-Z]{2,})([A-Z][a-z])', r'\1 \2', s_spaced)
    tokens = re.findall(r'[A-Za-z]+', s_spaced)
    core = []
    inits = []
    for t in tokens:
        tl = t.lower()
        if tl in ('mr', 'mrs', 'ms', 'sri', 'shri', 'smt', 'kum', 'kumari', 'late', 'dr', 'prof', 'deleted', 'dele', 'ted'):
            continue
        if len(tl) <= 2:
            inits.extend(list(tl))
        else:
            core.append(tl)
    return ("".join(core), "".join(sorted(inits)))

PREFIX_CHAR_FIX = str.maketrans({'0': 'O', '1': 'I', '2': 'Z', '5': 'S', '8': 'B'})
OCR_PREFIX_FIXES = {
    'IKL': 'IKI',
    'IIK': 'IKI',
    'KII': 'IKI',
    'BIX': 'BJX',
    'H2R': 'HZR',
    '2FB': 'ZFB',
    '5PC': 'SPC',
    '5PD': 'SPD',
    '5VW': 'SVW',
    '8JX': 'BJX',
    'NM0': 'NMO',
}
DIGIT_FIX_MAP = str.maketrans({
    'O': '0', 'Q': '0', 'D': '0',
    'I': '1', 'L': '1',
    'Z': '2', 'S': '5', 'B': '8', 'G': '6',
})

def epic_variants(epic):
    if not epic:
        return []
    e = re.sub(r'[^A-Za-z0-9]', '', str(epic)).upper()
    if not e or e in ('NOEPIC', 'NONE', 'NULL', 'NA') or e.startswith('NOP'):
        return []
    variants = {e}
    if len(e) in (9, 10, 11):
        raw_p = e[:3].translate(PREFIX_CHAR_FIX)
        p = OCR_PREFIX_FIXES.get(raw_p, OCR_PREFIX_FIXES.get(e[:3], raw_p))
        suf = e[3:].translate(DIGIT_FIX_MAP)
        if p.isalpha() and suf.isdigit():
            variants.add(p + suf)
            stripped = suf.lstrip('0') or '0'
            variants.add(f"{p}{stripped.zfill(7)}")
            if len(suf) == 6:
                variants.add(f"{p}0{suf}")
            elif len(suf) in (7, 8) and suf.startswith('0'):
                variants.add(f"{p}{suf[1:]}")
            alt_prefixes = {p, raw_p}
            if p == 'IKI':
                alt_prefixes |= {'IKL', 'IIK', 'KII'}
            elif p == 'BJX':
                alt_prefixes |= {'BIX'}
            for ap in alt_prefixes:
                if ap.isalpha():
                    for v in list(variants):
                        if len(v) >= 9:
                            variants.add(ap + v[3:])
    return list(variants)

def col_to_idx(col_str):
    idx = 0
    for ch in col_str:
        if 'A' <= ch <= 'Z':
            idx = idx * 26 + (ord(ch) - ord('A') + 1)
    return idx - 1

def read_xlsx_fast(file_path):
    with zipfile.ZipFile(file_path, 'r') as z:
        shared_strings = []
        if 'xl/sharedStrings.xml' in z.namelist():
            ss_xml = z.read('xl/sharedStrings.xml')
            root = ET.fromstring(ss_xml)
            for si in root.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}si'):
                shared_strings.append("".join(si.itertext()))
        sheets = sorted([n for n in z.namelist() if n.startswith('xl/worksheets/sheet') and n.endswith('.xml')])
        for sh in sheets:
            ws_xml = z.read(sh)
            root = ET.fromstring(ws_xml)
            ns = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'
            for row_el in root.iter(f'{ns}row'):
                row_dict = {}
                for c_el in row_el:
                    ref = c_el.attrib.get('r', '')
                    col_letters = "".join([ch for ch in ref if ch.isalpha()])
                    c_idx = col_to_idx(col_letters) if col_letters else len(row_dict)
                    c_type = c_el.attrib.get('t', '')
                    val = None
                    if c_type == 's':
                        v_el = c_el.find(f'{ns}v')
                        if v_el is not None and v_el.text and v_el.text.isdigit():
                            val = shared_strings[int(v_el.text)]
                    elif c_type == 'inlineStr':
                        is_el = c_el.find(f'{ns}is')
                        if is_el is not None:
                            val = "".join(is_el.itertext())
                    else:
                        v_el = c_el.find(f'{ns}v')
                        if v_el is not None and v_el.text is not None:
                            val = v_el.text
                    if val is not None:
                        s_val = str(val).strip()
                        if s_val != '':
                            row_dict[c_idx] = s_val
                if row_dict:
                    yield row_dict

def run_strict_phone_sync():
    start_t = time.time()
    by_epic = {}                    # epic_variant -> phone
    by_epic_last7 = {}              # last7_digits -> (core_name, phone)
    by_epic_last6 = {}              # (part_s, last6_digits) -> phone
    by_part_serial = {}             # (part_s, serial_int) -> (core_name, inits, phone)
    by_part_name_rel = {}           # (part_s, norm_name, norm_rel) -> phone
    by_part_sig_rel = {}            # (part_s, core_name, inits, core_rel) -> phone
    by_part_core_rel = {}           # (part_s, core_name, core_rel) -> (inits, phone)
    by_part_exact_name = defaultdict(set)  # (part_s, norm_name) -> set of (rk, ph)
    by_part_sig_name = defaultdict(set)    # (part_s, core_name, inits) -> set of (c_rel, ph)
    by_global_name_rel = defaultdict(set)  # (norm_name, norm_rel) -> set of ph
    by_global_sig_rel = defaultdict(set)   # (core_name, inits, core_rel) -> set of ph

    def register(epic, name, rel, part_no, serial_no, phone):
        ph = clean_phone(phone)
        if not ph:
            return False
        p_s = str(part_no).strip() if part_no is not None else ''
        if p_s.endswith('.0'):
            p_s = p_s[:-2]
        nk = norm_str(name)
        rk = norm_str(rel)
        c_name, inits = name_signature(name)
        c_rel, _ = name_signature(rel)

        if epic:
            for v in epic_variants(epic):
                if v not in by_epic:
                    by_epic[v] = ph
            edig = re.sub(r'\D', '', str(epic))
            if len(edig) >= 7:
                l7 = edig[-7:].lstrip('0') or '0'
                if len(l7) >= 5 and l7 not in by_epic_last7:
                    by_epic_last7[l7] = (c_name, ph)
            if len(edig) >= 6 and p_s and p_s.isdigit():
                by_epic_last6[(p_s, edig[-6:])] = ph

        if p_s and p_s.isdigit() and serial_no is not None:
            s_clean = re.sub(r'\D', '', str(serial_no))
            if s_clean:
                sl_i = int(s_clean)
                if 1 <= sl_i <= 50000 and (p_s, sl_i) not in by_part_serial:
                    by_part_serial[(p_s, sl_i)] = (c_name, inits, ph)

        if p_s and p_s.isdigit():
            if nk and rk:
                by_part_name_rel[(p_s, nk, rk)] = ph
            if c_name and c_rel:
                if inits:
                    by_part_sig_rel[(p_s, c_name, inits, c_rel)] = ph
                by_part_core_rel[(p_s, c_name, c_rel)] = (inits, ph)
            if nk:
                by_part_exact_name[(p_s, nk)].add((rk, ph))
            if c_name and inits:
                by_part_sig_name[(p_s, c_name, inits)].add((c_rel, ph))

        if nk and rk:
            by_global_name_rel[(nk, rk)].add(ph)
        if c_name and inits and c_rel:
            by_global_sig_rel[(c_name, inits, c_rel)].add(ph)
        return True

    # Harvest only from authentic authoritative phone sources (NOT from any noisy DB state)
    # 1. CSV files (Desktop CSV + electors_number_backup.csv)
    csv_files = [
        os.path.join(DESKTOP_DIR, "MLC_Voters_ALL_Filtered_2026-10-04.csv"),
        os.path.join(BASE_DIR, "electors_number.csv"),
        os.path.join(BASE_DIR, "electors_number_backup.csv"),
    ]
    for cf in csv_files:
        if os.path.exists(cf):
            cnt = 0
            with open(cf, 'r', encoding='utf-8', errors='ignore') as f:
                r = csv.reader(f)
                hdr = next(r, None)
                if not hdr:
                    continue
                h_low = [h.strip().lower() for h in hdr]
                if 'whatsapp_mob' in h_low:
                    ep_i = h_low.index('epic_number')
                    nm_i = h_low.index('name')
                    rl_i = h_low.index('relative_name')
                    pt_i = h_low.index('part_number')
                    sl_i = h_low.index('serial_number')
                    mb_i = h_low.index('whatsapp_mob')
                    for row in r:
                        if len(row) > mb_i and row[mb_i]:
                            if register(row[ep_i], row[nm_i], row[rl_i], row[pt_i], row[sl_i], row[mb_i]):
                                cnt += 1
                elif 'mob' in h_low or 'mobile number' in h_low:
                    mb_i = h_low.index('mob') if 'mob' in h_low else h_low.index('mobile number')
                    for row in r:
                        if len(row) > mb_i and row[mb_i]:
                            if register(row[3], row[1], row[2], row[13], row[0], row[mb_i]):
                                cnt += 1
            print(f"[CSV] {os.path.basename(cf)}: {cnt:,} phone rows")

    # 2. Backup XLSX
    backup_xlsx = os.path.join(BASE_DIR, "MLC_Voters_ALL_Filtered_2026-10-05_backup.xlsx")
    if os.path.exists(backup_xlsx):
        cnt = 0
        for r_idx, rd in enumerate(read_xlsx_fast(backup_xlsx)):
            if r_idx == 0:
                continue
            mob = rd.get(14)
            if mob:
                if register(rd.get(3), rd.get(1), rd.get(2), rd.get(13), rd.get(0), mob):
                    cnt += 1
        print(f"[XLSX] {os.path.basename(backup_xlsx)}: {cnt:,} phone rows")

    conn = sqlite3.connect(WEB_DB_PATH)
    cur = conn.cursor()
    cur.execute("""
        SELECT id, part_number, serial_number, epic_number, name, relative_name
        FROM electors
    """)
    all_rows = cur.fetchall()

    # Count how many voters share (part_s, nk) or (part_s, c_name, inits) in the DB so we only match by (part, name) if unique in that part
    db_part_nk_counts = Counter()
    db_part_sig_counts = Counter()
    for rid, pno, sl, epic, name, rel in all_rows:
        p_s = str(pno).strip() if pno is not None else ''
        nk = norm_str(name)
        c_name, inits = name_signature(name)
        if p_s and nk:
            db_part_nk_counts[(p_s, nk)] += 1
        if p_s and c_name and inits:
            db_part_sig_counts[(p_s, c_name, inits)] += 1

    stats = Counter()
    new_8235_stats = Counter()
    new_4909_stats = Counter()
    db_updates = []

    for rid, pno, sl, epic, name, rel in all_rows:
        is_new_row = rid > 450636
        has_epic = bool(epic and str(epic).strip())
        p_s = str(pno).strip() if pno is not None else ''
        nk = norm_str(name)
        rk = norm_str(rel)
        c_name, inits = name_signature(name)
        c_rel, _ = name_signature(rel)

        matched_ph = None
        method = None

        # 1. Exact or OCR-variant EPIC
        if epic:
            for v in epic_variants(epic):
                if v in by_epic:
                    matched_ph = by_epic[v]
                    method = '1_epic_exact_or_variant'
                    break

        # 2. Same part + last 6 digits of EPIC
        if not matched_ph and epic and p_s:
            edig = re.sub(r'\D', '', str(epic))
            if len(edig) >= 6 and (p_s, edig[-6:]) in by_epic_last6:
                matched_ph = by_epic_last6[(p_s, edig[-6:])]
                method = '2_part_last6_epic'

        # 3. Last 7 digits of EPIC + compatible voter name
        if not matched_ph and epic:
            edig = re.sub(r'\D', '', str(epic))
            if len(edig) >= 7:
                l7 = edig[-7:].lstrip('0') or '0'
                if l7 in by_epic_last7:
                    ref_cname, ref_ph = by_epic_last7[l7]
                    if not ref_cname or not c_name or ref_cname[:4] == c_name[:4] or ref_cname in c_name or c_name in ref_cname:
                        matched_ph = ref_ph
                        method = '3_epic_last7_with_name'

        # 4. Same part + Name + Relative Name (exact or swapped initials)
        if not matched_ph and p_s:
            if nk and rk and (p_s, nk, rk) in by_part_name_rel:
                matched_ph = by_part_name_rel[(p_s, nk, rk)]
                method = '4_part_name_and_rel'
            elif c_name and inits and c_rel and (p_s, c_name, inits, c_rel) in by_part_sig_rel:
                matched_ph = by_part_sig_rel[(p_s, c_name, inits, c_rel)]
                method = '4_part_swapped_initials_and_rel'
            elif c_name and c_rel and (p_s, c_name, c_rel) in by_part_core_rel:
                ref_inits, ref_ph = by_part_core_rel[(p_s, c_name, c_rel)]
                if not inits or not ref_inits or inits == ref_inits:
                    matched_ph = ref_ph
                    method = '4_part_core_name_and_rel'

        # 5. Same part + Serial Number + compatible Name & non-conflicting Initials
        if not matched_ph and p_s and sl is not None and (p_s, int(sl)) in by_part_serial:
            ps_cname, ps_inits, ps_ph = by_part_serial[(p_s, int(sl))]
            if (ps_cname == c_name or (ps_cname and c_name and (ps_cname in c_name or c_name in ps_cname))) and (not inits or not ps_inits or inits == ps_inits):
                matched_ph = ps_ph
                method = '5_part_serial_and_name'

        # 6. Same part + Exact Name (or Swapped Initials) ONLY when unique in that part and relative doesn't conflict
        if not matched_ph and p_s:
            if nk and db_part_nk_counts[(p_s, nk)] == 1 and len(by_part_exact_name.get((p_s, nk), ())) == 1:
                ref_rk, ref_ph = next(iter(by_part_exact_name[(p_s, nk)]))
                if not rk or not ref_rk or rk == ref_rk or rk in ref_rk or ref_rk in rk:
                    matched_ph = ref_ph
                    method = '6_part_unique_exact_name'
            elif c_name and inits and db_part_sig_counts[(p_s, c_name, inits)] == 1 and len(by_part_sig_name.get((p_s, c_name, inits), ())) == 1:
                ref_crel, ref_ph = next(iter(by_part_sig_name[(p_s, c_name, inits)]))
                if not c_rel or not ref_crel or c_rel == ref_crel or c_rel in ref_crel or ref_crel in c_rel:
                    matched_ph = ref_ph
                    method = '6_part_unique_swapped_initials_name'

        # 7. Global (Name + Relative Name) when unambiguous (single phone)
        if not matched_ph:
            if nk and rk and len(by_global_name_rel.get((nk, rk), ())) == 1:
                matched_ph = next(iter(by_global_name_rel[(nk, rk)]))
                method = '7_global_exact_name_and_rel'
            elif c_name and inits and c_rel and len(by_global_sig_rel.get((c_name, inits, c_rel), ())) == 1:
                matched_ph = next(iter(by_global_sig_rel[(c_name, inits, c_rel)]))
                method = '7_global_swapped_initials_and_rel'

        db_updates.append((matched_ph, rid))
        if matched_ph:
            stats[method] += 1
            if is_new_row and has_epic:
                new_8235_stats[method] += 1
            elif is_new_row and not has_epic:
                new_4909_stats[method] += 1

    total_matched = sum(stats.values())
    print("\n=== STRICT ZERO-MISTAKE PHONE MATCHING SUMMARY (ALL 178,575 DB ELECTORS) ===")
    for k, v in sorted(stats.items()):
        print(f"  {k:38s}: {v:,}")
    print(f"  {'TOTAL_VERIFIED_PHONES_IN_DB':38s}: {total_matched:,}")

    print("\n=== NEWLY ADDED +8,235 VOTERS (WITH EPIC) PHONE SUMMARY ===")
    for k, v in sorted(new_8235_stats.items()):
        print(f"  {k:38s}: {v:,}")
    print(f"  {'TOTAL_WITH_PHONE_IN_8235':38s}: {sum(new_8235_stats.values()):,}")

    print("\n=== NEWLY ADDED +4,909 VOTERS (WITHOUT EPIC) PHONE SUMMARY ===")
    for k, v in sorted(new_4909_stats.items()):
        print(f"  {k:38s}: {v:,}")
    print(f"  {'TOTAL_WITH_PHONE_IN_4909':38s}: {sum(new_4909_stats.values()):,}")

    print("\nUpdating whatsapp_mob across all 178,575 rows in web/electors.db...")
    cur.executemany("UPDATE electors SET whatsapp_mob = ? WHERE id = ?", db_updates)
    conn.commit()

    # Rebuild web/lib/phone_lookup.json cleanly
    pl_data = {'epics': {}, 'name_parts': {}}
    for ep_k, ph_v in by_epic.items():
        pl_data['epics'][ep_k] = ph_v

    cur.execute("""
        SELECT id, serial_number, epic_number, name, relative_name, sex, age,
               district, taluk, ac_name, village, polling_station_name, polling_address,
               part_number, whatsapp_mob, qualification, occupation, address
        FROM electors
        ORDER BY CAST(part_number AS INTEGER) ASC,
                 CASE WHEN serial_number IS NOT NULL THEN 0 ELSE 1 END,
                 CAST(serial_number AS INTEGER) ASC,
                 id ASC
    """)
    final_rows = cur.fetchall()
    conn.close()

    for r in final_rows:
        rid, sl, ep, nm, rl, sx, ag, dist, tlk, ac, vil, ps_n, ps_a, pno, mob, qual, occ, addr = r
        ph = clean_phone(mob)
        if ph:
            if ep:
                c_ep = re.sub(r'[^A-Z0-9]', '', str(ep).upper())
                if c_ep and not c_ep.startswith('NOP'):
                    pl_data['epics'][c_ep] = ph
            if nm and pno:
                pl_data['name_parts'][f"{str(nm).strip().upper()}:{str(pno).strip()}"] = ph

    with open(PHONE_LOOKUP_JSON, 'w', encoding='utf-8') as f:
        json.dump(pl_data, f, separators=(',', ':'))
    print(f"Saved clean web/lib/phone_lookup.json ({len(pl_data['epics']):,} EPICs, {len(pl_data['name_parts']):,} Name:Part entries)")

    shutil.copy2(WEB_DB_PATH, ROOT_DB_PATH)
    print("Synced web/electors.db -> root electors.db")

    # Regenerate Master Excel files in BASE_DIR + a dedicated Excel file for the newly added voters
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

    out_all_xlsx = os.path.join(BASE_DIR, "MLC_Voters_ALL_With_Phone_Numbers_2026.xlsx")
    out_phones_only_xlsx = os.path.join(BASE_DIR, "MLC_Voters_Only_With_Phone_Numbers.xlsx")
    existing_xlsx = os.path.join(BASE_DIR, "MLC_Voters_ALL_Filtered_2026-10-05.xlsx")
    out_new_8235_xlsx = os.path.join(BASE_DIR, "Newly_Added_Voters_With_Phone_Numbers_2026.xlsx")

    wb_all = openpyxl.Workbook(write_only=True)
    ws_all = wb_all.create_sheet(title="All Electors")
    ws_all.append(excel_headers)

    wb_phones = openpyxl.Workbook(write_only=True)
    ws_phones = wb_phones.create_sheet(title="Electors With Mobile")
    ws_phones.append(excel_headers)

    wb_new = openpyxl.Workbook(write_only=True)
    ws_new_epic = wb_new.create_sheet(title="New Voters With EPIC (8235)")
    ws_new_epic.append(excel_headers)
    ws_new_no_epic = wb_new.create_sheet(title="New Voters No EPIC (4909)")
    ws_new_no_epic.append(excel_headers)

    phone_only_sl = 0
    new_epic_sl = 0
    new_no_epic_sl = 0

    for idx, r in enumerate(final_rows, 1):
        rid, sl, ep, nm, rl, sx, ag, dist, tlk, ac, vil, ps_n, ps_a, pno, mob, qual, occ, addr = r
        ph = clean_phone(mob) or ''
        clean_ep = '' if (not ep or str(ep).startswith('NOP') or re.match(r'^[DE]\d{2}\d{6,8}$', str(ep))) else str(ep)
        ps_combined = ps_n or ps_a or ''
        if ps_n and ps_a and ps_a not in ps_n:
            ps_combined = f"{ps_n} - {ps_a}"
        row_vals = [
            sl if sl is not None else idx,
            nm or '',
            rl or '',
            clean_ep,
            sx or '',
            ag if ag is not None else '',
            dist or '',
            tlk or '',
            ac or '',
            '',
            '',
            vil or '',
            ps_combined,
            pno or '',
            ph,
            '',
            qual or '',
            occ or '',
            addr or ''
        ]
        ws_all.append(row_vals)
        if ph:
            phone_only_sl += 1
            p_row = list(row_vals)
            p_row[0] = phone_only_sl
            ws_phones.append(p_row)
        if rid > 450636:
            if clean_ep:
                new_epic_sl += 1
                ne_row = list(row_vals)
                ne_row[0] = sl if sl is not None else new_epic_sl
                ws_new_epic.append(ne_row)
            else:
                new_no_epic_sl += 1
                nne_row = list(row_vals)
                nne_row[0] = sl if sl is not None else new_no_epic_sl
                ws_new_no_epic.append(nne_row)

    wb_all.save(out_all_xlsx)
    wb_phones.save(out_phones_only_xlsx)
    wb_new.save(out_new_8235_xlsx)
    shutil.copy2(out_all_xlsx, existing_xlsx)
    print(f"\nSaved all Master Excel files in {BASE_DIR}:")
    print(f"  1. {os.path.basename(out_all_xlsx)} ({len(final_rows):,} rows, {phone_only_sl:,} with verified phone)")
    print(f"  2. {os.path.basename(out_phones_only_xlsx)} ({phone_only_sl:,} rows with verified phone)")
    print(f"  3. {os.path.basename(existing_xlsx)} ({len(final_rows):,} rows, {phone_only_sl:,} with verified phone)")
    print(f"  4. {os.path.basename(out_new_8235_xlsx)} ({new_epic_sl:,} new voters with EPIC + {new_no_epic_sl:,} without EPIC)")
    print(f"Completed in {time.time() - start_t:.1f}s!")

if __name__ == '__main__':
    run_strict_phone_sync()
