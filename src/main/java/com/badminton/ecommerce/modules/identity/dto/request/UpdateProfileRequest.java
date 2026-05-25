package com.badminton.ecommerce.modules.identity.dto.request;

import jakarta.validation.constraints.NotBlank;

public record UpdateProfileRequest(
        @NotBlank(message = "Họ không được để trống!")
        String firstName,

        @NotBlank(message = "Tên không được để trống!")
        String lastName,

        String phone
) {}
