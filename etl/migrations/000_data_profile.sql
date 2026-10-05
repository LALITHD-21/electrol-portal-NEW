-- ═══════════════════════════════════════════════════════════════
-- DATA PROFILE SCRIPT — Elector Lookup Portal Phase 0
-- Run in Supabase SQL Editor. Results guide all migration and
-- UI decisions. Takes ~2–5 s on 178k rows.
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. TOTAL ROWS ──────────────────────────────────────────
SELECT 'total_rows' AS metric, COUNT(*)::TEXT AS value
FROM electors;

-- ─── 2. NULL COUNTS PER COLUMN ──────────────────────────────
SELECT
  'null_counts' AS metric,
  jsonb_build_object(
    'serial_number',       COUNT(*) FILTER (WHERE serial_number IS NULL),
    'epic_number',         COUNT(*) FILTER (WHERE epic_number IS NULL),
    'name',                COUNT(*) FILTER (WHERE name IS NULL OR trim(name) = ''),
    'relative_name',       COUNT(*) FILTER (WHERE relative_name IS NULL OR trim(relative_name) = ''),
    'address',             COUNT(*) FILTER (WHERE address IS NULL OR trim(address) = ''),
    'qualification',       COUNT(*) FILTER (WHERE qualification IS NULL OR trim(qualification) = ''),
    'occupation',          COUNT(*) FILTER (WHERE occupation IS NULL OR trim(occupation) = ''),
    'age',                 COUNT(*) FILTER (WHERE age IS NULL),
    'sex',                 COUNT(*) FILTER (WHERE sex IS NULL OR trim(sex) = ''),
    'whatsapp_mob',        COUNT(*) FILTER (WHERE whatsapp_mob IS NULL OR trim(whatsapp_mob) = ''),
    'caste',               COUNT(*) FILTER (WHERE caste IS NULL OR trim(caste) = ''),
    'district',            COUNT(*) FILTER (WHERE district IS NULL OR trim(district) = ''),
    'ac_name',             COUNT(*) FILTER (WHERE ac_name IS NULL OR trim(ac_name) = ''),
    'taluk',               COUNT(*) FILTER (WHERE taluk IS NULL OR trim(taluk) = ''),
    'hobli',               COUNT(*) FILTER (WHERE hobli IS NULL OR trim(hobli) = ''),
    'grama_panchayath',    COUNT(*) FILTER (WHERE grama_panchayath IS NULL OR trim(grama_panchayath) = ''),
    'village',             COUNT(*) FILTER (WHERE village IS NULL OR trim(village) = ''),
    'area_ward',           COUNT(*) FILTER (WHERE area_ward IS NULL OR trim(area_ward) = ''),
    'part_number',         COUNT(*) FILTER (WHERE part_number IS NULL OR trim(part_number) = ''),
    'polling_station_name',COUNT(*) FILTER (WHERE polling_station_name IS NULL OR trim(polling_station_name) = ''),
    'polling_address',     COUNT(*) FILTER (WHERE polling_address IS NULL OR trim(polling_address) = ''),
    'photo_url',           COUNT(*) FILTER (WHERE photo_url IS NULL)
  )::TEXT AS value
FROM electors;

-- ─── 3. SEX ANOMALIES (values NOT in M, F) ─────────────────
SELECT 'sex_anomalies' AS metric,
       sex, COUNT(*) AS cnt
FROM electors
WHERE sex IS NOT NULL AND sex NOT IN ('M', 'F')
GROUP BY sex
ORDER BY cnt DESC;

-- ─── 4. AGE ANOMALIES ──────────────────────────────────────
SELECT 'age_stats' AS metric,
  jsonb_build_object(
    'null_count',   COUNT(*) FILTER (WHERE age IS NULL),
    'under_18',     COUNT(*) FILTER (WHERE age < 18),
    'over_110',     COUNT(*) FILTER (WHERE age > 110),
    'min_age',      MIN(age),
    'max_age',      MAX(age),
    'avg_age',      ROUND(AVG(age)::NUMERIC, 1),
    'age_18_25',    COUNT(*) FILTER (WHERE age BETWEEN 18 AND 25),
    'age_26_35',    COUNT(*) FILTER (WHERE age BETWEEN 26 AND 35),
    'age_36_45',    COUNT(*) FILTER (WHERE age BETWEEN 36 AND 45),
    'age_46_60',    COUNT(*) FILTER (WHERE age BETWEEN 46 AND 60),
    'age_61_80',    COUNT(*) FILTER (WHERE age BETWEEN 61 AND 80),
    'age_over_80',  COUNT(*) FILTER (WHERE age > 80)
  )::TEXT AS value
FROM electors;

-- ─── 5. SEX DISTRIBUTION (M / F / NULL / Other) ────────────
SELECT 'sex_distribution' AS metric,
  COALESCE(sex, 'NULL') AS sex_val,
  COUNT(*) AS cnt
FROM electors
GROUP BY sex
ORDER BY cnt DESC;

-- ─── 6. HIERARCHY DISTINCT COUNTS ──────────────────────────
SELECT 'distinct_counts' AS metric,
  jsonb_build_object(
    'districts',         COUNT(DISTINCT district),
    'ac_names',          COUNT(DISTINCT ac_name),
    'taluks',            COUNT(DISTINCT taluk),
    'hoblis',            COUNT(DISTINCT hobli),
    'grama_panchayaths', COUNT(DISTINCT grama_panchayath),
    'villages',          COUNT(DISTINCT village),
    'part_numbers',      COUNT(DISTINCT part_number),
    'area_wards',        COUNT(DISTINCT area_ward)
  )::TEXT AS value
FROM electors;

-- ─── 7. COVERAGE COUNTS ────────────────────────────────────
SELECT 'coverage' AS metric,
  jsonb_build_object(
    'has_photo_url',        COUNT(*) FILTER (WHERE photo_url IS NOT NULL AND trim(photo_url) <> ''),
    'has_whatsapp_mob',     COUNT(*) FILTER (WHERE whatsapp_mob IS NOT NULL AND trim(whatsapp_mob) <> ''),
    'has_caste',            COUNT(*) FILTER (WHERE caste IS NOT NULL AND trim(caste) <> ''),
    'has_occupation',       COUNT(*) FILTER (WHERE occupation IS NOT NULL AND trim(occupation) <> ''),
    'has_qualification',    COUNT(*) FILTER (WHERE qualification IS NOT NULL AND trim(qualification) <> '')
  )::TEXT AS value
FROM electors;

-- ─── 8. DISTRICT BREAKDOWN ─────────────────────────────────
SELECT 'district_breakdown' AS metric,
  COALESCE(district, 'NULL/EMPTY') AS district_val,
  COUNT(*) AS cnt
FROM electors
GROUP BY district
ORDER BY cnt DESC;

-- ─── 9. AC NAME BREAKDOWN ──────────────────────────────────
SELECT 'ac_breakdown' AS metric,
  COALESCE(ac_name, 'NULL/EMPTY') AS ac_val,
  COUNT(*) AS cnt
FROM electors
GROUP BY ac_name
ORDER BY cnt DESC;

-- ─── 10. TALUK BREAKDOWN ───────────────────────────────────
SELECT 'taluk_breakdown' AS metric,
  COALESCE(taluk, 'NULL/EMPTY') AS taluk_val,
  COUNT(*) AS cnt
FROM electors
GROUP BY taluk
ORDER BY cnt DESC;

-- ─── 11. PART NUMBER BREAKDOWN (top 30) ────────────────────
SELECT 'part_breakdown_top30' AS metric,
  COALESCE(part_number, 'NULL') AS part_val,
  COUNT(*) AS cnt
FROM electors
GROUP BY part_number
ORDER BY cnt DESC
LIMIT 30;

-- ─── 12. NAME INITIAL DISTRIBUTION (A-Z + non-alpha) ───────
SELECT 'name_initial_distribution' AS metric,
  CASE
    WHEN upper(left(trim(name), 1)) ~ '[A-Z]' THEN upper(left(trim(name), 1))
    WHEN left(trim(name), 1) ~ '[0-9]' THEN '#digit'
    WHEN left(trim(name), 1) ~ '[^\x00-\x7F]' THEN '#non-latin'
    ELSE '#symbol'
  END AS initial,
  COUNT(*) AS cnt
FROM electors
WHERE name IS NOT NULL AND trim(name) <> ''
GROUP BY initial
ORDER BY initial;

-- ─── 13. NAMES WITH HONORIFICS ─────────────────────────────
SELECT 'names_with_honorifics' AS metric,
  CASE
    WHEN name ~* '^\s*(Sri|Shri)\s+'  THEN 'Sri/Shri'
    WHEN name ~* '^\s*Smt\s+'         THEN 'Smt'
    WHEN name ~* '^\s*Kum\s+'         THEN 'Kum'
    WHEN name ~* '^\s*Dr\.?\s+'       THEN 'Dr'
    WHEN name ~* '^\s*Mr\.?\s+'       THEN 'Mr'
    WHEN name ~* '^\s*Mrs\.?\s+'      THEN 'Mrs'
    ELSE 'No honorific'
  END AS honorific_group,
  COUNT(*) AS cnt
FROM electors
WHERE name IS NOT NULL
GROUP BY honorific_group
ORDER BY cnt DESC;

-- ─── 14. NAMES WITH INITIALS (e.g. "K. Suresh", "S R Ravi") ─
SELECT 'names_with_initials' AS metric,
  CASE
    WHEN name ~ '^\s*[A-Z]\.\s'        THEN 'Leading single initial (K. Suresh)'
    WHEN name ~ '^\s*[A-Z]\s[A-Z]\s'   THEN 'Two-letter initials (S R Ravi)'
    WHEN name ~ '^\s*[A-Z]\s[A-Z]\.\s' THEN 'Mixed initials (S R. Kumar)'
    ELSE 'Standard name'
  END AS initial_style,
  COUNT(*) AS cnt
FROM electors
WHERE name IS NOT NULL
GROUP BY initial_style
ORDER BY cnt DESC;

-- ─── 15. NAMES STARTING WITH NON-LATIN (Kannada script) ───
SELECT 'non_latin_names' AS metric,
  COUNT(*) AS cnt,
  left(name, 30) AS sample
FROM electors
WHERE name IS NOT NULL AND left(trim(name), 1) ~ '[^\x00-\x7F]'
GROUP BY left(name, 30)
ORDER BY cnt DESC
LIMIT 20;

-- ─── 16. DUPLICATE DETECTION — Rule A: same name + relative + age
SELECT 'dup_rule_A_name_rel_age' AS metric,
  COUNT(*) AS duplicate_groups,
  SUM(group_size) AS total_rows_in_dups
FROM (
  SELECT lower(trim(name)) AS n, lower(trim(relative_name)) AS r, age,
         COUNT(*) AS group_size
  FROM electors
  WHERE name IS NOT NULL AND relative_name IS NOT NULL AND age IS NOT NULL
  GROUP BY n, r, age
  HAVING COUNT(*) > 1
) sub;

-- ─── 17. DUPLICATE DETECTION — Rule B: same whatsapp_mob (10+ voters)
SELECT 'dup_rule_B_shared_mobile' AS metric,
  COUNT(*) AS numbers_with_10plus,
  SUM(group_size) AS total_rows_affected
FROM (
  SELECT whatsapp_mob, COUNT(*) AS group_size
  FROM electors
  WHERE whatsapp_mob IS NOT NULL AND trim(whatsapp_mob) <> ''
    AND length(regexp_replace(whatsapp_mob, '\D', '', 'g')) = 10
  GROUP BY whatsapp_mob
  HAVING COUNT(*) >= 10
) sub;

-- ─── 18. DUPLICATE DETECTION — Rule C: same mobile (any sharing)
SELECT 'dup_rule_C_any_shared_mobile' AS metric,
  COUNT(*) AS numbers_shared,
  SUM(group_size) AS total_rows_affected
FROM (
  SELECT whatsapp_mob, COUNT(*) AS group_size
  FROM electors
  WHERE whatsapp_mob IS NOT NULL AND trim(whatsapp_mob) <> ''
    AND length(regexp_replace(whatsapp_mob, '\D', '', 'g')) = 10
  GROUP BY whatsapp_mob
  HAVING COUNT(*) > 1
) sub;

-- ─── 19. TOP 20 CASTE VALUES ───────────────────────────────
SELECT 'top_caste_values' AS metric,
  COALESCE(caste, 'NULL') AS caste_val,
  COUNT(*) AS cnt
FROM electors
GROUP BY caste
ORDER BY cnt DESC
LIMIT 20;

-- ─── 20. TOP 20 OCCUPATION VALUES ──────────────────────────
SELECT 'top_occupation_values' AS metric,
  COALESCE(occupation, 'NULL') AS occ_val,
  COUNT(*) AS cnt
FROM electors
GROUP BY occupation
ORDER BY cnt DESC
LIMIT 20;

-- ─── 21. TOP 20 QUALIFICATION VALUES ───────────────────────
SELECT 'top_qualification_values' AS metric,
  COALESCE(qualification, 'NULL') AS qual_val,
  COUNT(*) AS cnt
FROM electors
GROUP BY qualification
ORDER BY cnt DESC
LIMIT 20;

-- ─── 22. EXISTING INDEXES ──────────────────────────────────
SELECT 'existing_indexes' AS metric,
  indexname, indexdef
FROM pg_indexes
WHERE tablename = 'electors'
ORDER BY indexname;
