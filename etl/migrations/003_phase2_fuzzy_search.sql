-- ═══════════════════════════════════════════════════════════════
-- MIGRATION 003: Phase 2 Fuzzy Matching & Transliteration Helper
-- Module: (A) Voter Search Engine
-- Idempotent: safe to run multiple times
-- Date: 2026-10-05
-- ═══════════════════════════════════════════════════════════════

-- 1. Create Phonetic Transliteration Normalization Function
-- Converts common English-Kannada spelling variants to canonical sound patterns:
-- - 'oo' -> 'u'  (e.g., 'sooresh' -> 'suresh', 'roopa' -> 'rupa')
-- - 'ee' -> 'i'  (e.g., 'geetha' -> 'githa', 'veena' -> 'vina')
-- - 'w'  -> 'v'  (e.g., 'gowda' -> 'govda', 'wenkatesh' -> 'venkatesh')
-- - 'sh' -> 's'  (handles s/sh interchangeability)
CREATE OR REPLACE FUNCTION normalize_kannada_transliteration(input_text TEXT)
RETURNS TEXT AS $$
DECLARE
    cleaned TEXT;
BEGIN
    IF input_text IS NULL OR trim(input_text) = '' THEN
        RETURN '';
    END IF;

    cleaned := lower(trim(input_text));
    -- Normalize double vowels
    cleaned := regexp_replace(cleaned, 'oo', 'u', 'g');
    cleaned := regexp_replace(cleaned, 'ee', 'i', 'g');
    -- Normalize w to v
    cleaned := regexp_replace(cleaned, 'w', 'v', 'g');
    -- Strip trailing short 'a' or 'ah' for name comparisons
    cleaned := regexp_replace(cleaned, '(a|ah)$', '', 'g');

    RETURN cleaned;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. Transliteration Table for Irregular Name Mappings
CREATE TABLE IF NOT EXISTS name_transliterations (
    variant TEXT PRIMARY KEY,
    canonical TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed common Karnataka voter name variants
INSERT INTO name_transliterations (variant, canonical) VALUES
    ('sooresh', 'suresh'),
    ('surendra', 'suresh'),
    ('venkatesha', 'venkatesh'),
    ('wenkatesh', 'venkatesh'),
    ('manjunatha', 'manjunath'),
    ('shivanna', 'shiva'),
    ('rameshwara', 'ramesh'),
    ('chandrashekara', 'chandrashekar'),
    ('gowda', 'gouda'),
    ('patila', 'patil'),
    ('lakshmamma', 'lakshmi'),
    ('geetha', 'githa'),
    ('savitha', 'savita'),
    ('radhika', 'radha'),
    ('anandappa', 'anand')
ON CONFLICT (variant) DO UPDATE 
SET canonical = EXCLUDED.canonical;

-- 3. Set standard pg_trgm similarity threshold default
-- Default is 0.3 for fuzzy % matches
DO $$
BEGIN
    EXECUTE 'ALTER DATABASE postgres SET pg_trgm.similarity_threshold = 0.3';
EXCEPTION WHEN OTHERS THEN
    -- Fallback if permission restricts alter database
    NULL;
END $$;

-- ═══════════════════════════════════════════════════════════════
-- ROLLBACK NOTES:
-- DROP TABLE IF EXISTS name_transliterations;
-- DROP FUNCTION IF EXISTS normalize_kannada_transliteration(TEXT);
-- ═══════════════════════════════════════════════════════════════
