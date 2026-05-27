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

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
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
            
            // Ép cập nhật updatedAt bằng tay để Log đếm được bài trùng lặp (kể cả khi không có field nào bị thay đổi)
            dealRepository.touchUpdatedAt(updatedDeal.getId(), java.time.Instant.now());
            
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
    public Page<DealResponse> getDeals(int page, int size, String keyword, String status,
                                        UUID brandId, UUID categoryId,
                                        String condition, String location,
                                        String transactionMethod,
                                        BigDecimal minPrice, BigDecimal maxPrice,
                                        String timeRange) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        // Xây dựng Specification động
        Specification<Deal> spec = Specification.where(hasStatus(status));

        // Keyword: Lọc theo product_name hoặc raw_text (LIKE thay vì FTS để kết hợp được với các filter khác)
        if (keyword != null && !keyword.trim().isEmpty()) {
            spec = spec.and(containsKeyword(keyword.trim()));
        }

        if (brandId != null) {
            spec = spec.and(hasBrandId(brandId));
        }
        if (categoryId != null) {
            spec = spec.and(hasCategoryId(categoryId));
        }

        // Lọc theo tình trạng (condition): new, likenew, used
        if (condition != null && !condition.trim().isEmpty()) {
            spec = spec.and(hasCondition(condition.trim()));
        }

        // Lọc theo khu vực (location): LIKE %location%
        if (location != null && !location.trim().isEmpty()) {
            spec = spec.and(containsLocation(location.trim()));
        }

        // Lọc theo loại giao dịch (transactionMethod): ban, mua
        if (transactionMethod != null && !transactionMethod.trim().isEmpty()) {
            spec = spec.and(hasTransactionMethod(transactionMethod.trim()));
        }

        // Lọc theo khoảng giá
        if (minPrice != null && minPrice.compareTo(BigDecimal.ZERO) > 0) {
            spec = spec.and(priceGreaterThanOrEqual(minPrice));
        }
        if (maxPrice != null && maxPrice.compareTo(BigDecimal.ZERO) > 0) {
            spec = spec.and(priceLessThanOrEqual(maxPrice));
        }

        // Lọc theo thời gian đăng
        if (timeRange != null && !timeRange.trim().isEmpty()) {
            Instant cutoff = calculateCutoff(timeRange.trim());
            if (cutoff != null) {
                spec = spec.and(createdAfter(cutoff));
            }
        }

        return dealRepository.findAll(spec, pageable).map(dealMapper::toResponse);
    }

    // --- Specification helpers ---

    private Specification<Deal> hasStatus(String status) {
        return (root, query, cb) -> cb.equal(root.get("status"), status);
    }

    private Specification<Deal> containsKeyword(String keyword) {
        return (root, query, cb) -> {
            String pattern = "%" + keyword.toLowerCase() + "%";
            return cb.or(
                cb.like(cb.lower(root.get("productName")), pattern),
                cb.like(cb.lower(root.get("rawText")), pattern),
                cb.like(cb.lower(root.get("aiSummary")), pattern)
            );
        };
    }

    private Specification<Deal> hasBrandId(UUID brandId) {
        return (root, query, cb) -> cb.equal(root.get("brandId"), brandId);
    }

    private Specification<Deal> hasCategoryId(UUID categoryId) {
        return (root, query, cb) -> cb.equal(root.get("categoryId"), categoryId);
    }

    private Specification<Deal> hasCondition(String condition) {
        return (root, query, cb) -> cb.equal(cb.lower(root.get("condition")), condition.toLowerCase());
    }

    private Specification<Deal> containsLocation(String location) {
        return (root, query, cb) -> cb.like(cb.lower(root.get("location")), "%" + location.toLowerCase() + "%");
    }

    private Specification<Deal> hasTransactionMethod(String method) {
        return (root, query, cb) -> cb.like(cb.lower(root.get("transactionMethod")), "%" + method.toLowerCase() + "%");
    }

    private Specification<Deal> priceGreaterThanOrEqual(BigDecimal minPrice) {
        return (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("price"), minPrice);
    }

    private Specification<Deal> priceLessThanOrEqual(BigDecimal maxPrice) {
        return (root, query, cb) -> cb.lessThanOrEqualTo(root.get("price"), maxPrice);
    }

    private Specification<Deal> createdAfter(Instant cutoff) {
        return (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("createdAt"), cutoff);
    }

    private Instant calculateCutoff(String timeRange) {
        Instant now = Instant.now();
        return switch (timeRange) {
            case "1h" -> now.minus(1, ChronoUnit.HOURS);
            case "24h" -> now.minus(24, ChronoUnit.HOURS);
            case "7d" -> now.minus(7, ChronoUnit.DAYS);
            case "30d" -> now.minus(30, ChronoUnit.DAYS);
            default -> null;
        };
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
