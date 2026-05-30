package com.badminton.ecommerce.core.security;

import com.badminton.ecommerce.core.security.entity.BlacklistedToken;
import com.badminton.ecommerce.core.security.repository.BlacklistedTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
@Slf4j
public class TokenBlacklistService {

    private final BlacklistedTokenRepository blacklistedTokenRepository;

    @Transactional
    public void blacklistToken(String token, Instant expiry) {
        if (expiry.isAfter(Instant.now())) {
            BlacklistedToken blacklistedToken = BlacklistedToken.builder()
                    .token(token)
                    .expiryDate(expiry)
                    .build();
            blacklistedTokenRepository.save(blacklistedToken);
            log.info("Token added to blacklist. Expiry: {}", expiry);
        } else {
            log.debug("Token is already expired, no need to blacklist.");
        }
    }

    public boolean isBlacklisted(String token) {
        return blacklistedTokenRepository.findById(token)
                .map(blacklisted -> {
                    if (blacklisted.getExpiryDate().isBefore(Instant.now())) {
                        // Let the cleanup job handle deletion to avoid transaction issues here
                        return false;
                    }
                    return true;
                })
                .orElse(false);
    }

    @Scheduled(fixedRate = 1800000) // Every 30 minutes
    @Transactional
    public void cleanExpiredTokens() {
        log.debug("Cleaning expired tokens from blacklist DB...");
        try {
            blacklistedTokenRepository.deleteByExpiryDateBefore(Instant.now());
            log.debug("Expired tokens cleaned.");
        } catch (Exception e) {
            log.error("Error cleaning expired tokens: ", e);
        }
    }
}
