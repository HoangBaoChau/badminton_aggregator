package com.badminton.ecommerce.modules.system.controller;

import com.badminton.ecommerce.core.response.ApiResponse;
import com.badminton.ecommerce.modules.system.dto.UpdateConfigRequest;
import com.badminton.ecommerce.modules.system.entity.SystemConfig;
import com.badminton.ecommerce.modules.system.service.SystemConfigService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/system-configs")
@RequiredArgsConstructor
public class SystemConfigController {

    private final SystemConfigService systemConfigService;

    @GetMapping("/{key}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, String>>> getConfig(@PathVariable String key) {
        String value = systemConfigService.getConfig(key, "false");
        return ResponseEntity.ok(ApiResponse.success(Map.of("key", key, "value", value)));
    }

    @PutMapping("/{key}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SystemConfig>> updateConfig(
            @PathVariable String key,
            @Valid @RequestBody UpdateConfigRequest request) {
        SystemConfig updatedConfig = systemConfigService.updateConfig(key, request.getValue(), request.getDescription());
        return ResponseEntity.ok(ApiResponse.success(updatedConfig));
    }
}
