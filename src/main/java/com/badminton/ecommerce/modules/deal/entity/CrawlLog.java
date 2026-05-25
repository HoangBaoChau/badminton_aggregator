package com.badminton.ecommerce.modules.deal.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "crawl_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class CrawlLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_id")
    private DealSource source;

    @Column(nullable = false, length = 20)
    private String status; // 'success', 'failed', 'partial'

    @Column(name = "posts_found", nullable = false)
    @Builder.Default
    private int postsFound = 0;

    @Column(name = "posts_new", nullable = false)
    @Builder.Default
    private int postsNew = 0;

    @Column(name = "posts_duplicate", nullable = false)
    @Builder.Default
    private int postsDuplicate = 0;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "duration_ms")
    private Integer durationMs;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
