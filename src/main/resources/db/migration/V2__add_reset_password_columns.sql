-- ============================================================
-- Migration: Thêm cột reset password vào bảng users
-- Dùng cho chức năng "Quên mật khẩu"
-- ============================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_expires_at TIMESTAMPTZ;
