-- Chuyển đổi từ cột weight cứng nhắc sang dạng JSONB linh hoạt
ALTER TABLE deals DROP COLUMN weight;
ALTER TABLE deals ADD COLUMN metadata JSONB;
