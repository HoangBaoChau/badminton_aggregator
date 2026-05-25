package com.badminton.ecommerce.modules.deal.entity;

import com.badminton.ecommerce.core.audit.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "deals")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Deal extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_id")
    private DealSource source;

    @Column(name = "external_id")
    private String externalId;

    @Column(name = "external_url", nullable = false, columnDefinition = "TEXT")
    private String externalUrl;

    @Column(name = "product_name")
    private String productName;

    // Giữ dưới dạng ID (thay vì mapping Entity Brand) để module Deal độc lập
    @Column(name = "brand_id")
    private UUID brandId;

    @Column(name = "category_id")
    private UUID categoryId;

    @Column(precision = 12, scale = 0)
    private BigDecimal price;

    @Column(name = "original_price", precision = 12, scale = 0)
    private BigDecimal originalPrice;

    @Column(length = 30)
    private String condition;

    @Column(length = 100)
    private String location;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private java.util.Map<String, Object> metadata;

    @Column(name = "transaction_method", length = 100)
    private String transactionMethod; // Ví dụ: COD, Trực tiếp

    @Column(name = "seller_name", length = 100)
    private String sellerName;

    @Column(name = "thumbnail_url", columnDefinition = "TEXT")
    private String thumbnailUrl;

    @Column(name = "raw_text", columnDefinition = "TEXT")
    private String rawText;

    @Column(name = "ai_summary", length = 500)
    private String aiSummary;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "tags", columnDefinition = "text[]")
    private List<String> tags;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "active";

    @Column(name = "posted_at")
    private Instant postedAt;
}
