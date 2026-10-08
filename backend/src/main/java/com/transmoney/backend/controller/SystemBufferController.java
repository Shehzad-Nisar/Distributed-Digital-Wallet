package com.transmoney.backend.controller;

import com.transmoney.backend.dto.response.ApiResponse;
import com.transmoney.backend.dto.response.CacheStatsResponse;
import com.transmoney.backend.dto.response.QueueStatsResponse;
import com.transmoney.backend.entity.Account;
import com.transmoney.backend.repository.AccountRepository;
import com.transmoney.backend.service.AccountService;
import com.transmoney.backend.service.cache.BalanceCacheService;
import com.transmoney.backend.service.queue.AsyncQueueBufferService;
import com.transmoney.backend.service.websocket.WalletWebSocketHandler;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/system")
@RequiredArgsConstructor
@Tag(name = "System Performance & Buffer", description = "Endpoints for Redis caching, Async Queue Buffer, and WebSocket metrics")
public class SystemBufferController {

    private final BalanceCacheService balanceCacheService;
    private final AsyncQueueBufferService queueBufferService;
    private final WalletWebSocketHandler webSocketHandler;
    private final AccountRepository accountRepository;
    private final AccountService accountService;

    @GetMapping("/cache-stats")
    @Operation(summary = "Get cache metrics", description = "Returns Redis and in-memory cache hit/miss statistics and status")
    public ResponseEntity<ApiResponse<CacheStatsResponse>> getCacheStats() {
        long hits = balanceCacheService.getHits();
        long misses = balanceCacheService.getMisses();
        long total = hits + misses;
        double hitRate = total > 0 ? (double) hits / total * 100.0 : 0.0;

        CacheStatsResponse stats = CacheStatsResponse.builder()
                .hits(hits)
                .misses(misses)
                .evictions(balanceCacheService.getEvictions())
                .inMemoryEntries(balanceCacheService.getInMemorySize())
                .redisConnected(balanceCacheService.isRedisConnected())
                .hitRatePercentage(Math.round(hitRate * 10.0) / 10.0)
                .build();

        return ResponseEntity.ok(ApiResponse.ok("Cache statistics retrieved successfully", stats));
    }

    @PostMapping("/cache-clear")
    @Operation(summary = "Clear balance cache", description = "Purges all cached balances from Redis and in-memory tiers")
    public ResponseEntity<ApiResponse<String>> clearCache() {
        balanceCacheService.clearAll();
        return ResponseEntity.ok(ApiResponse.ok("Balance cache cleared successfully", "CLEARED"));
    }

    @GetMapping("/queue-stats")
    @Operation(summary = "Get async queue metrics", description = "Returns async queue buffer throughput and real-time WebSocket connection count")
    public ResponseEntity<ApiResponse<QueueStatsResponse>> getQueueStats() {
        QueueStatsResponse response = QueueStatsResponse.builder()
                .totalEnqueued(queueBufferService.getTotalEnqueued())
                .totalProcessed(queueBufferService.getTotalProcessed())
                .pendingBufferSize(queueBufferService.getPendingBufferSize())
                .activeWebSocketConnections(webSocketHandler.getActiveSessionCount())
                .queueStatus("OPERATIONAL")
                .build();

        return ResponseEntity.ok(ApiResponse.ok("Async queue statistics retrieved successfully", response));
    }

    @PostMapping("/warm-cache")
    @Operation(summary = "Pre-warm balance cache", description = "Pre-loads all active account balances into the cache tier")
    public ResponseEntity<ApiResponse<Integer>> warmCache() {
        List<Account> accounts = accountRepository.findAll();
        int warmed = 0;
        for (Account acc : accounts) {
            accountService.getBalance(acc.getId());
            warmed++;
        }
        return ResponseEntity.ok(ApiResponse.ok("Pre-warmed cache for " + warmed + " accounts", warmed));
    }
}
