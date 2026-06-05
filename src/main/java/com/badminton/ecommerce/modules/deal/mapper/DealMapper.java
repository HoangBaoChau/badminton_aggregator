package com.badminton.ecommerce.modules.deal.mapper;

import com.badminton.ecommerce.modules.deal.dto.request.CreateDealRequest;
import com.badminton.ecommerce.modules.deal.dto.request.CreateUserListingRequest;
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

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "source", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "externalId", ignore = true)
    @Mapping(target = "externalUrl", ignore = true)
    @Mapping(target = "userId", ignore = true)
    @Mapping(target = "listingType", ignore = true)
    Deal toEntity(CreateUserListingRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "source", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "externalId", ignore = true)
    @Mapping(target = "externalUrl", ignore = true)
    @Mapping(target = "userId", ignore = true)
    @Mapping(target = "listingType", ignore = true)
    void updateEntityFromRequest(CreateUserListingRequest request, @MappingTarget Deal deal);
}
