package com.badminton.ecommerce.modules.identity.dto.response;

import lombok.Builder;

// Vẫn có thể dùng @Builder với record để lúc tạo object dễ nhìn hơn
@Builder
public record AuthResponse(
        String accessToken,
        String refreshToken,
        String tokenType,   // Thường là "Bearer"
        String email,
        String fullName,
        String role
) {
    // Record cho phép set giá trị mặc định rất gọn gàng
    public AuthResponse {
        if (tokenType == null) tokenType = "Bearer";
    }
}