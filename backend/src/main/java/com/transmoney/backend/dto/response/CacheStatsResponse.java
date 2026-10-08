package com.transmoney.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CacheStatsResponse {
    private long hits;
    private long misses;
    private long evictions;
    private int inMemoryEntries;
    private boolean redisConnected;
    private double hitRatePercentage;
}
