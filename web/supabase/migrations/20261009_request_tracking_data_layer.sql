-- ============================================================================
-- MIGRATION: 20261009_request_tracking_data_layer.sql
-- Description: Voter Request Tracking & Admin Status Workflow Data Layer
-- Includes:
--   1. reject_reasons lookup table
--   2. voter_requests schema enhancement (columns & SLA)
--   3. request_events append-only audit trail
--   4. request_notifications outbox table
--   5. State transition verification trigger / rules
--   6. public_track_request() SECURITY DEFINER function for anon public tracking
--   7. RLS policies and role grants
-- ============================================================================

-- Rollback instructions:
-- DROP FUNCTION IF EXISTS public_track_request(text, text);
-- DROP TRIGGER IF EXISTS trg_validate_voter_request_transition ON voter_requests;
-- DROP FUNCTION IF EXISTS fn_validate_voter_request_transition();
-- DROP TABLE IF EXISTS request_notifications CASCADE;
-- DROP TABLE IF EXISTS request_events CASCADE;
-- DROP TABLE IF EXISTS reject_reasons CASCADE;

-- ----------------------------------------------------------------------------
-- 1. PRE-APPROVED REJECTION REASONS LOOKUP TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reject_reasons (
    code text PRIMARY KEY,
    label_en text NOT NULL,
    label_kn text NOT NULL,
    public_visible_text_en text NOT NULL,
    public_visible_text_kn text NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Seed pre-approved reasons (neutral, factual, non-defamatory)
INSERT INTO reject_reasons (code, label_en, label_kn, public_visible_text_en, public_visible_text_kn, is_active)
VALUES
    (
        'INCOMPLETE_DOCS',
        'Incomplete or unclear degree documentation',
        'ಅಪೂರ್ಣ ಅಥವಾ ಅಸ್ಪಷ್ಟ ಶೈಕ್ಷಣಿಕ ದಾಖಲೆಗಳು',
        'Uploaded or shared graduation certificate is incomplete or illegible for Form 18.',
        'ಫಾರ್ಮ್ 18 ಕ್ಕೆ ಸಲ್ಲಿಸಲಾದ ಪದವಿ ಪ್ರಮಾಣಪತ್ರವು ಅಪೂರ್ಣವಾಗಿದೆ ಅಥವಾ ಸ್ಪಷ್ಟವಾಗಿಲ್ಲ.',
        true
    ),
    (
        'NOT_ELIGIBLE_GRAD_YEAR',
        'Graduation completed less than 3 years before qualifying date',
        'ಅರ್ಹತಾ ದಿನಾಂಕಕ್ಕಿಂತ 3 ವರ್ಷಗಳ ಮುಂಚೆ ಪದವಿ ಪೂರ್ಣಗೊಂಡಿಲ್ಲ',
        'Degree completion does not satisfy the statutory 3-year prior qualifying requirement under Section 27 of Representation of the People Act, 1950.',
        'ಜನಪ್ರತಿನಿಧಿ ಕಾಯ್ದೆ 1950 ರ ಸೆಕ್ಷನ್ 27 ರ ಪ್ರಕಾರ 3 ವರ್ಷಗಳ ಮುಂಚೆ ಪದವಿ ಪೂರ್ಣಗೊಂಡ ಮಾನದಂಡ ಪೂರೈಸಿಲ್ಲ.',
        true
    ),
    (
        'OUTSIDE_CONSTITUENCY',
        'Residence outside South-East Graduates constituency',
        'ವಾಸಸ್ಥಳವು ಆಗ್ನೇಯ ಪದವೀಧರ ಕ್ಷೇತ್ರದ ವ್ಯಾಪ್ತಿಗೆ ಬರುವುದಿಲ್ಲ',
        'Ordinary residence falls outside the notified districts (Tumkur, Chitradurga, Davanagere, Kolar, Chikkaballapura).',
        'ಸಾಮಾನ್ಯ ವಾಸಸ್ಥಳವು ನಿಗದಿತ ಜಿಲ್ಲೆಗಳ (ತುಮಕೂರು, ಚಿತ್ರದುರ್ಗ, ದಾವಣಗೆರೆ, ಕೋಲಾರ, ಚಿಕ್ಕಬಳ್ಳಾಪುರ) ವ್ಯಾಪ್ತಿಗೆ ಬರುವುದಿಲ್ಲ.',
        true
    ),
    (
        'DUPLICATE_APPLICATION',
        'Duplicate application for the same voter',
        'ಅದೇ ಮತದಾರರ ನಕಲಿ ಅರ್ಜಿ',
        'An existing verified application is already active for this elector.',
        'ಈ ಮತದಾರರಿಗೆ ಈಗಾಗಲೇ ಪರಿಶೀಲಿಸಿದ ಅರ್ಜಿ ಚಾಲ್ತಿಯಲ್ಲಿದೆ.',
        true
    ),
    (
        'APPLICANT_WITHDREW',
        'Withdrawn by applicant',
        'ಅರ್ಜಿದಾರರು ವಿನಂತಿಯನ್ನು ಹಿಂಪಡೆದಿದ್ದಾರೆ',
        'The applicant requested cancellation of this assistance request.',
        'ಅರ್ಜಿದಾರರ ಕೋರಿಕೆಯ ಮೇರೆಗೆ ಈ ವಿನಂತಿಯನ್ನು ರದ್ದುಗೊಳಿಸಲಾಗಿದೆ.',
        true
    ),
    (
        'NON_RECOGNIZED_INSTITUTION',
        'Educational institution not recognized for Form 18 roll',
        'ಪದವಿ ನೀಡಿದ ಸಂಸ್ಥೆಯು ಮಾನ್ಯತೆ ಪಡೆದಿಲ್ಲ',
        'The awarding institution is not listed as a recognized university under ECI guidelines.',
        'ಪದವಿ ನೀಡಿದ ಶಿಕ್ಷಣ ಸಂಸ್ಥೆಯು ಚುನಾವಣಾ ಆಯೋಗದ ಮಾನ್ಯತೆ ಪಡೆದ ವಿಶ್ವವಿದ್ಯಾಲಯಗಳ ಪಟ್ಟಿಯಲ್ಲಿಲ್ಲ.',
        true
    )
ON CONFLICT (code) DO UPDATE SET
    label_en = EXCLUDED.label_en,
    label_kn = EXCLUDED.label_kn,
    public_visible_text_en = EXCLUDED.public_visible_text_en,
    public_visible_text_kn = EXCLUDED.public_visible_text_kn,
    is_active = EXCLUDED.is_active;

-- ----------------------------------------------------------------------------
-- 2. ENSURE & EXTEND voter_requests TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS voter_requests (
    id text PRIMARY KEY,
    elector_name text NOT NULL,
    elector_name_kannada text,
    relative_name text NOT NULL,
    relation_type text DEFAULT 'Father',
    gender text DEFAULT 'Male',
    age integer,
    dob date,
    qualification text,
    occupation text,
    existing_epic text,
    district text NOT NULL,
    taluk text NOT NULL,
    hobli text,
    village text,
    city text,
    polling_station text,
    address text,
    pincode text,
    mobile text NOT NULL,
    whatsapp text,
    applicant_type text DEFAULT 'Self',
    category text DEFAULT 'Graduates / Teachers Enrollment',
    notes text,
    status text NOT NULL DEFAULT 'new',
    rejection_reason text,
    reviewed_by text,
    reviewed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add tracking and ECI workflow columns if missing
DO $$
BEGIN
    -- form fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'voter_requests' AND column_name = 'form_type') THEN
        ALTER TABLE voter_requests ADD COLUMN form_type text DEFAULT 'Form 18';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'voter_requests' AND column_name = 'form_submitted_at') THEN
        ALTER TABLE voter_requests ADD COLUMN form_submitted_at timestamptz;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'voter_requests' AND column_name = 'form_ack_number') THEN
        ALTER TABLE voter_requests ADD COLUMN form_ack_number text;
    END IF;

    -- enrolment fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'voter_requests' AND column_name = 'enrolled_confirmed_at') THEN
        ALTER TABLE voter_requests ADD COLUMN enrolled_confirmed_at timestamptz;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'voter_requests' AND column_name = 'enrolled_part_number') THEN
        ALTER TABLE voter_requests ADD COLUMN enrolled_part_number text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'voter_requests' AND column_name = 'enrolled_serial_number') THEN
        ALTER TABLE voter_requests ADD COLUMN enrolled_serial_number text;
    END IF;

    -- reject reason relation
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'voter_requests' AND column_name = 'public_reject_reason_code') THEN
        ALTER TABLE voter_requests ADD COLUMN public_reject_reason_code text REFERENCES reject_reasons(code);
    END IF;

    -- audit and SLA fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'voter_requests' AND column_name = 'last_status_changed_at') THEN
        ALTER TABLE voter_requests ADD COLUMN last_status_changed_at timestamptz DEFAULT now();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'voter_requests' AND column_name = 'sla_due_at') THEN
        ALTER TABLE voter_requests ADD COLUMN sla_due_at timestamptz DEFAULT (now() + interval '3 days');
    END IF;
END $$;

-- Normalize legacy statuses if any exist
UPDATE voter_requests SET status = 'new' WHERE status = 'pending';
UPDATE voter_requests SET status = 'contacted' WHERE status = 'in_review';
UPDATE voter_requests SET status = 'verified' WHERE status = 'approved';

CREATE INDEX IF NOT EXISTS idx_voter_requests_status ON voter_requests (status);
CREATE INDEX IF NOT EXISTS idx_voter_requests_mobile ON voter_requests (mobile);
CREATE INDEX IF NOT EXISTS idx_voter_requests_taluk ON voter_requests (taluk);
CREATE INDEX IF NOT EXISTS idx_voter_requests_sla ON voter_requests (sla_due_at);

-- ----------------------------------------------------------------------------
-- 3. APPEND-ONLY request_events TABLE (Audit Trail)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS request_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id text NOT NULL REFERENCES voter_requests(id) ON DELETE CASCADE,
    actor_id text NOT NULL DEFAULT 'system',
    action text NOT NULL,
    from_status text,
    to_status text NOT NULL,
    internal_note text,
    public_note text,
    public_note_kn text,
    public_visible boolean NOT NULL DEFAULT false,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_request_events_req_id ON request_events (request_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_request_events_public ON request_events (request_id) WHERE public_visible = true;

-- Explicitly revoke destructive permissions on request_events to guarantee append-only
REVOKE UPDATE, DELETE ON request_events FROM PUBLIC;
REVOKE UPDATE, DELETE ON request_events FROM anon;
REVOKE UPDATE, DELETE ON request_events FROM authenticated;

-- ----------------------------------------------------------------------------
-- 4. request_notifications OUTBOX TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS request_notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id text NOT NULL REFERENCES voter_requests(id) ON DELETE CASCADE,
    channel text NOT NULL CHECK (channel IN ('whatsapp_click', 'whatsapp_api', 'sms', 'pwa_push')),
    template_key text NOT NULL,
    recipient_mobile text NOT NULL,
    payload jsonb NOT NULL DEFAULT '{}'::jsonb,
    status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'failed', 'skipped')),
    error_message text,
    created_at timestamptz NOT NULL DEFAULT now(),
    sent_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_request_notifs_pending ON request_notifications (status, created_at ASC) WHERE status = 'queued';

-- ----------------------------------------------------------------------------
-- 5. DATABASE-LEVEL STATE MACHINE ENFORCEMENT TRIGGER
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_validate_voter_request_transition()
RETURNS trigger AS $$
DECLARE
    v_valid boolean := false;
BEGIN
    -- Skip if status is not changing
    IF (OLD.status = NEW.status) THEN
        NEW.updated_at := now();
        RETURN NEW;
    END IF;

    -- Strict Allowed Transition Matrix:
    -- new                 -> contacted, needs_info, rejected, duplicate, withdrawn, closed
    -- contacted           -> documents_pending, verified, needs_info, rejected, duplicate, withdrawn, closed
    -- documents_pending   -> verified, needs_info, rejected, withdrawn, closed
    -- needs_info          -> contacted, documents_pending, verified, rejected, withdrawn, closed
    -- verified            -> form_submitted, rejected, withdrawn, closed
    -- form_submitted      -> enrolled, needs_info, rejected, withdrawn, closed
    -- enrolled            -> closed (terminal state)
    -- rejected, duplicate, withdrawn, closed -> new (re-opening requires explicit reset)
    
    CASE OLD.status
        WHEN 'new' THEN
            v_valid := NEW.status IN ('contacted', 'needs_info', 'rejected', 'duplicate', 'withdrawn', 'closed');
        WHEN 'contacted' THEN
            v_valid := NEW.status IN ('documents_pending', 'verified', 'needs_info', 'rejected', 'duplicate', 'withdrawn', 'closed');
        WHEN 'documents_pending' THEN
            v_valid := NEW.status IN ('verified', 'needs_info', 'rejected', 'withdrawn', 'closed');
        WHEN 'needs_info' THEN
            v_valid := NEW.status IN ('contacted', 'documents_pending', 'verified', 'rejected', 'withdrawn', 'closed');
        WHEN 'verified' THEN
            v_valid := NEW.status IN ('form_submitted', 'rejected', 'withdrawn', 'closed');
        WHEN 'form_submitted' THEN
            v_valid := NEW.status IN ('enrolled', 'needs_info', 'rejected', 'withdrawn', 'closed');
        WHEN 'enrolled' THEN
            v_valid := NEW.status IN ('closed');
        WHEN 'rejected', 'duplicate', 'withdrawn', 'closed' THEN
            v_valid := NEW.status IN ('new', 'closed');
        ELSE
            -- In case of unmapped legacy status, allow initial transition into standard states
            v_valid := true;
    END CASE;

    IF NOT v_valid THEN
        RAISE EXCEPTION 'Illegal status transition from "%" to "%" for request %',
            OLD.status, NEW.status, NEW.id
            USING ERRCODE = '22000';
    END IF;

    -- Enforce Required Fields per State
    IF NEW.status = 'rejected' THEN
        IF NEW.public_reject_reason_code IS NULL AND NEW.rejection_reason IS NULL THEN
            RAISE EXCEPTION 'A rejection reason code or explanation is mandatory when rejecting a request.'
                USING ERRCODE = '22001';
        END IF;
    ELSIF NEW.status = 'form_submitted' THEN
        IF NEW.form_ack_number IS NULL OR trim(NEW.form_ack_number) = '' THEN
            RAISE EXCEPTION 'Acknowledgement number is required when marking a form as submitted to ERO.'
                USING ERRCODE = '22002';
        END IF;
        IF NEW.form_submitted_at IS NULL THEN
            NEW.form_submitted_at := now();
        END IF;
    ELSIF NEW.status = 'enrolled' THEN
        IF NEW.enrolled_confirmed_at IS NULL THEN
            NEW.enrolled_confirmed_at := now();
        END IF;
    END IF;

    -- Update transition timestamps
    NEW.last_status_changed_at := now();
    NEW.updated_at := now();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_voter_request_transition ON voter_requests;
CREATE TRIGGER trg_validate_voter_request_transition
    BEFORE UPDATE OF status ON voter_requests
    FOR EACH ROW
    EXECUTE FUNCTION fn_validate_voter_request_transition();

-- ----------------------------------------------------------------------------
-- 6. SECURITY DEFINER PUBLIC TRACKING FUNCTION (Free from ID Probing)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public_track_request(
    p_reference text,
    p_mobile text
)
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_clean_ref text;
    v_clean_mob text;
    v_rec record;
    v_public_events jsonb;
    v_first_name text;
    v_reason_text_en text := null;
    v_reason_text_kn text := null;
BEGIN
    -- 1. Input sanitization
    v_clean_ref := upper(trim(COALESCE(p_reference, '')));
    -- Extract only last 10 digits of mobile
    v_clean_mob := right(regexp_replace(COALESCE(p_mobile, ''), '\D', '', 'g'), 10);

    -- Constant-time simulation check: ensure invalid input lengths fail uniformly
    IF length(v_clean_ref) < 8 OR length(v_clean_mob) <> 10 THEN
        RETURN jsonb_build_object(
            'found', false,
            'message', 'No application found matching the provided Reference ID and Mobile Number.'
        );
    END IF;

    -- 2. Lookup record matching BOTH reference ID and normalized mobile
    SELECT 
        r.id,
        r.elector_name,
        r.status,
        r.created_at,
        r.last_status_changed_at,
        r.sla_due_at,
        r.form_type,
        r.form_submitted_at,
        r.form_ack_number,
        r.enrolled_confirmed_at,
        r.enrolled_part_number,
        r.enrolled_serial_number,
        r.public_reject_reason_code,
        r.rejection_reason
    INTO v_rec
    FROM voter_requests r
    WHERE r.id = v_clean_ref
      AND right(regexp_replace(r.mobile, '\D', '', 'g'), 10) = v_clean_mob;

    -- 3. Uniform response if no match (prevents ID enumeration & probing)
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'found', false,
            'message', 'No application found matching the provided Reference ID and Mobile Number.'
        );
    END IF;

    -- 4. Extract first name only (Privacy: Never expose full legal name or surname)
    v_first_name := split_part(trim(v_rec.elector_name), ' ', 1);

    -- 5. Fetch pre-approved rejection reason if applicable
    IF v_rec.public_reject_reason_code IS NOT NULL THEN
        SELECT public_visible_text_en, public_visible_text_kn
        INTO v_reason_text_en, v_reason_text_kn
        FROM reject_reasons
        WHERE code = v_rec.public_reject_reason_code;
    ELSIF v_rec.rejection_reason IS NOT NULL THEN
        v_reason_text_en := v_rec.rejection_reason;
        v_reason_text_kn := v_rec.rejection_reason;
    END IF;

    -- 6. Collect public-visible timeline events
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'action', e.action,
                'to_status', e.to_status,
                'public_note', e.public_note,
                'public_note_kn', e.public_note_kn,
                'created_at', e.created_at
            ) ORDER BY e.created_at ASC
        ),
        '[]'::jsonb
    )
    INTO v_public_events
    FROM request_events e
    WHERE e.request_id = v_rec.id
      AND e.public_visible = true;

    -- 7. Return allow-listed payload ONLY (Zero internal notes, zero staff data)
    RETURN jsonb_build_object(
        'found', true,
        'reference_id', v_rec.id,
        'first_name', v_first_name,
        'status', v_rec.status,
        'submitted_at', v_rec.created_at,
        'last_updated_at', v_rec.last_status_changed_at,
        'sla_due_at', v_rec.sla_due_at,
        'form_type', v_rec.form_type,
        'form_submitted_at', v_rec.form_submitted_at,
        'form_ack_number', v_rec.form_ack_number,
        'enrolled_confirmed_at', v_rec.enrolled_confirmed_at,
        'enrolled_part_number', v_rec.enrolled_part_number,
        'enrolled_serial_number', v_rec.enrolled_serial_number,
        'reject_reason_en', v_reason_text_en,
        'reject_reason_kn', v_reason_text_kn,
        'timeline', v_public_events
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY & PERMISSIONS
-- ----------------------------------------------------------------------------
ALTER TABLE voter_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE reject_reasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_notifications ENABLE ROW LEVEL SECURITY;

-- Grant EXECUTE on public_track_request to anon and authenticated
GRANT EXECUTE ON FUNCTION public_track_request(text, text) TO anon, authenticated;

-- reject_reasons can be read by all for UI display
DROP POLICY IF EXISTS "Allow public read on reject_reasons" ON reject_reasons;
CREATE POLICY "Allow public read on reject_reasons" ON reject_reasons
    FOR SELECT TO anon, authenticated USING (is_active = true);

-- voter_requests & request_events: NO direct SELECT for anon (only accessed via SECURITY DEFINER)
DROP POLICY IF EXISTS "Allow staff full access to voter_requests" ON voter_requests;
CREATE POLICY "Allow staff full access to voter_requests" ON voter_requests
    FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow staff full access to request_events" ON request_events;
CREATE POLICY "Allow staff full access to request_events" ON request_events
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow staff insert to request_events" ON request_events;
CREATE POLICY "Allow staff insert to request_events" ON request_events
    FOR INSERT TO authenticated WITH CHECK (true);
