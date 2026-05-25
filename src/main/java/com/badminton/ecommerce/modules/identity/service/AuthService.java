package com.badminton.ecommerce.modules.identity.service;

import com.badminton.ecommerce.modules.identity.dto.request.ForgotPasswordRequest;
import com.badminton.ecommerce.modules.identity.dto.request.LoginRequest;
import com.badminton.ecommerce.modules.identity.dto.request.RegisterRequest;
import com.badminton.ecommerce.modules.identity.dto.request.ResetPasswordRequest;
import com.badminton.ecommerce.modules.identity.dto.response.AuthResponse;

public interface AuthService {
    AuthResponse login(LoginRequest request);
    void register(RegisterRequest request);
    void verifyEmail(String token);
    void forgotPassword(ForgotPasswordRequest request);
    void resetPassword(ResetPasswordRequest request);
    AuthResponse refreshToken(String refreshToken);
    void logout(String token);
}