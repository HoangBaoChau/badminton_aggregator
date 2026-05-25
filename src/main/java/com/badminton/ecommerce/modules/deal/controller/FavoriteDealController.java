package com.badminton.ecommerce.modules.deal.controller;

import com.badminton.ecommerce.core.response.ApiResponse;
import com.badminton.ecommerce.modules.deal.dto.response.DealResponse;
import com.badminton.ecommerce.modules.deal.service.FavoriteDealService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/favorites")
@RequiredArgsConstructor
public class FavoriteDealController {

    private final FavoriteDealService favoriteDealService;

    /**
     * Bật/Tắt trạng thái yêu thích của một deal cho người dùng hiện tại.
     * POST /api/v1/favorites/{dealId}/toggle
     */
    @PostMapping("/{dealId}/toggle")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Boolean>> toggleFavorite(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID dealId) {
        boolean isFavorited = favoriteDealService.toggleFavorite(userDetails.getUsername(), dealId);
        return ResponseEntity.ok(ApiResponse.success(isFavorited));
    }

    /**
     * Kiểm tra xem deal đã được người dùng hiện tại yêu thích hay chưa.
     * GET /api/v1/favorites/{dealId}/check
     */
    @GetMapping("/{dealId}/check")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Boolean>> checkFavorite(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID dealId) {
        boolean isFavorited = favoriteDealService.checkFavorite(userDetails.getUsername(), dealId);
        return ResponseEntity.ok(ApiResponse.success(isFavorited));
    }

    /**
     * Lấy danh sách các deal đã yêu thích của người dùng hiện tại (có phân trang).
     * GET /api/v1/favorites
     */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Page<DealResponse>>> getUserFavorites(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<DealResponse> favorites = favoriteDealService.getUserFavorites(userDetails.getUsername(), page, size);
        return ResponseEntity.ok(ApiResponse.success(favorites));
    }
}
