-- ============================================================
-- Migration: Thêm bảng favorite_deals
-- Mục đích: Người dùng lưu/yêu thích bài đăng deal gom
-- ============================================================

CREATE TABLE favorite_deals (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    deal_id     UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at  TIMESTAMPTZ DEFAULT now() NOT NULL,

    CONSTRAINT uq_user_deal_favorite UNIQUE (user_id, deal_id)
);

CREATE INDEX idx_favorite_deals_user ON favorite_deals(user_id);
CREATE INDEX idx_favorite_deals_deal ON favorite_deals(deal_id);

CREATE TRIGGER trg_favorite_deals_updated_at
    BEFORE UPDATE ON favorite_deals
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE favorite_deals IS 'Danh sách bài đăng deal người dùng đã lưu/yêu thích';
