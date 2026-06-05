package com.badminton.ecommerce.modules.deal.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Builder;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Builder
public record CreateUserListingRequest(
        @NotBlank(message = "Tên sản phẩm không được để trống")
        String productName,
        
        UUID brandId,
        UUID categoryId,
        BigDecimal price,
        String condition,
        String location,
        String transactionMethod,
        
        @NotBlank(message = "Mô tả không được để trống")
        String description,
        
        @NotBlank(message = "Thông tin liên hệ không được để trống")
        String contactInfo,
        
        String thumbnailUrl,
        List<String> tags
) {
}
