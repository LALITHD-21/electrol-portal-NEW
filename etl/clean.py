"""
ETL Stage 2: Cleaning & Normalization
Maps source columns to canonical names and cleans every field.
"""

import re
import pandas as pd
from typing import Optional
import logging

logger = logging.getLogger(__name__)

# ─── Column Mapping ───────────────────────────────────────────────────────────
# Maps common source column name variants to our canonical schema names.
# Matching is case-insensitive and whitespace-insensitive.

COLUMN_MAP = {
    'sno': 'serial_number',
    's no': 'serial_number',
    'sino': 'serial_number',
    'si no': 'serial_number',
    's.no': 'serial_number',
    's.no.': 'serial_number',
    'serial': 'serial_number',
    'serial no': 'serial_number',
    'serial number': 'serial_number',
    'sl no': 'serial_number',
    'slno': 'serial_number',
    'sl.no': 'serial_number',
    'sr no': 'serial_number',
    'srno': 'serial_number',
    'sr.no': 'serial_number',
    'epic': 'epic_number',
    'epic no': 'epic_number',
    'epic number': 'epic_number',
    'epicno': 'epic_number',
    'epic_no': 'epic_number',
    'epic no.': 'epic_number',
    'voter id': 'epic_number',
    'voter id no': 'epic_number',
    'voter id number': 'epic_number',
    'name': 'name',
    'elector name': 'name',
    'voter name': 'name',
    'name of elector': 'name',
    'name of the elector': 'name',
    'relative name': 'relative_name',
    'father/husband name': 'relative_name',
    'father name': 'relative_name',
    'husband name': 'relative_name',
    'mother name': 'relative_name',
    'name of father mother husband': 'relative_name',
    'name of father/mother/ husband': 'relative_name',
    'name of father/mother/husband': 'relative_name',
    'father mother husband name': 'relative_name',
    'f/h name': 'relative_name',
    'relation name': 'relative_name',
    'relative': 'relative_name',
    "father's name": 'relative_name',
    "husband's name": 'relative_name',
    'address': 'address',
    'address place of ordinary residence': 'address',
    'place of ordinary residence': 'address',
    'residence': 'address',
    'addr': 'address',
    'qualification': 'qualification',
    'education': 'qualification',
    'educational qualification': 'qualification',
    'edu': 'qualification',
    'occupation': 'occupation',
    'occupcation': 'occupation',
    'profession': 'occupation',
    'occ': 'occupation',
    'age': 'age',
    'sex': 'sex',
    'gender': 'sex',
    'photo': 'photo_available',
    'photo of the elector': 'photo_available',
    'photo of elector': 'photo_available',
    'photo available': 'photo_available',
    'photo avail': 'photo_available',
    'part number': 'part_number',
    'part no': 'part_number',
    'part_number': 'part_number',
    'part numberpart name': 'part_number',
    'part number part name': 'part_number',
    'part name': 'polling_station_name',
    'polling station name': 'polling_station_name',
    'ps name': 'polling_station_name',
    'name of ps': 'polling_station_name',
    'area of the ps': 'polling_address',
    'area of ps': 'polling_address',
    'polling address': 'polling_address',
    'area of the ps part wise total': 'polling_address',
    'district name': 'district_name',
    'district': 'district_name',
    'taluk name': 'taluk_name',
    'taluk': 'taluk_name',
}


def map_columns(df: pd.DataFrame) -> pd.DataFrame:
    """
    Map source column names to canonical schema column names.
    Supports standard voter roll schemas and polling station / address master schemas.
    """
    if df.empty:
        return df

    # Drop columns where column name is empty or starts with Unnamed and has no data
    valid_cols = []
    for i, col in enumerate(df.columns):
        col_str = str(col).strip()
        if not col_str:
            continue
        valid_cols.append(i)

    if len(valid_cols) < len(df.columns):
        df = df.iloc[:, valid_cols].copy()

    new_column_names = []
    mapped_canonicals = set()
    unmapped = []

    for col in df.columns:
        col_str = str(col).strip()
        normalized = re.sub(r'[\s_.\-\(\)\/]+', ' ', col_str.lower()).strip()
        normalized_simple = re.sub(r'[^a-z0-9]', '', col_str.lower()).strip()

        matched_canonical = None
        for source_name, canonical_name in COLUMN_MAP.items():
            source_simple = re.sub(r'[^a-z0-9]', '', source_name)
            if normalized == source_name or normalized_simple == source_simple:
                if canonical_name in mapped_canonicals:
                    logger.warning(f"  Duplicate mapping: '{col}' -> '{canonical_name}' (already mapped)")
                else:
                    matched_canonical = canonical_name
                    mapped_canonicals.add(canonical_name)
                break

        if matched_canonical:
            new_column_names.append(matched_canonical)
        else:
            if col not in ('source_file', 'source_sheet'):
                unmapped.append(col_str)
            new_column_names.append(col_str)

    if unmapped:
        logger.warning(f"  Unmapped columns: {unmapped}")

    df.columns = new_column_names

    # Deduplicate columns if any duplicates remain
    df = df.loc[:, ~df.columns.duplicated()].copy()

    # Positional fallback for polling address sheets if unmapped/col_* columns exist
    cols = list(df.columns)
    if len(cols) >= 6 and 'epic_number' not in df.columns:
        pos_map = {}
        if 'serial_number' not in df.columns and cols[0] not in ('source_file', 'source_sheet'):
            pos_map[cols[0]] = 'serial_number'
        if 'district_name' not in df.columns and cols[1] not in ('source_file', 'source_sheet'):
            pos_map[cols[1]] = 'district_name'
        if 'taluk_name' not in df.columns and cols[2] not in ('source_file', 'source_sheet'):
            pos_map[cols[2]] = 'taluk_name'
        if 'part_number' not in df.columns and cols[3] not in ('source_file', 'source_sheet'):
            pos_map[cols[3]] = 'part_number'
        if 'polling_station_name' not in df.columns and cols[4] not in ('source_file', 'source_sheet'):
            pos_map[cols[4]] = 'polling_station_name'
        if 'polling_address' not in df.columns and cols[5] not in ('source_file', 'source_sheet'):
            pos_map[cols[5]] = 'polling_address'

        if pos_map:
            logger.info(f"  Applying positional column mapping for polling data: {pos_map}")
            df = df.rename(columns=pos_map)

    # Drop columns that are entirely empty after mapping
    cols_to_drop = []
    for col in df.columns:
        if col not in ('source_file', 'source_sheet'):
            series = df[col]
            if isinstance(series, pd.Series):
                if series.astype(str).str.strip().replace('', pd.NA).dropna().empty:
                    cols_to_drop.append(col)

    if cols_to_drop:
        logger.info(f"  Dropping empty columns: {cols_to_drop}")
        df = df.drop(columns=cols_to_drop)

    return df


# ─── Field Cleaning Functions ─────────────────────────────────────────────────

def clean_epic_number(raw) -> Optional[str]:
    """
    Normalize an EPIC number: uppercase, strip non-alphanumeric,
    validate format: exactly 3 uppercase letters + 7 digits (10 chars).
    """
    if raw is None:
        return None

    raw_str = str(raw).strip()
    if raw_str.lower() in ('nan', '', 'none', 'null'):
        return None

    # Remove everything except alphanumeric
    cleaned = re.sub(r'[^A-Za-z0-9]', '', raw_str).upper()

    # Validate: exactly 3 letters + 7 digits
    if re.match(r'^[A-Z]{3}\d{7}$', cleaned):
        return cleaned
    else:
        return None


def clean_name(raw) -> Optional[str]:
    """
    Clean a name field: strip, collapse whitespace, preserve casing.
    Returns None if raw is header text or dummy fallback.
    """
    if raw is None:
        return None

    raw_str = str(raw).strip()
    if raw_str.lower() in ('nan', '', 'none', 'null', 'na', 'n/a'):
        return None

    # Filter out header labels and dummy fallbacks
    lower_str = raw_str.lower()
    header_patterns = [
        'name of the elector', 'name of elector', 'elector name', 'sl no', 'sl.no',
        'serial no', 'assembly constituency', 'harihara elector', 'table of content',
        'photo of', 'photo available', 'voter id', 'epic number', 'name of father',
        'father/mother/husband', 'place of ordinary residence', 'qualification', 'occupcation', 'occupation'
    ]
    if any(pat in lower_str for pat in header_patterns):
        return None

    # Remove non-printable characters but preserve Unicode (Devanagari etc.)
    cleaned = ''.join(ch for ch in raw_str if ch.isprintable())

    # Collapse multiple spaces into one
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()

    # Remove trailing periods and stray numbers at the end
    cleaned = re.sub(r'[\.\d]+$', '', cleaned).strip()

    if not cleaned or len(cleaned) < 2:
        return None

    return cleaned


def clean_relative_name(raw) -> Optional[str]:
    """
    Clean relative name. Same logic as clean_name.
    Preserves "S/o", "D/o", "W/o" prefixes.
    """
    return clean_name(raw)


def clean_address(raw) -> Optional[str]:
    """
    Clean address: replace newlines with ', ', collapse commas, strip edges.
    """
    if raw is None:
        return None

    raw_str = str(raw).strip()
    if raw_str.lower() in ('nan', '', 'none', 'null', 'na', 'n/a'):
        return None

    # Replace newlines with ', '
    cleaned = raw_str.replace('\r\n', ', ').replace('\n', ', ').replace('\r', ', ')

    # Replace multiple consecutive commas (with optional spaces) with single comma + space
    cleaned = re.sub(r'[,\s]*,+[,\s]*', ', ', cleaned)

    # Collapse multiple spaces
    cleaned = re.sub(r'\s+', ' ', cleaned)

    # Strip leading/trailing whitespace and commas
    cleaned = cleaned.strip().strip(',').strip()

    if not cleaned:
        return None

    return cleaned


def clean_serial_number(raw) -> Optional[int]:
    """
    Clean integer serial number. Extracts integer without age range capping.
    """
    if raw is None:
        return None

    raw_str = str(raw).strip()
    if raw_str.lower() in ('nan', '', 'none', 'null', 'na', 'n/a'):
        return None

    match = re.search(r'\d+', raw_str)
    if not match:
        return None

    sno = int(match.group())
    return sno if sno > 0 else None


def clean_age(raw) -> int:
    """
    Clean and validate age: extract integer, defaulting to 30 if missing or out of range.
    """
    if raw is None:
        return 30

    raw_str = str(raw).strip()
    if raw_str.lower() in ('nan', '', 'none', 'null', 'na', 'n/a'):
        return 30

    match = re.search(r'\d+', raw_str)
    if not match:
        return 30

    age = int(match.group())
    if 18 <= age <= 120:
        return age
    return 30


def clean_sex(raw) -> str:
    """
    Normalize sex/gender to 'M' or 'F', defaulting to 'M' if invalid/missing.
    """
    if raw is None:
        return 'M'

    raw_str = str(raw).strip().upper()
    if raw_str in ('F', 'FEMALE', 'WOMAN', 'GIRL', '0'):
        return 'F'
    return 'M'


QUALIFICATION_NORM = {
    'ba': 'B.A.', 'b.a': 'B.A.', 'b. a': 'B.A.',
    'bcom': 'B.Com', 'b.com': 'B.Com', 'b. com': 'B.Com',
    'bsc': 'B.Sc', 'b.sc': 'B.Sc', 'b. sc': 'B.Sc',
    'be': 'B.E. / B.Tech', 'b.e': 'B.E. / B.Tech', 'btech': 'B.E. / B.Tech', 'b.tech': 'B.E. / B.Tech',
    'ma': 'M.A.', 'm.a': 'M.A.',
    'msc': 'M.Sc', 'm.sc': 'M.Sc',
    'mcom': 'M.Com', 'm.com': 'M.Com',
    'mba': 'MBA', 'm.b.a': 'MBA',
    'bba': 'BBA / BBM', 'bbm': 'BBA / BBM',
    'bca': 'BCA', 'mca': 'MCA',
    'mbbs': 'MBBS', 'llb': 'LL.B.',
    'bed': 'B.Ed.', 'med': 'M.Ed.',
}

OCCUPATION_NORM = {
    'private job': 'Private Sector / Corporate',
    'private': 'Private Sector / Corporate',
    'private employee': 'Private Sector / Corporate',
    'teacher': 'Teacher / Educator',
    'teachars': 'Teacher / Educator',
    'assistant teacher': 'Teacher / Educator',
    'housewife': 'Homemaker',
    'house wife': 'Homemaker',
    'home maker': 'Homemaker',
    'agriculture': 'Agriculture / Farmer',
    'farmer': 'Agriculture / Farmer',
    'self employee': 'Self-Employed / Freelance',
    'self employed': 'Self-Employed / Freelance',
    'business': 'Business / Merchant',
    'engineer': 'Engineer / Tech',
    'software engineer': 'Engineer / Tech',
    'advocate': 'Advocate / Legal',
    'lawyer': 'Advocate / Legal',
    'doctor': 'Doctor / Healthcare',
    'student': 'Student',
    'police': 'Police / Security',
}


def clean_qualification(raw) -> Optional[str]:
    """
    Clean qualification: strip and normalize to canonical standard form if matched.
    """
    if raw is None:
        return None

    raw_str = str(raw).strip()
    if raw_str.lower() in ('nan', '', 'none', 'null', 'na', 'n/a', '-'):
        return None

    cleaned = re.sub(r'\s+', ' ', raw_str).strip()
    normalized = QUALIFICATION_NORM.get(cleaned.lower())
    return normalized if normalized else cleaned


def clean_occupation(raw) -> Optional[str]:
    """
    Clean occupation: strip and normalize to canonical standard form if matched.
    """
    if raw is None:
        return None

    raw_str = str(raw).strip()
    if raw_str.lower() in ('nan', '', 'none', 'null', 'na', 'n/a', '-', '.', '0', 'no'):
        return None

    cleaned = re.sub(r'\s+', ' ', raw_str).strip()
    normalized = OCCUPATION_NORM.get(cleaned.lower())
    return normalized if normalized else cleaned


# ─── Main Cleaning Function ──────────────────────────────────────────────────

def clean_dataframe(df: pd.DataFrame, polling_map: dict = None) -> pd.DataFrame:
    """
    Apply all cleaning functions to the DataFrame.
    Returns cleaned DataFrame ready for validation.
    """
    if df.empty:
        return df

    # Step 1: Map columns to canonical names
    df = map_columns(df)
    logger.info(f"  Columns after mapping: {list(df.columns)}")

    # Step 2: Clean each field
    if 'epic_number' in df.columns:
        df['epic_number'] = df['epic_number'].apply(clean_epic_number)
    elif 'part_number' in df.columns or 'polling_station_name' in df.columns:
        logger.info("  Processing Polling Station / Polling Address master dataset")
    else:
        logger.error("  CRITICAL: Neither 'epic_number' nor 'part_number' columns found after mapping!")
        return pd.DataFrame()

    if 'name' in df.columns:
        df['name'] = df['name'].apply(clean_name)

    if 'relative_name' in df.columns:
        df['relative_name'] = df['relative_name'].apply(clean_relative_name)

    if 'address' in df.columns:
        df['address'] = df['address'].apply(clean_address)

    if 'serial_number' in df.columns:
        df['serial_number'] = df['serial_number'].apply(clean_serial_number)

    if 'age' in df.columns:
        df['age'] = df['age'].apply(clean_age)

    if 'sex' in df.columns:
        df['sex'] = df['sex'].apply(clean_sex)

    if 'qualification' in df.columns:
        df['qualification'] = df['qualification'].apply(clean_qualification)

    if 'occupation' in df.columns:
        df['occupation'] = df['occupation'].apply(clean_occupation)

    # Polling station / address specific cleaners
    def _clean_part_no(val):
        if pd.isna(val) or val is None:
            return None
        s = str(val).strip()
        if not s or s.lower() in ('none', 'nan', 'null', ''):
            return None
        m = re.search(r'\d+[A-Za-z0-9\/\-]*', s)
        return m.group(0).strip() if m else s

    if 'part_number' in df.columns:
        df['part_number'] = df['part_number'].apply(_clean_part_no)

    # Enrich polling station details from master polling_map
    if polling_map and 'part_number' in df.columns:
        if 'polling_station_name' not in df.columns:
            df['polling_station_name'] = None
        if 'polling_address' not in df.columns:
            df['polling_address'] = None

        def _attach_polling(row):
            p_val = row.get('part_number')
            p_str = str(p_val).strip() if p_val is not None else ''
            matched_key = p_str if p_str in polling_map else None
            if not matched_key and p_str:
                m = re.search(r'\d+', p_str)
                if m and m.group() in polling_map:
                    matched_key = m.group()

            if matched_key:
                info = polling_map[matched_key]
                st_name = info.get('polling_station_name') or info.get('station')
                st_addr = info.get('polling_address') or info.get('address')
                if st_name:
                    row['polling_station_name'] = st_name
                if st_addr:
                    row['polling_address'] = st_addr
            else:
                s_file = str(row.get('source_file') or '').replace('.xlsx', '').strip()
                s_clean = re.sub(r'[\-_2026\d\ufffd\(\)]', ' ', s_file).strip()
                s_title = ' '.join(w.capitalize() for w in s_clean.split())

                if p_str:
                    row['polling_station_name'] = f"Polling Station Part {p_str} ({s_title})"
                    row['polling_address'] = f"{s_title}, Karnataka"
                elif s_title:
                    row['polling_station_name'] = f"Polling Station - {s_title}"
                    row['polling_address'] = f"{s_title}, Karnataka"
                else:
                    row['polling_station_name'] = "Polling Station - Election Commission of India"
                    row['polling_address'] = "Karnataka, India"
            return row

        df = df.apply(_attach_polling, axis=1)

    if 'polling_station_name' in df.columns:
        df['polling_station_name'] = df['polling_station_name'].apply(clean_address)

    if 'polling_address' in df.columns:
        df['polling_address'] = df['polling_address'].apply(clean_address)

    if 'district_name' in df.columns:
        df['district_name'] = df['district_name'].apply(clean_name)

    if 'taluk_name' in df.columns:
        df['taluk_name'] = df['taluk_name'].apply(clean_name)

    # Step 3: Set photo_url to None for ALL records (PENDING)
    df['photo_url'] = None

    # Step 4: Drop 'photo_available' if present
    if 'photo_available' in df.columns:
        df = df.drop(columns=['photo_available'])

    logger.info(f"  Rows after cleaning: {len(df)}")
    return df
