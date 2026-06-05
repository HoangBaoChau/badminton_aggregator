package com.badminton.ecommerce.modules.shop.repository;

import com.badminton.ecommerce.modules.shop.entity.BadmintonShop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BadmintonShopRepository extends JpaRepository<BadmintonShop, UUID> {

    List<BadmintonShop> findByStatusAndCity(String status, String city);

    @Query("SELECT s FROM BadmintonShop s WHERE s.status = :status AND s.city = :city AND (" +
            "LOWER(s.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(s.brand) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(s.address) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(s.district) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<BadmintonShop> searchShops(@Param("status") String status, @Param("city") String city, @Param("keyword") String keyword);
}
