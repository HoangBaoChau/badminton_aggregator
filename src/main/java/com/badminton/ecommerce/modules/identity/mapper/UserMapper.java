package com.badminton.ecommerce.modules.identity.mapper;

import com.badminton.ecommerce.modules.identity.dto.request.RegisterRequest;
import com.badminton.ecommerce.modules.identity.dto.request.UpdateProfileRequest;
import com.badminton.ecommerce.modules.identity.dto.response.UserProfileResponse;
import com.badminton.ecommerce.modules.identity.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring", uses = { AddressMapper.class })
public interface UserMapper {

    // --- Register: DTO -> Entity ---

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "password", ignore = true)
    @Mapping(target = "role", ignore = true)
    @Mapping(target = "active", ignore = true)
    @Mapping(target = "verificationToken", ignore = true)
    @Mapping(target = "emailVerifiedAt", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    @Mapping(target = "verificationExpiresAt", ignore = true)
    @Mapping(target = "resetPasswordToken", ignore = true)
    @Mapping(target = "resetPasswordExpiresAt", ignore = true)
    @Mapping(target = "addresses", ignore = true)
    User toEntity(RegisterRequest request);

    // --- Profile: Entity -> Response ---
    // MapStruct tự động dùng AddressMapper để map List<Address> ->
    // List<AddressResponse>

    @Mapping(source = "active", target = "active")
    UserProfileResponse toProfileResponse(User user);

    // --- Update Profile: DTO -> Entity (cập nhật trực tiếp lên entity hiện có) ---

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "email", ignore = true)
    @Mapping(target = "password", ignore = true)
    @Mapping(target = "role", ignore = true)
    @Mapping(target = "active", ignore = true)
    @Mapping(target = "verificationToken", ignore = true)
    @Mapping(target = "emailVerifiedAt", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    @Mapping(target = "verificationExpiresAt", ignore = true)
    @Mapping(target = "resetPasswordToken", ignore = true)
    @Mapping(target = "resetPasswordExpiresAt", ignore = true)
    @Mapping(target = "addresses", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "authorities", ignore = true)
    void updateProfile(UpdateProfileRequest request, @MappingTarget User user);
}
