package com.badminton.ecommerce.modules.identity.dto.response;

import java.time.Instant;
import java.util.UUID;

public record AddressResponse(
        UUID id,
        String label,
        String streetLine1,
        String streetLine2,
        String ward,
        String district,
        String province,
        String countryCode,
        boolean isDefault,
        Instant createdAt
) {}
