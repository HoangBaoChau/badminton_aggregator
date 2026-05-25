package com.badminton.ecommerce.modules.deal.service;

import com.badminton.ecommerce.modules.deal.dto.response.CrawlLogResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface CrawlLogService {
    Page<CrawlLogResponse> getAllLogs(Pageable pageable, UUID sourceId, String status);
}
