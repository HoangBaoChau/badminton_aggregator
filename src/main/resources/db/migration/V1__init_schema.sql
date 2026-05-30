-- =============================================================================
--  BADMINTON E-COMMERCE — DATABASE SCHEMA v2
--  PostgreSQL 15+
--
--  Thay đổi so với v1 (sau Architecture Review Board):
--  [1] Soft Delete: thêm deleted_at vào mọi bảng chính
--  [2] product_attributes (EAV) → specifications JSONB + GIN index
--  [3] flex / weight_class tách thành cột riêng với B-Tree index
--  [4] Shopify Variant Model: product_options + option_values + variant_option_values
--  [5] available_stock / reserved_stock thay thế stock_quantity đơn lẻ
--  [6] customizations JSONB trong cart_items + order_items (nghiệp vụ đan vợt)
-- =============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- trigram search trên name/slug

-- Utility: auto-update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- =============================================================================
--  DOMAIN 1 — NGƯỜI DÙNG (users, addresses)
-- =============================================================================

CREATE TABLE users (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name          VARCHAR(80)  NOT NULL,
    last_name           VARCHAR(80)  NOT NULL,
    email               VARCHAR(255) NOT NULL,
    phone               VARCHAR(20),
    password_hash       TEXT         NOT NULL,
    is_active           BOOLEAN      NOT NULL DEFAULT TRUE,
    email_verified_at   TIMESTAMPTZ,
    -- [1] Soft delete
    deleted_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT uq_users_email UNIQUE (email)
);

CREATE INDEX idx_users_last_name  ON users (last_name);
CREATE INDEX idx_users_first_name ON users (first_name);
CREATE INDEX idx_users_deleted    ON users (deleted_at) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE addresses (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    label           VARCHAR(60),                    -- "Nhà", "Công ty"
    street_line1    VARCHAR(255) NOT NULL,
    street_line2    VARCHAR(255),
    ward            VARCHAR(100),                   -- Phường / Xã
    district        VARCHAR(100) NOT NULL,          -- Quận / Huyện
    province        VARCHAR(100) NOT NULL,          -- Tỉnh / Thành phố
    country_code    CHAR(2)      NOT NULL DEFAULT 'VN',
    is_default      BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_addresses_user     ON addresses (user_id);
CREATE INDEX idx_addresses_province ON addresses (province, district);

-- =============================================================================
--  DOMAIN 2 — SẢN PHẨM (brands, categories, products, variants…)
-- =============================================================================

CREATE TABLE brands (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(120) NOT NULL,
    slug                VARCHAR(120) NOT NULL,
    country_of_origin   VARCHAR(80),
    description         TEXT,
    logo_url            TEXT,
    -- [1] Soft delete
    deleted_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_brands_name UNIQUE (name),
    CONSTRAINT uq_brands_slug UNIQUE (slug)
);

CREATE TRIGGER trg_brands_updated_at
    BEFORE UPDATE ON brands
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE categories (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id   UUID        REFERENCES categories (id) ON DELETE SET NULL,
    name        VARCHAR(120) NOT NULL,
    slug        VARCHAR(120) NOT NULL,
    sort_order  SMALLINT    NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_categories_slug UNIQUE (slug)
);

CREATE INDEX idx_categories_parent ON categories (parent_id);

-- ──────────────────────────────────────────────────────────────────────────────
-- [2][3] Products: specifications JSONB + flex/weight_class cột riêng

CREATE TABLE products (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id        UUID        NOT NULL REFERENCES brands (id),
    category_id     UUID        NOT NULL REFERENCES categories (id),
    name            VARCHAR(255) NOT NULL,
    slug            VARCHAR(255) NOT NULL,
    description     TEXT,
    -- [3] Cột riêng cho các thuộc tính FILTER thường xuyên → B-Tree index
    skill_level     VARCHAR(20)  CHECK (skill_level IN ('beginner','intermediate','advanced','professional')),
    flex            VARCHAR(20)  CHECK (flex IN ('extra-stiff','stiff','medium','flexible','extra-flexible')),
    weight_class    VARCHAR(10)  CHECK (weight_class IN ('2U','3U','4U','5U','6U')),
    -- [2] Thay thế bảng product_attributes (EAV anti-pattern)
    --     Lưu thông số hiển thị: công nghệ, vật liệu, điểm cân bằng marketing, v.v.
    --     Không cần filter → JSONB + GIN index là tối ưu
    specifications  JSONB        NOT NULL DEFAULT '{}',
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    -- [1] Soft delete
    deleted_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT uq_products_slug UNIQUE (slug)
);

-- B-Tree cho filter thường xuyên
CREATE INDEX idx_products_brand        ON products (brand_id)      WHERE deleted_at IS NULL;
CREATE INDEX idx_products_category     ON products (category_id)   WHERE deleted_at IS NULL;
CREATE INDEX idx_products_flex         ON products (flex)           WHERE deleted_at IS NULL;
CREATE INDEX idx_products_weight_class ON products (weight_class)   WHERE deleted_at IS NULL;
CREATE INDEX idx_products_skill_level  ON products (skill_level)    WHERE deleted_at IS NULL;
-- Composite index cho filter kết hợp phổ biến
CREATE INDEX idx_products_cat_flex     ON products (category_id, flex, weight_class) WHERE deleted_at IS NULL;
-- GIN cho specifications JSONB (dùng khi cần filter theo công nghệ, v.v.)
CREATE INDEX idx_products_specs_gin    ON products USING GIN (specifications);
-- Trigram search trên name
CREATE INDEX idx_products_name_trgm    ON products USING GIN (name gin_trgm_ops);

CREATE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ──────────────────────────────────────────────────────────────────────────────
-- [4] Shopify Variant Model — product_options & option_values

CREATE TABLE product_options (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id  UUID        NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    name        VARCHAR(80)  NOT NULL,   -- "Màu sắc", "Kích cỡ", "Độ căng"
    position    SMALLINT    NOT NULL DEFAULT 1,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_product_options UNIQUE (product_id, name)
);

CREATE INDEX idx_product_options_product ON product_options (product_id);

-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE option_values (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    option_id   UUID        NOT NULL REFERENCES product_options (id) ON DELETE CASCADE,
    value       VARCHAR(100) NOT NULL,   -- "Đỏ", "4U", "11kg"
    position    SMALLINT    NOT NULL DEFAULT 1,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_option_values UNIQUE (option_id, value)
);

CREATE INDEX idx_option_values_option ON option_values (option_id);

-- ──────────────────────────────────────────────────────────────────────────────
-- [4][5] product_variants: options JSONB + stock tách đôi

CREATE TABLE product_variants (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id       UUID        NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    sku              VARCHAR(100) NOT NULL,
    -- [4] Snapshot nhanh của combination để hiển thị (không dùng để filter/constraint)
    --     Referential integrity được đảm bảo bởi variant_option_values
    options          JSONB        NOT NULL DEFAULT '{}',
    price            NUMERIC(12,0) NOT NULL CHECK (price >= 0),    -- VND, không cần decimal
    sale_price       NUMERIC(12,0)           CHECK (sale_price >= 0),
    -- [5] Tách stock để xử lý oversell / Flash Sale
    available_stock  INTEGER      NOT NULL DEFAULT 0 CHECK (available_stock >= 0),
    reserved_stock   INTEGER      NOT NULL DEFAULT 0 CHECK (reserved_stock >= 0),
    image_url        TEXT,
    -- [1] Soft delete
    deleted_at       TIMESTAMPTZ,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT uq_variants_sku UNIQUE (sku)
);

CREATE INDEX idx_variants_product ON product_variants (product_id) WHERE deleted_at IS NULL;
-- Computed index: lấy nhanh variant còn hàng
CREATE INDEX idx_variants_in_stock ON product_variants (product_id, available_stock)
    WHERE deleted_at IS NULL AND available_stock > 0;

CREATE TRIGGER trg_variants_updated_at
    BEFORE UPDATE ON product_variants
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ──────────────────────────────────────────────────────────────────────────────
-- [4] Bảng mapping N-N giữa variant và option_values (Referential Integrity)

CREATE TABLE variant_option_values (
    variant_id      UUID NOT NULL REFERENCES product_variants (id) ON DELETE CASCADE,
    option_value_id UUID NOT NULL REFERENCES option_values (id) ON DELETE RESTRICT,

    PRIMARY KEY (variant_id, option_value_id)
);

CREATE INDEX idx_vov_option_value ON variant_option_values (option_value_id);

-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE product_images (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id  UUID        NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    url         TEXT        NOT NULL,
    alt_text    VARCHAR(255),
    is_primary  BOOLEAN     NOT NULL DEFAULT FALSE,
    sort_order  SMALLINT    NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_images_product ON product_images (product_id);

-- =============================================================================
--  DOMAIN 3 — GIỎ HÀNG & ĐƠN HÀNG
-- =============================================================================

CREATE TABLE carts (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        REFERENCES users (id) ON DELETE SET NULL,
    session_id  VARCHAR(100),   -- cho guest checkout
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_carts_user    ON carts (user_id);
CREATE INDEX idx_carts_session ON carts (session_id);

-- ──────────────────────────────────────────────────────────────────────────────
-- [6] cart_items: thêm customizations JSONB cho nghiệp vụ đan vợt

CREATE TABLE cart_items (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id         UUID        NOT NULL REFERENCES carts (id) ON DELETE CASCADE,
    variant_id      UUID        NOT NULL REFERENCES product_variants (id),
    quantity        SMALLINT    NOT NULL DEFAULT 1 CHECK (quantity > 0),
    price_snapshot  NUMERIC(12,0) NOT NULL,
    -- [6] Cấu hình đan vợt do khách chọn
    --     Ví dụ: {"stringing": {"tension_kg": 11.5, "string_model": "BG65", "knots": 4}}
    customizations  JSONB       NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_cart_variant UNIQUE (cart_id, variant_id)
);

CREATE INDEX idx_cart_items_cart    ON cart_items (cart_id);
CREATE INDEX idx_cart_items_variant ON cart_items (variant_id);

-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE discounts (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    code              VARCHAR(50)  NOT NULL,
    type              VARCHAR(20)  NOT NULL CHECK (type IN ('percentage','fixed','free_shipping')),
    value             NUMERIC(10,2) NOT NULL CHECK (value >= 0),
    min_order_amount  NUMERIC(12,0) NOT NULL DEFAULT 0,
    max_uses          INTEGER,
    used_count        INTEGER      NOT NULL DEFAULT 0,
    starts_at         TIMESTAMPTZ  NOT NULL DEFAULT now(),
    expires_at        TIMESTAMPTZ,
    is_active         BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT uq_discounts_code UNIQUE (code)
);

CREATE INDEX idx_discounts_active ON discounts (code, is_active) WHERE is_active = TRUE;

-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE orders (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID        REFERENCES users (id) ON DELETE SET NULL,
    shipping_address_id UUID        REFERENCES addresses (id) ON DELETE SET NULL,
    order_number        VARCHAR(30)  NOT NULL,
    status              VARCHAR(30)  NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending','confirmed','processing','shipped','delivered','cancelled','refunded')),
    subtotal            NUMERIC(12,0) NOT NULL,
    shipping_fee        NUMERIC(12,0) NOT NULL DEFAULT 0,
    discount_amount     NUMERIC(12,0) NOT NULL DEFAULT 0,
    tax_amount          NUMERIC(12,0) NOT NULL DEFAULT 0,
    total_amount        NUMERIC(12,0) NOT NULL,
    payment_status      VARCHAR(20)  NOT NULL DEFAULT 'unpaid'
                            CHECK (payment_status IN ('unpaid','pending','paid','partially_refunded','refunded')),
    payment_method      VARCHAR(30),
    notes               TEXT,
    placed_at           TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT uq_orders_number UNIQUE (order_number)
);

CREATE INDEX idx_orders_user       ON orders (user_id);
CREATE INDEX idx_orders_status     ON orders (status, placed_at DESC);
CREATE INDEX idx_orders_payment    ON orders (payment_status);

CREATE TRIGGER trg_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ──────────────────────────────────────────────────────────────────────────────
-- [6] order_items: customizations snapshot

CREATE TABLE order_items (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID        NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
    variant_id      UUID        REFERENCES product_variants (id) ON DELETE SET NULL,
    -- Snapshot tại thời điểm đặt hàng — bảo vệ lịch sử
    product_name    VARCHAR(255) NOT NULL,
    variant_label   VARCHAR(255),
    quantity        SMALLINT    NOT NULL CHECK (quantity > 0),
    unit_price      NUMERIC(12,0) NOT NULL,
    subtotal        NUMERIC(12,0) NOT NULL,
    -- [6] Snapshot cấu hình đan vợt
    customizations  JSONB       NOT NULL DEFAULT '{}'
);

CREATE INDEX idx_order_items_order   ON order_items (order_id);
CREATE INDEX idx_order_items_variant ON order_items (variant_id);

-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE order_discounts (
    order_id        UUID NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
    discount_id     UUID NOT NULL REFERENCES discounts (id),
    applied_amount  NUMERIC(12,0) NOT NULL,

    PRIMARY KEY (order_id, discount_id)
);

-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE reviews (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id              UUID        NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    user_id                 UUID        REFERENCES users (id) ON DELETE SET NULL,
    order_item_id           UUID        REFERENCES order_items (id) ON DELETE SET NULL,
    rating                  SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
    body                    TEXT,
    is_verified_purchase    BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reviews_product ON reviews (product_id);
CREATE INDEX idx_reviews_user    ON reviews (user_id);

-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE wishlists (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    variant_id  UUID        NOT NULL REFERENCES product_variants (id) ON DELETE CASCADE,
    added_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_wishlist UNIQUE (user_id, variant_id)
);

CREATE INDEX idx_wishlists_user ON wishlists (user_id);

-- =============================================================================
--  DOMAIN 4 — THANH TOÁN (payment_transactions, refunds, saved methods)
-- =============================================================================

CREATE TABLE payment_transactions (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id          UUID        NOT NULL REFERENCES orders (id),
    gateway           VARCHAR(30)  NOT NULL CHECK (gateway IN ('vnpay','momo','zalopay','cod','bank_transfer','card')),
    gateway_txn_id    VARCHAR(100),
    method            VARCHAR(30),
    amount            NUMERIC(12,0) NOT NULL,
    currency          CHAR(3)      NOT NULL DEFAULT 'VND',
    status            VARCHAR(20)  NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending','success','failed','cancelled','expired')),
    -- Raw response từ gateway — tuyệt đối không mất dữ liệu này
    gateway_response  JSONB        NOT NULL DEFAULT '{}',
    initiated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    completed_at      TIMESTAMPTZ,

    CONSTRAINT uq_payment_gateway_txn UNIQUE (gateway, gateway_txn_id)
);

CREATE INDEX idx_payment_txn_order  ON payment_transactions (order_id);
CREATE INDEX idx_payment_txn_status ON payment_transactions (status, initiated_at DESC);

-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE payment_methods_saved (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    gateway         VARCHAR(30)  NOT NULL,
    type            VARCHAR(20)  NOT NULL CHECK (type IN ('card','wallet','bank_account')),
    last4           CHAR(4),
    brand           VARCHAR(20),
    expiry_month    CHAR(2),
    expiry_year     CHAR(4),
    -- Token từ gateway — KHÔNG lưu số thẻ thật
    gateway_token   TEXT         NOT NULL,
    is_default      BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_saved_methods_user ON payment_methods_saved (user_id);

-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE refunds (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id      UUID        NOT NULL REFERENCES payment_transactions (id),
    initiated_by        UUID        REFERENCES users (id) ON DELETE SET NULL,
    amount              NUMERIC(12,0) NOT NULL CHECK (amount > 0),
    reason              VARCHAR(255),
    status              VARCHAR(20)  NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending','approved','processing','completed','rejected')),
    gateway_refund_id   VARCHAR(100),
    requested_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    completed_at        TIMESTAMPTZ
);

CREATE INDEX idx_refunds_transaction ON refunds (transaction_id);

-- =============================================================================
--  DOMAIN 5 — VẬN CHUYỂN (carriers, methods, rates, shipments, events)
-- =============================================================================

CREATE TABLE shipping_carriers (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    code            VARCHAR(20)  NOT NULL,
    name            VARCHAR(100) NOT NULL,
    api_endpoint    TEXT,
    -- API key đã mã hoá — không lưu plain text
    api_key_enc     TEXT,
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT uq_carriers_code UNIQUE (code)
);

-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE shipping_methods (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    carrier_id          UUID        NOT NULL REFERENCES shipping_carriers (id),
    name                VARCHAR(100) NOT NULL,
    service_code        VARCHAR(50),
    estimated_days_min  SMALLINT    NOT NULL DEFAULT 1,
    estimated_days_max  SMALLINT    NOT NULL DEFAULT 5,
    is_active           BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_shipping_methods_carrier ON shipping_methods (carrier_id);

-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE shipping_rates (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    method_id           UUID        NOT NULL REFERENCES shipping_methods (id) ON DELETE CASCADE,
    province_code       VARCHAR(10),        -- NULL = áp dụng toàn quốc
    min_weight_g        INTEGER     NOT NULL DEFAULT 0,
    max_weight_g        INTEGER,
    base_fee            NUMERIC(10,0) NOT NULL,
    per_kg_fee          NUMERIC(10,0) NOT NULL DEFAULT 0,
    free_above_order    NUMERIC(12,0),      -- miễn phí ship khi đơn >= giá trị này
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_shipping_rates_method   ON shipping_rates (method_id);
CREATE INDEX idx_shipping_rates_province ON shipping_rates (province_code);

-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE shipments (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id                UUID        NOT NULL REFERENCES orders (id),
    method_id               UUID        REFERENCES shipping_methods (id) ON DELETE SET NULL,
    tracking_number         VARCHAR(100),
    carrier_status          VARCHAR(100),
    internal_status         VARCHAR(30)  NOT NULL DEFAULT 'pending'
                                CHECK (internal_status IN ('pending','picked_up','in_transit','out_for_delivery','delivered','failed','returned')),
    weight_g                INTEGER,
    dimensions_cm           JSONB,              -- {"l":30,"w":20,"h":10}
    shipping_fee_charged    NUMERIC(10,0),
    shipped_at              TIMESTAMPTZ,
    delivered_at            TIMESTAMPTZ,
    estimated_delivery      TIMESTAMPTZ,
    created_at              TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT uq_shipments_tracking UNIQUE (tracking_number)
);

CREATE INDEX idx_shipments_order   ON shipments (order_id);
CREATE INDEX idx_shipments_status  ON shipments (internal_status);

CREATE TRIGGER trg_shipments_updated_at
    BEFORE UPDATE ON shipments
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE shipment_events (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id     UUID        NOT NULL REFERENCES shipments (id) ON DELETE CASCADE,
    location        VARCHAR(255),
    description     TEXT        NOT NULL,
    status_code     VARCHAR(50),
    occurred_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_shipment_events_shipment ON shipment_events (shipment_id, occurred_at DESC);

-- =============================================================================
--  DOMAIN 6 — LOYALTY & ĐIỂM THƯỞNG
-- =============================================================================

CREATE TABLE loyalty_tiers (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(50)  NOT NULL,
    min_lifetime_points INTEGER      NOT NULL DEFAULT 0,
    discount_pct        NUMERIC(5,2) NOT NULL DEFAULT 0,
    free_shipping_above NUMERIC(12,0),
    birthday_bonus_pct  SMALLINT    NOT NULL DEFAULT 0,
    points_multiplier   NUMERIC(4,2) NOT NULL DEFAULT 1.0,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT uq_loyalty_tiers_name UNIQUE (name)
);

-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE loyalty_accounts (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    points_balance    INTEGER     NOT NULL DEFAULT 0 CHECK (points_balance >= 0),
    points_lifetime   INTEGER     NOT NULL DEFAULT 0,
    tier_id           UUID        REFERENCES loyalty_tiers (id) ON DELETE SET NULL,
    tier_updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_loyalty_user UNIQUE (user_id)
);

CREATE INDEX idx_loyalty_accounts_tier ON loyalty_accounts (tier_id);

CREATE TRIGGER trg_loyalty_accounts_updated_at
    BEFORE UPDATE ON loyalty_accounts
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ──────────────────────────────────────────────────────────────────────────────
-- Sổ cái điểm — append-only, không bao giờ UPDATE

CREATE TABLE loyalty_transactions (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id      UUID        NOT NULL REFERENCES loyalty_accounts (id),
    order_id        UUID        REFERENCES orders (id) ON DELETE SET NULL,
    type            VARCHAR(20)  NOT NULL CHECK (type IN ('earn','redeem','expire','adjust','bonus')),
    points_delta    INTEGER     NOT NULL,        -- dương = cộng, âm = trừ
    balance_after   INTEGER     NOT NULL,
    description     VARCHAR(255),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_loyalty_txn_account ON loyalty_transactions (account_id, created_at DESC);
CREATE INDEX idx_loyalty_txn_order   ON loyalty_transactions (order_id);

-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE point_redemptions (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id          UUID        NOT NULL REFERENCES orders (id),
    account_id        UUID        NOT NULL REFERENCES loyalty_accounts (id),
    points_used       INTEGER     NOT NULL CHECK (points_used > 0),
    discount_applied  NUMERIC(12,0) NOT NULL,
    redeemed_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_point_redemptions_order   ON point_redemptions (order_id);
CREATE INDEX idx_point_redemptions_account ON point_redemptions (account_id);

-- =============================================================================
--  DOMAIN 7 — ADMIN, CMS & NOTIFICATIONS
-- =============================================================================

CREATE TABLE admin_users (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name      VARCHAR(80)  NOT NULL,
    last_name       VARCHAR(80)  NOT NULL,
    email           VARCHAR(255) NOT NULL,
    password_hash   TEXT        NOT NULL,
    is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
    last_login_at   TIMESTAMPTZ,
    -- [1] Soft delete
    deleted_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_admin_users_email UNIQUE (email)
);

CREATE TRIGGER trg_admin_users_updated_at
    BEFORE UPDATE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ──────────────────────────────────────────────────────────────────────────────
-- RBAC: roles → permissions

CREATE TABLE admin_roles (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(60)  NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_admin_roles_name UNIQUE (name)
);

CREATE TABLE admin_permissions (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    resource    VARCHAR(60)  NOT NULL,   -- "products", "orders", "users"
    action      VARCHAR(20)  NOT NULL,   -- "read", "create", "update", "delete"
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_admin_permission UNIQUE (resource, action)
);

CREATE TABLE admin_role_permissions (
    role_id         UUID NOT NULL REFERENCES admin_roles (id) ON DELETE CASCADE,
    permission_id   UUID NOT NULL REFERENCES admin_permissions (id) ON DELETE CASCADE,

    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE admin_user_roles (
    admin_user_id   UUID NOT NULL REFERENCES admin_users (id) ON DELETE CASCADE,
    role_id         UUID NOT NULL REFERENCES admin_roles (id) ON DELETE CASCADE,

    PRIMARY KEY (admin_user_id, role_id)
);

-- ──────────────────────────────────────────────────────────────────────────────
-- Audit log — append-only, không DELETE, không UPDATE

CREATE TABLE audit_logs (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id   UUID        REFERENCES admin_users (id) ON DELETE SET NULL,
    entity_type     VARCHAR(60)  NOT NULL,   -- "products", "orders", v.v.
    entity_id       UUID        NOT NULL,
    action          VARCHAR(20)  NOT NULL CHECK (action IN ('create','update','delete','restore')),
    before_state    JSONB,
    after_state     JSONB,
    ip_address      INET,
    user_agent      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_entity   ON audit_logs (entity_type, entity_id);
CREATE INDEX idx_audit_logs_admin    ON audit_logs (admin_user_id, created_at DESC);

-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE banners (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by  UUID        REFERENCES admin_users (id) ON DELETE SET NULL,
    title       VARCHAR(255) NOT NULL,
    image_url   TEXT        NOT NULL,
    link_url    TEXT,
    placement   VARCHAR(40)  NOT NULL CHECK (placement IN ('homepage_hero','homepage_mid','category_top','popup')),
    sort_order  SMALLINT    NOT NULL DEFAULT 0,
    is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
    starts_at   TIMESTAMPTZ,
    ends_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_banners_active ON banners (placement, is_active, sort_order) WHERE is_active = TRUE;

-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE blog_posts (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id       UUID        REFERENCES admin_users (id) ON DELETE SET NULL,
    title           VARCHAR(255) NOT NULL,
    slug            VARCHAR(255) NOT NULL,
    body_html       TEXT        NOT NULL,
    status          VARCHAR(20)  NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
    published_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_blog_posts_slug UNIQUE (slug)
);

CREATE INDEX idx_blog_posts_status ON blog_posts (status, published_at DESC);
CREATE INDEX idx_blog_posts_slug_trgm ON blog_posts USING GIN (slug gin_trgm_ops);

CREATE TRIGGER trg_blog_posts_updated_at
    BEFORE UPDATE ON blog_posts
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE notification_preferences (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    email_order_update  BOOLEAN     NOT NULL DEFAULT TRUE,
    email_promotion     BOOLEAN     NOT NULL DEFAULT FALSE,
    sms_order_update    BOOLEAN     NOT NULL DEFAULT TRUE,
    sms_promotion       BOOLEAN     NOT NULL DEFAULT FALSE,
    push_enabled        BOOLEAN     NOT NULL DEFAULT TRUE,
    zalo_enabled        BOOLEAN     NOT NULL DEFAULT FALSE,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_notif_prefs_user UNIQUE (user_id)
);

-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE notification_logs (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        REFERENCES users (id) ON DELETE SET NULL,
    channel         VARCHAR(20)  NOT NULL CHECK (channel IN ('email','sms','push','zalo')),
    type            VARCHAR(50)  NOT NULL,   -- "order_confirmed", "shipment_update", v.v.
    subject         VARCHAR(255),
    body_preview    TEXT,
    status          VARCHAR(20)  NOT NULL DEFAULT 'sent' CHECK (status IN ('sent','delivered','failed','bounced')),
    external_id     VARCHAR(100),
    metadata        JSONB        NOT NULL DEFAULT '{}',
    sent_at         TIMESTAMPTZ  NOT NULL DEFAULT now(),
    read_at         TIMESTAMPTZ
);

CREATE INDEX idx_notif_logs_user ON notification_logs (user_id, sent_at DESC);

-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE campaigns (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    type            VARCHAR(30)  NOT NULL CHECK (type IN ('email','sms','push','zalo')),
    target_segment  VARCHAR(100),
    channel         VARCHAR(20)  NOT NULL,
    content_template TEXT,
    status          VARCHAR(20)  NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','sending','sent','cancelled')),
    scheduled_at    TIMESTAMPTZ,
    sent_at         TIMESTAMPTZ,
    recipient_count INTEGER      NOT NULL DEFAULT 0,
    open_count      INTEGER      NOT NULL DEFAULT 0,
    click_count     INTEGER      NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE campaign_recipients (
    campaign_id UUID        NOT NULL REFERENCES campaigns (id) ON DELETE CASCADE,
    user_id     UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    status      VARCHAR(20)  NOT NULL DEFAULT 'pending',
    sent_at     TIMESTAMPTZ,
    opened_at   TIMESTAMPTZ,

    PRIMARY KEY (campaign_id, user_id)
);

CREATE INDEX idx_campaign_recipients_user ON campaign_recipients (user_id);

-- =============================================================================
--  INVENTORY LOCK — Tránh Oversell khi Flash Sale
--  Dùng SELECT ... FOR UPDATE SKIP LOCKED (Pessimistic Locking)
-- =============================================================================

-- Hàm trừ stock an toàn — gọi trong transaction của checkout
-- Trả về TRUE nếu thành công, FALSE nếu không đủ hàng
CREATE OR REPLACE FUNCTION reserve_stock(
    p_variant_id UUID,
    p_quantity   INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql AS $$
DECLARE
    v_avail INTEGER;
BEGIN
    -- Lock row để tránh race condition
    SELECT available_stock INTO v_avail
    FROM product_variants
    WHERE id = p_variant_id AND deleted_at IS NULL
    FOR UPDATE;

    IF v_avail IS NULL OR v_avail < p_quantity THEN
        RETURN FALSE;
    END IF;

    UPDATE product_variants SET
        available_stock = available_stock - p_quantity,
        reserved_stock  = reserved_stock  + p_quantity,
        updated_at      = now()
    WHERE id = p_variant_id;

    RETURN TRUE;
END;
$$;

-- Hàm giải phóng reserved stock (khi huỷ đơn / timeout thanh toán)
CREATE OR REPLACE FUNCTION release_stock(
    p_variant_id UUID,
    p_quantity   INTEGER
)
RETURNS VOID
LANGUAGE plpgsql AS $$
BEGIN
    UPDATE product_variants SET
        available_stock = available_stock + p_quantity,
        reserved_stock  = GREATEST(reserved_stock - p_quantity, 0),
        updated_at      = now()
    WHERE id = p_variant_id AND deleted_at IS NULL;
END;
$$;

-- Hàm xác nhận stock (khi payment thành công — trừ reserved thành đã bán)
CREATE OR REPLACE FUNCTION confirm_stock(
    p_variant_id UUID,
    p_quantity   INTEGER
)
RETURNS VOID
LANGUAGE plpgsql AS $$
BEGIN
    UPDATE product_variants SET
        reserved_stock = GREATEST(reserved_stock - p_quantity, 0),
        updated_at     = now()
    WHERE id = p_variant_id AND deleted_at IS NULL;
END;
$$;

-- =============================================================================
--  SEED DỮ LIỆU MẪU (tham khảo)
-- =============================================================================

-- Tiers loyalty
INSERT INTO loyalty_tiers (name, min_lifetime_points, discount_pct, points_multiplier, birthday_bonus_pct) VALUES
    ('Bạc',    0,     0,    1.0, 0),
    ('Vàng',   5000,  3,    1.5, 5),
    ('Bạch Kim',20000, 5,   2.0, 10),
    ('Kim Cương',50000,8,   3.0, 15);

-- Admin permissions mẫu
INSERT INTO admin_permissions (resource, action) VALUES
    ('products','read'),('products','create'),('products','update'),('products','delete'),
    ('orders','read'),('orders','update'),
    ('users','read'),('users','update'),
    ('inventory','read'),('inventory','update'),
    ('reports','read'),
    ('banners','read'),('banners','create'),('banners','update'),('banners','delete');

-- Carrier mẫu
INSERT INTO shipping_carriers (code, name, api_endpoint) VALUES
    ('GHN',   'Giao Hàng Nhanh',    'https://api.ghn.vn/home/prod/v2'),
    ('GHTK',  'Giao Hàng Tiết Kiệm','https://services.giaohangtietkiem.vn'),
    ('VTPOST','Viettel Post',         'https://partner.viettelpost.vn/v2');

-- =============================================================================
--  END OF SCHEMA v2
-- =============================================================================