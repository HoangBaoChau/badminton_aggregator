package com.badminton.ecommerce.modules.system.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateConfigRequest {
    @NotBlank
    private String value;
    private String description;
}
