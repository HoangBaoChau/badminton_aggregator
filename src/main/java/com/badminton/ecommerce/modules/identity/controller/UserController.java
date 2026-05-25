package com.badminton.ecommerce.modules.identity.controller;

import com.badminton.ecommerce.core.response.ApiResponse;
import com.badminton.ecommerce.modules.identity.dto.request.ChangePasswordRequest;
import com.badminton.ecommerce.modules.identity.dto.request.CreateAddressRequest;
import com.badminton.ecommerce.modules.identity.dto.request.UpdateAddressRequest;
import com.badminton.ecommerce.modules.identity.dto.request.UpdateProfileRequest;
import com.badminton.ecommerce.modules.identity.dto.response.AddressResponse;
import com.badminton.ecommerce.modules.identity.dto.response.UserProfileResponse;
import com.badminton.ecommerce.modules.identity.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // ========================= PROFILE =========================

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getProfile(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(
                userService.getProfile(userDetails.getUsername())));
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                userService.updateProfile(userDetails.getUsername(), request)));
    }

    @PostMapping("/me/change-password")
    public ResponseEntity<ApiResponse<String>> changePassword(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.success("Đổi mật khẩu thành công!"));
    }

    // ========================= ADDRESS =========================

    @PostMapping("/me/addresses")
    public ResponseEntity<ApiResponse<AddressResponse>> createAddress(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreateAddressRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                userService.createAddress(userDetails.getUsername(), request)));
    }

    @PutMapping("/me/addresses/{addressId}")
    public ResponseEntity<ApiResponse<AddressResponse>> updateAddress(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID addressId,
            @Valid @RequestBody UpdateAddressRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                userService.updateAddress(userDetails.getUsername(), addressId, request)));
    }

    @DeleteMapping("/me/addresses/{addressId}")
    public ResponseEntity<ApiResponse<String>> deleteAddress(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID addressId) {
        userService.deleteAddress(userDetails.getUsername(), addressId);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa địa chỉ thành công!"));
    }

    @PatchMapping("/me/addresses/{addressId}/default")
    public ResponseEntity<ApiResponse<String>> setDefaultAddress(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID addressId) {
        userService.setDefaultAddress(userDetails.getUsername(), addressId);
        return ResponseEntity.ok(ApiResponse.success("Đã đặt làm địa chỉ mặc định!"));
    }
}
