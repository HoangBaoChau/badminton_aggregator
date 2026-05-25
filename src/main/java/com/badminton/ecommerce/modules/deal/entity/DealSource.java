package com.badminton.ecommerce.modules.deal.entity;

import com.badminton.ecommerce.core.audit.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "deal_sources")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DealSource extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, length = 30)
    private String type; // 'fb_group', 'shopee', 'lazada', 'tiki', 'vnb', 'website', 'other'

    @Column(nullable = false, columnDefinition = "TEXT")
    private String url;

    @Column(name = "crawl_frequency_minutes")
    @Builder.Default
    private Integer crawlFrequencyMinutes = 60;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(name = "last_crawled_at")
    private Instant lastCrawledAt;
}
