package com.badminton.ecommerce.modules.deal.controller;

import com.badminton.ecommerce.core.response.ApiResponse;
import com.badminton.ecommerce.modules.deal.dto.response.DealResponse;
import com.badminton.ecommerce.modules.deal.service.DealService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/deals")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminDealController {

    private final DealService dealService;

    @PatchMapping("/{id}/status")
    public ApiResponse<DealResponse> updateStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, String> request) {
        
        String status = request.get("status");
        if (status == null || status.trim().isEmpty()) {
            throw new IllegalArgumentException("Status cannot be empty");
        }
        
        return ApiResponse.success(dealService.updateDealStatus(id, status));
    }
}
