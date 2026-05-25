package com.badminton.ecommerce.modules.deal.controller;

import com.badminton.ecommerce.core.response.ApiResponse;
import com.badminton.ecommerce.modules.deal.dto.response.CrawlLogResponse;
import com.badminton.ecommerce.modules.deal.service.CrawlLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/logs")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminCrawlLogController {

    private final CrawlLogService crawlLogService;

    @GetMapping
    public ApiResponse<Page<CrawlLogResponse>> getAllLogs(
            Pageable pageable,
            @RequestParam(required = false) UUID sourceId,
            @RequestParam(required = false) String status) {
        
        Page<CrawlLogResponse> logs = crawlLogService.getAllLogs(pageable, sourceId, status);
        return ApiResponse.success(logs);
    }
}
