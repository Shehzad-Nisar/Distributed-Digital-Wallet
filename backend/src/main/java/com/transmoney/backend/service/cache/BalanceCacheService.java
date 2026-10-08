package com.transmoney.backend.service.cache;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.transmoney.backend.dto.response.AccountBalanceResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicLong;

/**
 * High-throughput balance caching layer for the distributed digital wallet.
 * Implements a resilient dual-tier cache-aside pattern:
 * 1. Redis Tier: Distributed caching across microservice instances with 5-minute TTL.
 * 2. In-Memory Tier: Resilient local fallback when Redis is unreachable or during local tests.
 */
@Slf4j
@Service
public class BalanceCacheService {

    private static final String KEY_PREFIX = "wallet:balance:";
    private static final Duration DEFAULT_TTL = Duration.ofMinutes(5);

    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    // Resilient fallback in-memory cache
    private final Map<Long, CacheEntry> inMemoryCache = new ConcurrentHashMap<>();
    private final AtomicBoolean redisWarned = new AtomicBoolean(false);

    // Cache Metrics
    private final AtomicLong hits = new AtomicLong(0);
    private final AtomicLong misses = new AtomicLong(0);
    private final AtomicLong evictions = new AtomicLong(0);

    private record CacheEntry(AccountBalanceResponse response, Instant expiresAt) {
        boolean isExpired() {
            return Instant.now().isAfter(expiresAt);
        }
    }

    public BalanceCacheService(@Autowired(required = false) RedisTemplate<String, Object> redisTemplate,
                               ObjectMapper objectMapper) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    /**
     * Retrieve account balance from cache.
     */
    public Optional<AccountBalanceResponse> getBalance(Long accountId) {
        if (accountId == null) {
            return Optional.empty();
        }

        // Try Redis first if available
        if (redisTemplate != null) {
            try {
                Object cached = redisTemplate.opsForValue().get(KEY_PREFIX + accountId);
                if (cached != null) {
                    hits.incrementAndGet();
                    AccountBalanceResponse result;
                    if (cached instanceof AccountBalanceResponse resp) {
                        result = resp;
                    } else {
                        result = objectMapper.convertValue(cached, AccountBalanceResponse.class);
                    }
                    log.debug("Redis Cache HIT for account ID {}", accountId);
                    return Optional.of(result);
                }
            } catch (Exception ex) {
                logRedisFallbackOnce(ex);
            }
        }

        // Check resilient in-memory fallback
        CacheEntry localEntry = inMemoryCache.get(accountId);
        if (localEntry != null) {
            if (!localEntry.isExpired()) {
                hits.incrementAndGet();
                log.debug("In-Memory Cache HIT for account ID {}", accountId);
                return Optional.of(localEntry.response());
            } else {
                inMemoryCache.remove(accountId);
            }
        }

        misses.incrementAndGet();
        log.debug("Cache MISS for account ID {}", accountId);
        return Optional.empty();
    }

    /**
     * Store account balance into cache with TTL.
     */
    public void putBalance(Long accountId, AccountBalanceResponse response) {
        if (accountId == null || response == null) {
            return;
        }

        // Write to Redis
        if (redisTemplate != null) {
            try {
                redisTemplate.opsForValue().set(KEY_PREFIX + accountId, response, DEFAULT_TTL);
                log.debug("Cached account ID {} in Redis (TTL: {} min)", accountId, DEFAULT_TTL.toMinutes());
            } catch (Exception ex) {
                logRedisFallbackOnce(ex);
            }
        }

        // Always mirror to resilient in-memory fallback
        inMemoryCache.put(accountId, new CacheEntry(response, Instant.now().plus(DEFAULT_TTL)));
    }

    /**
     * Invalidate cached balance when account balance updates (2PC Commit, deposit, withdraw).
     */
    public void evictBalance(Long accountId) {
        if (accountId == null) {
            return;
        }
        evictions.incrementAndGet();

        if (redisTemplate != null) {
            try {
                redisTemplate.delete(KEY_PREFIX + accountId);
                log.debug("Evicted account ID {} from Redis cache", accountId);
            } catch (Exception ex) {
                logRedisFallbackOnce(ex);
            }
        }

        inMemoryCache.remove(accountId);
        log.debug("Evicted account ID {} from In-Memory cache", accountId);
    }

    /**
     * Invalidate multiple account balances atomically (e.g., both sender and receiver in 2PC).
     */
    public void evictBalances(Long... accountIds) {
        if (accountIds == null) return;
        for (Long id : accountIds) {
            if (id != null) {
                evictBalance(id);
            }
        }
    }

    public void clearAll() {
        inMemoryCache.clear();
        if (redisTemplate != null) {
            try {
                var keys = redisTemplate.keys(KEY_PREFIX + "*");
                if (keys != null && !keys.isEmpty()) {
                    redisTemplate.delete(keys);
                }
            } catch (Exception ignored) {
            }
        }
    }

    public long getHits() {
        return hits.get();
    }

    public long getMisses() {
        return misses.get();
    }

    public long getEvictions() {
        return evictions.get();
    }

    public int getInMemorySize() {
        return inMemoryCache.size();
    }

    public boolean isRedisConnected() {
        if (redisTemplate == null) return false;
        try {
            return Boolean.TRUE.equals(redisTemplate.execute(
                    (org.springframework.data.redis.core.RedisCallback<Boolean>) connection -> !connection.isClosed()
            ));
        } catch (Exception e) {
            return false;
        }
    }

    private void logRedisFallbackOnce(Exception ex) {
        if (redisWarned.compareAndSet(false, true)) {
            log.warn("Redis host unavailable ({}); smoothly operating with resilient in-memory balance cache.", ex.getMessage());
        }
    }
}
