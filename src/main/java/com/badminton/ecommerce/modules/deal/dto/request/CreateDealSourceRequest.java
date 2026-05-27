package com.badminton.ecommerce.modules.deal.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateDealSourceRequest {
    @NotBlank(message = "Tên nguồn không được để trống")
    private String name;

    @NotBlank(message = "Loại nguồn không được để trống")
    private String type; // VD: FACEBOOK_GROUP

    @NotBlank(message = "URL không được để trống")
    private String url;

    @NotNull(message = "Tần suất cào (phút) không được để trống")
    private Integer crawlFrequencyMinutes;

    private Integer maxScrolls = 5;
}
