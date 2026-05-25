package com.badminton.ecommerce.modules.identity.event;

import com.badminton.ecommerce.modules.identity.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class PasswordResetListener {

    private final JavaMailSender mailSender;

    @Async // Chạy ngầm, không bắt User phải đợi loading
    @EventListener
    public void handlePasswordReset(PasswordResetEvent event) {
        User user = event.getUser();
        String token = user.getResetPasswordToken();

        // Đường link để user click vào (Sau này ghép với Frontend)
        String resetUrl = "http://localhost:3000/reset-password?token=" + token;

        log.info("Đang gửi mail đặt lại mật khẩu tới {}...", user.getEmail());
        log.info("Link đặt lại mật khẩu (dùng để test Postman): {}", resetUrl);

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(user.getEmail());
            message.setSubject("Chou Badminton - Đặt lại mật khẩu");
            message.setText("Chào " + user.getFirstName() + ",\n\n" +
                    "Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.\n\n" +
                    "Vui lòng click vào đường link dưới đây để đặt lại mật khẩu:\n" +
                    resetUrl + "\n\n" +
                    "Link này sẽ hết hạn sau 15 phút.\n\n" +
                    "Nếu bạn không yêu cầu đổi mật khẩu, vui lòng bỏ qua email này.\n\n" +
                    "Trân trọng,\nChou Badminton");

            mailSender.send(message);
            log.info("Đã gửi mail đặt lại mật khẩu thành công!");
        } catch (Exception e) {
            log.error("Lỗi gửi mail đặt lại mật khẩu cho user {}: {}", user.getEmail(), e.getMessage());
        }
    }
}
