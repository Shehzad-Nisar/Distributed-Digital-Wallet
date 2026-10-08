package com.transmoney.backend.service.chaos;

import com.transmoney.backend.dto.request.ChaosConfigRequest;
import com.transmoney.backend.dto.response.ChaosConfigResponse;
import com.transmoney.backend.exception.TransactionException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Chaos Monkey & Fault Injection engine for TransMoney.
 * Simulates real-world distributed systems failures:
 * - Network latency spikes between shard partitions
 * - Network partitions during 2PC Prepare phase
 * - Simulated coordinator node crash after PREPARED state
 * - Transient packet drop / timeout failure rates
 */
@Slf4j
@Service
public class ChaosEngineeringService {

    private final AtomicBoolean enabled = new AtomicBoolean(false);
    private final AtomicReference<String> mode = new AtomicReference<>("NONE");
    private final AtomicInteger latencyMs = new AtomicInteger(0);
    private final AtomicReference<Double> failureRatePercent = new AtomicReference<>(0.0);

    // Fault Injection Telemetry
    private final AtomicLong totalFaultsInjected = new AtomicLong(0);
    private final AtomicLong totalCrashesSimulated = new AtomicLong(0);
    private final AtomicLong totalDelaysInjected = new AtomicLong(0);

    public ChaosConfigResponse getConfig() {
        return ChaosConfigResponse.builder()
                .enabled(enabled.get())
                .mode(mode.get())
                .latencyMs(latencyMs.get())
                .failureRatePercent(failureRatePercent.get())
                .totalFaultsInjected(totalFaultsInjected.get())
                .totalCrashesSimulated(totalCrashesSimulated.get())
                .totalDelaysInjected(totalDelaysInjected.get())
                .build();
    }

    public ChaosConfigResponse updateConfig(ChaosConfigRequest request) {
        if (request.getEnabled() != null) {
            enabled.set(request.getEnabled());
        }
        if (request.getMode() != null && !request.getMode().isBlank()) {
            mode.set(request.getMode().trim().toUpperCase());
        }
        if (request.getLatencyMs() != null) {
            latencyMs.set(Math.max(0, request.getLatencyMs()));
        }
        if (request.getFailureRatePercent() != null) {
            failureRatePercent.set(Math.max(0.0, Math.min(100.0, request.getFailureRatePercent())));
        }

        log.info("Chaos Monkey configuration updated: enabled={}, mode={}, latencyMs={}, failureRate={}%",
                enabled.get(), mode.get(), latencyMs.get(), failureRatePercent.get());

        return getConfig();
    }

    public void reset() {
        enabled.set(false);
        mode.set("NONE");
        latencyMs.set(0);
        failureRatePercent.set(0.0);
        log.info("Chaos Monkey reset to default disabled state");
    }

    /**
     * Intercepts Phase 1 (Prepare phase) to inject artificial delays, partitions, or drops.
     */
    public void injectPreparePhaseChaos(String txId, Long senderId, Long receiverId) {
        if (!enabled.get()) {
            return;
        }

        String currentMode = mode.get();

        // 1. Latency Spike Simulation
        if ("LATENCY_SPIKE".equalsIgnoreCase(currentMode) || latencyMs.get() > 0) {
            int delay = latencyMs.get() > 0 ? latencyMs.get() : 300;
            try {
                log.warn("CHAOS MONKEY: Injecting {}ms artificial network delay on tx [{}] between accounts {} and {}",
                        delay, txId, senderId, receiverId);
                totalDelaysInjected.incrementAndGet();
                TimeUnit.MILLISECONDS.sleep(delay);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }

        // 2. Prepare Phase Network Partition (Deterministic)
        if ("PREPARE_PARTITION".equalsIgnoreCase(currentMode)) {
            totalFaultsInjected.incrementAndGet();
            log.error("CHAOS MONKEY: Injecting simulated network partition during Prepare phase on tx [{}]", txId);
            throw new TransactionException("CHAOS FAULT: Simulated network partition during 2PC Prepare phase on transaction " + txId);
        }

        // 3. Probabilistic Packet Drop
        if ("PACKET_DROP".equalsIgnoreCase(currentMode) && failureRatePercent.get() > 0.0) {
            double roll = ThreadLocalRandom.current().nextDouble(0.0, 100.0);
            if (roll < failureRatePercent.get()) {
                totalFaultsInjected.incrementAndGet();
                log.error("CHAOS MONKEY: Probabilistic packet drop triggered (roll={:.1f} < rate={:.1f}%) on tx [{}]",
                        roll, failureRatePercent.get(), txId);
                throw new TransactionException("CHAOS FAULT: Network packet dropped between distributed shards on transaction " + txId);
            }
        }
    }

    /**
     * Evaluates if a coordinator crash should be injected right after PREPARED transition.
     */
    public boolean shouldSimulateCoordinatorCrash() {
        if (!enabled.get()) {
            return false;
        }
        if ("COORDINATOR_CRASH".equalsIgnoreCase(mode.get())) {
            totalCrashesSimulated.incrementAndGet();
            totalFaultsInjected.incrementAndGet();
            return true;
        }
        return false;
    }
}
