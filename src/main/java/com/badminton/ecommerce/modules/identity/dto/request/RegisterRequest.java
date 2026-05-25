package com.badminton.ecommerce.modules.identity.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(

        @NotBlank(message = "Họ (First Name) không được để trống")
        String firstName,

        @NotBlank(message = "Tên (Last Name) không được để trống")
        String lastName,

        @NotBlank(message = "Email không được để trống")
        @Email(message = "Email không đúng định dạng")
        String email,

        @NotBlank(message = "Mật khẩu không được để trống")
        @Size(min = 6, message = "Mật khẩu phải dài ít nhất 6 ký tự")
        String password,

        // Số điện thoại có thể không bắt buộc tùy nghiệp vụ, nên không dùng @NotBlank
        String phone
) {}