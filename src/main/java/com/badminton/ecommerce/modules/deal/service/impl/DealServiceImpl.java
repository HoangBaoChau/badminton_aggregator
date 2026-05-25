package com.badminton.ecommerce.modules.deal.service.impl;

import com.badminton.ecommerce.modules.deal.dto.request.CreateDealRequest;
import com.badminton.ecommerce.modules.deal.dto.response.DealResponse;
import com.badminton.ecommerce.modules.deal.entity.Deal;
import com.badminton.ecommerce.modules.deal.entity.DealSource;
import com.badminton.ecommerce.modules.deal.mapper.DealMapper;
import com.badminton.ecommerce.modules.deal.repository.DealRepository;
import com.badminton.ecommerce.modules.deal.repository.DealSourceRepository;
import com.badminton.ecommerce.modules.deal.service.DealService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class DealServiceImpl implements DealService {

    private final DealRepository dealRepository;
    private final DealSourceRepository dealSourceRepository;
    private final DealMapper dealMapper;

    @Override
    @Transactional
    public DealResponse createDeal(CreateDealRequest request) {
        // 1. Xử lý DealSource: Tìm hoặc tạo mới nếu chưa có
        DealSource source = dealSourceRepository.findById(request.sourceId()).orElse(null);
        if (source == null) {
            log.info("SourceId {} không tồn tại, tạo mới source mặc định.", request.sourceId());
            source = new DealSource();
            source.setId(request.sourceId()); // Giữ nguyên ID nếu có, hoặc sinh mới
            source.setName("Facebook Group Crawler");
            source.setType("FACEBOOK");
            source.setUrl(request.externalUrl());
            source = dealSourceRepository.save(source);
        }

        // 2. Chống trùng lặp: Kiểm tra xem bài đăng này đã được crawl chưa
        Deal existingDeal = dealRepository.findBySourceIdAndExternalId(source.getId(), request.externalId()).orElse(null);
        if (existingDeal != null) {
            log.info("Deal đã tồn tại, cập nhật: sourceId={}, externalId={}", source.getId(), request.externalId());
            dealMapper.updateEntityFromRequest(request, existingDeal);
            existingDeal.setSource(source);
            Deal updatedDeal = dealRepository.save(existingDeal);
            return dealMapper.toResponse(updatedDeal);
        }

        // 3. Map DTO -> Entity (Tạo mới)
        Deal deal = dealMapper.toEntity(request);
        deal.setSource(source);

        // 4. Lưu vào DB
        Deal savedDeal = dealRepository.save(deal);

        // 5. Trả về Response
        return dealMapper.toResponse(savedDeal);
    }

    @Override
    public Page<DealResponse> getDeals(int page, int size, String keyword, String status, UUID brandId, UUID categoryId) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "postedAt"));
        Pageable nativePageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "posted_at"));

        // Nếu có keyword -> dùng Full-Text Search (native query)
        if (keyword != null && !keyword.trim().isEmpty()) {
            return dealRepository.searchDealsFts(keyword.trim(), status, nativePageable)
                    .map(dealMapper::toResponse);
        }

        // Nếu không có keyword -> dùng JPA Specification (dynamic query an toàn)
        Specification<Deal> spec = Specification.where(hasStatus(status));

        if (brandId != null) {
            spec = spec.and(hasBrandId(brandId));
        }
        if (categoryId != null) {
            spec = spec.and(hasCategoryId(categoryId));
        }

        return dealRepository.findAll(spec, pageable).map(dealMapper::toResponse);
    }

    // --- Specification helpers ---

    private Specification<Deal> hasStatus(String status) {
        return (root, query, cb) -> cb.equal(root.get("status"), status);
    }

    private Specification<Deal> hasBrandId(UUID brandId) {
        return (root, query, cb) -> cb.equal(root.get("brandId"), brandId);
    }

    private Specification<Deal> hasCategoryId(UUID categoryId) {
        return (root, query, cb) -> cb.equal(root.get("categoryId"), categoryId);
    }

    @Override
    @Transactional
    public DealResponse updateDealStatus(UUID id, String status) {
        Deal deal = dealRepository.findById(id)
                .orElseThrow(() -> new com.badminton.ecommerce.core.exception.AppException(
                        com.badminton.ecommerce.core.exception.ErrorCode.DEAL_NOT_FOUND));
        
        deal.setStatus(status);
        deal = dealRepository.save(deal);
        return dealMapper.toResponse(deal);
    }
}
