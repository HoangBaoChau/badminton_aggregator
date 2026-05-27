-- ============================================================
-- Migration: Thêm max_scrolls vào deal_sources
-- ============================================================

ALTER TABLE deal_sources ADD COLUMN IF NOT EXISTS max_scrolls INT DEFAULT 5 NOT NULL;
