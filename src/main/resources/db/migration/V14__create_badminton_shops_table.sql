CREATE TABLE badminton_shops (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255) NOT NULL,
    brand       VARCHAR(100),
    address     TEXT NOT NULL,
    district    VARCHAR(100),
    city        VARCHAR(100) DEFAULT 'Hà Nội',
    latitude    DOUBLE PRECISION NOT NULL,
    longitude   DOUBLE PRECISION NOT NULL,
    phone       VARCHAR(50),
    website     VARCHAR(255),
    description TEXT,
    shop_type   VARCHAR(50) DEFAULT 'shop',
    status      VARCHAR(20) DEFAULT 'active',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_shops_city ON badminton_shops(city);
CREATE INDEX idx_shops_district ON badminton_shops(district);
CREATE INDEX idx_shops_brand ON badminton_shops(brand);
CREATE INDEX idx_shops_status ON badminton_shops(status);
