package com.transmoney.backend.service.coordinator;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class TransactionRecoveryCoordinator {

    private final TwoPhaseCommitCoordinator twoPhaseCommitCoordinator;

    /**
     * Periodic background recovery process executing every 60 seconds.
     * Sweeps for orphaned PREPARED or INITIATED transactions older than 30 seconds
     * (e.g. caused by coordinator crashes, thread death, or network partition)
     * and safely rolls them back.
     */
    @Scheduled(fixedDelay = 60000, initialDelay = 30000)
    public void scheduledTransactionSweep() {
        try {
            int recovered = twoPhaseCommitCoordinator.recoverStaleTransactions(30);
            if (recovered > 0) {
                log.info("TransactionRecoveryCoordinator: Swept and reconciled {} stale 2PC transactions", recovered);
            }
        } catch (Exception e) {
            log.error("TransactionRecoveryCoordinator: Error during scheduled recovery sweep", e);
        }
    }

    /**
     * Explicit on-demand manual recovery invocation.
     */
    public int triggerManualRecovery(long staleSeconds) {
        log.info("TransactionRecoveryCoordinator: Manual recovery triggered for transactions older than {}s", staleSeconds);
        return twoPhaseCommitCoordinator.recoverStaleTransactions(staleSeconds);
    }
}
