package com.badminton.ecommerce.modules.deal.repository;

import com.badminton.ecommerce.modules.deal.entity.Deal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface DealRepository extends JpaRepository<Deal, UUID>, JpaSpecificationExecutor<Deal> {

    // Kiểm tra xem bài đăng từ Nguồn X với ID Y đã tồn tại chưa (Deduplicate)
    boolean existsBySourceIdAndExternalId(UUID sourceId, String externalId);

    // Tìm deal theo sourceId và externalId để cập nhật
    java.util.Optional<Deal> findBySourceIdAndExternalId(UUID sourceId, String externalId);

    /**
     * Tận dụng GIN Index của PostgreSQL để Full-Text Search.
     */
    @Query(value = "SELECT * FROM deals d " +
            "WHERE d.status = :status " +
            "AND to_tsvector('simple', COALESCE(d.product_name, '') || ' ' || COALESCE(d.raw_text, '')) " +
            "@@ plainto_tsquery('simple', :keyword)",
           countQuery = "SELECT count(*) FROM deals d " +
            "WHERE d.status = :status " +
            "AND to_tsvector('simple', COALESCE(d.product_name, '') || ' ' || COALESCE(d.raw_text, '')) " +
            "@@ plainto_tsquery('simple', :keyword)",
            nativeQuery = true)
    Page<Deal> searchDealsFts(@Param("keyword") String keyword, @Param("status") String status, Pageable pageable);

    long countBySourceIdAndCreatedAtBetween(UUID sourceId, java.time.Instant start, java.time.Instant end);

    long countBySourceIdAndUpdatedAtBetween(UUID sourceId, java.time.Instant start, java.time.Instant end);

    @org.springframework.data.jpa.repository.Modifying
    @Query("UPDATE Deal d SET d.updatedAt = :now WHERE d.id = :id")
    void touchUpdatedAt(@Param("id") UUID id, @Param("now") java.time.Instant now);
}
