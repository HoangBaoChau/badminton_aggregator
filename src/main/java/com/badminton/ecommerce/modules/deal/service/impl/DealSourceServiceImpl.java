package com.badminton.ecommerce.modules.deal.service.impl;

import com.badminton.ecommerce.core.exception.AppException;
import com.badminton.ecommerce.core.exception.ErrorCode;
import com.badminton.ecommerce.modules.deal.dto.request.CreateDealSourceRequest;
import com.badminton.ecommerce.modules.deal.dto.request.UpdateDealSourceRequest;
import com.badminton.ecommerce.modules.deal.dto.response.DealSourceMapper;
import com.badminton.ecommerce.modules.deal.dto.response.DealSourceResponse;
import com.badminton.ecommerce.modules.deal.entity.DealSource;
import com.badminton.ecommerce.modules.deal.repository.DealSourceRepository;
import com.badminton.ecommerce.modules.deal.service.DealSourceService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DealSourceServiceImpl implements DealSourceService {

    private final DealSourceRepository dealSourceRepository;
    private final DealSourceMapper dealSourceMapper;

    @Override
    public Page<DealSourceResponse> getAllSources(Pageable pageable) {
        return dealSourceRepository.findAll(pageable)
                .map(dealSourceMapper::toResponse);
    }

    @Override
    public DealSourceResponse getSourceById(UUID id) {
        DealSource dealSource = dealSourceRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.DEAL_NOT_FOUND)); // TODO: Thêm DEAL_SOURCE_NOT_FOUND sau
        return dealSourceMapper.toResponse(dealSource);
    }

    @Override
    public DealSourceResponse createSource(CreateDealSourceRequest request) {
        DealSource dealSource = DealSource.builder()
                .name(request.getName())
                .type(request.getType())
                .url(request.getUrl())
                .crawlFrequencyMinutes(request.getCrawlFrequencyMinutes())
                .maxScrolls(request.getMaxScrolls() != null ? request.getMaxScrolls() : 5)
                .active(true)
                .build();
        
        dealSource = dealSourceRepository.save(dealSource);
        return dealSourceMapper.toResponse(dealSource);
    }

    @Override
    public DealSourceResponse updateSource(UUID id, UpdateDealSourceRequest request) {
        DealSource dealSource = dealSourceRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.DEAL_NOT_FOUND));

        if (request.getName() != null) dealSource.setName(request.getName());
        if (request.getUrl() != null) dealSource.setUrl(request.getUrl());
        if (request.getCrawlFrequencyMinutes() != null) dealSource.setCrawlFrequencyMinutes(request.getCrawlFrequencyMinutes());
        if (request.getMaxScrolls() != null) dealSource.setMaxScrolls(request.getMaxScrolls());
        if (request.getActive() != null) dealSource.setActive(request.getActive());

        dealSource = dealSourceRepository.save(dealSource);
        return dealSourceMapper.toResponse(dealSource);
    }

    @Override
    public void deleteSource(UUID id) {
        DealSource dealSource = dealSourceRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.DEAL_NOT_FOUND));
        dealSourceRepository.delete(dealSource);
    }
}
