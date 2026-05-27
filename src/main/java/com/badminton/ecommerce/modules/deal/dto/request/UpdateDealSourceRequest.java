package com.badminton.ecommerce.modules.deal.dto.request;

import lombok.Data;

@Data
public class UpdateDealSourceRequest {
    private String name;
    private String url;
    private Integer crawlFrequencyMinutes;
    private Integer maxScrolls;
    private Boolean active;
}
