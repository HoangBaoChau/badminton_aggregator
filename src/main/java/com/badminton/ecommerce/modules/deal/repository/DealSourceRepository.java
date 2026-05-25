package com.badminton.ecommerce.modules.deal.repository;

import com.badminton.ecommerce.modules.deal.entity.DealSource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DealSourceRepository extends JpaRepository<DealSource, UUID> {
    
    List<DealSource> findByActiveTrue();
    
    Optional<DealSource> findByName(String name);
}
