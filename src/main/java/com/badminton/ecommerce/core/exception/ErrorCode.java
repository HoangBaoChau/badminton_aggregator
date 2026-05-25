package com.badminton.ecommerce.core.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {
    EMAIL_ALREADY_EXISTS("Email này đã được sử dụng!", HttpStatus.BAD_REQUEST),
    INVALID_TOKEN("Mã xác thực không hợp lệ hoặc không tồn tại!", HttpStatus.BAD_REQUEST), // Thêm dòng này
    TOKEN_EXPIRED("Mã xác thực đã hết hạn! Vui lòng yêu cầu gửi lại.", HttpStatus.GONE),  // Thêm dòng này
    RESET_TOKEN_INVALID("Link đặt lại mật khẩu không hợp lệ hoặc đã được sử dụng!", HttpStatus.BAD_REQUEST),
    RESET_TOKEN_EXPIRED("Link đặt lại mật khẩu đã hết hạn! Vui lòng yêu cầu gửi lại.", HttpStatus.GONE),
    USER_NOT_FOUND("Không tìm thấy người dùng!", HttpStatus.NOT_FOUND),
    DEAL_SOURCE_NOT_FOUND("Không tìm thấy nguồn dữ liệu!", HttpStatus.NOT_FOUND),
    DEAL_NOT_FOUND("Không tìm thấy bài viết deal!", HttpStatus.NOT_FOUND),
    DEAL_DUPLICATE("Bài viết deal này đã tồn tại trong hệ thống!", HttpStatus.CONFLICT),
    INCORRECT_PASSWORD("Mật khẩu hiện tại không đúng!", HttpStatus.BAD_REQUEST),
    ADDRESS_NOT_FOUND("Không tìm thấy địa chỉ!", HttpStatus.NOT_FOUND),
    UNAUTHENTICATED("Chưa xác thực hoặc token không hợp lệ!", HttpStatus.UNAUTHORIZED),
    UNCATEGORIZED_EXCEPTION("Lỗi hệ thống không xác định!", HttpStatus.INTERNAL_SERVER_ERROR);

    private final String message;
    private final HttpStatus httpStatus;
}