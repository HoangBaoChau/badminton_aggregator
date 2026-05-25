package com.badminton.ecommerce.modules.deal.repository;

import com.badminton.ecommerce.modules.deal.entity.DealAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DealAlertRepository extends JpaRepository<DealAlert, UUID> {

    List<DealAlert> findByUserId(UUID userId);

    List<DealAlert> findByUserIdAndActiveTrue(UUID userId);

    // Lấy tất cả các cảnh báo đang bật để Scheduler chạy ngầm đối chiếu
    List<DealAlert> findByActiveTrue();
}
