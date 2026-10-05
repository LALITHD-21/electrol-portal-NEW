-- Migration 005: Normalization Alias Tables & Data Quality Engine
-- Idempotent: safe to re-run
-- Date: 2026-10-05

-- 1. Qualification Aliases Table
CREATE TABLE IF NOT EXISTS qualification_aliases (
  id BIGSERIAL PRIMARY KEY,
  raw_value TEXT NOT NULL UNIQUE,
  canonical_value TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_qual_aliases_raw ON qualification_aliases(lower(trim(raw_value)));

-- 2. Occupation Aliases Table
CREATE TABLE IF NOT EXISTS occupation_aliases (
  id BIGSERIAL PRIMARY KEY,
  raw_value TEXT NOT NULL UNIQUE,
  canonical_value TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_occ_aliases_raw ON occupation_aliases(lower(trim(raw_value)));

-- 3. Caste Aliases Table
CREATE TABLE IF NOT EXISTS caste_aliases (
  id BIGSERIAL PRIMARY KEY,
  raw_value TEXT NOT NULL UNIQUE,
  canonical_value TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_caste_aliases_raw ON caste_aliases(lower(trim(raw_value)));

-- 4. Seed Qualification Aliases
INSERT INTO qualification_aliases (raw_value, canonical_value, category) VALUES
-- B.A.
('BA', 'B.A.', 'Arts & Humanities'),
('B.A', 'B.A.', 'Arts & Humanities'),
('Ba', 'B.A.', 'Arts & Humanities'),
('ba', 'B.A.', 'Arts & Humanities'),
('B. A', 'B.A.', 'Arts & Humanities'),
-- B.Com
('BCOM', 'B.Com', 'Commerce'),
('Bcom', 'B.Com', 'Commerce'),
('BCom', 'B.Com', 'Commerce'),
('B.COM', 'B.Com', 'Commerce'),
('B.com', 'B.Com', 'Commerce'),
('B.Com', 'B.Com', 'Commerce'),
('bcom', 'B.Com', 'Commerce'),
('B. Com', 'B.Com', 'Commerce'),
-- B.Sc
('BSC', 'B.Sc', 'Science'),
('BSc', 'B.Sc', 'Science'),
('Bsc', 'B.Sc', 'Science'),
('B.SC', 'B.Sc', 'Science'),
('B.Sc', 'B.Sc', 'Science'),
('B.sc', 'B.Sc', 'Science'),
('bsc', 'B.Sc', 'Science'),
-- B.E. / Engineering
('BE', 'B.E. / B.Tech', 'Engineering'),
('B.E', 'B.E. / B.Tech', 'Engineering'),
('B.TECH', 'B.E. / B.Tech', 'Engineering'),
('BTECH', 'B.E. / B.Tech', 'Engineering'),
('B.Tech', 'B.E. / B.Tech', 'Engineering'),
('BTech', 'B.E. / B.Tech', 'Engineering'),
-- M.A.
('MA', 'M.A.', 'Postgraduate - Arts'),
('M.A', 'M.A.', 'Postgraduate - Arts'),
('Ma', 'M.A.', 'Postgraduate - Arts'),
('M. A', 'M.A.', 'Postgraduate - Arts'),
-- M.Sc
('MSC', 'M.Sc', 'Postgraduate - Science'),
('Msc', 'M.Sc', 'Postgraduate - Science'),
('MSc', 'M.Sc', 'Postgraduate - Science'),
('M.SC', 'M.Sc', 'Postgraduate - Science'),
('M.Sc', 'M.Sc', 'Postgraduate - Science'),
-- M.Com
('MCOM', 'M.Com', 'Postgraduate - Commerce'),
('Mcom', 'M.Com', 'Postgraduate - Commerce'),
('MCom', 'M.Com', 'Postgraduate - Commerce'),
('M.COM', 'M.Com', 'Postgraduate - Commerce'),
('M.Com', 'M.Com', 'Postgraduate - Commerce'),
-- Combined Education Degrees
('MA BED', 'M.A. B.Ed.', 'Education'),
('MA Bed', 'M.A. B.Ed.', 'Education'),
('MA,BEd', 'M.A. B.Ed.', 'Education'),
('MA, BEd', 'M.A. B.Ed.', 'Education'),
('M.A. B.Ed', 'M.A. B.Ed.', 'Education'),
('BA BED', 'B.A. B.Ed.', 'Education'),
('BABed', 'B.A. B.Ed.', 'Education'),
('BA, BEd', 'B.A. B.Ed.', 'Education'),
('BA Bed', 'B.A. B.Ed.', 'Education'),
('B.A. B.Ed', 'B.A. B.Ed.', 'Education'),
('MSC BED', 'M.Sc. B.Ed.', 'Education'),
('BSC BED', 'B.Sc. B.Ed.', 'Education'),
('BED', 'B.Ed.', 'Education'),
('B.Ed', 'B.Ed.', 'Education'),
('Bed', 'B.Ed.', 'Education'),
('MED', 'M.Ed.', 'Education'),
('M.Ed', 'M.Ed.', 'Education'),
-- Management & Applications
('MBA', 'MBA', 'Management'),
('M.B.A', 'MBA', 'Management'),
('BBM', 'BBA / BBM', 'Management'),
('BBA', 'BBA / BBM', 'Management'),
('B.B.M', 'BBA / BBM', 'Management'),
('B.B.A', 'BBA / BBM', 'Management'),
('BCA', 'BCA', 'Computer Applications'),
('B.C.A', 'BCA', 'Computer Applications'),
('MCA', 'MCA', 'Computer Applications'),
('M.C.A', 'MCA', 'Computer Applications'),
-- Law & Medicine
('MBBS', 'MBBS', 'Medicine'),
('M.B.B.S', 'MBBS', 'Medicine'),
('BAMS', 'BAMS / AYUSH', 'Medicine'),
('BHMS', 'BHMS / AYUSH', 'Medicine'),
('BDS', 'BDS', 'Medicine'),
('LLB', 'LL.B.', 'Law'),
('BA LLB', 'LL.B.', 'Law'),
('B.A. LL.B', 'LL.B.', 'Law'),
('L.L.B', 'LL.B.', 'Law'),
('LLM', 'LL.M.', 'Law'),
-- Other Postgrads & Technical
('MTECH', 'M.Tech', 'Engineering'),
('M.TECH', 'M.Tech', 'Engineering'),
('M.Tech', 'M.Tech', 'Engineering'),
('MSW', 'MSW', 'Social Work'),
('M.S.W', 'MSW', 'Social Work'),
('DIPLOMA', 'Diploma', 'Technical Vocational'),
('Diploma', 'Diploma', 'Technical Vocational'),
('PHD', 'Ph.D.', 'Doctorate'),
('Ph.D', 'Ph.D.', 'Doctorate'),
('PUC', 'PUC / 12th', 'Pre-University'),
('SSLC', 'SSLC / 10th', 'Secondary')
ON CONFLICT (raw_value) DO UPDATE
SET canonical_value = EXCLUDED.canonical_value, category = EXCLUDED.category;

-- 5. Seed Occupation Aliases
INSERT INTO occupation_aliases (raw_value, canonical_value, category) VALUES
-- Private Sector
('Private Job', 'Private Sector / Corporate', 'Private Sector'),
('PRIVATE', 'Private Sector / Corporate', 'Private Sector'),
('PRIVATE JOB', 'Private Sector / Corporate', 'Private Sector'),
('Private', 'Private Sector / Corporate', 'Private Sector'),
('PRIVATE EMPLOYEE', 'Private Sector / Corporate', 'Private Sector'),
('Private Employee', 'Private Sector / Corporate', 'Private Sector'),
('private job', 'Private Sector / Corporate', 'Private Sector'),
('private employee', 'Private Sector / Corporate', 'Private Sector'),
('EMPLOYEE', 'Private Sector / Corporate', 'Private Sector'),
('Employee', 'Private Sector / Corporate', 'Private Sector'),
-- Education
('TEACHER', 'Teacher / Educator', 'Education'),
('Teacher', 'Teacher / Educator', 'Education'),
('teacher', 'Teacher / Educator', 'Education'),
('Teachars', 'Teacher / Educator', 'Education'),
('Assistant Teacher', 'Teacher / Educator', 'Education'),
('Govt Teacher', 'Teacher / Educator', 'Education'),
('LECTURER', 'Lecturer / Professor', 'Higher Education'),
('Lecturer', 'Lecturer / Professor', 'Higher Education'),
('lecturer', 'Lecturer / Professor', 'Higher Education'),
('PROFESSOR', 'Lecturer / Professor', 'Higher Education'),
('Professor', 'Lecturer / Professor', 'Higher Education'),
-- Household
('HOUSEWIFE', 'Homemaker', 'Household'),
('Housewife', 'Homemaker', 'Household'),
('House Wife', 'Homemaker', 'Household'),
('HouseWife', 'Homemaker', 'Household'),
('housewife', 'Homemaker', 'Household'),
('Home Maker', 'Homemaker', 'Household'),
('Homemaker', 'Homemaker', 'Household'),
-- Agriculture
('Agriculture', 'Agriculture / Farmer', 'Agriculture'),
('AGRICULTURE', 'Agriculture / Farmer', 'Agriculture'),
('Farmer', 'Agriculture / Farmer', 'Agriculture'),
('FARMER', 'Agriculture / Farmer', 'Agriculture'),
('farmer', 'Agriculture / Farmer', 'Agriculture'),
('agriculture', 'Agriculture / Farmer', 'Agriculture'),
-- Self Employed & Business
('Self Employee', 'Self-Employed / Freelance', 'Self-Employed'),
('self employee', 'Self-Employed / Freelance', 'Self-Employed'),
('SELF EMPLOYEE', 'Self-Employed / Freelance', 'Self-Employed'),
('SELF', 'Self-Employed / Freelance', 'Self-Employed'),
('Self employee', 'Self-Employed / Freelance', 'Self-Employed'),
('SELF EMPLOYED', 'Self-Employed / Freelance', 'Self-Employed'),
('Self Employed', 'Self-Employed / Freelance', 'Self-Employed'),
('BUSINESS', 'Business / Merchant', 'Business'),
('Business', 'Business / Merchant', 'Business'),
('business', 'Business / Merchant', 'Business'),
-- Engineering & Tech
('ENGINEER', 'Engineer / Tech', 'Technology'),
('Engineer', 'Engineer / Tech', 'Technology'),
('SOFTWARE ENGINEER', 'Engineer / Tech', 'Technology'),
('Software Engineer', 'Engineer / Tech', 'Technology'),
-- Legal & Medical
('ADVOCATE', 'Advocate / Legal', 'Legal'),
('Advocate', 'Advocate / Legal', 'Legal'),
('LAWYER', 'Advocate / Legal', 'Legal'),
('Lawyer', 'Advocate / Legal', 'Legal'),
('advocate', 'Advocate / Legal', 'Legal'),
('DOCTOR', 'Doctor / Healthcare', 'Healthcare'),
('Doctor', 'Doctor / Healthcare', 'Healthcare'),
('doctor', 'Doctor / Healthcare', 'Healthcare'),
-- Student & Public Services
('Student', 'Student', 'Student'),
('STUDENT', 'Student', 'Student'),
('POLICE', 'Police / Security', 'Public Service'),
('Police', 'Police / Security', 'Public Service'),
('FDA', 'Govt Staff (FDA / SDA)', 'Government'),
('SDA', 'Govt Staff (FDA / SDA)', 'Government'),
-- Non-recorded placeholders
('.', 'Unrecorded / None', 'Unspecified'),
('NO', 'Unrecorded / None', 'Unspecified'),
('0', 'Unrecorded / None', 'Unspecified'),
('Unemployed', 'Unemployed', 'Unspecified')
ON CONFLICT (raw_value) DO UPDATE
SET canonical_value = EXCLUDED.canonical_value, category = EXCLUDED.category;

-- 6. Seed Caste Aliases
INSERT INTO caste_aliases (raw_value, canonical_value, category) VALUES
('VOKKALIGA', 'Vokkaliga', 'General / OBC'),
('VAKKAL / VAKKALIGA', 'Vokkaliga', 'General / OBC'),
('Vokkaliga', 'Vokkaliga', 'General / OBC'),
('LINGAYATH', 'Lingayath / Veerashaiva', 'General / OBC'),
('VEERASHAIVA LINGAYATH', 'Lingayath / Veerashaiva', 'General / OBC'),
('VEERASHAIVA PANCHAMASALI', 'Lingayath / Veerashaiva', 'General / OBC'),
('PANCHAMASHALI LINGAITHA', 'Lingayath / Veerashaiva', 'General / OBC'),
('Lingayath', 'Lingayath / Veerashaiva', 'General / OBC'),
('MUSLIM', 'Muslim', 'Minority'),
('SUNNIMUSLIM', 'Muslim', 'Minority'),
('SHAIK MUSLIM', 'Muslim', 'Minority'),
('Muslim', 'Muslim', 'Minority'),
('KURUBA', 'Kuruba', 'OBC'),
('Kadu Kuruba', 'Kuruba', 'OBC'),
('Kuruba', 'Kuruba', 'OBC'),
('Madiga', 'Madiga', 'SC'),
('MADIGA', 'Madiga', 'SC'),
('Adi Karnataka', 'Adi Karnataka / Dravida', 'SC'),
('Adi Dravida', 'Adi Karnataka / Dravida', 'SC'),
('Bhovi', 'Bhovi', 'SC'),
('BHOVI', 'Bhovi', 'SC'),
('GOLLA', 'Golla', 'OBC'),
('KADU GOLLA', 'Golla', 'OBC'),
('Golla', 'Golla', 'OBC'),
('VAISYA/VYSYA/VAISHYA', 'Arya Vysya', 'General'),
('ARYA VYSYA', 'Arya Vysya', 'General'),
('BALIJA', 'Balija', 'OBC'),
('BALAJIGA', 'Balija', 'OBC'),
('Balija', 'Balija', 'OBC'),
('BRAHMANA', 'Brahmin', 'General'),
('Brahmin', 'Brahmin', 'General'),
('Lambani', 'Lambani / Banjara', 'SC'),
('MADIVALA/ MADIVALAR', 'Madivala / Agasa', 'OBC'),
('AGASA', 'Madivala / Agasa', 'OBC'),
('BESTHAR / BESTHA / BESHTAR', 'Bestha', 'OBC'),
('Valmiki', 'Valmiki / Nayaka', 'ST'),
('Beda Jansam', 'Valmiki / Nayaka', 'ST'),
('Navaka', 'Nayaka / Valmiki', 'ST'),
('UPPARA / UPPERA', 'Uppara', 'OBC'),
('REDDY', 'Reddy', 'General / OBC'),
('EDTGA/ IDIGA', 'Idiga', 'OBC')
ON CONFLICT (raw_value) DO UPDATE
SET canonical_value = EXCLUDED.canonical_value, category = EXCLUDED.category;

-- 7. Data Quality Snapshot Table
CREATE TABLE IF NOT EXISTS data_quality_snapshot (
  id INT PRIMARY KEY DEFAULT 1,
  refreshed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload JSONB NOT NULL
);

-- 8. Updated Dashboard Stats Function with Alias Joins
CREATE OR REPLACE FUNCTION get_dashboard_stats(
  p_district TEXT DEFAULT NULL,
  p_ac TEXT DEFAULT NULL,
  p_taluk TEXT DEFAULT NULL,
  p_part TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_result JSONB;
  v_total BIGINT;
  v_male BIGINT;
  v_female BIGINT;
  v_unspecified BIGINT;
  v_districts_cnt BIGINT;
  v_acs_cnt BIGINT;
  v_taluks_cnt BIGINT;
  v_hoblis_cnt BIGINT;
  v_gps_cnt BIGINT;
  v_villages_cnt BIGINT;
  v_booths_cnt BIGINT;
  v_mobile_cnt BIGINT;
  v_photo_cnt BIGINT;
  v_caste_cnt BIGINT;
  v_occupation_cnt BIGINT;
  v_qual_cnt BIGINT;
  v_dup_groups BIGINT;
  v_dup_rows BIGINT;
  v_age_brackets JSONB;
  v_districts_strength JSONB;
  v_ac_strength JSONB;
  v_top_occupations JSONB;
  v_top_qualifications JSONB;
  v_top_caste JSONB;
BEGIN
  -- Aggregate totals & hierarchy
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE sex = 'M'),
    COUNT(*) FILTER (WHERE sex = 'F'),
    COUNT(*) FILTER (WHERE sex IS NULL OR sex NOT IN ('M', 'F')),
    COUNT(DISTINCT district) FILTER (WHERE district IS NOT NULL AND trim(district) <> ''),
    COUNT(DISTINCT ac_name) FILTER (WHERE ac_name IS NOT NULL AND trim(ac_name) <> ''),
    COUNT(DISTINCT taluk) FILTER (WHERE taluk IS NOT NULL AND trim(taluk) <> ''),
    COUNT(DISTINCT hobli) FILTER (WHERE hobli IS NOT NULL AND trim(hobli) <> ''),
    COUNT(DISTINCT grama_panchayath) FILTER (WHERE grama_panchayath IS NOT NULL AND trim(grama_panchayath) <> ''),
    COUNT(DISTINCT village) FILTER (WHERE village IS NOT NULL AND trim(village) <> ''),
    COUNT(DISTINCT part_number) FILTER (WHERE part_number IS NOT NULL AND trim(part_number) <> ''),
    COUNT(*) FILTER (WHERE whatsapp_mob IS NOT NULL AND trim(whatsapp_mob) <> ''),
    COUNT(*) FILTER (WHERE photo_url IS NOT NULL AND trim(photo_url) <> ''),
    COUNT(*) FILTER (WHERE caste IS NOT NULL AND trim(caste) <> ''),
    COUNT(*) FILTER (WHERE occupation IS NOT NULL AND trim(occupation) <> ''),
    COUNT(*) FILTER (WHERE qualification IS NOT NULL AND trim(qualification) <> '')
  INTO
    v_total, v_male, v_female, v_unspecified,
    v_districts_cnt, v_acs_cnt, v_taluks_cnt, v_hoblis_cnt, v_gps_cnt, v_villages_cnt, v_booths_cnt,
    v_mobile_cnt, v_photo_cnt, v_caste_cnt, v_occupation_cnt, v_qual_cnt
  FROM electors e
  WHERE
    (p_district IS NULL OR trim(p_district) = '' OR e.district ILIKE p_district) AND
    (p_ac IS NULL OR trim(p_ac) = '' OR e.ac_name ILIKE p_ac) AND
    (p_taluk IS NULL OR trim(p_taluk) = '' OR e.taluk ILIKE p_taluk) AND
    (p_part IS NULL OR trim(p_part) = '' OR e.part_number = p_part);

  -- Duplicates
  SELECT
    COALESCE(COUNT(*), 0),
    COALESCE(SUM(group_size), 0)
  INTO v_dup_groups, v_dup_rows
  FROM (
    SELECT COUNT(*) AS group_size
    FROM electors e
    WHERE
      e.name IS NOT NULL AND e.relative_name IS NOT NULL AND e.age IS NOT NULL
      AND (p_district IS NULL OR trim(p_district) = '' OR e.district ILIKE p_district)
      AND (p_ac IS NULL OR trim(p_ac) = '' OR e.ac_name ILIKE p_ac)
      AND (p_taluk IS NULL OR trim(p_taluk) = '' OR e.taluk ILIKE p_taluk)
      AND (p_part IS NULL OR trim(p_part) = '' OR e.part_number = p_part)
    GROUP BY lower(trim(e.name)), lower(trim(e.relative_name)), e.age
    HAVING COUNT(*) > 1
  ) dups;

  -- Age brackets
  SELECT COALESCE(jsonb_agg(bracket_row ORDER BY ord), '[]'::JSONB)
  INTO v_age_brackets
  FROM (
    SELECT
      b.bracket,
      b.ord,
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE e.sex = 'M') AS male,
      COUNT(*) FILTER (WHERE e.sex = 'F') AS female,
      COUNT(*) FILTER (WHERE e.sex IS NULL OR e.sex NOT IN ('M', 'F')) AS unspecified,
      CASE WHEN v_total > 0 THEN ROUND((COUNT(*)::NUMERIC / v_total) * 100, 1) ELSE 0 END AS pct
    FROM (
      SELECT
        e.sex,
        CASE
          WHEN e.age BETWEEN 18 AND 25 THEN '18-25'
          WHEN e.age BETWEEN 26 AND 35 THEN '26-35'
          WHEN e.age BETWEEN 36 AND 45 THEN '36-45'
          WHEN e.age BETWEEN 46 AND 60 THEN '46-60'
          WHEN e.age BETWEEN 61 AND 80 THEN '61-80'
          WHEN e.age > 80 THEN '80+'
          ELSE 'Unknown / Not recorded'
        END AS bracket,
        CASE
          WHEN e.age BETWEEN 18 AND 25 THEN 1
          WHEN e.age BETWEEN 26 AND 35 THEN 2
          WHEN e.age BETWEEN 36 AND 45 THEN 3
          WHEN e.age BETWEEN 46 AND 60 THEN 4
          WHEN e.age BETWEEN 61 AND 80 THEN 5
          WHEN e.age > 80 THEN 6
          ELSE 7
        END AS ord
      FROM electors e
      WHERE
        (p_district IS NULL OR trim(p_district) = '' OR e.district ILIKE p_district) AND
        (p_ac IS NULL OR trim(p_ac) = '' OR e.ac_name ILIKE p_ac) AND
        (p_taluk IS NULL OR trim(p_taluk) = '' OR e.taluk ILIKE p_taluk) AND
        (p_part IS NULL OR trim(p_part) = '' OR e.part_number = p_part)
    ) b
    GROUP BY b.bracket, b.ord
  ) bracket_row;

  -- District Strength
  SELECT COALESCE(jsonb_agg(dist_row ORDER BY total DESC), '[]'::JSONB)
  INTO v_districts_strength
  FROM (
    SELECT
      COALESCE(NULLIF(trim(district), ''), 'Unknown / Not recorded') AS district,
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE sex = 'M') AS male,
      COUNT(*) FILTER (WHERE sex = 'F') AS female,
      CASE WHEN v_total > 0 THEN ROUND((COUNT(*)::NUMERIC / v_total) * 100, 1) ELSE 0 END AS pct
    FROM electors e
    WHERE
      (p_district IS NULL OR trim(p_district) = '' OR e.district ILIKE p_district) AND
      (p_ac IS NULL OR trim(p_ac) = '' OR e.ac_name ILIKE p_ac) AND
      (p_taluk IS NULL OR trim(p_taluk) = '' OR e.taluk ILIKE p_taluk) AND
      (p_part IS NULL OR trim(p_part) = '' OR e.part_number = p_part)
    GROUP BY COALESCE(NULLIF(trim(district), ''), 'Unknown / Not recorded')
  ) dist_row;

  -- AC Strength
  SELECT COALESCE(jsonb_agg(ac_row ORDER BY total DESC), '[]'::JSONB)
  INTO v_ac_strength
  FROM (
    SELECT
      COALESCE(NULLIF(trim(ac_name), ''), 'Unknown / Not recorded') AS ac_name,
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE sex = 'M') AS male,
      COUNT(*) FILTER (WHERE sex = 'F') AS female,
      CASE WHEN v_total > 0 THEN ROUND((COUNT(*)::NUMERIC / v_total) * 100, 1) ELSE 0 END AS pct
    FROM electors e
    WHERE
      (p_district IS NULL OR trim(p_district) = '' OR e.district ILIKE p_district) AND
      (p_ac IS NULL OR trim(p_ac) = '' OR e.ac_name ILIKE p_ac) AND
      (p_taluk IS NULL OR trim(p_taluk) = '' OR e.taluk ILIKE p_taluk) AND
      (p_part IS NULL OR trim(p_part) = '' OR e.part_number = p_part)
    GROUP BY COALESCE(NULLIF(trim(ac_name), ''), 'Unknown / Not recorded')
  ) ac_row;

  -- Normalized Top Occupations (Joined with occupation_aliases)
  SELECT COALESCE(jsonb_agg(occ_row), '[]'::JSONB)
  INTO v_top_occupations
  FROM (
    WITH raw_occ AS (
      SELECT
        COALESCE(oa.canonical_value, NULLIF(trim(e.occupation), ''), 'Not recorded') AS label,
        COUNT(*) AS cnt
      FROM electors e
      LEFT JOIN occupation_aliases oa ON lower(trim(e.occupation)) = lower(trim(oa.raw_value))
      WHERE
        (p_district IS NULL OR trim(p_district) = '' OR e.district ILIKE p_district) AND
        (p_ac IS NULL OR trim(p_ac) = '' OR e.ac_name ILIKE p_ac) AND
        (p_taluk IS NULL OR trim(p_taluk) = '' OR e.taluk ILIKE p_taluk) AND
        (p_part IS NULL OR trim(p_part) = '' OR e.part_number = p_part)
      GROUP BY COALESCE(oa.canonical_value, NULLIF(trim(e.occupation), ''), 'Not recorded')
    ),
    ranked AS (
      SELECT
        label,
        cnt,
        ROW_NUMBER() OVER (ORDER BY cnt DESC) as rnk
      FROM raw_occ
      WHERE label NOT IN ('Not recorded', 'Unrecorded / None')
    ),
    top10 AS (
      SELECT label, cnt FROM ranked WHERE rnk <= 10
    ),
    others AS (
      SELECT 'Others' AS label, COALESCE(SUM(cnt), 0) AS cnt FROM ranked WHERE rnk > 10
    ),
    unrecorded AS (
      SELECT 'Not recorded' AS label, COALESCE(SUM(cnt), 0) AS cnt FROM raw_occ WHERE label IN ('Not recorded', 'Unrecorded / None')
    )
    SELECT
      label,
      cnt AS count,
      CASE WHEN v_total > 0 THEN ROUND((cnt::NUMERIC / v_total) * 100, 2) ELSE 0 END AS pct
    FROM (
      SELECT * FROM top10
      UNION ALL
      SELECT * FROM others WHERE cnt > 0
      UNION ALL
      SELECT * FROM unrecorded WHERE cnt > 0
    ) combined
    ORDER BY cnt DESC
  ) occ_row;

  -- Normalized Top Qualifications (Joined with qualification_aliases)
  SELECT COALESCE(jsonb_agg(qual_row), '[]'::JSONB)
  INTO v_top_qualifications
  FROM (
    WITH raw_qual AS (
      SELECT
        COALESCE(qa.canonical_value, NULLIF(trim(e.qualification), ''), 'Not recorded') AS label,
        COUNT(*) AS cnt
      FROM electors e
      LEFT JOIN qualification_aliases qa ON lower(trim(e.qualification)) = lower(trim(qa.raw_value))
      WHERE
        (p_district IS NULL OR trim(p_district) = '' OR e.district ILIKE p_district) AND
        (p_ac IS NULL OR trim(p_ac) = '' OR e.ac_name ILIKE p_ac) AND
        (p_taluk IS NULL OR trim(p_taluk) = '' OR e.taluk ILIKE p_taluk) AND
        (p_part IS NULL OR trim(p_part) = '' OR e.part_number = p_part)
      GROUP BY COALESCE(qa.canonical_value, NULLIF(trim(e.qualification), ''), 'Not recorded')
    ),
    ranked AS (
      SELECT
        label,
        cnt,
        ROW_NUMBER() OVER (ORDER BY cnt DESC) as rnk
      FROM raw_qual
      WHERE label NOT IN ('Not recorded')
    ),
    top10 AS (
      SELECT label, cnt FROM ranked WHERE rnk <= 10
    ),
    others AS (
      SELECT 'Others' AS label, COALESCE(SUM(cnt), 0) AS cnt FROM ranked WHERE rnk > 10
    ),
    unrecorded AS (
      SELECT 'Not recorded' AS label, COALESCE(SUM(cnt), 0) AS cnt FROM raw_qual WHERE label = 'Not recorded'
    )
    SELECT
      label,
      cnt AS count,
      CASE WHEN v_total > 0 THEN ROUND((cnt::NUMERIC / v_total) * 100, 2) ELSE 0 END AS pct
    FROM (
      SELECT * FROM top10
      UNION ALL
      SELECT * FROM others WHERE cnt > 0
      UNION ALL
      SELECT * FROM unrecorded WHERE cnt > 0
    ) combined
    ORDER BY cnt DESC
  ) qual_row;

  -- Normalized Top Caste (Joined with caste_aliases)
  SELECT COALESCE(jsonb_agg(caste_row), '[]'::JSONB)
  INTO v_top_caste
  FROM (
    WITH raw_caste AS (
      SELECT
        COALESCE(ca.canonical_value, NULLIF(trim(e.caste), ''), 'Not recorded') AS label,
        COUNT(*) AS cnt
      FROM electors e
      LEFT JOIN caste_aliases ca ON lower(trim(e.caste)) = lower(trim(ca.raw_value))
      WHERE
        (p_district IS NULL OR trim(p_district) = '' OR e.district ILIKE p_district) AND
        (p_ac IS NULL OR trim(p_ac) = '' OR e.ac_name ILIKE p_ac) AND
        (p_taluk IS NULL OR trim(p_taluk) = '' OR e.taluk ILIKE p_taluk) AND
        (p_part IS NULL OR trim(p_part) = '' OR e.part_number = p_part)
      GROUP BY COALESCE(ca.canonical_value, NULLIF(trim(e.caste), ''), 'Not recorded')
    ),
    ranked AS (
      SELECT
        label,
        cnt,
        ROW_NUMBER() OVER (ORDER BY cnt DESC) as rnk
      FROM raw_caste
      WHERE label NOT IN ('Not recorded')
    ),
    top10 AS (
      SELECT label, cnt FROM ranked WHERE rnk <= 10
    ),
    others AS (
      SELECT 'Others' AS label, COALESCE(SUM(cnt), 0) AS cnt FROM ranked WHERE rnk > 10
    ),
    unrecorded AS (
      SELECT 'Not recorded' AS label, COALESCE(SUM(cnt), 0) AS cnt FROM raw_caste WHERE label = 'Not recorded'
    )
    SELECT
      label,
      cnt AS count,
      CASE WHEN v_total > 0 THEN ROUND((cnt::NUMERIC / v_total) * 100, 2) ELSE 0 END AS pct
    FROM (
      SELECT * FROM top10
      UNION ALL
      SELECT * FROM others WHERE cnt > 0
      UNION ALL
      SELECT * FROM unrecorded WHERE cnt > 0
    ) combined
    ORDER BY cnt DESC
  ) caste_row;

  -- Build final JSONB
  v_result := jsonb_build_object(
    'totals', jsonb_build_object(
      'total', v_total,
      'male', v_male,
      'female', v_female,
      'unspecified', v_unspecified
    ),
    'hierarchy', jsonb_build_object(
      'districts', v_districts_cnt,
      'ac_names', v_acs_cnt,
      'taluks', v_taluks_cnt,
      'hoblis', v_hoblis_cnt,
      'grama_panchayaths', v_gps_cnt,
      'villages', v_villages_cnt,
      'booths', v_booths_cnt
    ),
    'coverage', jsonb_build_object(
      'mobile', jsonb_build_object('count', v_mobile_cnt, 'pct', CASE WHEN v_total > 0 THEN ROUND((v_mobile_cnt::NUMERIC / v_total) * 100, 2) ELSE 0 END),
      'photo', jsonb_build_object('count', v_photo_cnt, 'pct', CASE WHEN v_total > 0 THEN ROUND((v_photo_cnt::NUMERIC / v_total) * 100, 2) ELSE 0 END),
      'caste', jsonb_build_object('count', v_caste_cnt, 'pct', CASE WHEN v_total > 0 THEN ROUND((v_caste_cnt::NUMERIC / v_total) * 100, 2) ELSE 0 END),
      'occupation', jsonb_build_object('count', v_occupation_cnt, 'pct', CASE WHEN v_total > 0 THEN ROUND((v_occupation_cnt::NUMERIC / v_total) * 100, 2) ELSE 0 END),
      'qualification', jsonb_build_object('count', v_qual_cnt, 'pct', CASE WHEN v_total > 0 THEN ROUND((v_qual_cnt::NUMERIC / v_total) * 100, 2) ELSE 0 END)
    ),
    'duplicates', jsonb_build_object(
      'groups', v_dup_groups,
      'rows', v_dup_rows
    ),
    'age_brackets', v_age_brackets,
    'district_strength', v_districts_strength,
    'ac_strength', v_ac_strength,
    'occupations', v_top_occupations,
    'qualifications', v_top_qualifications,
    'caste_majority', v_top_caste
  );

  RETURN v_result;
END;
$$;

-- 9. Data Quality Calculation Function
CREATE OR REPLACE FUNCTION refresh_data_quality_snapshot()
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_total BIGINT;
  v_completeness JSONB;
  v_anomalies JSONB;
  v_duplicates JSONB;
  v_payload JSONB;
BEGIN
  SELECT COUNT(*) INTO v_total FROM electors;

  -- Column completeness
  SELECT jsonb_build_object(
    'serial_number', ROUND(((v_total - COUNT(*) FILTER (WHERE serial_number IS NULL))::NUMERIC / v_total) * 100, 1),
    'epic_number', ROUND(((v_total - COUNT(*) FILTER (WHERE epic_number IS NULL OR trim(epic_number) = ''))::NUMERIC / v_total) * 100, 1),
    'name', ROUND(((v_total - COUNT(*) FILTER (WHERE name IS NULL OR trim(name) = ''))::NUMERIC / v_total) * 100, 1),
    'relative_name', ROUND(((v_total - COUNT(*) FILTER (WHERE relative_name IS NULL OR trim(relative_name) = ''))::NUMERIC / v_total) * 100, 1),
    'address', ROUND(((v_total - COUNT(*) FILTER (WHERE address IS NULL OR trim(address) = ''))::NUMERIC / v_total) * 100, 1),
    'age', ROUND(((v_total - COUNT(*) FILTER (WHERE age IS NULL))::NUMERIC / v_total) * 100, 1),
    'sex', ROUND(((v_total - COUNT(*) FILTER (WHERE sex IS NULL OR trim(sex) = ''))::NUMERIC / v_total) * 100, 1),
    'occupation', ROUND(((v_total - COUNT(*) FILTER (WHERE occupation IS NULL OR trim(occupation) = ''))::NUMERIC / v_total) * 100, 1),
    'qualification', ROUND(((v_total - COUNT(*) FILTER (WHERE qualification IS NULL OR trim(qualification) = ''))::NUMERIC / v_total) * 100, 1),
    'part_number', ROUND(((v_total - COUNT(*) FILTER (WHERE part_number IS NULL OR trim(part_number) = ''))::NUMERIC / v_total) * 100, 1),
    'polling_station_name', ROUND(((v_total - COUNT(*) FILTER (WHERE polling_station_name IS NULL OR trim(polling_station_name) = ''))::NUMERIC / v_total) * 100, 1),
    'whatsapp_mob', ROUND(((v_total - COUNT(*) FILTER (WHERE whatsapp_mob IS NULL OR trim(whatsapp_mob) = ''))::NUMERIC / v_total) * 100, 1),
    'caste', ROUND(((v_total - COUNT(*) FILTER (WHERE caste IS NULL OR trim(caste) = ''))::NUMERIC / v_total) * 100, 1),
    'district', ROUND(((v_total - COUNT(*) FILTER (WHERE district IS NULL OR trim(district) = ''))::NUMERIC / v_total) * 100, 1),
    'ac_name', ROUND(((v_total - COUNT(*) FILTER (WHERE ac_name IS NULL OR trim(ac_name) = ''))::NUMERIC / v_total) * 100, 1),
    'taluk', ROUND(((v_total - COUNT(*) FILTER (WHERE taluk IS NULL OR trim(taluk) = ''))::NUMERIC / v_total) * 100, 1),
    'photo_url', ROUND(((v_total - COUNT(*) FILTER (WHERE photo_url IS NULL OR trim(photo_url) = ''))::NUMERIC / v_total) * 100, 1)
  )
  INTO v_completeness
  FROM electors;

  -- Anomalies
  SELECT jsonb_build_object(
    'age_under_18', COUNT(*) FILTER (WHERE age < 18),
    'age_over_110', COUNT(*) FILTER (WHERE age > 110),
    'age_null', COUNT(*) FILTER (WHERE age IS NULL),
    'sex_invalid', COUNT(*) FILTER (WHERE sex IS NOT NULL AND sex NOT IN ('M', 'F')),
    'part_missing', COUNT(*) FILTER (WHERE part_number IS NULL OR trim(part_number) = ''),
    'epic_invalid_format', COUNT(*) FILTER (WHERE epic_number IS NULL OR epic_number !~ '^[A-Z]{3}[0-9]{7}$'),
    'name_blank', COUNT(*) FILTER (WHERE name IS NULL OR trim(name) = ''),
    'shared_mobile_10plus', (
      SELECT COALESCE(COUNT(*), 0)
      FROM (
        SELECT whatsapp_mob
        FROM electors
        WHERE whatsapp_mob IS NOT NULL AND trim(whatsapp_mob) <> ''
        GROUP BY whatsapp_mob
        HAVING COUNT(*) >= 10
      ) sm
    )
  )
  INTO v_anomalies
  FROM electors;

  -- Duplicate Summary
  SELECT jsonb_build_object(
    'rule_a_clusters', COUNT(*),
    'rule_a_voters_affected', COALESCE(SUM(group_size), 0)
  )
  INTO v_duplicates
  FROM (
    SELECT COUNT(*) AS group_size
    FROM electors
    WHERE name IS NOT NULL AND relative_name IS NOT NULL AND age IS NOT NULL
    GROUP BY lower(trim(name)), lower(trim(relative_name)), age
    HAVING COUNT(*) > 1
  ) dups;

  v_payload := jsonb_build_object(
    'total_electors', v_total,
    'refreshed_at', NOW(),
    'completeness', v_completeness,
    'anomalies', v_anomalies,
    'duplicates', v_duplicates
  );

  INSERT INTO data_quality_snapshot (id, refreshed_at, payload)
  VALUES (1, NOW(), v_payload)
  ON CONFLICT (id) DO UPDATE
  SET refreshed_at = EXCLUDED.refreshed_at, payload = EXCLUDED.payload;

  RETURN v_payload;
END;
$$;

-- 10. Pre-warm both snapshots
SELECT refresh_dashboard_snapshot();
SELECT refresh_data_quality_snapshot();
