-- ============================================================
-- Migration: Xóa check constraint của cột role
-- Mục đích: Cho phép role có thể là ADMIN, tránh lỗi violatoins check constraint
-- ============================================================

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
