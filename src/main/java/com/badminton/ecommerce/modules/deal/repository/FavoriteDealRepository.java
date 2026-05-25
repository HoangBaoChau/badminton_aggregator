package com.badminton.ecommerce.modules.deal.repository;

import com.badminton.ecommerce.modules.deal.entity.FavoriteDeal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface FavoriteDealRepository extends JpaRepository<FavoriteDeal, UUID> {

    Optional<FavoriteDeal> findByUserIdAndDealId(UUID userId, UUID dealId);

    Page<FavoriteDeal> findByUserId(UUID userId, Pageable pageable);

    void deleteByUserIdAndDealId(UUID userId, UUID dealId);

    boolean existsByUserIdAndDealId(UUID userId, UUID dealId);
}
