package com.badminton.ecommerce.modules.deal.dto.response;

import com.badminton.ecommerce.modules.deal.entity.CrawlLog;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface CrawlLogMapper {
    @Mapping(source = "source.id", target = "sourceId")
    CrawlLogResponse toResponse(CrawlLog crawlLog);
}
