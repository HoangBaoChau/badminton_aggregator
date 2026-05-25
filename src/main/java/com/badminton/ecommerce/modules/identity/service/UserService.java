package com.badminton.ecommerce.modules.identity.service;

import com.badminton.ecommerce.modules.identity.dto.request.ChangePasswordRequest;
import com.badminton.ecommerce.modules.identity.dto.request.CreateAddressRequest;
import com.badminton.ecommerce.modules.identity.dto.request.UpdateAddressRequest;
import com.badminton.ecommerce.modules.identity.dto.request.UpdateProfileRequest;
import com.badminton.ecommerce.modules.identity.dto.response.AddressResponse;
import com.badminton.ecommerce.modules.identity.dto.response.UserProfileResponse;

import java.util.UUID;

public interface UserService {
    UserProfileResponse getProfile(String email);
    UserProfileResponse updateProfile(String email, UpdateProfileRequest request);
    void changePassword(String email, ChangePasswordRequest request);
    AddressResponse createAddress(String email, CreateAddressRequest request);
    AddressResponse updateAddress(String email, UUID addressId, UpdateAddressRequest request);
    void deleteAddress(String email, UUID addressId);
    void setDefaultAddress(String email, UUID addressId);
}
