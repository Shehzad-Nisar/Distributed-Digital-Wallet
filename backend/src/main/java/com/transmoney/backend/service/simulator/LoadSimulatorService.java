package com.transmoney.backend.service.simulator;

import com.transmoney.backend.dto.request.LoadTestRequest;
import com.transmoney.backend.dto.request.TransferRequest;
import com.transmoney.backend.dto.response.LoadBenchmarkResult;
import com.transmoney.backend.entity.Account;
import com.transmoney.backend.repository.AccountRepository;
import com.transmoney.backend.service.coordinator.TwoPhaseCommitCoordinator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * High-concurrency load simulator and benchmarking engine for TransMoney.
 * Evaluates Two-Phase Commit throughput, deadlock freedom under hot account contention,
 * and calculates latency percentiles (P50, P95, P99).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LoadSimulatorService {

    private final TwoPhaseCommitCoordinator coordinator;
    private final AccountRepository accountRepository;

    private final AtomicBoolean isRunning = new AtomicBoolean(false);
    private final AtomicBoolean cancelRequested = new AtomicBoolean(false);
    private volatile LoadBenchmarkResult latestResult;
    private final AtomicInteger currentProgress = new AtomicInteger(0);
    private final AtomicInteger targetTransactions = new AtomicInteger(0);

    public LoadBenchmarkResult getLatestResult() {
        return latestResult;
    }

    public boolean isRunning() {
        return isRunning.get();
    }

    public int getProgressPercentage() {
        int total = targetTransactions.get();
        if (total <= 0) return 0;
        return Math.min(100, (int) Math.round((currentProgress.get() * 100.0) / total));
    }

    public void cancelBenchmark() {
        if (isRunning.get()) {
            cancelRequested.set(true);
            log.warn("Load simulation cancellation requested by user");
        }
    }

    /**
     * Executes a high-concurrency load test simulation according to the given parameters.
     */
    public LoadBenchmarkResult runBenchmark(LoadTestRequest request) {
        if (!isRunning.compareAndSet(false, true)) {
            throw new IllegalStateException("A load test simulation is already running!");
        }

        cancelRequested.set(false);
        String runId = "RUN-" + UUID.randomUUID().toString().substring(0, 8);
        int concurrency = request.getConcurrency() != null ? Math.max(1, request.getConcurrency()) : 10;
        int totalTx = request.getTotalTransactions() != null ? Math.max(1, request.getTotalTransactions()) : 100;
        BigDecimal amount = request.getTransferAmount() != null ? request.getTransferAmount() : new BigDecimal("5.00");
        String scenario = request.getScenario() != null ? request.getScenario().toUpperCase() : "MIXED";

        targetTransactions.set(totalTx);
        currentProgress.set(0);

        log.info("Starting Load Benchmark [{}]: Concurrency={}, TotalTx={}, Amount={}, Scenario={}",
                runId, concurrency, totalTx, amount, scenario);

        // Determine benchmark currency
        Account hotAccount = null;
        if (request.getHotAccountId() != null) {
            hotAccount = accountRepository.findById(request.getHotAccountId()).orElse(null);
        }

        final String benchmarkCurrency = hotAccount != null ? hotAccount.getCurrency() : "USD";

        List<Account> allActive = accountRepository.findAll().stream()
                .filter(a -> "ACTIVE".equalsIgnoreCase(a.getStatus()))
                .filter(a -> benchmarkCurrency.equalsIgnoreCase(a.getCurrency()))
                .filter(a -> a.getBalance().compareTo(new BigDecimal("50.00")) >= 0)
                .toList();

        List<Account> activeAccounts;
        if (allActive.size() >= 2) {
            activeAccounts = allActive;
        } else {
            // Fallback to all active accounts if specific currency has less than 2
            activeAccounts = accountRepository.findAll().stream()
                    .filter(a -> "ACTIVE".equalsIgnoreCase(a.getStatus()))
                    .filter(a -> a.getBalance().compareTo(new BigDecimal("50.00")) >= 0)
                    .toList();
        }

        if (activeAccounts.size() < 2) {
            isRunning.set(false);
            throw new IllegalStateException("Load test requires at least 2 active funded accounts in the database.");
        }

        final Account finalHot = hotAccount != null ? hotAccount : activeAccounts.get(0);

        // Measure initial net balance across participant accounts
        BigDecimal netBalanceBefore = activeAccounts.stream()
                .map(Account::getBalance)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        ExecutorService executor = Executors.newFixedThreadPool(concurrency, new ThreadFactory() {
            private int counter = 1;
            @Override
            public Thread newThread(Runnable r) {
                return new Thread(r, "load-sim-worker-" + counter++);
            }
        });

        List<Double> latenciesMs = new CopyOnWriteArrayList<>();
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failCount = new AtomicInteger(0);
        AtomicInteger deadlockCount = new AtomicInteger(0);

        long startNano = System.nanoTime();

        try {
            CountDownLatch latch = new CountDownLatch(totalTx);

            for (int i = 0; i < totalTx; i++) {
                final int index = i;
                executor.submit(() -> {
                    if (cancelRequested.get()) {
                        failCount.incrementAndGet();
                        latch.countDown();
                        return;
                    }

                    // Pick sender and receiver based on chosen scenario
                    Account sender;
                    Account receiver;

                    if ("HOT_ACCOUNT".equalsIgnoreCase(scenario)) {
                        if (index % 2 == 0) {
                            sender = finalHot;
                            receiver = getRandomDifferentAccount(activeAccounts, finalHot.getId());
                        } else {
                            sender = getRandomDifferentAccount(activeAccounts, finalHot.getId());
                            receiver = finalHot;
                        }
                    } else if ("SAME_SHARD".equalsIgnoreCase(scenario)) {
                        sender = activeAccounts.get(ThreadLocalRandom.current().nextInt(activeAccounts.size()));
                        Account match = activeAccounts.stream()
                                .filter(a -> a.getShard().equals(sender.getShard()) && !a.getId().equals(sender.getId()))
                                .findFirst()
                                .orElse(getRandomDifferentAccount(activeAccounts, sender.getId()));
                        receiver = match;
                    } else if ("CROSS_SHARD".equalsIgnoreCase(scenario)) {
                        sender = activeAccounts.get(ThreadLocalRandom.current().nextInt(activeAccounts.size()));
                        Account diff = activeAccounts.stream()
                                .filter(a -> !a.getShard().equals(sender.getShard()) && !a.getId().equals(sender.getId()))
                                .findFirst()
                                .orElse(getRandomDifferentAccount(activeAccounts, sender.getId()));
                        receiver = diff;
                    } else {
                        // MIXED
                        sender = activeAccounts.get(ThreadLocalRandom.current().nextInt(activeAccounts.size()));
                        receiver = getRandomDifferentAccount(activeAccounts, sender.getId());
                    }

                    long txStart = System.nanoTime();
                    try {
                        coordinator.executeTransfer(TransferRequest.builder()
                                .senderAccountId(sender.getId())
                                .receiverAccountId(receiver.getId())
                                .amount(amount)
                                .currency(sender.getCurrency())
                                .description("Load benchmark transfer #" + index)
                                .build());

                        long txEnd = System.nanoTime();
                        double durationMs = (txEnd - txStart) / 1_000_000.0;
                        latenciesMs.add(durationMs);
                        successCount.incrementAndGet();
                    } catch (Exception ex) {
                        failCount.incrementAndGet();
                        if (ex.getMessage() != null && ex.getMessage().toLowerCase().contains("deadlock")) {
                            deadlockCount.incrementAndGet();
                        }
                    } finally {
                        currentProgress.incrementAndGet();
                        latch.countDown();
                    }
                });
            }

            latch.await(180, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.warn("Load simulation interrupted: {}", e.getMessage());
        } finally {
            executor.shutdownNow();
            isRunning.set(false);
        }

        long endNano = System.nanoTime();
        long totalDurationMs = Math.max(1, (endNano - startNano) / 1_000_000);

        // Verification: Check total money conservation (Zero-Sum Invariant)
        List<Account> accountsAfter = accountRepository.findAllById(
                activeAccounts.stream().map(Account::getId).toList()
        );
        BigDecimal netBalanceAfter = accountsAfter.stream()
                .map(Account::getBalance)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        boolean moneyConserved = netBalanceBefore.compareTo(netBalanceAfter) == 0;

        // Compute Percentiles
        List<Double> sortedLatencies = new ArrayList<>(latenciesMs);
        Collections.sort(sortedLatencies);

        double minMs = sortedLatencies.isEmpty() ? 0.0 : sortedLatencies.get(0);
        double maxMs = sortedLatencies.isEmpty() ? 0.0 : sortedLatencies.get(sortedLatencies.size() - 1);
        double avgMs = sortedLatencies.isEmpty() ? 0.0 : sortedLatencies.stream().mapToDouble(d -> d).average().orElse(0.0);
        double p50Ms = getPercentile(sortedLatencies, 50.0);
        double p95Ms = getPercentile(sortedLatencies, 95.0);
        double p99Ms = getPercentile(sortedLatencies, 99.0);

        double tps = totalDurationMs > 0 ? (successCount.get() * 1000.0) / totalDurationMs : 0.0;

        LoadBenchmarkResult result = LoadBenchmarkResult.builder()
                .runId(runId)
                .status(cancelRequested.get() ? "CANCELLED" : "COMPLETED")
                .scenario(scenario)
                .concurrency(concurrency)
                .totalAttempted(successCount.get() + failCount.get())
                .totalSucceeded(successCount.get())
                .totalFailed(failCount.get())
                .totalDurationMs(totalDurationMs)
                .throughputTps(Math.round(tps * 10.0) / 10.0)
                .minLatencyMs(Math.round(minMs * 10.0) / 10.0)
                .maxLatencyMs(Math.round(maxMs * 10.0) / 10.0)
                .avgLatencyMs(Math.round(avgMs * 10.0) / 10.0)
                .p50LatencyMs(Math.round(p50Ms * 10.0) / 10.0)
                .p95LatencyMs(Math.round(p95Ms * 10.0) / 10.0)
                .p99LatencyMs(Math.round(p99Ms * 10.0) / 10.0)
                .moneyConserved(moneyConserved)
                .deadlockCount(deadlockCount.get())
                .timestamp(LocalDateTime.now())
                .build();

        this.latestResult = result;
        log.info("Load Benchmark [{}] Finished: Success={}/{}, Duration={}ms, TPS={}, P50={}ms, P95={}ms, P99={}ms, MoneyConserved={}",
                runId, result.getTotalSucceeded(), result.getTotalAttempted(), totalDurationMs,
                result.getThroughputTps(), result.getP50LatencyMs(), result.getP95LatencyMs(), result.getP99LatencyMs(), moneyConserved);

        return result;
    }

    private Account getRandomDifferentAccount(List<Account> accounts, Long excludeId) {
        List<Account> candidates = accounts.stream().filter(a -> !a.getId().equals(excludeId)).toList();
        if (candidates.isEmpty()) return accounts.get(0);
        return candidates.get(ThreadLocalRandom.current().nextInt(candidates.size()));
    }

    private double getPercentile(List<Double> sorted, double percentile) {
        if (sorted.isEmpty()) return 0.0;
        int index = (int) Math.ceil((percentile / 100.0) * sorted.size()) - 1;
        index = Math.max(0, Math.min(index, sorted.size() - 1));
        return sorted.get(index);
    }
}
