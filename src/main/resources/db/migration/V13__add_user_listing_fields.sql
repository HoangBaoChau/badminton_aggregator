-- Thêm các trường hỗ trợ tính năng người dùng đăng bài bán hàng thủ công (User Listings)
ALTER TABLE deals
    ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    ADD COLUMN listing_type VARCHAR(20) DEFAULT 'crawled' NOT NULL,
    ADD COLUMN description TEXT,
    ADD COLUMN contact_info VARCHAR(255);

-- Sửa constraint external_url thành NULL vì bài thủ công không có external url
ALTER TABLE deals ALTER COLUMN external_url DROP NOT NULL;

-- Đánh index cho user_id để truy vấn bài đăng của mình nhanh hơn
CREATE INDEX idx_deals_user_id ON deals (user_id) WHERE user_id IS NOT NULL;
