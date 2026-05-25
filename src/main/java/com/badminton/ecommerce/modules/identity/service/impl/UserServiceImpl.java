package com.badminton.ecommerce.modules.identity.service.impl;

import com.badminton.ecommerce.core.exception.AppException;
import com.badminton.ecommerce.core.exception.ErrorCode;
import com.badminton.ecommerce.modules.identity.dto.request.ChangePasswordRequest;
import com.badminton.ecommerce.modules.identity.dto.request.CreateAddressRequest;
import com.badminton.ecommerce.modules.identity.dto.request.UpdateAddressRequest;
import com.badminton.ecommerce.modules.identity.dto.request.UpdateProfileRequest;
import com.badminton.ecommerce.modules.identity.dto.response.AddressResponse;
import com.badminton.ecommerce.modules.identity.dto.response.UserProfileResponse;
import com.badminton.ecommerce.modules.identity.entity.Address;
import com.badminton.ecommerce.modules.identity.entity.User;
import com.badminton.ecommerce.modules.identity.mapper.AddressMapper;
import com.badminton.ecommerce.modules.identity.mapper.UserMapper;
import com.badminton.ecommerce.modules.identity.repository.AddressRepository;
import com.badminton.ecommerce.modules.identity.repository.UserRepository;
import com.badminton.ecommerce.modules.identity.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final AddressRepository addressRepository;
    private final UserMapper userMapper;
    private final AddressMapper addressMapper;
    private final PasswordEncoder passwordEncoder;

    // ========================= PROFILE =========================

    @Override
    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(String email) {
        User user = findUserByEmail(email);

        // Lấy danh sách địa chỉ riêng (tránh N+1 query với lazy loading)
        List<Address> addresses = addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(user.getId());

        // Map thủ công addresses vào response vì ta fetch riêng, không qua OneToMany lazy
        UserProfileResponse profile = userMapper.toProfileResponse(user);

        // Ghi đè addresses bằng list đã fetch sẵn
        return new UserProfileResponse(
                profile.id(),
                profile.firstName(),
                profile.lastName(),
                profile.email(),
                profile.phone(),
                profile.role(),
                profile.active(),
                profile.emailVerifiedAt(),
                profile.createdAt(),
                addressMapper.toResponseList(addresses)
        );
    }

    @Override
    @Transactional
    public UserProfileResponse updateProfile(String email, UpdateProfileRequest request) {
        User user = findUserByEmail(email);

        // MapStruct cập nhật trực tiếp lên entity, chỉ sửa firstName, lastName, phone
        userMapper.updateProfile(request, user);
        userRepository.save(user);

        log.info("Đã cập nhật profile cho user: {}", email);
        return getProfile(email);
    }

    @Override
    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {
        User user = findUserByEmail(email);

        // 1. Kiểm tra mật khẩu hiện tại có đúng không
        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new AppException(ErrorCode.INCORRECT_PASSWORD);
        }

        // 2. Cập nhật mật khẩu mới (hash bằng BCrypt)
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        log.info("Đã đổi mật khẩu thành công cho user: {}", email);
    }

    // ========================= ADDRESS =========================

    @Override
    @Transactional
    public AddressResponse createAddress(String email, CreateAddressRequest request) {
        User user = findUserByEmail(email);

        // 1. Map DTO -> Entity
        Address address = addressMapper.toEntity(request);
        address.setUser(user);

        // 2. Nếu đây là địa chỉ đầu tiên -> tự động set làm mặc định
        long addressCount = addressRepository.countByUserId(user.getId());
        if (addressCount == 0) {
            address.setDefault(true);
        }

        // 3. Nếu request yêu cầu set mặc định -> xóa mặc định cũ
        if (request.isDefault() && addressCount > 0) {
            addressRepository.clearDefaultByUserId(user.getId());
        }

        // 4. Lưu vào Database
        addressRepository.save(address);

        log.info("Đã tạo địa chỉ mới cho user: {}", email);
        return addressMapper.toResponse(address);
    }

    @Override
    @Transactional
    public AddressResponse updateAddress(String email, UUID addressId, UpdateAddressRequest request) {
        User user = findUserByEmail(email);

        // 1. Tìm địa chỉ theo ID + User ID (đảm bảo user chỉ sửa được địa chỉ của chính mình)
        Address address = addressRepository.findByIdAndUserId(addressId, user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.ADDRESS_NOT_FOUND));

        // 2. Nếu request yêu cầu set mặc định -> xóa mặc định cũ
        if (request.isDefault() && !address.isDefault()) {
            addressRepository.clearDefaultByUserId(user.getId());
        }

        // 3. MapStruct cập nhật trực tiếp lên entity
        addressMapper.updateEntity(request, address);
        addressRepository.save(address);

        log.info("Đã cập nhật địa chỉ {} cho user: {}", addressId, email);
        return addressMapper.toResponse(address);
    }

    @Override
    @Transactional
    public void deleteAddress(String email, UUID addressId) {
        User user = findUserByEmail(email);

        Address address = addressRepository.findByIdAndUserId(addressId, user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.ADDRESS_NOT_FOUND));

        addressRepository.delete(address);

        log.info("Đã xóa địa chỉ {} cho user: {}", addressId, email);
    }

    @Override
    @Transactional
    public void setDefaultAddress(String email, UUID addressId) {
        User user = findUserByEmail(email);

        Address address = addressRepository.findByIdAndUserId(addressId, user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.ADDRESS_NOT_FOUND));

        // 1. Xóa mặc định cũ
        addressRepository.clearDefaultByUserId(user.getId());

        // 2. Set mặc định mới
        address.setDefault(true);
        addressRepository.save(address);

        log.info("Đã đặt địa chỉ {} làm mặc định cho user: {}", addressId, email);
    }

    // ========================= HELPER =========================

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }
}
