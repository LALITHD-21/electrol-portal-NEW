-- ============================================
-- Elector Lookup Portal — Database Setup Script (with Polling fields)
-- Run this in the Supabase SQL Editor
-- ============================================

-- 1. Create the table
CREATE TABLE IF NOT EXISTS electors (
    id                    BIGSERIAL PRIMARY KEY,
    serial_number         INTEGER,
    epic_number           VARCHAR(11) NOT NULL UNIQUE,
    name                  TEXT NOT NULL,
    relative_name         TEXT,
    address               TEXT,
    qualification         VARCHAR(100),
    occupation            VARCHAR(100),
    age                   INTEGER,
    sex                   CHAR(1) CHECK (sex IN ('M', 'F')),
    part_number           VARCHAR(20),
    polling_station_name  TEXT,
    polling_address       TEXT,
    whatsapp_mob          VARCHAR(15),
    caste                 TEXT,
    district              TEXT,
    ac_name               TEXT,
    taluk                 TEXT,
    hobli                 TEXT,
    grama_panchayath      TEXT,
    village               TEXT,
    area_ward             TEXT,
    photo_url             TEXT,          -- ⚠️ PENDING: leave NULL for all records
    created_at            TIMESTAMPTZ DEFAULT NOW(),
    updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create the unique index on epic_number
CREATE UNIQUE INDEX IF NOT EXISTS idx_electors_epic_number
    ON electors (epic_number);

-- 3. Enable Row Level Security
ALTER TABLE electors ENABLE ROW LEVEL SECURITY;

-- 4. Policy: authenticated users can SELECT
CREATE POLICY "Authenticated users can read electors"
    ON electors FOR SELECT
    TO authenticated
    USING (true);

-- 5. Policy: anonymous users CANNOT SELECT
CREATE POLICY "Anonymous users cannot read electors"
    ON electors FOR SELECT
    TO anon
    USING (false);

-- 6. Verify setup
-- Run these manually after executing the script:
-- SELECT count(*) FROM electors;
-- SELECT * FROM pg_policies WHERE tablename = 'electors';
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'electors';
-- SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'electors';
