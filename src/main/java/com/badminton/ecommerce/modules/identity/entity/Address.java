package com.badminton.ecommerce.modules.identity.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "addresses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class Address {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(length = 60)
    private String label;

    @Column(name = "street_line1", length = 255, nullable = false)
    private String streetLine1;

    @Column(name = "street_line2", length = 255)
    private String streetLine2;

    @Column(length = 100)
    private String ward;

    @Column(length = 100, nullable = false)
    private String district;

    @Column(length = 100, nullable = false)
    private String province;

    @Column(name = "country_code", length = 2, nullable = false)
    @JdbcTypeCode(java.sql.Types.CHAR)
    @Builder.Default
    private String countryCode = "VN";

    @Column(name = "is_default", nullable = false)
    @Builder.Default
    private boolean isDefault = false;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
