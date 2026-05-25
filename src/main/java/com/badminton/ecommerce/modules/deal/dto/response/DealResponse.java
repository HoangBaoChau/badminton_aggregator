package com.badminton.ecommerce.modules.deal.dto.response;

import lombok.Builder;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * DTO này được Backend trả về cho Frontend hiển thị lên Feed.
 */
@Builder
public record DealResponse(
        UUID id,
        String sourceName,    // Thay vì trả sourceId, ta trả hẳn tên nguồn (VD: "Vợt Cầu Lông Cũ HN")
        String externalUrl,   // Để Frontend gắn link chuyển hướng
        
        String productName,
        UUID brandId,
        UUID categoryId,
        BigDecimal price,
        BigDecimal originalPrice,
        String condition,
        String location,
        java.util.Map<String, Object> metadata,
        String transactionMethod,
        String sellerName,
        String thumbnailUrl,
        String aiSummary,     // Tóm tắt ngắn gọn hiển thị ngoài Feed
        List<String> tags,
        
        String status,
        Instant postedAt,
        Instant createdAt
) {
}
