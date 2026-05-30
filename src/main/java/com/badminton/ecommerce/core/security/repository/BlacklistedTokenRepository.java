package com.badminton.ecommerce.core.security.repository;

import com.badminton.ecommerce.core.security.entity.BlacklistedToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;

@Repository
public interface BlacklistedTokenRepository extends JpaRepository<BlacklistedToken, String> {

    void deleteByExpiryDateBefore(Instant now);
}
