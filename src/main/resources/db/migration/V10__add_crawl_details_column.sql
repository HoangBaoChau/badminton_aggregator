-- V10: Add crawl_details column to crawl_logs table for storing JSON deal data
ALTER TABLE crawl_logs ADD COLUMN IF NOT EXISTS crawl_details TEXT;

COMMENT ON COLUMN crawl_logs.crawl_details IS 'JSON array of deal payloads pushed to DB during this crawl session';
