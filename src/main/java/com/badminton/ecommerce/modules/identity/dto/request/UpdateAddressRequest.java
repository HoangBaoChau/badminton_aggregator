package com.badminton.ecommerce.modules.identity.dto.request;

import jakarta.validation.constraints.NotBlank;

public record UpdateAddressRequest(
        String label,

        @NotBlank(message = "Địa chỉ dòng 1 không được để trống!")
        String streetLine1,

        String streetLine2,

        String ward,

        @NotBlank(message = "Quận/Huyện không được để trống!")
        String district,

        @NotBlank(message = "Tỉnh/Thành phố không được để trống!")
        String province,

        boolean isDefault
) {}
