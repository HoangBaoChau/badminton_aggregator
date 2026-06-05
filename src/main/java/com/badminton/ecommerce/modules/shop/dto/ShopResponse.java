package com.badminton.ecommerce.modules.shop.dto;

import java.util.UUID;

public record ShopResponse(
        UUID id,
        String name,
        String brand,
        String address,
        String district,
        String city,
        Double latitude,
        Double longitude,
        String phone,
        String website,
        String description,
        String shopType,
        String status
) {
}
