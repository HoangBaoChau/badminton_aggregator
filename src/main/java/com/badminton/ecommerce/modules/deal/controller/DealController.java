package com.badminton.ecommerce.modules.deal.controller;

import com.badminton.ecommerce.core.response.ApiResponse;
import com.badminton.ecommerce.modules.deal.dto.request.CreateDealRequest;
import com.badminton.ecommerce.modules.deal.dto.response.DealResponse;
import com.badminton.ecommerce.modules.deal.service.DealService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/deals")
@RequiredArgsConstructor
public class DealController {

    private final DealService dealService;

    /**
     * API dành cho Frontend để hiển thị danh sách (Feed)
     * GET /api/v1/deals?page=0&size=20&keyword=yonex
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<DealResponse>>> getDeals(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "active") String status,
            @RequestParam(required = false) UUID brandId,
            @RequestParam(required = false) UUID categoryId) {

        Page<DealResponse> deals = dealService.getDeals(page, size, keyword, status, brandId, categoryId);
        return ResponseEntity.ok(ApiResponse.success(deals));
    }

    /**
     * API dành cho Crawler (Playwright) đẩy data lấy được từ FB về DB
     * POST /api/v1/deals
     * Yêu cầu header: X-Crawler-Key
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('VIP', 'CRAWLER')")
    public ResponseEntity<ApiResponse<DealResponse>> createDeal(@Valid @RequestBody CreateDealRequest request) {
        DealResponse response = dealService.createDeal(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
