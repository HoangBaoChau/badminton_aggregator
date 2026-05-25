package com.badminton.ecommerce.core.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class TokenBlacklistService {

    // Cache to hold blacklisted tokens. Key is the token, value is the token's expiration time.
    private final Map<String, Instant> blacklist = new ConcurrentHashMap<>();

    /**
     * Adds a token to the blacklist with its expiration time.
     *
     * @param token  The JWT token
     * @param expiry The token's expiration instant
     */
    public void blacklistToken(String token, Instant expiry) {
        if (expiry.isAfter(Instant.now())) {
            blacklist.put(token, expiry);
            log.info("Token added to blacklist. Expiry: {}", expiry);
        } else {
            log.debug("Token is already expired, no need to blacklist.");
        }
    }

    /**
     * Checks if a token is blacklisted.
     *
     * @param token The JWT token
     * @return true if the token is blacklisted and not yet expired, false otherwise
     */
    public boolean isBlacklisted(String token) {
        Instant expiry = blacklist.get(token);
        if (expiry == null) {
            return false;
        }
        if (expiry.isBefore(Instant.now())) {
            blacklist.remove(token); // Lazy eviction
            return false;
        }
        return true;
    }

    /**
     * Scheduled task to evict expired tokens from the blacklist.
     * Runs every 30 minutes (1800000 milliseconds).
     */
    @Scheduled(fixedRate = 1800000)
    public void cleanExpiredTokens() {
        log.debug("Cleaning expired tokens from blacklist...");
        Instant now = Instant.now();
        int initialSize = blacklist.size();
        
        blacklist.entrySet().removeIf(entry -> entry.getValue().isBefore(now));
        
        int removedCount = initialSize - blacklist.size();
        if (removedCount > 0) {
            log.info("Removed {} expired tokens from blacklist.", removedCount);
        }
    }
}
