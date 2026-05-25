package com.badminton.ecommerce.modules.deal.mapper;

import com.badminton.ecommerce.modules.deal.dto.request.CreateDealRequest;
import com.badminton.ecommerce.modules.deal.dto.response.DealResponse;
import com.badminton.ecommerce.modules.deal.entity.Deal;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import java.util.List;

@Mapper(componentModel = "spring")
public interface DealMapper {

    @Mapping(target = "sourceName", source = "source.name")
    DealResponse toResponse(Deal deal);

    List<DealResponse> toResponseList(List<Deal> deals);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "source", ignore = true)
    @Mapping(target = "status", ignore = true)
    Deal toEntity(CreateDealRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "source", ignore = true)
    @Mapping(target = "status", ignore = true)
    void updateEntityFromRequest(CreateDealRequest request, @MappingTarget Deal deal);
}
