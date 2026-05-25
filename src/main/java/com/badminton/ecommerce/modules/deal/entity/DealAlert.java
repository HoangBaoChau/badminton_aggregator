package com.badminton.ecommerce.modules.deal.entity;

import com.badminton.ecommerce.modules.identity.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "deal_alerts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class DealAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private String keyword;

    @Column(name = "brand_id")
    private UUID brandId;

    @Column(name = "category_id")
    private UUID categoryId;

    @Column(name = "max_price", precision = 12, scale = 0)
    private BigDecimal maxPrice;

    @Column(length = 30)
    private String condition;

    private String location;

    @Column(name = "notify_via", nullable = false, length = 20)
    @Builder.Default
    private String notifyVia = "email";

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(name = "last_notified_at")
    private Instant lastNotifiedAt;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
