import os
import sys
import re
import json
import sqlite3
import zipfile
import shutil
import xml.etree.ElementTree as ET
from collections import defaultdict, Counter

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = r"C:\Users\techb\Desktop\electrol-portal-NEW-main\electrol-portal-NEW-main"
FINAL_VOTERS_DIR = os.path.join(BASE_DIR, "FINAL VOTERS")
WEB_DB_PATH = os.path.join(BASE_DIR, "web", "electors.db")
ROOT_DB_PATH = os.path.join(BASE_DIR, "electors.db")
BOOTH_MASTER_TS = os.path.join(BASE_DIR, "web", "lib", "boothMaster.ts")
POLLING_MASTER_TS = os.path.join(BASE_DIR, "web", "lib", "pollingStationMaster.ts")
PHONE_LOOKUP_JSON = os.path.join(BASE_DIR, "web", "lib", "phone_lookup.json")

def load_booth_master():
    booth_map = {}
    if os.path.exists(BOOTH_MASTER_TS):
        txt = open(BOOTH_MASTER_TS, encoding='utf-8').read()
        for m in re.finditer(r'"(\d+)"\s*:\s*\{\s*district:\s*"([^"]+)",\s*taluk:\s*"([^"]+)",\s*ac_name:\s*"([^"]+)"\s*\}', txt):
            booth_map[m.group(1)] = {
                'district': m.group(2),
                'taluk': m.group(3),
                'ac_name': m.group(4),
            }
    return booth_map

def load_polling_station_master():
    by_part = defaultdict(list)
    if os.path.exists(POLLING_MASTER_TS):
        txt = open(POLLING_MASTER_TS, encoding='utf-8').read()
        start = txt.find('export const POLLING_BOOTHS_MASTER')
        if start != -1:
            arr_start = txt.find('[', start)
            # Find matching closing bracket of POLLING_BOOTHS_MASTER array
            end_marker = txt.find('];', arr_start)
            if arr_start != -1 and end_marker != -1:
                json_str = txt[arr_start:end_marker+1]
                try:
                    items = json.loads(json_str)
                    for item in items:
                        bp = str(item.get('basePart', '')).strip()
                        if bp:
                            by_part[bp].append(item)
                except Exception as e:
                    print("Warning parsing pollingStationMaster.ts:", e)
    return by_part

def load_phone_lookup():
    if os.path.exists(PHONE_LOOKUP_JSON):
        try:
            return json.load(open(PHONE_LOOKUP_JSON, encoding='utf-8'))
        except Exception:
            pass
    return {'epics': {}, 'name_parts': {}}

def resolve_station(polling_map, part_s, serial_no, fallback_meta):
    stations = polling_map.get(part_s, [])
    if stations:
        if serial_no is not None:
            for st in stations:
                mn = st.get('minSerial')
                mx = st.get('maxSerial')
                if mn is not None and mx is not None and mn <= serial_no <= mx:
                    return st.get('buildingName'), st.get('pollingArea')
        primary = [st for st in stations if not st.get('isAuxiliary')] or stations
        return primary[0].get('buildingName'), primary[0].get('pollingArea')
    if fallback_meta:
        return fallback_meta.get('polling_station_name'), fallback_meta.get('polling_address')
    return f"Polling Station Part {part_s}", f"Part {part_s}"

def resolve_phone(phone_lookup, epic, name, part_s):
    if epic:
        c_epic = re.sub(r'[^A-Z0-9]', '', epic.upper())
        ph = phone_lookup.get('epics', {}).get(c_epic)
        if ph:
            digits = re.sub(r'\D', '', str(ph))
            if len(digits) == 12 and digits.startswith('91'):
                digits = digits[2:]
            if len(digits) == 10 and digits[0] in '6789':
                return digits
    if name and part_s:
        key = f"{name.strip().upper()}:{part_s.strip()}"
        ph = phone_lookup.get('name_parts', {}).get(key)
        if ph:
            digits = re.sub(r'\D', '', str(ph))
            if len(digits) == 12 and digits.startswith('91'):
                digits = digits[2:]
            if len(digits) == 10 and digits[0] in '6789':
                return digits
    return None

def col_to_idx(col_str):
    idx = 0
    for ch in col_str:
        if 'A' <= ch <= 'Z':
            idx = idx * 26 + (ord(ch) - ord('A') + 1)
    return idx - 1

def read_xlsx_rows(file_path):
    with zipfile.ZipFile(file_path, 'r') as z:
        shared_strings = []
        if 'xl/sharedStrings.xml' in z.namelist():
            ss_xml = z.read('xl/sharedStrings.xml')
            root = ET.fromstring(ss_xml)
            for si in root.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}si'):
                shared_strings.append("".join(si.itertext()))
        sheet_name = 'xl/worksheets/sheet1.xml'
        if sheet_name not in z.namelist():
            sheets = [n for n in z.namelist() if n.startswith('xl/worksheets/sheet') and n.endswith('.xml')]
            if not sheets:
                return []
            sheet_name = sorted(sheets)[0]
        ws_xml = z.read(sheet_name)
        root = ET.fromstring(ws_xml)
        ns = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'
        rows = []
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
                        s_idx = int(v_el.text)
                        if 0 <= s_idx < len(shared_strings):
                            val = shared_strings[s_idx]
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
                rows.append(row_dict)
        return rows

def detect_header_mapping(row_dict):
    joined = " ".join(row_dict.values()).lower()
    if ('elector' not in joined and 'epic' not in joined) or ('address' not in joined and 'residence' not in joined):
        return None
    mapping = {}
    for c_idx, val in sorted(row_dict.items()):
        v = re.sub(r'\s+', ' ', val.lower()).strip()
        if v in ('sino', 'sl no', 'sl.no', 'sl. no', 'sr no', 's.no', 'si no', 'slno'):
            mapping['serial_number'] = c_idx
        elif 'name of the elector' in v or v == 'elector name':
            mapping['name'] = c_idx
        elif 'father' in v or 'mother' in v or 'husband' in v or 'relative' in v:
            mapping['relative_name'] = c_idx
        elif 'address' in v or 'ordinary residence' in v:
            mapping['address'] = c_idx
        elif 'qualification' in v:
            mapping['qualification'] = c_idx
        elif 'occupation' in v:
            mapping['occupation'] = c_idx
        elif v == 'age' or v.startswith('age'):
            mapping['age'] = c_idx
        elif v in ('sex', 'gender'):
            mapping['sex'] = c_idx
        elif 'epic' in v:
            mapping['epic_number'] = c_idx
        elif 'photo' in v:
            mapping['photo'] = c_idx
        elif v == 'part no':
            mapping['part_no'] = c_idx

    if 'name' in mapping and ('address' in mapping or 'epic_number' in mapping):
        if 'serial_number' not in mapping:
            mapping['serial_number'] = 0
        sorted_cols = sorted((col, field) for field, col in mapping.items())
        return sorted_cols
    return None

def clean_text(s):
    if not s:
        return None
    s = re.sub(r'[\r\n\t\xa0]+', ' ', str(s))
    s = re.sub(r'\s+', ' ', s).strip()
    if s in ('-', '.', '--', '...', '....', '.....', 'N/A', 'NA', 'nil', 'NIL', ''):
        return None
    return s

def clean_name(s):
    s = clean_text(s)
    if not s:
        return None
    s = re.sub(r'^[#\-\*\,\:\;\s\.]+', '', s).strip()
    s = re.sub(r'\s+', ' ', s).strip()
    return s if s else None

OCR_PREFIX_FIXES = {
    'IKL': 'IKI',
    'BIX': 'BJX',
    'H2R': 'HZR',
    '2FB': 'ZFB',
    '5PC': 'SPC',
    '5PD': 'SPD',
    '5VW': 'SVW',
    '8JX': 'BJX',
}

DIGIT_FIX_MAP = str.maketrans({
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

def extract_epic(s):
    if not s:
        return None
    raw = str(s).strip()
    if re.search(r'\bK[TAI]\s*[\/\-]?\s*\d{1,2}\s*[\/\-]?\s*\d{2,3}\s*[\/\-]?\s*\d{4,7}\b', raw, re.IGNORECASE):
        kt_clean = re.sub(r'[^A-Za-z0-9]', '', raw).upper()
        if kt_clean.startswith('KI'):
            kt_clean = 'KT' + kt_clean[2:]
        return kt_clean

    s_clean = re.sub(r'[^A-Za-z0-9]', '', raw).upper()
    if len(s_clean) < 7 or len(s_clean) > 14:
        return None
    if s_clean.isdigit():
        return None

    if len(s_clean) in (9, 10, 11):
        prefix = s_clean[:3]
        suffix = s_clean[3:]
        prefix = OCR_PREFIX_FIXES.get(prefix, prefix)
        if prefix.isalpha():
            fixed_suffix = suffix.translate(DIGIT_FIX_MAP)
            if fixed_suffix.isdigit() and 6 <= len(fixed_suffix) <= 8:
                return prefix + fixed_suffix

    m = re.search(r'\b([A-Za-z0-9]{3})\s*([0-9OQDILZSBG]{6,8})\b', raw.upper())
    if m:
        p = OCR_PREFIX_FIXES.get(m.group(1), m.group(1))
        suf = m.group(2).translate(DIGIT_FIX_MAP)
        if p.isalpha() and suf.isdigit():
            return p + suf

    return None

def epic_variants(epic):
    if not epic:
        return []
    variants = {epic}
    m = re.match(r'^([A-Z]{3})(\d+)$', epic)
    if m:
        prefix, digits = m.group(1), m.group(2)
        stripped = digits.lstrip('0') or '0'
        variants.add(f"{prefix}{stripped.zfill(7)}")
        if len(digits) == 6:
            variants.add(f"{prefix}0{digits}")
        elif len(digits) == 7 and digits.startswith('0'):
            variants.add(f"{prefix}{digits[1:]}")
        elif len(digits) == 8 and digits.startswith('0'):
            variants.add(f"{prefix}{digits[1:]}")
        alt_prefixes = [prefix]
        if prefix == 'IKI':
            alt_prefixes.append('IKL')
        elif prefix == 'IKL':
            alt_prefixes.append('IKI')
        elif prefix == 'BJX':
            alt_prefixes.append('BIX')
        elif prefix == 'BIX':
            alt_prefixes.append('BJX')
        for ap in alt_prefixes:
            for v in list(variants):
                if v.startswith(prefix):
                    variants.add(ap + v[3:])
    return list(variants)

def parse_serial(s):
    if not s:
        return None
    s_clean = re.sub(r'^[#\s\*]+', '', str(s)).strip()
    if re.match(r'^\d+(\.0+)?$', s_clean):
        val = int(float(s_clean))
        if 1 <= val <= 50000:
            return val
    return None

def parse_age(s):
    if not s:
        return None
    s_clean = str(s).strip()
    if re.match(r'^\d+(\.0+)?$', s_clean):
        val = int(float(s_clean))
        if 18 <= val <= 120:
            return val
    return None

def parse_sex(s):
    if not s:
        return None
    v = str(s).strip().upper()
    if v in ('M', 'MALE'):
        return 'M'
    if v in ('F', 'FEMALE'):
        return 'F'
    if v in ('O', 'OTHER', 'OTHERS', 'T', 'TG', 'THIRD GENDER'):
        return 'O'
    return None

def is_metadata_or_header_row(row_dict):
    joined = " ".join(row_dict.values())
    j_low = joined.lower()
    if 'graduates' in j_low and 'constituency' in j_low:
        return True
    if 'year of revision' in j_low or 'qualifying date' in j_low:
        return True
    if 'electoral rolls-2025' in j_low or 'taluk/town/city' in j_low:
        return True
    if j_low.startswith('area :') or j_low.startswith('area:'):
        return True
    if 'male' in j_low and 'female' in j_low and 'total' in j_low:
        return True
    if 'signature of' in j_low or 'electoral registration officer' in j_low or 'assistant electoral' in j_low:
        return True
    if 'summary of electors' in j_low or 'number of electors' in j_low or 'mother roll' in j_low or 'supplement' in j_low:
        return True
    return False

def parse_file(file_path):
    rows = read_xlsx_rows(file_path)
    part_no = None
    for r in rows[:15]:
        txt = " ".join(r.values())
        m = re.search(r'Part\s*No\s*[:\.\-]?\s*(\d+)', txt, re.IGNORECASE)
        if m:
            part_no = m.group(1)
            break

    if part_no is None:
        fn_m = re.search(r'Part[_\s\-]*(\d+)', os.path.basename(file_path), re.IGNORECASE)
        if fn_m:
            part_no = fn_m.group(1)

    header_cols = None
    parsed_records = []

    for r in rows:
        hdr = detect_header_mapping(r)
        if hdr is not None:
            header_cols = hdr
            continue
        if header_cols is None:
            continue
        if is_metadata_or_header_row(r):
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

        raw_sl = " ".join(field_vals.get('serial_number', []))
        sl_no = parse_serial(raw_sl)
        if sl_no is None and 0 in r:
            sl_no = parse_serial(r[0])

        if sl_no is None:
            continue

        if part_no is None and 'part_no' in field_vals:
            p_cand = clean_text(" ".join(field_vals['part_no']))
            if p_cand and p_cand.isdigit():
                part_no = p_cand

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

        if not name and not epic:
            continue
        if name and re.match(r'^[\d\s\.\-\/]+$', name):
            continue
        if not address and not epic and not rel_name:
            continue

        parsed_records.append({
            'part_number': str(part_no),
            'serial_number': sl_no,
            'epic_number': epic,
            'name': name or '',
            'relative_name': rel_name,
            'address': address,
            'qualification': qualification,
            'occupation': occupation,
            'age': age,
            'sex': sex,
        })

    return part_no, parsed_records

def norm_str(s):
    if not s:
        return ''
    return re.sub(r'[^a-z0-9]', '', str(s).lower())

def is_db_synthetic_epic(epic):
    if not epic:
        return True
    e = epic.strip().upper()
    if e.startswith('NOP') or e.startswith('P'):
        return True
    if re.match(r'^[DE]\d{2}\d+$', e):
        return True
    return False

def run_ingestion(commit_changes=True):
    booth_master = load_booth_master()
    polling_master = load_polling_station_master()
    phone_lookup = load_phone_lookup()

    conn = sqlite3.connect(WEB_DB_PATH)
    cur = conn.cursor()

    # Load existing part metadata from DB as fallback
    cur.execute("""
        SELECT part_number, district, ac_name, taluk, polling_station_name, polling_address
        FROM electors
        WHERE part_number IS NOT NULL AND district IS NOT NULL
        GROUP BY part_number
    """)
    db_part_meta = {}
    for pno, dist, ac, taluk, ps_name, ps_addr in cur.fetchall():
        db_part_meta[str(pno)] = {
            'district': dist,
            'ac_name': ac,
            'taluk': taluk,
            'polling_station_name': ps_name,
            'polling_address': ps_addr,
        }

    # Load all existing rows
    cur.execute("""
        SELECT id, part_number, serial_number, epic_number, name, relative_name,
               address, qualification, occupation, age, sex, whatsapp_mob
        FROM electors
    """)
    db_rows = cur.fetchall()
    initial_count = len(db_rows)
    print(f"Initial DB Electors Count: {initial_count:,}")

    db_by_epic = {}
    db_by_part_last6 = defaultdict(list)
    db_by_ps = {}
    db_by_pnr = {}
    db_by_pn = defaultdict(list)
    db_by_pr = defaultdict(list)

    for r in db_rows:
        rid, pno, sl, epic, name, rel, addr, qual, occ, age, sex, mob = r
        pno_s = str(pno) if pno is not None else ''
        if epic:
            eu = epic.strip().upper()
            if not is_db_synthetic_epic(eu):
                for v in epic_variants(eu):
                    db_by_epic[v] = r
            digits = re.sub(r'[^0-9]', '', eu)
            if len(digits) >= 6 and pno_s:
                db_by_part_last6[(pno_s, digits[-6:])].append(r)
        if pno_s and sl is not None:
            db_by_ps[(pno_s, int(sl))] = r
        nk = norm_str(name)
        rk = norm_str(rel)
        if pno_s and nk:
            db_by_pnr[(pno_s, nk, rk)] = r
            db_by_pn[(pno_s, nk)].append(r)
        if pno_s and rk:
            db_by_pr[(pno_s, rk)].append(r)

    files = sorted([f for f in os.listdir(FINAL_VOTERS_DIR) if f.lower().endswith('.xlsx')])
    print(f"Processing {len(files)} Excel workbooks from FINAL VOTERS...")

    seen_epics = set()
    seen_ps = set()

    stats = Counter()
    updates_to_apply = {}  # id -> dict of fields to update
    inserts_to_apply = []
    part_added_counts = Counter()

    def queue_enrichment(matched_row, rec):
        rid, pno, sl, db_epic, db_name, db_rel, db_addr, db_qual, db_occ, db_age, db_sex, db_mob = matched_row
        upd = updates_to_apply.get(rid, {})
        if sl is None and rec['serial_number'] is not None:
            upd['serial_number'] = rec['serial_number']
        if rec['epic_number'] and is_db_synthetic_epic(db_epic):
            # Make sure new epic doesn't collide with another row
            ev = epic_variants(rec['epic_number'])
            if not any(v in db_by_epic for v in ev):
                upd['epic_number'] = rec['epic_number']
                for v in ev:
                    db_by_epic[v] = matched_row
        if (not db_rel or len(str(db_rel).strip()) < 2) and rec['relative_name']:
            upd['relative_name'] = rec['relative_name']
        if (not db_addr or len(str(db_addr).strip()) < 4) and rec['address']:
            upd['address'] = rec['address']
        if not db_qual and rec['qualification']:
            upd['qualification'] = rec['qualification']
        if not db_occ and rec['occupation']:
            upd['occupation'] = rec['occupation']
        if db_age is None and rec['age'] is not None:
            upd['age'] = rec['age']
        if not db_sex and rec['sex']:
            upd['sex'] = rec['sex']
        if upd:
            updates_to_apply[rid] = upd

    for fn in files:
        fpath = os.path.join(FINAL_VOTERS_DIR, fn)
        pno, recs = parse_file(fpath)
        stats['total_parsed'] += len(recs)

        for rec in recs:
            p_s = rec['part_number']
            sl = rec['serial_number']
            epic = rec['epic_number']
            nk = norm_str(rec['name'])
            rk = norm_str(rec['relative_name'])

            # 0. Deduplicate within FINAL VOTERS batch
            if epic:
                ev = epic_variants(epic)
                if any(v in seen_epics for v in ev):
                    stats['batch_duplicates_skipped'] += 1
                    continue
                for v in ev:
                    seen_epics.add(v)
            if (p_s, sl, nk) in seen_ps:
                stats['batch_duplicates_skipped'] += 1
                continue
            seen_ps.add((p_s, sl, nk))

            # 1. Exact or variant EPIC match anywhere in DB
            matched_row = None
            if epic:
                for v in epic_variants(epic):
                    if v in db_by_epic:
                        matched_row = db_by_epic[v]
                        break
            if matched_row is not None:
                stats['matched_by_epic'] += 1
                queue_enrichment(matched_row, rec)
                continue

            # 2. Same part + last 6 digits of EPIC (handles D01/E01 synthetic prefix + OCR prefix variations)
            if epic:
                edig = re.sub(r'[^0-9]', '', epic)
                if len(edig) >= 6 and (p_s, edig[-6:]) in db_by_part_last6:
                    cands = db_by_part_last6[(p_s, edig[-6:])]
                    matched_row = cands[0]
                    stats['matched_by_part_last6_epic'] += 1
                    queue_enrichment(matched_row, rec)
                    continue

            # 3. Same (part_number, serial_number) with compatible name/relative
            ps_row = db_by_ps.get((p_s, sl))
            if ps_row is not None:
                db_nk = norm_str(ps_row[4])
                db_rk = norm_str(ps_row[5])
                if db_nk == nk or (db_nk and nk and (db_nk in nk or nk in db_nk)) or (db_rk and db_rk == rk):
                    stats['matched_by_part_serial'] += 1
                    queue_enrichment(ps_row, rec)
                    continue

            # 4. Same (part_number, norm_name, norm_rel)
            if nk and (p_s, nk, rk) in db_by_pnr:
                matched_row = db_by_pnr[(p_s, nk, rk)]
                stats['matched_by_part_name_rel'] += 1
                queue_enrichment(matched_row, rec)
                continue

            # 5. Same (part_number, norm_name) when DB row has null serial_number or blank relative_name
            if nk and (p_s, nk) in db_by_pn:
                for cand in db_by_pn[(p_s, nk)]:
                    if cand[2] is None or not norm_str(cand[5]) or not rk:
                        matched_row = cand
                        break
                if matched_row is not None:
                    stats['matched_by_part_name_null_serial'] += 1
                    queue_enrichment(matched_row, rec)
                    continue

            # 6. Same (part_number, norm_rel) + partial name match when DB row has null serial_number
            if rk and (p_s, rk) in db_by_pr:
                for cand in db_by_pr[(p_s, rk)]:
                    if cand[2] is None:
                        db_nk = norm_str(cand[4])
                        if db_nk and nk and (db_nk in nk or nk in db_nk or db_nk[:5] == nk[:5]):
                            matched_row = cand
                            break
                if matched_row is not None:
                    stats['matched_by_part_rel_partial_name'] += 1
                    queue_enrichment(matched_row, rec)
                    continue

            # Truly missing voter -> prepare INSERT!
            b_info = booth_master.get(p_s) or db_part_meta.get(p_s) or {
                'district': 'Karnataka',
                'taluk': '',
                'ac_name': f'Part {p_s}',
            }
            ps_name, ps_addr = resolve_station(polling_master, p_s, sl, db_part_meta.get(p_s))
            mob = resolve_phone(phone_lookup, epic, rec['name'], p_s)

            insert_tuple = (
                sl,
                epic,  # None if missing EPIC
                rec['name'],
                rec['relative_name'],
                rec['address'],
                rec['qualification'],
                rec['occupation'],
                rec['age'],
                rec['sex'],
                p_s,
                ps_name,
                ps_addr,
                mob,
                b_info.get('district'),
                b_info.get('ac_name'),
                b_info.get('taluk'),
                None,  # village
            )
            inserts_to_apply.append(insert_tuple)
            part_added_counts[p_s] += 1
            if epic:
                stats['new_inserted_with_epic'] += 1
                for v in epic_variants(epic):
                    db_by_epic[v] = (None, p_s, sl, epic, rec['name'], rec['relative_name'], None, None, None, None, None, None)
            else:
                stats['new_inserted_without_epic'] += 1

    print("\n=== INGESTION & DEDUPLICATION SUMMARY ===")
    for k, v in stats.items():
        print(f"  {k:40s}: {v:,}")
    print(f"  {'existing_rows_enriched':40s}: {len(updates_to_apply):,}")
    print(f"  {'total_new_rows_to_insert':40s}: {len(inserts_to_apply):,}")

    if commit_changes:
        print("\nApplying enrichments and inserting new voters into web/electors.db...")
        # 1. Apply updates to existing rows
        for rid, upd in updates_to_apply.items():
            cols = list(upd.keys())
            vals = [upd[c] for c in cols] + [rid]
            set_clause = ", ".join(f"{c} = ?" for c in cols)
            cur.execute(f"UPDATE electors SET {set_clause} WHERE id = ?", vals)

        # 2. Insert new rows
        cur.executemany("""
            INSERT INTO electors (
                serial_number, epic_number, name, relative_name, address,
                qualification, occupation, age, sex, part_number,
                polling_station_name, polling_address, whatsapp_mob,
                district, ac_name, taluk, village
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, inserts_to_apply)

        conn.commit()

        print("Rebuilding FTS5 full-text search index (electors_fts)...")
        cur.execute("INSERT INTO electors_fts(electors_fts) VALUES('rebuild');")
        cur.execute("ANALYZE;")
        conn.commit()

        cur.execute("SELECT COUNT(*) FROM electors")
        final_count = cur.fetchone()[0]
        cur.execute("SELECT COUNT(DISTINCT part_number) FROM electors WHERE CAST(part_number AS INTEGER) BETWEEN 1 AND 151")
        parts_covered = cur.fetchone()[0]
        print(f"Final DB Electors Count: {final_count:,} (Added {final_count - initial_count:,} net new voters)")
        print(f"Official Parts 1..151 covered in DB: {parts_covered} / 151")
        conn.close()

        # Sync root electors.db
        print("Syncing web/electors.db -> root electors.db...")
        shutil.copy2(WEB_DB_PATH, ROOT_DB_PATH)
        print("Sync complete!")
    else:
        conn.close()

if __name__ == '__main__':
    commit_flag = '--dry-run' not in sys.argv
    run_ingestion(commit_changes=commit_flag)
