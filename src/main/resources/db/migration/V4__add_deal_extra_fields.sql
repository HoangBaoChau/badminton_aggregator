-- Thêm cột weight (trọng lượng) và transaction_method (phương thức giao dịch) vào bảng deals
ALTER TABLE deals 
ADD COLUMN weight VARCHAR(50),
ADD COLUMN transaction_method VARCHAR(100);
