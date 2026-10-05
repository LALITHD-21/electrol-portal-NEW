-- Migration 001: Phase 0 Indexes
-- Idempotent: safe to re-run
-- Date: 2026-10-05

-- ============================================================================
-- Description:
-- Establishes single-column and composite B-tree indexes on the `electors` table
-- to optimize frequent search, filter, and aggregation query patterns.
-- Also ensures baseline Row Level Security (RLS) policies are in place.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Individual B-tree Indexes
-- ----------------------------------------------------------------------------

-- Index on district for geographic filtering
CREATE INDEX IF NOT EXISTS idx_electors_district
    ON electors (district);

-- Index on assembly constituency (ac_name)
CREATE INDEX IF NOT EXISTS idx_electors_ac_name
    ON electors (ac_name);

-- Index on taluk
CREATE INDEX IF NOT EXISTS idx_electors_taluk
    ON electors (taluk);

-- Index on part_number / polling booth identifier
CREATE INDEX IF NOT EXISTS idx_electors_part_number
    ON electors (part_number);

-- Index on sex (gender filtering / stats)
CREATE INDEX IF NOT EXISTS idx_electors_sex
    ON electors (sex);

-- Index on age (demographic range filtering)
CREATE INDEX IF NOT EXISTS idx_electors_age
    ON electors (age);

-- Index on whatsapp_mob (phone / outreach lookup)
CREATE INDEX IF NOT EXISTS idx_electors_whatsapp_mob
    ON electors (whatsapp_mob);

-- Index on epic_number (ensures B-tree index exists if not already created by unique constraint)
CREATE INDEX IF NOT EXISTS idx_electors_epic_number
    ON electors (epic_number);

-- ----------------------------------------------------------------------------
-- 2. Composite Indexes
-- ----------------------------------------------------------------------------

-- Composite index: district -> ac_name -> part_number
-- Optimizes hierarchical drill-down searches by constituency and booth
CREATE INDEX IF NOT EXISTS idx_electors_district_ac_name_part_number
    ON electors (district, ac_name, part_number);

-- Composite index: district -> ac_name -> taluk
-- Optimizes administrative area drill-down queries
CREATE INDEX IF NOT EXISTS idx_electors_district_ac_name_taluk
    ON electors (district, ac_name, taluk);

-- ----------------------------------------------------------------------------
-- 3. Baseline Security & Role Policies (Idempotent)
-- ----------------------------------------------------------------------------

ALTER TABLE electors ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    -- Authenticated users can read electors
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'electors' AND policyname = 'Authenticated users can read electors'
    ) THEN
        CREATE POLICY "Authenticated users can read electors"
            ON electors FOR SELECT
            TO authenticated
            USING (true);
    END IF;

    -- Anonymous users cannot read electors
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'electors' AND policyname = 'Anonymous users cannot read electors'
    ) THEN
        CREATE POLICY "Anonymous users cannot read electors"
            ON electors FOR SELECT
            TO anon
            USING (false);
    END IF;
END $$;

-- ============================================================================
-- Rollback / Down Migration Notes (Run manually if rollback is needed):
-- ============================================================================
-- DROP INDEX IF EXISTS idx_electors_district_ac_name_taluk;
-- DROP INDEX IF EXISTS idx_electors_district_ac_name_part_number;
-- DROP INDEX IF EXISTS idx_electors_whatsapp_mob;
-- DROP INDEX IF EXISTS idx_electors_age;
-- DROP INDEX IF EXISTS idx_electors_sex;
-- DROP INDEX IF EXISTS idx_electors_part_number;
-- DROP INDEX IF EXISTS idx_electors_taluk;
-- DROP INDEX IF EXISTS idx_electors_ac_name;
-- DROP INDEX IF EXISTS idx_electors_district;
-- DROP INDEX IF EXISTS idx_electors_epic_number;
