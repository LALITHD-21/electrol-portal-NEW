-- ═══════════════════════════════════════════════════════════════
-- MIGRATION 002: Phase 1 Search Trigram & Digits-Only Indexes
-- Module: (A) Voter Search Engine
-- Idempotent: safe to run multiple times
-- Date: 2026-10-05
-- ═══════════════════════════════════════════════════════════════

-- 1. Enable pg_trgm extension for fast substring & trigram search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. GIN trigram index on elector name (supports ILIKE '%name%' and similarity % queries in < 400ms)
CREATE INDEX IF NOT EXISTS idx_electors_name_trgm 
ON electors 
USING gin (name gin_trgm_ops);

-- 3. GIN trigram index on relative_name (father/husband search)
CREATE INDEX IF NOT EXISTS idx_electors_relative_name_trgm 
ON electors 
USING gin (relative_name gin_trgm_ops);

-- 4. B-tree index on normalized 10-digit mobile number expression
CREATE INDEX IF NOT EXISTS idx_electors_whatsapp_mob_digits 
ON electors ((regexp_replace(whatsapp_mob, '\D', '', 'g')));

-- 4b. GIN trigram index on whatsapp_mob for ultra-fast phone substring lookup (1.5 ms)
CREATE INDEX IF NOT EXISTS idx_electors_whatsapp_mob_trgm 
ON electors USING gin (whatsapp_mob gin_trgm_ops);

-- 5. Composite index for filtered name searches (e.g., searching by name within a part/booth)
CREATE INDEX IF NOT EXISTS idx_electors_part_name 
ON electors (part_number, name);

-- 6. Composite index for constituency-level search
CREATE INDEX IF NOT EXISTS idx_electors_ac_part 
ON electors (ac_name, part_number);

-- ═══════════════════════════════════════════════════════════════
-- ROLLBACK INSTRUCTIONS (Run only if reversing this migration)
-- ═══════════════════════════════════════════════════════════════
-- DROP INDEX IF EXISTS idx_electors_ac_part;
-- DROP INDEX IF EXISTS idx_electors_part_name;
-- DROP INDEX IF EXISTS idx_electors_whatsapp_mob_digits;
-- DROP INDEX IF EXISTS idx_electors_relative_name_trgm;
-- DROP INDEX IF EXISTS idx_electors_name_trgm;
-- Note: Do NOT drop pg_trgm if other tables or modules depend on it.
