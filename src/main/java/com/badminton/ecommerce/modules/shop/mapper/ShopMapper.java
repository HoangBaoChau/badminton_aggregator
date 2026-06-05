package com.badminton.ecommerce.modules.shop.mapper;

import com.badminton.ecommerce.modules.shop.dto.ShopResponse;
import com.badminton.ecommerce.modules.shop.entity.BadmintonShop;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ShopMapper {
    ShopResponse toResponse(BadmintonShop shop);
    List<ShopResponse> toResponseList(List<BadmintonShop> shops);
}
