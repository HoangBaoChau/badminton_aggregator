CREATE TABLE IF NOT EXISTS system_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value VARCHAR(1000) NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Thêm cấu hình mặc định cho CRAWLER_AUTO_RUN
INSERT INTO system_configs (config_key, config_value, description)
VALUES ('CRAWLER_AUTO_RUN', 'false', 'Tự động chạy crawler theo lịch')
ON CONFLICT (config_key) DO NOTHING;
