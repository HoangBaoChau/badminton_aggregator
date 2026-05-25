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
public class DealSourceResponse {
    private UUID id;
    private String name;
    private String type; // FACEBOOK_GROUP, FORUM, vv.
    private String url;
    private Integer crawlFrequencyMinutes;
    private boolean active;
    private Instant lastCrawledAt;
    private Instant createdAt;
}
