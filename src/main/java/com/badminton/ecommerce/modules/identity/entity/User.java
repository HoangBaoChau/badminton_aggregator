package com.badminton.ecommerce.modules.identity.entity;

import com.badminton.ecommerce.core.audit.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLRestriction;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@SQLRestriction("deleted_at IS NULL") // Tự động lọc bỏ các user đã bị xóa mềm
public class User extends BaseEntity implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "first_name", length = 80, nullable = false)
    private String firstName;

    @Column(name = "last_name", length = 80, nullable = false)
    private String lastName;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "password_hash", nullable = false)
    private String password;

    @Column(nullable = false)
    @Builder.Default
    private String role = "CUSTOMER";

    @Column(name = "is_active", nullable = false)
    private boolean active;

    @Column(name = "email_verified_at")
    private java.time.Instant emailVerifiedAt;

    @Column(name = "deleted_at")
    private java.time.Instant deletedAt;

    @Column(name = "verification_token")
    private String verificationToken;

    @Column(name = "verification_expires_at")
    private java.time.Instant verificationExpiresAt;

    @Column(name = "reset_password_token")
    private String resetPasswordToken;

    @Column(name = "reset_password_expires_at")
    private java.time.Instant resetPasswordExpiresAt;

    // --- LIÊN KẾT VỚI BẢNG ADDRESSES ---
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Address> addresses = new ArrayList<>();

    // --- CÁC HÀM CỦA SPRING SECURITY ---

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + this.role));
    }

    @Override
    public String getUsername() {
        return email; // Dùng email làm username đăng nhập
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return !"BANNED".equals(this.role);
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return active && deletedAt == null;
    }

    // --- RICH DOMAIN MODEL (Logic nghiệp vụ) ---

    public void deactivateAccount() {
        this.active = false;
    }

    public void markAsDeleted() {
        this.deletedAt = java.time.Instant.now();
        this.active = false;
    }


}