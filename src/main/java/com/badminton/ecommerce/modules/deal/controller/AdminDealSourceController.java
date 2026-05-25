package com.badminton.ecommerce.modules.deal.controller;

import com.badminton.ecommerce.core.response.ApiResponse;
import com.badminton.ecommerce.modules.deal.dto.request.CreateDealSourceRequest;
import com.badminton.ecommerce.modules.deal.dto.request.UpdateDealSourceRequest;
import com.badminton.ecommerce.modules.deal.dto.response.DealSourceResponse;
import com.badminton.ecommerce.modules.deal.service.DealSourceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/sources")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminDealSourceController {

    private final DealSourceService dealSourceService;

    @GetMapping
    public ApiResponse<Page<DealSourceResponse>> getAllSources(Pageable pageable) {
        Page<DealSourceResponse> page = dealSourceService.getAllSources(pageable);
        return ApiResponse.success(page);
    }

    @GetMapping("/{id}")
    public ApiResponse<DealSourceResponse> getSourceById(@PathVariable UUID id) {
        return ApiResponse.success(dealSourceService.getSourceById(id));
    }

    @PostMapping
    public ApiResponse<DealSourceResponse> createSource(@Valid @RequestBody CreateDealSourceRequest request) {
        return ApiResponse.success(dealSourceService.createSource(request));
    }

    @PutMapping("/{id}")
    public ApiResponse<DealSourceResponse> updateSource(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateDealSourceRequest request) {
        return ApiResponse.success(dealSourceService.updateSource(id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteSource(@PathVariable UUID id) {
        dealSourceService.deleteSource(id);
        return ApiResponse.success(null);
    }
}
