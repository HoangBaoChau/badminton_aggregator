-- ============================================================
-- Migration: Thêm các bảng cho Deal Aggregator
-- Mục đích: Thu thập deals cầu lông từ FB groups và các nguồn khác
-- Chỉ THÊM MỚI, không sửa/xóa bảng cũ
-- ============================================================

-- -------------------------------------------------------
-- 1. deal_sources: Nguồn crawl data (FB groups, shops...)
-- -------------------------------------------------------
CREATE TABLE deal_sources (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(120)    NOT NULL,
    type            VARCHAR(30)     NOT NULL,
    url             TEXT            NOT NULL,
    crawl_frequency_minutes INT     DEFAULT 60,
    is_active       BOOLEAN         DEFAULT true NOT NULL,
    last_crawled_at TIMESTAMPTZ,
    created_at      TIMESTAMPTZ     DEFAULT now() NOT NULL,
    updated_at      TIMESTAMPTZ     DEFAULT now() NOT NULL,

    CONSTRAINT deal_sources_type_check CHECK (
        type IN ('fb_group', 'shopee', 'lazada', 'tiki', 'vnb', 'website', 'other')
    )
);

COMMENT ON TABLE  deal_sources IS 'Nguồn dữ liệu để crawl deals (FB groups, sàn TMĐT, website...)';
COMMENT ON COLUMN deal_sources.type IS 'Loại nguồn: fb_group, shopee, lazada, tiki, vnb, website, other';
COMMENT ON COLUMN deal_sources.crawl_frequency_minutes IS 'Tần suất crawl (phút). Mặc định 60 phút';

-- -------------------------------------------------------
-- 2. deals: Bảng trung tâm - mỗi row là 1 deal
-- -------------------------------------------------------
CREATE TABLE deals (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id       UUID            REFERENCES deal_sources(id) ON DELETE SET NULL,
    external_id     VARCHAR(255),
    external_url    TEXT            NOT NULL,

    -- AI-extracted fields
    product_name    VARCHAR(255),
    brand_id        UUID            REFERENCES brands(id) ON DELETE SET NULL,
    category_id     UUID            REFERENCES categories(id) ON DELETE SET NULL,
    price           NUMERIC(12,0),
    original_price  NUMERIC(12,0),
    condition       VARCHAR(30),
    location        VARCHAR(255),

    -- Seller info
    seller_name     VARCHAR(120),

    -- Content
    thumbnail_url   TEXT,
    raw_text        TEXT,
    ai_summary      VARCHAR(500),
    tags            TEXT[],

    -- Status & timestamps
    status          VARCHAR(20)     DEFAULT 'active' NOT NULL,
    posted_at       TIMESTAMPTZ,
    created_at      TIMESTAMPTZ     DEFAULT now() NOT NULL,
    updated_at      TIMESTAMPTZ     DEFAULT now() NOT NULL,

    CONSTRAINT deals_condition_check CHECK (
        condition IS NULL OR condition IN ('new', 'like_new', '90_percent', '80_percent', 'used')
    ),
    CONSTRAINT deals_status_check CHECK (
        status IN ('active', 'sold', 'expired', 'spam', 'hidden')
    ),
    CONSTRAINT deals_price_check CHECK (price IS NULL OR price >= 0)
);

-- Unique constraint: không trùng bài từ cùng nguồn
CREATE UNIQUE INDEX uq_deals_source_external ON deals (source_id, external_id)
    WHERE external_id IS NOT NULL;

-- Index cho feed query (lọc + sắp xếp)
CREATE INDEX idx_deals_status_posted   ON deals (status, posted_at DESC);
CREATE INDEX idx_deals_brand           ON deals (brand_id)   WHERE brand_id IS NOT NULL;
CREATE INDEX idx_deals_category        ON deals (category_id) WHERE category_id IS NOT NULL;
CREATE INDEX idx_deals_price           ON deals (price)       WHERE price IS NOT NULL;
CREATE INDEX idx_deals_location        ON deals (location)    WHERE location IS NOT NULL;

-- Full-text search trên tên sản phẩm + raw text
CREATE INDEX idx_deals_fts ON deals
    USING GIN (to_tsvector('simple', COALESCE(product_name, '') || ' ' || COALESCE(raw_text, '')));

COMMENT ON TABLE  deals IS 'Deals cầu lông được thu thập từ các nguồn. Click vào sẽ redirect về external_url';
COMMENT ON COLUMN deals.external_id IS 'ID bài đăng gốc (FB post ID, Shopee item ID...) để deduplicate';
COMMENT ON COLUMN deals.external_url IS 'Link bài gốc - user click "Xem chi tiết" sẽ được redirect tới đây';
COMMENT ON COLUMN deals.thumbnail_url IS 'URL ảnh đầu tiên của bài đăng, dùng làm thumbnail trên feed';
COMMENT ON COLUMN deals.tags IS 'Tags do AI gán, VD: {yonex, 4u, chinh_hang, 2nd_hand}';

-- -------------------------------------------------------
-- 3. deal_alerts: User đặt thông báo khi có deal phù hợp
-- -------------------------------------------------------
CREATE TABLE deal_alerts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    keyword         VARCHAR(255),
    brand_id        UUID            REFERENCES brands(id) ON DELETE SET NULL,
    category_id     UUID            REFERENCES categories(id) ON DELETE SET NULL,
    max_price       NUMERIC(12,0),
    condition       VARCHAR(30),
    location        VARCHAR(255),
    notify_via      VARCHAR(20)     DEFAULT 'email' NOT NULL,
    is_active       BOOLEAN         DEFAULT true NOT NULL,
    last_notified_at TIMESTAMPTZ,
    created_at      TIMESTAMPTZ     DEFAULT now() NOT NULL,

    CONSTRAINT deal_alerts_notify_check CHECK (
        notify_via IN ('email', 'telegram', 'push')
    )
);

CREATE INDEX idx_deal_alerts_active ON deal_alerts (is_active) WHERE is_active = true;

COMMENT ON TABLE deal_alerts IS 'Cấu hình alert: khi có deal mới khớp điều kiện, gửi thông báo cho user';

-- -------------------------------------------------------
-- 4. crawl_logs: Log mỗi lần crawl để debug & monitor
-- -------------------------------------------------------
CREATE TABLE crawl_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id       UUID            REFERENCES deal_sources(id) ON DELETE SET NULL,
    status          VARCHAR(20)     NOT NULL,
    posts_found     INT             DEFAULT 0 NOT NULL,
    posts_new       INT             DEFAULT 0 NOT NULL,
    posts_duplicate INT             DEFAULT 0 NOT NULL,
    error_message   TEXT,
    duration_ms     INT,
    created_at      TIMESTAMPTZ     DEFAULT now() NOT NULL,

    CONSTRAINT crawl_logs_status_check CHECK (
        status IN ('success', 'failed', 'partial')
    )
);

CREATE INDEX idx_crawl_logs_source_time ON crawl_logs (source_id, created_at DESC);

COMMENT ON TABLE crawl_logs IS 'Log kết quả mỗi lần chạy crawler. Dùng để monitor pipeline';
