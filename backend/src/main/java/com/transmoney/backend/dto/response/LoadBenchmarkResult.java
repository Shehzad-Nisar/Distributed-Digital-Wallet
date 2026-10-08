package com.transmoney.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoadBenchmarkResult {
    private String runId;
    private String status; // RUNNING, COMPLETED, FAILED, CANCELLED
    private String scenario;
    private int concurrency;
    private int totalAttempted;
    private int totalSucceeded;
    private int totalFailed;
    private long totalDurationMs;
    private double throughputTps;
    private double minLatencyMs;
    private double maxLatencyMs;
    private double avgLatencyMs;
    private double p50LatencyMs;
    private double p95LatencyMs;
    private double p99LatencyMs;
    private boolean moneyConserved;
    private int deadlockCount;
    private LocalDateTime timestamp;
}
