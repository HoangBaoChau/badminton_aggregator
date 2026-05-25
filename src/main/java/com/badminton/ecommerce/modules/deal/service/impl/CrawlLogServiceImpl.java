package com.badminton.ecommerce.modules.deal.service.impl;

import com.badminton.ecommerce.modules.deal.dto.response.CrawlLogMapper;
import com.badminton.ecommerce.modules.deal.dto.response.CrawlLogResponse;
import com.badminton.ecommerce.modules.deal.entity.CrawlLog;
import com.badminton.ecommerce.modules.deal.repository.CrawlLogRepository;
import com.badminton.ecommerce.modules.deal.service.CrawlLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CrawlLogServiceImpl implements CrawlLogService {

    private final CrawlLogRepository crawlLogRepository;
    private final CrawlLogMapper crawlLogMapper;

    @Override
    public Page<CrawlLogResponse> getAllLogs(Pageable pageable, UUID sourceId, String status) {
        Page<CrawlLog> logs;
        
        if (sourceId != null && status != null) {
            logs = crawlLogRepository.findBySourceIdAndStatusOrderByCreatedAtDesc(sourceId, status, pageable);
        } else if (sourceId != null) {
            logs = crawlLogRepository.findBySourceIdOrderByCreatedAtDesc(sourceId, pageable);
        } else if (status != null) {
            logs = crawlLogRepository.findByStatusOrderByCreatedAtDesc(status, pageable);
        } else {
            logs = crawlLogRepository.findAllByOrderByCreatedAtDesc(pageable);
        }
        
        return logs.map(crawlLogMapper::toResponse);
    }
}
