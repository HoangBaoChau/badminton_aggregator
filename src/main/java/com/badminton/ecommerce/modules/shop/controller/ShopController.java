package com.badminton.ecommerce.modules.shop.controller;

import com.badminton.ecommerce.core.response.ApiResponse;
import com.badminton.ecommerce.modules.shop.dto.ShopResponse;
import com.badminton.ecommerce.modules.shop.service.ShopService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/shops")
@RequiredArgsConstructor
public class ShopController {

    private final ShopService shopService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ShopResponse>>> getShops(
            @RequestParam(defaultValue = "Hà Nội") String city,
            @RequestParam(required = false) String q) {
        List<ShopResponse> shops = shopService.getShops(city, q);
        return ResponseEntity.ok(ApiResponse.success(shops));
    }
}
