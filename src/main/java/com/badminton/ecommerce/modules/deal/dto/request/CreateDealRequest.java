package com.badminton.ecommerce.modules.deal.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * DTO này được dùng khi Crawler đẩy dữ liệu (POST) về cho Backend.
 */
@Builder
public record CreateDealRequest(
        @NotNull(message = "Source ID không được để trống")
        UUID sourceId,

        @NotBlank(message = "External ID (ID bài đăng gốc) không được để trống")
        String externalId,

        @NotBlank(message = "URL bài đăng gốc không được để trống")
        String externalUrl,

        String productName,
        UUID brandId,
        UUID categoryId,
        BigDecimal price,
        BigDecimal originalPrice,
        String condition, // 'new', 'like_new', 'used'...
        String location,
        java.util.Map<String, Object> metadata,
        String transactionMethod,
        String sellerName,
        String thumbnailUrl,
        String rawText,
        String aiSummary,
        List<String> tags,
        Instant postedAt
) {
}
