package com.badminton.ecommerce.modules.deal.service;

import com.badminton.ecommerce.modules.deal.dto.request.CreateDealRequest;
import com.badminton.ecommerce.modules.deal.dto.response.DealResponse;
import org.springframework.data.domain.Page;

import java.util.UUID;

public interface DealService {
    
    // Dành cho Crawler đẩy data vào
    DealResponse createDeal(CreateDealRequest request);

    // Dành cho Frontend lấy danh sách (Feed)
    Page<DealResponse> getDeals(int page, int size, String keyword, String status, UUID brandId, UUID categoryId);

    // Dành cho Admin đổi trạng thái (ví dụ: đánh dấu spam, ẩn)
    DealResponse updateDealStatus(UUID id, String status);
}
