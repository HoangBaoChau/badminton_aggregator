-- ============================================================
-- Migration: Add token blacklist table
-- ============================================================

CREATE TABLE blacklisted_tokens (
    token           VARCHAR(500) PRIMARY KEY,
    expiry_date     TIMESTAMPTZ  NOT NULL,
    created_at      TIMESTAMPTZ  DEFAULT now() NOT NULL
);

CREATE INDEX idx_blacklisted_tokens_expiry ON blacklisted_tokens (expiry_date);
