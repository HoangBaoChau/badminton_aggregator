package com.badminton.ecommerce.modules.shop.service;

import com.badminton.ecommerce.modules.shop.dto.ShopResponse;
import com.badminton.ecommerce.modules.shop.entity.BadmintonShop;
import com.badminton.ecommerce.modules.shop.mapper.ShopMapper;
import com.badminton.ecommerce.modules.shop.repository.BadmintonShopRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ShopService {

    private final BadmintonShopRepository shopRepository;
    private final ShopMapper shopMapper;

    public List<ShopResponse> getShops(String city, String keyword) {
        String queryCity = StringUtils.hasText(city) ? city : "Hà Nội";
        
        List<BadmintonShop> shops;
        if (StringUtils.hasText(keyword)) {
            shops = shopRepository.searchShops("active", queryCity, keyword);
        } else {
            shops = shopRepository.findByStatusAndCity("active", queryCity);
        }
        
        return shopMapper.toResponseList(shops);
    }
}
