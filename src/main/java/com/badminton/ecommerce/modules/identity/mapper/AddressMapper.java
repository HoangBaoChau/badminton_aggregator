package com.badminton.ecommerce.modules.identity.mapper;

import com.badminton.ecommerce.modules.identity.dto.request.CreateAddressRequest;
import com.badminton.ecommerce.modules.identity.dto.request.UpdateAddressRequest;
import com.badminton.ecommerce.modules.identity.dto.response.AddressResponse;
import com.badminton.ecommerce.modules.identity.entity.Address;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import java.util.List;

@Mapper(componentModel = "spring")
public interface AddressMapper {

    @Mapping(target = "isDefault", expression = "java(address.isDefault())")
    AddressResponse toResponse(Address address);

    List<AddressResponse> toResponseList(List<Address> addresses);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "countryCode", ignore = true)  // Giữ mặc định "VN"
    Address toEntity(CreateAddressRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "countryCode", ignore = true)
    @Mapping(target = "default", source = "isDefault")
    void updateEntity(UpdateAddressRequest request, @MappingTarget Address address);
}
