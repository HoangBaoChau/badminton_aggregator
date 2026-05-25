package com.badminton.ecommerce.modules.deal.dto.response;

import com.badminton.ecommerce.modules.deal.entity.DealSource;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface DealSourceMapper {
    DealSourceResponse toResponse(DealSource dealSource);
}
