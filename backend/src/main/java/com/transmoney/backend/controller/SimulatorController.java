package com.transmoney.backend.controller;

import com.transmoney.backend.dto.request.ChaosConfigRequest;
import com.transmoney.backend.dto.request.LoadTestRequest;
import com.transmoney.backend.dto.response.ApiResponse;
import com.transmoney.backend.dto.response.ChaosConfigResponse;
import com.transmoney.backend.dto.response.LoadBenchmarkResult;
import com.transmoney.backend.dto.response.SimulatorStatusResponse;
import com.transmoney.backend.service.chaos.ChaosEngineeringService;
import com.transmoney.backend.service.coordinator.TransactionRecoveryCoordinator;
import com.transmoney.backend.service.simulator.LoadSimulatorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/simulator")
@RequiredArgsConstructor
@Tag(name = "Load Simulator & Chaos Injection", description = "High-concurrency benchmarking, latency percentiles, and chaos engineering fault injection")
public class SimulatorController {

    private final LoadSimulatorService loadSimulatorService;
    private final ChaosEngineeringService chaosEngineeringService;
    private final TransactionRecoveryCoordinator recoveryCoordinator;

    @PostMapping("/load-test")
    @Operation(summary = "Run concurrent load test", description = "Executes multi-threaded 2PC load benchmark and computes P50, P95, P99 latency percentiles")
    public ResponseEntity<ApiResponse<LoadBenchmarkResult>> runLoadTest(@RequestBody(required = false) LoadTestRequest request) {
        LoadTestRequest req = request != null ? request : LoadTestRequest.builder().build();
        LoadBenchmarkResult result = loadSimulatorService.runBenchmark(req);
        return ResponseEntity.ok(ApiResponse.ok("Load test simulation completed successfully", result));
    }

    @GetMapping("/status")
    @Operation(summary = "Get simulator status", description = "Returns active run status, progress percentage, and latest benchmark metrics")
    public ResponseEntity<ApiResponse<SimulatorStatusResponse>> getStatus() {
        SimulatorStatusResponse status = SimulatorStatusResponse.builder()
                .isRunning(loadSimulatorService.isRunning())
                .progressPercentage(loadSimulatorService.getProgressPercentage())
                .latestResult(loadSimulatorService.getLatestResult())
                .build();
        return ResponseEntity.ok(ApiResponse.ok("Simulator status retrieved successfully", status));
    }

    @PostMapping("/cancel")
    @Operation(summary = "Cancel running load test", description = "Cancels any in-progress benchmark execution")
    public ResponseEntity<ApiResponse<String>> cancel() {
        loadSimulatorService.cancelBenchmark();
        return ResponseEntity.ok(ApiResponse.ok("Cancellation requested successfully", "CANCELLED"));
    }

    @GetMapping("/chaos/config")
    @Operation(summary = "Get Chaos Monkey configuration", description = "Returns active fault injection mode, latency spikes, and drop rates")
    public ResponseEntity<ApiResponse<ChaosConfigResponse>> getChaosConfig() {
        return ResponseEntity.ok(ApiResponse.ok("Chaos configuration retrieved successfully", chaosEngineeringService.getConfig()));
    }

    @PostMapping("/chaos/config")
    @Operation(summary = "Update Chaos Monkey configuration", description = "Updates fault injection parameters (latency, partition, coordinator crash)")
    public ResponseEntity<ApiResponse<ChaosConfigResponse>> updateChaosConfig(@RequestBody ChaosConfigRequest request) {
        ChaosConfigResponse updated = chaosEngineeringService.updateConfig(request);
        return ResponseEntity.ok(ApiResponse.ok("Chaos configuration updated successfully", updated));
    }

    @PostMapping("/chaos/reset")
    @Operation(summary = "Reset Chaos Monkey", description = "Disables all fault injection modes and restores normal operation")
    public ResponseEntity<ApiResponse<String>> resetChaos() {
        chaosEngineeringService.reset();
        return ResponseEntity.ok(ApiResponse.ok("Chaos Monkey reset to normal operation", "RESET"));
    }

    @PostMapping("/chaos/trigger-recovery")
    @Operation(summary = "Trigger 2PC recovery sweep", description = "Sweeps and reconciles stale or orphaned PREPARED transactions immediately")
    public ResponseEntity<ApiResponse<Integer>> triggerRecovery(@RequestParam(defaultValue = "0") long staleOlderThanSeconds) {
        int recovered = recoveryCoordinator.triggerManualRecovery(staleOlderThanSeconds);
        return ResponseEntity.ok(ApiResponse.ok("Swept and reconciled " + recovered + " stale transactions", recovered));
    }
}
