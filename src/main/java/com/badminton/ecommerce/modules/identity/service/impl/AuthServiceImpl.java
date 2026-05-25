package com.badminton.ecommerce.modules.identity.service.impl;

import com.badminton.ecommerce.core.exception.AppException;
import com.badminton.ecommerce.core.exception.ErrorCode;
import com.badminton.ecommerce.core.security.JwtUtils;
import com.badminton.ecommerce.core.security.TokenBlacklistService;
import com.badminton.ecommerce.modules.identity.dto.request.ForgotPasswordRequest;
import com.badminton.ecommerce.modules.identity.dto.request.LoginRequest;
import com.badminton.ecommerce.modules.identity.dto.request.RegisterRequest;
import com.badminton.ecommerce.modules.identity.dto.request.ResetPasswordRequest;
import com.badminton.ecommerce.modules.identity.dto.response.AuthResponse;
import com.badminton.ecommerce.modules.identity.entity.User;
import com.badminton.ecommerce.modules.identity.event.PasswordResetEvent;
import com.badminton.ecommerce.modules.identity.event.UserRegistrationEvent;
import com.badminton.ecommerce.modules.identity.mapper.UserMapper;
import com.badminton.ecommerce.modules.identity.repository.UserRepository;
import com.badminton.ecommerce.modules.identity.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final AuthenticationManager authenticationManager;
    private final UserMapper userMapper;
    private final ApplicationEventPublisher eventPublisher;
    private final TokenBlacklistService tokenBlacklistService;

    @Override
    @Transactional
    public void register(RegisterRequest request) {
        // 1. Kiểm tra Email tồn tại chưa
        if (userRepository.existsByEmail(request.email())) {
            throw new AppException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }

        // 2. Map DTO -> Entity
        User user = userMapper.toEntity(request);

        // 3. Set các thông tin bảo mật
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setRole("CUSTOMER"); // Khớp với Database của bạn
        user.setActive(false);    // Khoá mõm, chờ bấm link mới mở
        user.setVerificationToken(UUID.randomUUID().toString());
        // Set hạn sử dụng là 15 phút tính từ bây giờ
        user.setVerificationExpiresAt(java.time.Instant.now().plus(15, java.time.temporal.ChronoUnit.MINUTES));

        // 4. Lưu vào Database
        userRepository.save(user);

        // 5. Ném sự kiện đi để Listener chạy ngầm gửi Mail
        eventPublisher.publishEvent(new UserRegistrationEvent(this, user));
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        // 1. Giao việc kiểm tra đúng/sai mật khẩu cho Spring Security làm
        // Nếu sai email hoặc pass, nó sẽ tự động ném ra Exception (BadCredentialsException)
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.email(),
                        request.password()
                )
        );

        // 2. Nếu chạy qua được dòng trên nghĩa là pass đúng. Ta lấy User từ DB lên.
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng!"));

        // 3. Nhờ JwtUtils tạo ra chuỗi Token
        String jwtToken = jwtUtils.generateToken(user);
        String refreshToken = jwtUtils.generateRefreshToken(user);

        // 4. Trả về cho Frontend
        return AuthResponse.builder()
                .accessToken(jwtToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .email(user.getEmail())
                .fullName(user.getFirstName() + " " + user.getLastName())
                // Lấy Role đầu tiên gán vào (hiện tại ta đang fix cứng ROLE_CUSTOMER ở Entity)
                .role(user.getAuthorities().iterator().next().getAuthority())
                .build();
    }

    @Override
    @Transactional
    public void verifyEmail(String token) {
        // 1. Tìm User dựa trên Token
        User user = userRepository.findByVerificationToken(token)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_TOKEN));

        // 2. Kiểm tra xem Token đã hết hạn chưa (15 phút)
        if (user.getVerificationExpiresAt().isBefore(java.time.Instant.now())) {
            throw new AppException(ErrorCode.TOKEN_EXPIRED);
        }

        // 3. Kích hoạt tài khoản
        user.setActive(true);
        user.setVerificationToken(null); // Xóa token để không dùng lại được lần 2
        user.setVerificationExpiresAt(null);
        user.setEmailVerifiedAt(java.time.Instant.now());

        userRepository.save(user);
    }

    @Override
    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        // 1. Tìm User theo email
        Optional<User> optionalUser = userRepository.findByEmail(request.email());

        // 2. Nếu email không tồn tại -> Vẫn trả về thành công (tránh lộ thông tin email có tồn tại hay không)
        if (optionalUser.isEmpty()) {
            log.warn("Yêu cầu đặt lại mật khẩu cho email không tồn tại: {}", request.email());
            return;
        }

        User user = optionalUser.get();

        // 3. Tạo reset token và set thời hạn 15 phút
        user.setResetPasswordToken(UUID.randomUUID().toString());
        user.setResetPasswordExpiresAt(Instant.now().plus(15, ChronoUnit.MINUTES));

        // 4. Lưu vào Database
        userRepository.save(user);

        // 5. Ném sự kiện đi để Listener chạy ngầm gửi Mail
        eventPublisher.publishEvent(new PasswordResetEvent(this, user));

        log.info("Đã tạo reset token cho user: {}", user.getEmail());
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        // 1. Tìm User dựa trên Reset Token
        User user = userRepository.findByResetPasswordToken(request.token())
                .orElseThrow(() -> new AppException(ErrorCode.RESET_TOKEN_INVALID));

        // 2. Kiểm tra xem Token đã hết hạn chưa (15 phút)
        if (user.getResetPasswordExpiresAt().isBefore(Instant.now())) {
            throw new AppException(ErrorCode.RESET_TOKEN_EXPIRED);
        }

        // 3. Cập nhật mật khẩu mới (hash bằng BCrypt)
        user.setPassword(passwordEncoder.encode(request.newPassword()));

        // 4. Xóa reset token để không dùng lại được lần 2
        user.setResetPasswordToken(null);
        user.setResetPasswordExpiresAt(null);

        // 5. Lưu vào Database
        userRepository.save(user);

        log.info("Đã đổi mật khẩu thành công cho user: {}", user.getEmail());
    }

    @Override
    public AuthResponse refreshToken(String refreshToken) {
        String userEmail = jwtUtils.extractUsername(refreshToken);
        
        if (userEmail != null) {
            User user = userRepository.findByEmail(userEmail)
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

            if (jwtUtils.isTokenValid(refreshToken, user)) {
                String accessToken = jwtUtils.generateToken(user);
                return AuthResponse.builder()
                        .accessToken(accessToken)
                        .refreshToken(refreshToken)
                        .tokenType("Bearer")
                        .email(user.getEmail())
                        .fullName(user.getFirstName() + " " + user.getLastName())
                        .role(user.getAuthorities().iterator().next().getAuthority())
                        .build();
            }
        }
        throw new AppException(ErrorCode.UNAUTHENTICATED);
    }

    @Override
    public void logout(String token) {
        try {
            java.util.Date expiration = jwtUtils.extractClaim(token, io.jsonwebtoken.Claims::getExpiration);
            tokenBlacklistService.blacklistToken(token, expiration.toInstant());
            log.info("Token blacklisted successfully on logout.");
        } catch (Exception e) {
            log.warn("Could not blacklist token or it is already expired/invalid: {}", e.getMessage());
        }
    }
}