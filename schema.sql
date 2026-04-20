-- Expense Tracker Schema
-- Run against your Supabase project via the SQL editor or psql.

CREATE TABLE IF NOT EXISTS expenses (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    amount           BIGINT      NOT NULL CHECK (amount > 0),
    category         TEXT        NOT NULL,
    description      TEXT,
    date             DATE        NOT NULL,
    idempotency_key  TEXT        UNIQUE,        -- NULL allowed; uniqueness enforced only when present
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_expenses_date     ON expenses (date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses (category);
