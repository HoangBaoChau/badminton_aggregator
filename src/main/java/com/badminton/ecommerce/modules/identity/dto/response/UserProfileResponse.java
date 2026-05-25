package com.badminton.ecommerce.modules.identity.dto.response;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record UserProfileResponse(
        UUID id,
        String firstName,
        String lastName,
        String email,
        String phone,
        String role,
        boolean active,
        Instant emailVerifiedAt,
        Instant createdAt,
        List<AddressResponse> addresses
) {}
