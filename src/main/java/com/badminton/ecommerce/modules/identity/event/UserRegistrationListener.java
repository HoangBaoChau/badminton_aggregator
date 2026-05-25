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
public class UserRegistrationListener {

    private final JavaMailSender mailSender;

    @Async // Chạy ngầm, không bắt User phải đợi loading
    @EventListener
    public void handleUserRegistration(UserRegistrationEvent event) {
        User user = event.getUser();
        String token = user.getVerificationToken();

        // Đường link để user click vào (Sau này ghép với Frontend)
        String confirmationUrl = "http://localhost:3000/verify-email?token=" + token;

        log.info(" Đang gửi mail xác nhận tới {}...", user.getEmail());
        log.info("Link kích hoạt (dùng để test Postman): {}", confirmationUrl);

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(user.getEmail());
            message.setSubject("Chou Badminton - Xác nhận đăng ký tài khoản");
            message.setText("Chào " + user.getFirstName() + ",\n\n" +
                    "Vui lòng click vào đường link dưới đây để xác nhận tài khoản của bạn:\n" +
                    confirmationUrl + "\n\n" +
                    "Cảm ơn bạn đã tham gia mua sắm tại Chou Badminton!");

            mailSender.send(message);
            log.info("Đã gửi mail thành công!");
        } catch (Exception e) {
            log.error(" Lỗi gửi mail cho user {}: {}", user.getEmail(), e.getMessage());
        }
    }
}