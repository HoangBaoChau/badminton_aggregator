package com.badminton.ecommerce.modules.deal.service;

import com.badminton.ecommerce.modules.deal.dto.request.CreateDealSourceRequest;
import com.badminton.ecommerce.modules.deal.dto.request.UpdateDealSourceRequest;
import com.badminton.ecommerce.modules.deal.dto.response.DealSourceResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface DealSourceService {
    Page<DealSourceResponse> getAllSources(Pageable pageable);
    DealSourceResponse getSourceById(UUID id);
    DealSourceResponse createSource(CreateDealSourceRequest request);
    DealSourceResponse updateSource(UUID id, UpdateDealSourceRequest request);
    void deleteSource(UUID id);
}
