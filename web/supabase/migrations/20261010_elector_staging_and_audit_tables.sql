-- ==============================================================================
-- Migration: Staging, Batch Tracking, Audit, and Polling Stations Tables
-- Date: 2026-10-10
-- Purpose: Support zero-error voter list ingestion pipeline (Phase 1-6)
-- Idempotent: Can be run multiple times safely
-- ==============================================================================

-- 1. import_batches table
CREATE TABLE IF NOT EXISTS public.import_batches (
    id TEXT PRIMARY KEY,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    status TEXT DEFAULT 'in_progress',
    files JSONB DEFAULT '[]'::jsonb,
    counts JSONB DEFAULT '{}'::jsonb,
    operator TEXT DEFAULT 'system'
);

-- 2. staging_electors table
CREATE TABLE IF NOT EXISTS public.staging_electors (
    id BIGSERIAL PRIMARY KEY,
    batch_id TEXT REFERENCES public.import_batches(id) ON DELETE CASCADE,
    serial_number TEXT,
    epic_number TEXT,
    name TEXT,
    relative_name TEXT,
    address TEXT,
    qualification TEXT,
    occupation TEXT,
    age TEXT,
    sex TEXT,
    part_number TEXT,
    polling_station_name TEXT,
    polling_address TEXT,
    whatsapp_mob TEXT,
    caste TEXT,
    district TEXT,
    ac_name TEXT,
    taluk TEXT,
    hobli TEXT,
    grama_panchayath TEXT,
    village TEXT,
    area_ward TEXT,
    source_file TEXT,
    source_page_or_row TEXT,
    ocr_confidence NUMERIC,
    parse_warnings TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staging_electors_batch_id ON public.staging_electors(batch_id);
CREATE INDEX IF NOT EXISTS idx_staging_electors_epic ON public.staging_electors(epic_number);

-- 3. import_results table
CREATE TABLE IF NOT EXISTS public.import_results (
    id BIGSERIAL PRIMARY KEY,
    batch_id TEXT REFERENCES public.import_batches(id) ON DELETE CASCADE,
    epic_number TEXT,
    classification TEXT NOT NULL,
    reason TEXT,
    source_file TEXT,
    source_page_or_row TEXT,
    differences JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_import_results_batch_classification ON public.import_results(batch_id, classification);

-- 4. quarantine_rows table
CREATE TABLE IF NOT EXISTS public.quarantine_rows (
    id BIGSERIAL PRIMARY KEY,
    batch_id TEXT REFERENCES public.import_batches(id) ON DELETE CASCADE,
    source_file TEXT,
    source_page_or_row TEXT,
    raw_data JSONB,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quarantine_rows_batch_id ON public.quarantine_rows(batch_id);

-- 5. polling_stations table
CREATE TABLE IF NOT EXISTS public.polling_stations (
    id BIGSERIAL PRIMARY KEY,
    part_number TEXT,
    ac_name TEXT,
    district TEXT,
    name TEXT,
    address TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    source_file TEXT,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_polling_stations_part ON public.polling_stations(part_number);
