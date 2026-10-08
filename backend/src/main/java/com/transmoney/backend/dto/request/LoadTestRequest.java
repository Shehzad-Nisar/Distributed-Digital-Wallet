package com.transmoney.backend.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoadTestRequest {
    @Builder.Default
    private Integer concurrency = 10;

    @Builder.Default
    private Integer totalTransactions = 100;

    @Builder.Default
    private BigDecimal transferAmount = new BigDecimal("5.00");

    @Builder.Default
    private String scenario = "MIXED"; // MIXED, SAME_SHARD, CROSS_SHARD, HOT_ACCOUNT

    private Long hotAccountId;
}
