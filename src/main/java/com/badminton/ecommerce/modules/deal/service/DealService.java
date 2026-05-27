package com.badminton.ecommerce.modules.deal.service;

import com.badminton.ecommerce.modules.deal.dto.request.CreateDealRequest;
import com.badminton.ecommerce.modules.deal.dto.response.DealResponse;
import org.springframework.data.domain.Page;

import java.math.BigDecimal;
import java.util.UUID;

public interface DealService {
    
    // Dành cho Crawler đẩy data vào
    DealResponse createDeal(CreateDealRequest request);

    // Dành cho Frontend lấy danh sách (Feed) - mở rộng thêm nhiều bộ lọc
    Page<DealResponse> getDeals(int page, int size, String keyword, String status,
                                 UUID brandId, UUID categoryId,
                                 String condition, String location,
                                 String transactionMethod,
                                 BigDecimal minPrice, BigDecimal maxPrice,
                                 String timeRange);

    // Dành cho Admin đổi trạng thái (ví dụ: đánh dấu spam, ẩn)
    DealResponse updateDealStatus(UUID id, String status);
}
