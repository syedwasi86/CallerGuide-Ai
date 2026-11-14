-- ====================================================================
-- CallGuide AI: Initial Database Schema Migration
-- Migration: 001_initial_schema.sql
-- Source of Truth: doc/PRODUCT_SPEC.md & Phase 4 Architecture
-- ====================================================================

-- 1. Enable UUID Extension (standard in PostgreSQL / Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create updated_at automated timestamp trigger function
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Table: calls
CREATE TABLE IF NOT EXISTS calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prospect_name TEXT NOT NULL,
    company_name TEXT NOT NULL,
    prospect_role TEXT NOT NULL,
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
    next_step_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Table: call_stage_results
CREATE TABLE IF NOT EXISTS call_stage_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id UUID NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
    stage_number INTEGER NOT NULL CHECK (stage_number >= 1 AND stage_number <= 8),
    stage_outcome TEXT,
    prospect_words TEXT,
    additional_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_call_stage_result UNIQUE (call_id, stage_number)
);

-- 5. Performance and Query Indexes
CREATE INDEX IF NOT EXISTS idx_calls_started_at ON calls (started_at DESC);
CREATE INDEX IF NOT EXISTS idx_calls_status ON calls (status);
CREATE INDEX IF NOT EXISTS idx_calls_final_outcome ON calls (final_outcome);
CREATE INDEX IF NOT EXISTS idx_calls_furthest_stage ON calls (furthest_stage_reached);
CREATE INDEX IF NOT EXISTS idx_calls_prospect_name ON calls (prospect_name);
CREATE INDEX IF NOT EXISTS idx_calls_company_name ON calls (company_name);
CREATE INDEX IF NOT EXISTS idx_call_stage_results_call_id ON call_stage_results (call_id);
CREATE INDEX IF NOT EXISTS idx_call_stage_results_stage_number ON call_stage_results (stage_number);

-- 6. Attach automated updated_at triggers
DROP TRIGGER IF EXISTS trg_calls_updated_at ON calls;
CREATE TRIGGER trg_calls_updated_at
    BEFORE UPDATE ON calls
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_call_stage_results_updated_at ON call_stage_results;
CREATE TRIGGER trg_call_stage_results_updated_at
    BEFORE UPDATE ON call_stage_results
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

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
