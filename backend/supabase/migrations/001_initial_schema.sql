-- ====================================================================
-- CallGuide AI: Initial Database Schema Migration
-- Migration: 001_initial_schema.sql
-- Source of Truth: doc/PRODUCT_SPEC.md & Phase 4 Architecture
-- ====================================================================

-- 1. Enable UUID Extension (standard in PostgreSQL / Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create automated updated_at and synchronization trigger function
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to ensure seamless bidirectional compatibility
-- between spec names (outcome, selected_outcome, extra_data)
-- and code names (final_outcome, stage_outcome, additional_data)
CREATE OR REPLACE FUNCTION sync_call_columns()
RETURNS TRIGGER AS $$
BEGIN
    -- Sync outcome <-> final_outcome
    IF NEW.final_outcome IS NOT NULL AND NEW.outcome IS NULL THEN
        NEW.outcome = NEW.final_outcome;
    ELSIF NEW.outcome IS NOT NULL AND NEW.final_outcome IS NULL THEN
        NEW.final_outcome = NEW.outcome;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION sync_stage_result_columns()
RETURNS TRIGGER AS $$
BEGIN
    -- Sync stage_outcome <-> selected_outcome
    IF NEW.stage_outcome IS NOT NULL AND NEW.selected_outcome IS NULL THEN
        NEW.selected_outcome = NEW.stage_outcome;
    ELSIF NEW.selected_outcome IS NOT NULL AND NEW.stage_outcome IS NULL THEN
        NEW.stage_outcome = NEW.selected_outcome;
    END IF;

    -- Sync additional_data <-> extra_data
    IF NEW.additional_data IS NOT NULL AND (NEW.extra_data IS NULL OR NEW.extra_data = '{}'::jsonb) THEN
        NEW.extra_data = NEW.additional_data;
    ELSIF NEW.extra_data IS NOT NULL AND (NEW.additional_data IS NULL OR NEW.additional_data = '{}'::jsonb) THEN
        NEW.additional_data = NEW.extra_data;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Table: calls
CREATE TABLE IF NOT EXISTS calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prospect_name TEXT NOT NULL,
    company_name TEXT NOT NULL,
    prospect_role TEXT, -- Nullable per PRODUCT_SPEC.md Section 9.1
    phone_number TEXT,  -- Supported per Pre-Test Consistency Audit
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
    current_stage INTEGER NOT NULL DEFAULT 1 CHECK (current_stage >= 1 AND current_stage <= 8),
    furthest_stage_reached INTEGER NOT NULL DEFAULT 1 CHECK (furthest_stage_reached >= 1 AND furthest_stage_reached <= 8),
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER NOT NULL DEFAULT 0 CHECK (duration_seconds >= 0),
    final_outcome TEXT CHECK (
        final_outcome IS NULL OR final_outcome IN (
            'agreed_to_receive_report',
            'next_step_agreed',
            'interested',
            'follow_up',
            'call_again',
            'not_interested',
            'do_not_call',
            'wrong_person',
            'moved_company',
            'not_logged'
        )
    ),
    outcome TEXT CHECK (
        outcome IS NULL OR outcome IN (
            'agreed_to_receive_report',
            'next_step_agreed',
            'interested',
            'follow_up',
            'call_again',
            'not_interested',
            'do_not_call',
            'wrong_person',
            'moved_company',
            'not_logged'
        )
    ),
    next_step_notes TEXT,
    next_step_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Table: call_stage_results
CREATE TABLE IF NOT EXISTS call_stage_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id UUID NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
    stage_number INTEGER NOT NULL CHECK (stage_number >= 1 AND stage_number <= 8),
    stage_outcome TEXT,
    selected_outcome TEXT,
    prospect_words TEXT,
    additional_data JSONB DEFAULT '{}'::jsonb,
    extra_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_call_stage_result UNIQUE (call_id, stage_number)
);

-- 5. Performance and Query Indexes
CREATE INDEX IF NOT EXISTS idx_calls_started_at ON calls (started_at DESC);
CREATE INDEX IF NOT EXISTS idx_calls_status ON calls (status);
CREATE INDEX IF NOT EXISTS idx_calls_final_outcome ON calls (final_outcome);
CREATE INDEX IF NOT EXISTS idx_calls_outcome ON calls (outcome);
CREATE INDEX IF NOT EXISTS idx_calls_furthest_stage ON calls (furthest_stage_reached);
CREATE INDEX IF NOT EXISTS idx_calls_prospect_name ON calls (prospect_name);
CREATE INDEX IF NOT EXISTS idx_calls_company_name ON calls (company_name);
CREATE INDEX IF NOT EXISTS idx_call_stage_results_call_id ON call_stage_results (call_id);
CREATE INDEX IF NOT EXISTS idx_call_stage_results_stage_number ON call_stage_results (stage_number);

-- 6. Attach automated updated_at and column sync triggers
DROP TRIGGER IF EXISTS trg_calls_updated_at ON calls;
CREATE TRIGGER trg_calls_updated_at
    BEFORE UPDATE ON calls
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_calls_sync_columns ON calls;
CREATE TRIGGER trg_calls_sync_columns
    BEFORE INSERT OR UPDATE ON calls
    FOR EACH ROW
    EXECUTE FUNCTION sync_call_columns();

DROP TRIGGER IF EXISTS trg_call_stage_results_updated_at ON call_stage_results;
CREATE TRIGGER trg_call_stage_results_updated_at
    BEFORE UPDATE ON call_stage_results
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_call_stage_results_sync_columns ON call_stage_results;
CREATE TRIGGER trg_call_stage_results_sync_columns
    BEFORE INSERT OR UPDATE ON call_stage_results
    FOR EACH ROW
    EXECUTE FUNCTION sync_stage_result_columns();

-- 7. Enable Row Level Security (RLS)
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_stage_results ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS in Supabase by default.
-- For anon/authenticated direct access (read-only demo fallback if required in future):
CREATE POLICY "Service role has full access to calls"
    ON calls
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to call_stage_results"
    ON call_stage_results
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
