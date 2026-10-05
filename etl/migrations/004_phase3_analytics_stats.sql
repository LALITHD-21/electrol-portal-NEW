-- ═══════════════════════════════════════════════════════════════
-- MIGRATION 004: Phase 3 Analytics Data Engine & Snapshot Cache
-- Module: (B) Analytics Dashboard
-- Idempotent: safe to run multiple times
-- Date: 2026-10-05
-- ═══════════════════════════════════════════════════════════════

-- 1. Create single-row snapshot table for sub-10ms unfiltered stats
CREATE TABLE IF NOT EXISTS dashboard_snapshot (
    id INT PRIMARY KEY DEFAULT 1,
    refreshed_at TIMESTAMPTZ DEFAULT now(),
    payload JSONB NOT NULL,
    CONSTRAINT single_row_check CHECK (id = 1)
);

-- 2. Master Analytics Engine Function
CREATE OR REPLACE FUNCTION get_dashboard_stats(
    p_district TEXT DEFAULT NULL,
    p_ac TEXT DEFAULT NULL,
    p_taluk TEXT DEFAULT NULL,
    p_part TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_total BIGINT;
    v_male BIGINT;
    v_female BIGINT;
    v_unspecified BIGINT;
    v_mobile_count BIGINT;
    v_photo_count BIGINT;
    v_caste_count BIGINT;
    v_occ_count BIGINT;
    v_qual_count BIGINT;
    v_districts_cnt INT;
    v_acs_cnt INT;
    v_taluks_cnt INT;
    v_hoblis_cnt INT;
    v_gps_cnt INT;
    v_villages_cnt INT;
    v_booths_cnt INT;
    v_dup_groups BIGINT := 0;
    v_dup_rows BIGINT := 0;
    v_age_brackets JSONB;
    v_district_strength JSONB;
    v_ac_strength JSONB;
    v_caste_dist JSONB;
    v_occ_dist JSONB;
    v_qual_dist JSONB;
    v_result JSONB;
BEGIN
    -- 1. Core Counts & Gender Reconciliation
    SELECT
        COUNT(*),
        COUNT(*) FILTER (WHERE e.sex = 'M'),
        COUNT(*) FILTER (WHERE e.sex = 'F'),
        COUNT(*) FILTER (WHERE e.sex IS NULL OR e.sex NOT IN ('M', 'F')),
        COUNT(*) FILTER (WHERE e.whatsapp_mob IS NOT NULL AND trim(e.whatsapp_mob) <> ''),
        COUNT(*) FILTER (WHERE e.photo_url IS NOT NULL AND trim(e.photo_url) <> ''),
        COUNT(*) FILTER (WHERE e.caste IS NOT NULL AND trim(e.caste) <> ''),
        COUNT(*) FILTER (WHERE e.occupation IS NOT NULL AND trim(e.occupation) <> ''),
        COUNT(*) FILTER (WHERE e.qualification IS NOT NULL AND trim(e.qualification) <> ''),
        COUNT(DISTINCT COALESCE(NULLIF(trim(e.district), ''), bm.district)) FILTER (WHERE COALESCE(NULLIF(trim(e.district), ''), bm.district) IS NOT NULL),
        COUNT(DISTINCT COALESCE(NULLIF(trim(e.ac_name), ''), bm.ac_name)) FILTER (WHERE COALESCE(NULLIF(trim(e.ac_name), ''), bm.ac_name) IS NOT NULL),
        COUNT(DISTINCT COALESCE(NULLIF(trim(e.taluk), ''), bm.taluk)) FILTER (WHERE COALESCE(NULLIF(trim(e.taluk), ''), bm.taluk) IS NOT NULL),
        COUNT(DISTINCT e.hobli) FILTER (WHERE e.hobli IS NOT NULL AND trim(e.hobli) <> ''),
        COUNT(DISTINCT e.grama_panchayath) FILTER (WHERE e.grama_panchayath IS NOT NULL AND trim(e.grama_panchayath) <> ''),
        COUNT(DISTINCT e.village) FILTER (WHERE e.village IS NOT NULL AND trim(e.village) <> ''),
        COUNT(DISTINCT e.part_number) FILTER (WHERE e.part_number IS NOT NULL AND trim(e.part_number) <> '')
    INTO
        v_total, v_male, v_female, v_unspecified,
        v_mobile_count, v_photo_count, v_caste_count, v_occ_count, v_qual_count,
        v_districts_cnt, v_acs_cnt, v_taluks_cnt, v_hoblis_cnt, v_gps_cnt, v_villages_cnt, v_booths_cnt
    FROM electors e
    LEFT JOIN booth_master bm ON e.part_number = bm.part_number
    WHERE (p_district IS NULL OR COALESCE(NULLIF(trim(e.district), ''), bm.district) = p_district)
      AND (p_ac IS NULL OR COALESCE(NULLIF(trim(e.ac_name), ''), bm.ac_name) = p_ac)
      AND (p_taluk IS NULL OR COALESCE(NULLIF(trim(e.taluk), ''), bm.taluk) = p_taluk)
      AND (p_part IS NULL OR e.part_number = p_part);

    -- Avoid division by zero
    IF v_total IS NULL OR v_total = 0 THEN
        RETURN jsonb_build_object(
            'totals', jsonb_build_object('total', 0, 'male', 0, 'female', 0, 'unspecified', 0),
            'hierarchy', jsonb_build_object('districts', 0, 'ac_names', 0, 'taluks', 0, 'hoblis', 0, 'grama_panchayaths', 0, 'villages', 0, 'booths', 0),
            'coverage', jsonb_build_object('mobile', jsonb_build_object('count', 0, 'pct', 0), 'photo', jsonb_build_object('count', 0, 'pct', 0), 'caste', jsonb_build_object('count', 0, 'pct', 0), 'occupation', jsonb_build_object('count', 0, 'pct', 0), 'qualification', jsonb_build_object('count', 0, 'pct', 0)),
            'duplicates', jsonb_build_object('groups', 0, 'rows', 0),
            'age_brackets', '[]'::jsonb,
            'district_strength', '[]'::jsonb,
            'ac_strength', '[]'::jsonb,
            'caste_majority', '[]'::jsonb,
            'occupations', '[]'::jsonb,
            'qualifications', '[]'::jsonb
        );
    END IF;

    -- 2. Duplicate Detection (Rule A: name + relative + age)
    SELECT COALESCE(COUNT(*), 0), COALESCE(SUM(grp_count), 0)
    INTO v_dup_groups, v_dup_rows
    FROM (
        SELECT COUNT(*) AS grp_count
        FROM electors e
        LEFT JOIN booth_master bm ON e.part_number = bm.part_number
        WHERE (p_district IS NULL OR COALESCE(NULLIF(trim(e.district), ''), bm.district) = p_district)
          AND (p_ac IS NULL OR COALESCE(NULLIF(trim(e.ac_name), ''), bm.ac_name) = p_ac)
          AND (p_taluk IS NULL OR COALESCE(NULLIF(trim(e.taluk), ''), bm.taluk) = p_taluk)
          AND (p_part IS NULL OR e.part_number = p_part)
          AND e.name IS NOT NULL AND e.relative_name IS NOT NULL AND e.age IS NOT NULL
        GROUP BY lower(trim(e.name)), lower(trim(e.relative_name)), e.age
        HAVING COUNT(*) > 1
    ) d;

    -- 3. Age Population Pyramid & Brackets
    WITH age_calc AS (
        SELECT
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
            END AS sort_order,
            e.sex
        FROM electors e
        LEFT JOIN booth_master bm ON e.part_number = bm.part_number
        WHERE (p_district IS NULL OR COALESCE(NULLIF(trim(e.district), ''), bm.district) = p_district)
          AND (p_ac IS NULL OR COALESCE(NULLIF(trim(e.ac_name), ''), bm.ac_name) = p_ac)
          AND (p_taluk IS NULL OR COALESCE(NULLIF(trim(e.taluk), ''), bm.taluk) = p_taluk)
          AND (p_part IS NULL OR e.part_number = p_part)
    )
    SELECT jsonb_agg(
        jsonb_build_object(
            'bracket', bracket,
            'total', total,
            'male', male,
            'female', female,
            'unspecified', unspecified,
            'pct', ROUND((total::NUMERIC / v_total::NUMERIC) * 100, 1)
        ) ORDER BY sort_order
    )
    INTO v_age_brackets
    FROM (
        SELECT
            bracket,
            sort_order,
            COUNT(*) AS total,
            COUNT(*) FILTER (WHERE sex = 'M') AS male,
            COUNT(*) FILTER (WHERE sex = 'F') AS female,
            COUNT(*) FILTER (WHERE sex IS NULL OR sex NOT IN ('M', 'F')) AS unspecified
        FROM age_calc
        GROUP BY bracket, sort_order
    ) a;

    -- 4. District Strength
    SELECT jsonb_agg(
        jsonb_build_object(
            'district', district_val,
            'total', total,
            'male', male,
            'female', female,
            'pct', ROUND((total::NUMERIC / v_total::NUMERIC) * 100, 1)
        ) ORDER BY total DESC
    )
    INTO v_district_strength
    FROM (
        SELECT
            COALESCE(NULLIF(trim(e.district), ''), bm.district, 'Unknown / Not recorded') AS district_val,
            COUNT(*) AS total,
            COUNT(*) FILTER (WHERE e.sex = 'M') AS male,
            COUNT(*) FILTER (WHERE e.sex = 'F') AS female
        FROM electors e
        LEFT JOIN booth_master bm ON e.part_number = bm.part_number
        WHERE (p_district IS NULL OR COALESCE(NULLIF(trim(e.district), ''), bm.district) = p_district)
          AND (p_ac IS NULL OR COALESCE(NULLIF(trim(e.ac_name), ''), bm.ac_name) = p_ac)
          AND (p_taluk IS NULL OR COALESCE(NULLIF(trim(e.taluk), ''), bm.taluk) = p_taluk)
          AND (p_part IS NULL OR e.part_number = p_part)
        GROUP BY COALESCE(NULLIF(trim(e.district), ''), bm.district, 'Unknown / Not recorded')
    ) dst;

    -- 5. Assembly Constituency (AC) Strength
    SELECT jsonb_agg(
        jsonb_build_object(
            'ac_name', ac_val,
            'total', total,
            'male', male,
            'female', female,
            'pct', ROUND((total::NUMERIC / v_total::NUMERIC) * 100, 1)
        ) ORDER BY total DESC
    )
    INTO v_ac_strength
    FROM (
        SELECT
            COALESCE(NULLIF(trim(e.ac_name), ''), bm.ac_name, 'Unknown / Not recorded') AS ac_val,
            COUNT(*) AS total,
            COUNT(*) FILTER (WHERE e.sex = 'M') AS male,
            COUNT(*) FILTER (WHERE e.sex = 'F') AS female
        FROM electors e
        LEFT JOIN booth_master bm ON e.part_number = bm.part_number
        WHERE (p_district IS NULL OR COALESCE(NULLIF(trim(e.district), ''), bm.district) = p_district)
          AND (p_ac IS NULL OR COALESCE(NULLIF(trim(e.ac_name), ''), bm.ac_name) = p_ac)
          AND (p_taluk IS NULL OR COALESCE(NULLIF(trim(e.taluk), ''), bm.taluk) = p_taluk)
          AND (p_part IS NULL OR e.part_number = p_part)
        GROUP BY COALESCE(NULLIF(trim(e.ac_name), ''), bm.ac_name, 'Unknown / Not recorded')
    ) acs;

    -- 6. Caste Majority (Top 10 + Others + Not recorded)
    WITH caste_agg AS (
        SELECT
            COALESCE(NULLIF(trim(e.caste), ''), 'Not recorded') AS caste_name,
            COUNT(*) AS cnt
        FROM electors e
        LEFT JOIN booth_master bm ON e.part_number = bm.part_number
        WHERE (p_district IS NULL OR COALESCE(NULLIF(trim(e.district), ''), bm.district) = p_district)
          AND (p_ac IS NULL OR COALESCE(NULLIF(trim(e.ac_name), ''), bm.ac_name) = p_ac)
          AND (p_taluk IS NULL OR COALESCE(NULLIF(trim(e.taluk), ''), bm.taluk) = p_taluk)
          AND (p_part IS NULL OR e.part_number = p_part)
        GROUP BY COALESCE(NULLIF(trim(e.caste), ''), 'Not recorded')
    ),
    caste_ranked AS (
        SELECT
            caste_name,
            cnt,
            ROW_NUMBER() OVER (ORDER BY cnt DESC) AS rn
        FROM caste_agg
        WHERE caste_name <> 'Not recorded'
    ),
    caste_top10 AS (
        SELECT caste_name, cnt FROM caste_ranked WHERE rn <= 10
        UNION ALL
        SELECT 'Others' AS caste_name, COALESCE(SUM(cnt), 0) FROM caste_ranked WHERE rn > 10
        UNION ALL
        SELECT 'Not recorded' AS caste_name, COALESCE((SELECT cnt FROM caste_agg WHERE caste_name = 'Not recorded'), 0)
    )
    SELECT jsonb_agg(
        jsonb_build_object(
            'label', caste_name,
            'count', cnt,
            'pct', ROUND((cnt::NUMERIC / v_total::NUMERIC) * 100, 2)
        ) ORDER BY cnt DESC
    )
    INTO v_caste_dist
    FROM caste_top10
    WHERE cnt > 0;

    -- 7. Top Occupations (Top 10 + Others + Not recorded)
    WITH occ_agg AS (
        SELECT
            COALESCE(NULLIF(trim(e.occupation), ''), 'Not recorded') AS occ_name,
            COUNT(*) AS cnt
        FROM electors e
        LEFT JOIN booth_master bm ON e.part_number = bm.part_number
        WHERE (p_district IS NULL OR COALESCE(NULLIF(trim(e.district), ''), bm.district) = p_district)
          AND (p_ac IS NULL OR COALESCE(NULLIF(trim(e.ac_name), ''), bm.ac_name) = p_ac)
          AND (p_taluk IS NULL OR COALESCE(NULLIF(trim(e.taluk), ''), bm.taluk) = p_taluk)
          AND (p_part IS NULL OR e.part_number = p_part)
        GROUP BY COALESCE(NULLIF(trim(e.occupation), ''), 'Not recorded')
    ),
    occ_ranked AS (
        SELECT
            occ_name,
            cnt,
            ROW_NUMBER() OVER (ORDER BY cnt DESC) AS rn
        FROM occ_agg
        WHERE occ_name <> 'Not recorded'
    ),
    occ_top10 AS (
        SELECT occ_name, cnt FROM occ_ranked WHERE rn <= 10
        UNION ALL
        SELECT 'Others' AS occ_name, COALESCE(SUM(cnt), 0) FROM occ_ranked WHERE rn > 10
        UNION ALL
        SELECT 'Not recorded' AS occ_name, COALESCE((SELECT cnt FROM occ_agg WHERE occ_name = 'Not recorded'), 0)
    )
    SELECT jsonb_agg(
        jsonb_build_object(
            'label', occ_name,
            'count', cnt,
            'pct', ROUND((cnt::NUMERIC / v_total::NUMERIC) * 100, 2)
        ) ORDER BY cnt DESC
    )
    INTO v_occ_dist
    FROM occ_top10
    WHERE cnt > 0;

    -- 8. Top Qualifications (Top 10 + Others + Not recorded)
    WITH qual_agg AS (
        SELECT
            COALESCE(NULLIF(trim(e.qualification), ''), 'Not recorded') AS qual_name,
            COUNT(*) AS cnt
        FROM electors e
        LEFT JOIN booth_master bm ON e.part_number = bm.part_number
        WHERE (p_district IS NULL OR COALESCE(NULLIF(trim(e.district), ''), bm.district) = p_district)
          AND (p_ac IS NULL OR COALESCE(NULLIF(trim(e.ac_name), ''), bm.ac_name) = p_ac)
          AND (p_taluk IS NULL OR COALESCE(NULLIF(trim(e.taluk), ''), bm.taluk) = p_taluk)
          AND (p_part IS NULL OR e.part_number = p_part)
        GROUP BY COALESCE(NULLIF(trim(e.qualification), ''), 'Not recorded')
    ),
    qual_ranked AS (
        SELECT
            qual_name,
            cnt,
            ROW_NUMBER() OVER (ORDER BY cnt DESC) AS rn
        FROM qual_agg
        WHERE qual_name <> 'Not recorded'
    ),
    qual_top10 AS (
        SELECT qual_name, cnt FROM qual_ranked WHERE rn <= 10
        UNION ALL
        SELECT 'Others' AS qual_name, COALESCE(SUM(cnt), 0) FROM qual_ranked WHERE rn > 10
        UNION ALL
        SELECT 'Not recorded' AS qual_name, COALESCE((SELECT cnt FROM qual_agg WHERE qual_name = 'Not recorded'), 0)
    )
    SELECT jsonb_agg(
        jsonb_build_object(
            'label', qual_name,
            'count', cnt,
            'pct', ROUND((cnt::NUMERIC / v_total::NUMERIC) * 100, 2)
        ) ORDER BY cnt DESC
    )
    INTO v_qual_dist
    FROM qual_top10
    WHERE cnt > 0;

    -- 9. Final JSON Assembly
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
            'mobile', jsonb_build_object(
                'count', v_mobile_count,
                'pct', ROUND((v_mobile_count::NUMERIC / v_total::NUMERIC) * 100, 2)
            ),
            'photo', jsonb_build_object(
                'count', v_photo_count,
                'pct', ROUND((v_photo_count::NUMERIC / v_total::NUMERIC) * 100, 2)
            ),
            'caste', jsonb_build_object(
                'count', v_caste_count,
                'pct', ROUND((v_caste_count::NUMERIC / v_total::NUMERIC) * 100, 2)
            ),
            'occupation', jsonb_build_object(
                'count', v_occ_count,
                'pct', ROUND((v_occ_count::NUMERIC / v_total::NUMERIC) * 100, 2)
            ),
            'qualification', jsonb_build_object(
                'count', v_qual_count,
                'pct', ROUND((v_qual_count::NUMERIC / v_total::NUMERIC) * 100, 2)
            )
        ),
        'duplicates', jsonb_build_object(
            'groups', v_dup_groups,
            'rows', v_dup_rows
        ),
        'age_brackets', COALESCE(v_age_brackets, '[]'::jsonb),
        'district_strength', COALESCE(v_district_strength, '[]'::jsonb),
        'ac_strength', COALESCE(v_ac_strength, '[]'::jsonb),
        'caste_majority', COALESCE(v_caste_dist, '[]'::jsonb),
        'occupations', COALESCE(v_occ_dist, '[]'::jsonb),
        'qualifications', COALESCE(v_qual_dist, '[]'::jsonb)
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE;

-- 3. Snapshot Refresh Function
CREATE OR REPLACE FUNCTION refresh_dashboard_snapshot()
RETURNS JSONB AS $$
DECLARE
    v_stats JSONB;
BEGIN
    -- Compute completely unfiltered metrics
    v_stats := get_dashboard_stats(NULL, NULL, NULL, NULL);

    -- Upsert into single-row snapshot table
    INSERT INTO dashboard_snapshot (id, refreshed_at, payload)
    VALUES (1, now(), v_stats)
    ON CONFLICT (id) DO UPDATE
    SET refreshed_at = EXCLUDED.refreshed_at,
        payload = EXCLUDED.payload;

    RETURN v_stats;
END;
$$ LANGUAGE plpgsql;

-- 4. Polling Booth Summary Aggregation Function
CREATE OR REPLACE FUNCTION get_booths_summary(
    p_district TEXT DEFAULT NULL,
    p_ac TEXT DEFAULT NULL,
    p_search TEXT DEFAULT NULL
)
RETURNS TABLE (
    part_number TEXT,
    polling_station_name TEXT,
    polling_address TEXT,
    district TEXT,
    ac_name TEXT,
    total_electors BIGINT,
    male_count BIGINT,
    female_count BIGINT,
    mobile_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.part_number::TEXT,
        COALESCE(e.polling_station_name, '')::TEXT,
        COALESCE(e.polling_address, '')::TEXT,
        COALESCE(NULLIF(trim(e.district), ''), bm.district, 'Unknown')::TEXT AS district,
        COALESCE(NULLIF(trim(e.ac_name), ''), bm.ac_name, 'Unknown')::TEXT AS ac_name,
        COUNT(*)::BIGINT AS total_electors,
        COUNT(*) FILTER (WHERE e.sex = 'M')::BIGINT AS male_count,
        COUNT(*) FILTER (WHERE e.sex = 'F')::BIGINT AS female_count,
        COUNT(*) FILTER (WHERE e.whatsapp_mob IS NOT NULL AND trim(e.whatsapp_mob) <> '')::BIGINT AS mobile_count
    FROM electors e
    LEFT JOIN booth_master bm ON e.part_number = bm.part_number
    WHERE (p_district IS NULL OR COALESCE(NULLIF(trim(e.district), ''), bm.district) = p_district)
      AND (p_ac IS NULL OR COALESCE(NULLIF(trim(e.ac_name), ''), bm.ac_name) = p_ac)
      AND (
          p_search IS NULL 
          OR trim(p_search) = ''
          OR e.part_number ILIKE '%' || p_search || '%'
          OR e.polling_station_name ILIKE '%' || p_search || '%'
      )
      AND e.part_number IS NOT NULL
    GROUP BY e.part_number, e.polling_station_name, e.polling_address, COALESCE(NULLIF(trim(e.district), ''), bm.district, 'Unknown'), COALESCE(NULLIF(trim(e.ac_name), ''), bm.ac_name, 'Unknown');
END;
$$ LANGUAGE plpgsql STABLE;

-- 5. Initial Snapshot Pre-Warm
SELECT refresh_dashboard_snapshot();

-- ═══════════════════════════════════════════════════════════════
-- ROLLBACK NOTES:
-- DROP FUNCTION IF EXISTS get_booths_summary(TEXT, TEXT, TEXT);
-- DROP FUNCTION IF EXISTS refresh_dashboard_snapshot();
-- DROP FUNCTION IF EXISTS get_dashboard_stats(TEXT, TEXT, TEXT, TEXT);
-- DROP TABLE IF EXISTS dashboard_snapshot;
-- ═══════════════════════════════════════════════════════════════

