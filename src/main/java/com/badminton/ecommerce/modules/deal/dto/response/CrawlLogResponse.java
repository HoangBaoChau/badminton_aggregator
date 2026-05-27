package com.badminton.ecommerce.modules.deal.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CrawlLogResponse {
    private UUID id;
    private UUID sourceId;
    private String status; // SUCCESS, FAILED
    private Integer postsFound;
    private Integer postsNew;
    private Integer postsDuplicate;
    private String errorMessage;
    private String crawlDetails;
    private Integer durationMs;
    private Instant createdAt;
}
