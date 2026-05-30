package com.badminton.ecommerce.modules.deal.controller;

import com.badminton.ecommerce.core.response.ApiResponse;
import com.badminton.ecommerce.modules.deal.dto.response.AiFilterResponse;
import com.badminton.ecommerce.modules.deal.service.AiFilterService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
public class AiFilterController {

    private final AiFilterService aiFilterService;

    @PostMapping("/extract-filters")
    public ResponseEntity<ApiResponse<AiFilterResponse>> extractFilters(@RequestBody Map<String, String> body) {
        String query = body.getOrDefault("query", "").trim();
        if (query.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error(400, "Query không được để trống"));
        }
        
        AiFilterResponse response = aiFilterService.extractFilters(query);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
