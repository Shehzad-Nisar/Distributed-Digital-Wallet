package com.transmoney.backend.service.coordinator;

import com.transmoney.backend.dto.event.TransactionEvent;
import com.transmoney.backend.dto.request.TransferRequest;
import com.transmoney.backend.entity.Account;
import com.transmoney.backend.entity.LedgerEntry;
import com.transmoney.backend.entity.Transaction;
import com.transmoney.backend.entity.enums.LedgerEntryType;
import com.transmoney.backend.entity.enums.TransactionStatus;
import com.transmoney.backend.entity.enums.TransactionType;
import com.transmoney.backend.exception.CoordinatorCrashException;
import com.transmoney.backend.exception.InsufficientBalanceException;
import com.transmoney.backend.exception.ResourceNotFoundException;
import com.transmoney.backend.exception.TransactionException;
import com.transmoney.backend.repository.AccountRepository;
import com.transmoney.backend.repository.LedgerEntryRepository;
import com.transmoney.backend.repository.TransactionRepository;
import com.transmoney.backend.service.LedgerService;
import com.transmoney.backend.service.cache.BalanceCacheService;
import com.transmoney.backend.service.queue.AsyncQueueBufferService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class TwoPhaseCommitCoordinator {

    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final LedgerEntryRepository ledgerEntryRepository;
    private final LedgerService ledgerService;
    private final com.transmoney.backend.service.FxRateService fxRateService;
    private final BalanceCacheService balanceCacheService;
    private final AsyncQueueBufferService queueBufferService;
    private final com.transmoney.backend.service.chaos.ChaosEngineeringService chaosEngineeringService;

    /**
     * Executes an atomic transfer using Two-Phase Commit protocol semantics
     * with ordered pessimistic write locks to guarantee deadlock-free execution
     * and explicit persistent state transitions (INITIATED -> PREPARED -> COMMITTED).
     * Supports both same-currency and cross-currency multi-shard transfers.
     */
    @Transactional(
            isolation = Isolation.READ_COMMITTED,
            rollbackFor = Exception.class,
            noRollbackFor = com.transmoney.backend.exception.CoordinatorCrashException.class
    )
    public Transaction executeTransfer(TransferRequest request) {
        String txId = "TX-" + UUID.randomUUID().toString();
        log.info("Starting 2PC transfer [{}] from account {} to account {} for amount {} {}",
                txId, request.getSenderAccountId(), request.getReceiverAccountId(), request.getAmount(), request.getCurrency());

        if (request.getSenderAccountId().equals(request.getReceiverAccountId())) {
            throw new IllegalArgumentException("Sender and receiver accounts cannot be the same");
        }

        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Transfer amount must be strictly positive");
        }

        // --- DEADLOCK PREVENTION: Deterministic Hierarchical Locking by Account ID ---
        Long firstLockId = Math.min(request.getSenderAccountId(), request.getReceiverAccountId());
        Long secondLockId = Math.max(request.getSenderAccountId(), request.getReceiverAccountId());
        log.info("2PC Deadlock Prevention: Acquired ordered locks [first={}, second={}]", firstLockId, secondLockId);

        Account firstLocked = accountRepository.findByIdForUpdate(firstLockId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with ID: " + firstLockId));
        Account secondLocked = accountRepository.findByIdForUpdate(secondLockId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with ID: " + secondLockId));

        Account senderAccount = firstLockId.equals(request.getSenderAccountId()) ? firstLocked : secondLocked;
        Account receiverAccount = firstLockId.equals(request.getReceiverAccountId()) ? firstLocked : secondLocked;

        boolean isCrossCurrency = !senderAccount.getCurrency().equalsIgnoreCase(receiverAccount.getCurrency());

        // --- PHASE 0: INITIATE ---
        Transaction transaction = Transaction.builder()
                .transactionId(txId)
                .senderAccountId(senderAccount.getId())
                .receiverAccountId(receiverAccount.getId())
                .amount(request.getAmount())
                .currency(senderAccount.getCurrency())
                .description(request.getDescription())
                .type(isCrossCurrency ? TransactionType.CURRENCY_EXCHANGE : TransactionType.P2P_TRANSFER)
                .status(TransactionStatus.INITIATED)
                .build();
        transaction = transactionRepository.save(transaction);

        // --- PHASE 1: PREPARE / VOTE ---
        chaosEngineeringService.injectPreparePhaseChaos(txId, senderAccount.getId(), receiverAccount.getId());

        boolean isCrossShard = !senderAccount.getShard().equals(receiverAccount.getShard());
        log.info("Phase 1 (Prepare): Validating accounts and topology [senderShard={}, receiverShard={}, crossShard={}, crossCurrency={}]",
                senderAccount.getShard(), receiverAccount.getShard(), isCrossShard, isCrossCurrency);

        if (!"ACTIVE".equalsIgnoreCase(senderAccount.getStatus())) {
            transaction.setStatus(TransactionStatus.FAILED);
            transactionRepository.save(transaction);
            throw new TransactionException("Sender account is not ACTIVE (current status: " + senderAccount.getStatus() + ")");
        }
        if (!"ACTIVE".equalsIgnoreCase(receiverAccount.getStatus())) {
            transaction.setStatus(TransactionStatus.FAILED);
            transactionRepository.save(transaction);
            throw new TransactionException("Receiver account is not ACTIVE (current status: " + receiverAccount.getStatus() + ")");
        }

        BigDecimal targetAmount;
        BigDecimal effectiveRate;

        if (isCrossCurrency) {
            log.info("Phase 1 (Prepare): Computing cross-currency FX rate [{} -> {}] for amount {}",
                    senderAccount.getCurrency(), receiverAccount.getCurrency(), request.getAmount());
            try {
                com.transmoney.backend.service.FxRateService.ConversionResult conversion = fxRateService.executeConversion(
                        senderAccount.getCurrency(),
                        receiverAccount.getCurrency(),
                        request.getAmount(),
                        null,
                        request.getExpectedRate(),
                        request.getMinTargetAmount(),
                        request.getMaxSlippagePercent()
                );
                targetAmount = conversion.targetAmount();
                effectiveRate = conversion.effectiveRate();
                log.info("Phase 1 (Prepare): FX conversion computed successfully: {} {} -> {} {} (effectiveRate={})",
                        request.getAmount(), senderAccount.getCurrency(), targetAmount, receiverAccount.getCurrency(), effectiveRate);
            } catch (Exception ex) {
                log.warn("Phase 1 VOTE_ABORT: FX conversion or slippage validation failed for tx [{}]: {}", txId, ex.getMessage());
                transaction.setStatus(TransactionStatus.FAILED);
                transactionRepository.save(transaction);
                throw ex;
            }
        } else {
            if (request.getCurrency() != null && !senderAccount.getCurrency().equalsIgnoreCase(request.getCurrency())) {
                transaction.setStatus(TransactionStatus.FAILED);
                transactionRepository.save(transaction);
                throw new TransactionException("Currency mismatch: sender currency " + senderAccount.getCurrency()
                        + " does not match requested currency " + request.getCurrency());
            }
            targetAmount = request.getAmount();
            effectiveRate = BigDecimal.ONE;
        }

        if (senderAccount.getBalance().compareTo(request.getAmount()) < 0) {
            log.warn("Phase 1 VOTE_ABORT: Sender account {} has insufficient balance (balance={}, required={})",
                    senderAccount.getId(), senderAccount.getBalance(), request.getAmount());
            transaction.setStatus(TransactionStatus.FAILED);
            transactionRepository.save(transaction);
            throw new InsufficientBalanceException("Insufficient balance in account " + senderAccount.getId()
                    + ". Current balance: " + senderAccount.getBalance() + ", requested: " + request.getAmount());
        }

        // Both participants vote COMMIT -> Transition to PREPARED
        transaction.setStatus(TransactionStatus.PREPARED);
        transaction = transactionRepository.save(transaction);
        log.info("Phase 1 VOTE_COMMIT: All participants validated successfully. Transitioned tx [{}] to PREPARED", txId);

        // --- CHAOS MONKEY: Coordinator Crash Simulation after PREPARED ---
        if (chaosEngineeringService.shouldSimulateCoordinatorCrash()) {
            log.error("CHAOS FAULT: Simulated coordinator crash after PREPARED phase on transaction [{}]", txId);
            throw new CoordinatorCrashException("Coordinator crashed after PREPARED phase on transaction " + txId);
        }

        // --- PHASE 2: COMMIT ---
        log.info("Phase 2 (Commit): Applying atomic balance updates and immutable ledger entries");
        BigDecimal senderBalanceAfter = senderAccount.getBalance().subtract(request.getAmount());
        BigDecimal receiverBalanceAfter = receiverAccount.getBalance().add(targetAmount);

        senderAccount.setBalance(senderBalanceAfter);
        receiverAccount.setBalance(receiverBalanceAfter);

        accountRepository.save(senderAccount);
        accountRepository.save(receiverAccount);

        transaction.setTargetAmount(targetAmount);
        transaction.setTargetCurrency(receiverAccount.getCurrency());
        transaction.setExchangeRate(effectiveRate);
        transaction.setStatus(TransactionStatus.COMMITTED);
        transaction = transactionRepository.save(transaction);

        if (!isCrossCurrency) {
            ledgerService.recordDoubleEntry(transaction,
                    senderAccount.getId(), senderBalanceAfter,
                    receiverAccount.getId(), receiverBalanceAfter,
                    request.getAmount());
        } else {
            // Immutable ledger entries in respective account home currencies
            ledgerService.recordSingleEntry(transaction, senderAccount.getId(), LedgerEntryType.DEBIT, request.getAmount(), senderBalanceAfter);
            ledgerService.recordSingleEntry(transaction, receiverAccount.getId(), LedgerEntryType.CREDIT, targetAmount, receiverBalanceAfter);
        }

        // Phase 7: Evict balance cache for both accounts and buffer event asynchronously
        balanceCacheService.evictBalances(senderAccount.getId(), receiverAccount.getId());
        queueBufferService.enqueueEvent(TransactionEvent.builder()
                .eventId("EVT-" + UUID.randomUUID())
                .eventType("P2P_TRANSFER_COMMITTED")
                .transactionId(txId)
                .transactionType(isCrossCurrency ? "CURRENCY_EXCHANGE" : "P2P_TRANSFER")
                .senderAccountId(senderAccount.getId())
                .receiverAccountId(receiverAccount.getId())
                .amount(request.getAmount())
                .currency(senderAccount.getCurrency())
                .targetAmount(targetAmount)
                .targetCurrency(receiverAccount.getCurrency())
                .senderNewBalance(senderBalanceAfter)
                .receiverNewBalance(receiverBalanceAfter)
                .description(request.getDescription())
                .timestamp(LocalDateTime.now())
                .build());

        log.info("2PC transfer [{}] COMMITTED successfully across shards [senderShard={}, receiverShard={}, crossCurrency={}]",
                txId, senderAccount.getShard(), receiverAccount.getShard(), isCrossCurrency);

        return transaction;
    }

    /**
     * Executes an atomic Currency Exchange between two accounts (can be same user or cross-user)
     * using Two-Phase Commit with deterministic row locking and real-time FX rate settlement.
     */
    @Transactional(isolation = Isolation.READ_COMMITTED, rollbackFor = Exception.class)
    public Transaction executeCurrencyExchange(com.transmoney.backend.dto.request.ExchangeRequest request) {
        String txId = "TX-EXC-" + UUID.randomUUID().toString();
        log.info("Starting 2PC Currency Exchange [{}] from account {} to account {} for amount {}",
                txId, request.getSourceAccountId(), request.getTargetAccountId(), request.getSourceAmount());

        if (request.getSourceAccountId().equals(request.getTargetAccountId())) {
            throw new IllegalArgumentException("Source and target accounts for currency exchange cannot be the same");
        }

        if (request.getSourceAmount() == null || request.getSourceAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Exchange source amount must be strictly positive");
        }

        // --- DEADLOCK PREVENTION: Deterministic Hierarchical Locking ---
        Long firstLockId = Math.min(request.getSourceAccountId(), request.getTargetAccountId());
        Long secondLockId = Math.max(request.getSourceAccountId(), request.getTargetAccountId());

        Account firstLocked = accountRepository.findByIdForUpdate(firstLockId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with ID: " + firstLockId));
        Account secondLocked = accountRepository.findByIdForUpdate(secondLockId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with ID: " + secondLockId));

        Account sourceAccount = firstLockId.equals(request.getSourceAccountId()) ? firstLocked : secondLocked;
        Account targetAccount = firstLockId.equals(request.getTargetAccountId()) ? firstLocked : secondLocked;

        // --- PHASE 0: INITIATE ---
        Transaction transaction = Transaction.builder()
                .transactionId(txId)
                .senderAccountId(sourceAccount.getId())
                .receiverAccountId(targetAccount.getId())
                .amount(request.getSourceAmount())
                .currency(sourceAccount.getCurrency())
                .description(request.getDescription() != null ? request.getDescription() :
                        String.format("FX Exchange: %s %s to %s", request.getSourceAmount(), sourceAccount.getCurrency(), targetAccount.getCurrency()))
                .type(TransactionType.CURRENCY_EXCHANGE)
                .status(TransactionStatus.INITIATED)
                .build();
        transaction = transactionRepository.save(transaction);

        // --- PHASE 1: PREPARE / VOTE ---
        if (!"ACTIVE".equalsIgnoreCase(sourceAccount.getStatus())) {
            transaction.setStatus(TransactionStatus.FAILED);
            transactionRepository.save(transaction);
            throw new TransactionException("Source account is not ACTIVE (current status: " + sourceAccount.getStatus() + ")");
        }
        if (!"ACTIVE".equalsIgnoreCase(targetAccount.getStatus())) {
            transaction.setStatus(TransactionStatus.FAILED);
            transactionRepository.save(transaction);
            throw new TransactionException("Target account is not ACTIVE (current status: " + targetAccount.getStatus() + ")");
        }

        com.transmoney.backend.service.FxRateService.ConversionResult conversion;
        try {
            conversion = fxRateService.executeConversion(
                    sourceAccount.getCurrency(),
                    targetAccount.getCurrency(),
                    request.getSourceAmount(),
                    request.getQuoteId(),
                    request.getExpectedRate(),
                    request.getMinTargetAmount(),
                    request.getMaxSlippagePercent()
            );
        } catch (Exception ex) {
            log.warn("Phase 1 VOTE_ABORT: Exchange calculation failed for tx [{}]: {}", txId, ex.getMessage());
            transaction.setStatus(TransactionStatus.FAILED);
            transactionRepository.save(transaction);
            throw ex;
        }

        if (sourceAccount.getBalance().compareTo(request.getSourceAmount()) < 0) {
            log.warn("Phase 1 VOTE_ABORT: Source account {} has insufficient balance (balance={}, required={})",
                    sourceAccount.getId(), sourceAccount.getBalance(), request.getSourceAmount());
            transaction.setStatus(TransactionStatus.FAILED);
            transactionRepository.save(transaction);
            throw new InsufficientBalanceException("Insufficient balance in source account " + sourceAccount.getId()
                    + ". Current balance: " + sourceAccount.getBalance() + ", requested: " + request.getSourceAmount());
        }

        transaction.setStatus(TransactionStatus.PREPARED);
        transaction = transactionRepository.save(transaction);
        log.info("Phase 1 VOTE_COMMIT: Currency exchange [{}] PREPARED successfully", txId);

        // --- PHASE 2: COMMIT ---
        BigDecimal sourceBalanceAfter = sourceAccount.getBalance().subtract(request.getSourceAmount());
        BigDecimal targetBalanceAfter = targetAccount.getBalance().add(conversion.targetAmount());

        sourceAccount.setBalance(sourceBalanceAfter);
        targetAccount.setBalance(targetBalanceAfter);

        accountRepository.save(sourceAccount);
        accountRepository.save(targetAccount);

        transaction.setTargetAmount(conversion.targetAmount());
        transaction.setTargetCurrency(targetAccount.getCurrency());
        transaction.setExchangeRate(conversion.effectiveRate());
        transaction.setStatus(TransactionStatus.COMMITTED);
        transaction = transactionRepository.save(transaction);

        ledgerService.recordSingleEntry(transaction, sourceAccount.getId(), LedgerEntryType.DEBIT, request.getSourceAmount(), sourceBalanceAfter);
        ledgerService.recordSingleEntry(transaction, targetAccount.getId(), LedgerEntryType.CREDIT, conversion.targetAmount(), targetBalanceAfter);

        // Phase 7: Evict balance cache for both accounts and buffer event asynchronously
        balanceCacheService.evictBalances(sourceAccount.getId(), targetAccount.getId());
        queueBufferService.enqueueEvent(TransactionEvent.builder()
                .eventId("EVT-" + UUID.randomUUID())
                .eventType("EXCHANGE_COMMITTED")
                .transactionId(txId)
                .transactionType("CURRENCY_EXCHANGE")
                .senderAccountId(sourceAccount.getId())
                .receiverAccountId(targetAccount.getId())
                .amount(request.getSourceAmount())
                .currency(sourceAccount.getCurrency())
                .targetAmount(conversion.targetAmount())
                .targetCurrency(targetAccount.getCurrency())
                .senderNewBalance(sourceBalanceAfter)
                .receiverNewBalance(targetBalanceAfter)
                .description(transaction.getDescription())
                .timestamp(LocalDateTime.now())
                .build());

        log.info("2PC Currency Exchange [{}] COMMITTED: Debited {} {} from acc {}, Credited {} {} to acc {}",
                txId, request.getSourceAmount(), sourceAccount.getCurrency(), sourceAccount.getId(),
                conversion.targetAmount(), targetAccount.getCurrency(), targetAccount.getId());

        return transaction;
    }

    /**
     * Executes an atomic merchant QR payment using Two-Phase Commit semantics
     * with deterministic ordered row locks, MDR fee deduction, and immutable ledger entries.
     */
    @Transactional(isolation = Isolation.READ_COMMITTED, rollbackFor = Exception.class)
    public Transaction executeMerchantPayment(
            Long payerAccountId,
            Long merchantAccountId,
            BigDecimal grossAmount,
            BigDecimal feeAmount,
            String currency,
            String description,
            String orderRef
    ) {
        String txId = "TX-MCH-" + UUID.randomUUID().toString();
        log.info("Starting 2PC Merchant Payment [{}] from payer {} to merchant {} for gross {} {} (fee: {})",
                txId, payerAccountId, merchantAccountId, grossAmount, currency, feeAmount);

        if (payerAccountId.equals(merchantAccountId)) {
            throw new IllegalArgumentException("Payer and merchant accounts cannot be the same");
        }

        if (grossAmount == null || grossAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Payment gross amount must be strictly positive");
        }

        BigDecimal netAmount = grossAmount.subtract(feeAmount != null ? feeAmount : BigDecimal.ZERO);
        if (netAmount.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Net payment amount cannot be negative");
        }

        // --- DEADLOCK PREVENTION: Ordered Hierarchical Locking ---
        Long firstLockId = Math.min(payerAccountId, merchantAccountId);
        Long secondLockId = Math.max(payerAccountId, merchantAccountId);

        Account firstLocked = accountRepository.findByIdForUpdate(firstLockId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with ID: " + firstLockId));
        Account secondLocked = accountRepository.findByIdForUpdate(secondLockId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with ID: " + secondLockId));

        Account payerAccount = firstLockId.equals(payerAccountId) ? firstLocked : secondLocked;
        Account merchantAccount = firstLockId.equals(merchantAccountId) ? firstLocked : secondLocked;

        // --- PHASE 0: INITIATE ---
        Transaction transaction = Transaction.builder()
                .transactionId(txId)
                .senderAccountId(payerAccount.getId())
                .receiverAccountId(merchantAccount.getId())
                .amount(grossAmount)
                .currency(currency != null ? currency : payerAccount.getCurrency())
                .description((description != null ? description : "Merchant Payment") + (orderRef != null ? " [Ref: " + orderRef + "]" : ""))
                .type(TransactionType.MERCHANT_PAYMENT)
                .status(TransactionStatus.INITIATED)
                .build();
        transaction = transactionRepository.save(transaction);

        // --- PHASE 1: PREPARE / VOTE ---
        if (!"ACTIVE".equalsIgnoreCase(payerAccount.getStatus())) {
            transaction.setStatus(TransactionStatus.FAILED);
            transactionRepository.save(transaction);
            throw new TransactionException("Payer account is not ACTIVE (current status: " + payerAccount.getStatus() + ")");
        }
        if (!"ACTIVE".equalsIgnoreCase(merchantAccount.getStatus())) {
            transaction.setStatus(TransactionStatus.FAILED);
            transactionRepository.save(transaction);
            throw new TransactionException("Merchant account is not ACTIVE (current status: " + merchantAccount.getStatus() + ")");
        }

        if (!payerAccount.getCurrency().equalsIgnoreCase(transaction.getCurrency())) {
            transaction.setStatus(TransactionStatus.FAILED);
            transactionRepository.save(transaction);
            throw new TransactionException("Currency mismatch with payer account currency: " + payerAccount.getCurrency());
        }

        if (payerAccount.getBalance().compareTo(grossAmount) < 0) {
            log.warn("Phase 1 VOTE_ABORT: Payer account {} has insufficient balance (balance={}, required={})",
                    payerAccount.getId(), payerAccount.getBalance(), grossAmount);
            transaction.setStatus(TransactionStatus.FAILED);
            transactionRepository.save(transaction);
            throw new InsufficientBalanceException("Insufficient balance in account " + payerAccount.getId()
                    + ". Current balance: " + payerAccount.getBalance() + ", requested: " + grossAmount);
        }

        transaction.setStatus(TransactionStatus.PREPARED);
        transaction = transactionRepository.save(transaction);
        log.info("Phase 1 VOTE_COMMIT: Merchant payment [{}] prepared successfully", txId);

        // --- PHASE 2: COMMIT ---
        BigDecimal payerBalanceAfter = payerAccount.getBalance().subtract(grossAmount);
        BigDecimal merchantBalanceAfter = merchantAccount.getBalance().add(netAmount);

        payerAccount.setBalance(payerBalanceAfter);
        merchantAccount.setBalance(merchantBalanceAfter);

        accountRepository.save(payerAccount);
        accountRepository.save(merchantAccount);

        transaction.setStatus(TransactionStatus.COMMITTED);
        transaction = transactionRepository.save(transaction);

        ledgerService.recordSingleEntry(transaction, payerAccount.getId(), LedgerEntryType.DEBIT, grossAmount, payerBalanceAfter);
        ledgerService.recordSingleEntry(transaction, merchantAccount.getId(), LedgerEntryType.CREDIT, netAmount, merchantBalanceAfter);

        // Phase 7: Evict balance cache for both accounts and buffer event asynchronously
        balanceCacheService.evictBalances(payerAccount.getId(), merchantAccount.getId());
        queueBufferService.enqueueEvent(TransactionEvent.builder()
                .eventId("EVT-" + UUID.randomUUID())
                .eventType("MERCHANT_PAYMENT_COMMITTED")
                .transactionId(txId)
                .transactionType("MERCHANT_PAYMENT")
                .senderAccountId(payerAccount.getId())
                .receiverAccountId(merchantAccount.getId())
                .amount(grossAmount)
                .currency(transaction.getCurrency())
                .targetAmount(netAmount)
                .targetCurrency(merchantAccount.getCurrency())
                .senderNewBalance(payerBalanceAfter)
                .receiverNewBalance(merchantBalanceAfter)
                .description(transaction.getDescription())
                .timestamp(LocalDateTime.now())
                .build());

        log.info("2PC Merchant Payment [{}] COMMITTED successfully across shards [payerShard={}, merchantShard={}]",
                txId, payerAccount.getShard(), merchantAccount.getShard());

        return transaction;
    }

    /**
     * Scans for stale orphaned transactions stuck in PREPARED or INITIATED state
     * (e.g., from coordinator crash or network timeout) and aborts them cleanly.
     */
    @Transactional
    public int recoverStaleTransactions(long staleOlderThanSeconds) {
        java.time.LocalDateTime cutoff = java.time.LocalDateTime.now().minusSeconds(staleOlderThanSeconds);
        java.util.List<Transaction> stalePrepared = transactionRepository.findByStatusAndCreatedAtBefore(TransactionStatus.PREPARED, cutoff);
        java.util.List<Transaction> staleInitiated = transactionRepository.findByStatusAndCreatedAtBefore(TransactionStatus.INITIATED, cutoff);

        int recoveredCount = 0;
        for (Transaction tx : stalePrepared) {
            log.warn("2PC Recovery: Found orphaned PREPARED transaction [{}]. Marking FAILED.", tx.getTransactionId());
            tx.setStatus(TransactionStatus.FAILED);
            transactionRepository.save(tx);
            recoveredCount++;
        }
        for (Transaction tx : staleInitiated) {
            log.warn("2PC Recovery: Found orphaned INITIATED transaction [{}]. Marking FAILED.", tx.getTransactionId());
            tx.setStatus(TransactionStatus.FAILED);
            transactionRepository.save(tx);
            recoveredCount++;
        }

        if (recoveredCount > 0) {
            log.info("2PC Recovery: Successfully reconciled {} stale transactions", recoveredCount);
        }
        return recoveredCount;
    }
}
