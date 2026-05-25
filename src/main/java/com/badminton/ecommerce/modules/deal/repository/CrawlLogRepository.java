package com.badminton.ecommerce.modules.deal.repository;

import com.badminton.ecommerce.modules.deal.entity.CrawlLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface CrawlLogRepository extends JpaRepository<CrawlLog, UUID> {

    Page<CrawlLog> findBySourceIdOrderByCreatedAtDesc(UUID sourceId, Pageable pageable);
    
    Page<CrawlLog> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);
    
    Page<CrawlLog> findBySourceIdAndStatusOrderByCreatedAtDesc(UUID sourceId, String status, Pageable pageable);
    
    Page<CrawlLog> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
