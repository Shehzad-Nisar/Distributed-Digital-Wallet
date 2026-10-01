package com.transmoney.backend.service.coordinator;

import com.transmoney.backend.dto.request.TransferRequest;
import com.transmoney.backend.entity.Account;
import com.transmoney.backend.entity.LedgerEntry;
import com.transmoney.backend.entity.Transaction;
import com.transmoney.backend.entity.enums.LedgerEntryType;
import com.transmoney.backend.entity.enums.TransactionStatus;
import com.transmoney.backend.entity.enums.TransactionType;
import com.transmoney.backend.exception.InsufficientBalanceException;
import com.transmoney.backend.exception.ResourceNotFoundException;
import com.transmoney.backend.exception.TransactionException;
import com.transmoney.backend.repository.AccountRepository;
import com.transmoney.backend.repository.LedgerEntryRepository;
import com.transmoney.backend.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class TwoPhaseCommitCoordinator {

    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final LedgerEntryRepository ledgerEntryRepository;

    /**
     * Executes an atomic transfer using Two-Phase Commit protocol semantics
     * with ordered pessimistic write locks to guarantee deadlock-free execution
     * and explicit persistent state transitions (INITIATED -> PREPARED -> COMMITTED).
     */
    @Transactional(isolation = Isolation.READ_COMMITTED, rollbackFor = Exception.class)
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

        // --- PHASE 0: INITIATE ---
        Transaction transaction = Transaction.builder()
                .transactionId(txId)
                .senderAccountId(senderAccount.getId())
                .receiverAccountId(receiverAccount.getId())
                .amount(request.getAmount())
                .currency(request.getCurrency())
                .description(request.getDescription())
                .type(TransactionType.P2P_TRANSFER)
                .status(TransactionStatus.INITIATED)
                .build();
        transaction = transactionRepository.save(transaction);

        // --- PHASE 1: PREPARE / VOTE ---
        boolean isCrossShard = !senderAccount.getShard().equals(receiverAccount.getShard());
        log.info("Phase 1 (Prepare): Validating accounts and shard topology [senderShard={}, receiverShard={}, crossShard={}]",
                senderAccount.getShard(), receiverAccount.getShard(), isCrossShard);

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

        if (!senderAccount.getCurrency().equalsIgnoreCase(request.getCurrency())) {
            transaction.setStatus(TransactionStatus.FAILED);
            transactionRepository.save(transaction);
            throw new TransactionException("Currency mismatch: sender currency " + senderAccount.getCurrency()
                    + " does not match requested currency " + request.getCurrency());
        }
        if (!receiverAccount.getCurrency().equalsIgnoreCase(request.getCurrency())) {
            transaction.setStatus(TransactionStatus.FAILED);
            transactionRepository.save(transaction);
            throw new TransactionException("Currency mismatch: receiver currency " + receiverAccount.getCurrency()
                    + " does not match requested currency " + request.getCurrency());
        }

        if (senderAccount.getBalance().compareTo(request.getAmount()) < 0) {
            log.warn("Phase 1 VOTE_ABORT: Sender account {} has insufficient balance (balance={}, required={})",
                    senderAccount.getId(), senderAccount.getBalance(), request.getAmount());
            transaction.setStatus(TransactionStatus.FAILED);
            transactionRepository.save(transaction);
            throw new InsufficientBalanceException("Insufficient balance in account " + senderAccount.getId()
                    + ". Current balance: " + senderAccount.getBalance() + ", requested: " + request.getAmount());
        }

        // Both shards vote COMMIT -> Transition to PREPARED
        transaction.setStatus(TransactionStatus.PREPARED);
        transaction = transactionRepository.save(transaction);
        log.info("Phase 1 VOTE_COMMIT: All participants validated successfully. Transitioned tx [{}] to PREPARED", txId);

        // --- PHASE 2: COMMIT ---
        log.info("Phase 2 (Commit): Applying atomic balance updates and immutable ledger entries");
        BigDecimal senderBalanceAfter = senderAccount.getBalance().subtract(request.getAmount());
        BigDecimal receiverBalanceAfter = receiverAccount.getBalance().add(request.getAmount());

        senderAccount.setBalance(senderBalanceAfter);
        receiverAccount.setBalance(receiverBalanceAfter);

        accountRepository.save(senderAccount);
        accountRepository.save(receiverAccount);

        transaction.setStatus(TransactionStatus.COMMITTED);
        transaction = transactionRepository.save(transaction);

        LedgerEntry debitEntry = LedgerEntry.builder()
                .transaction(transaction)
                .accountId(senderAccount.getId())
                .entryType(LedgerEntryType.DEBIT)
                .amount(request.getAmount())
                .balanceAfter(senderBalanceAfter)
                .build();

        LedgerEntry creditEntry = LedgerEntry.builder()
                .transaction(transaction)
                .accountId(receiverAccount.getId())
                .entryType(LedgerEntryType.CREDIT)
                .amount(request.getAmount())
                .balanceAfter(receiverBalanceAfter)
                .build();

        ledgerEntryRepository.save(debitEntry);
        ledgerEntryRepository.save(creditEntry);

        transaction.getLedgerEntries().add(debitEntry);
        transaction.getLedgerEntries().add(creditEntry);

        log.info("2PC transfer [{}] COMMITTED successfully across shards [senderShard={}, receiverShard={}]",
                txId, senderAccount.getShard(), receiverAccount.getShard());

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

        LedgerEntry debitEntry = LedgerEntry.builder()
                .transaction(transaction)
                .accountId(payerAccount.getId())
                .entryType(LedgerEntryType.DEBIT)
                .amount(grossAmount)
                .balanceAfter(payerBalanceAfter)
                .build();

        LedgerEntry creditEntry = LedgerEntry.builder()
                .transaction(transaction)
                .accountId(merchantAccount.getId())
                .entryType(LedgerEntryType.CREDIT)
                .amount(netAmount)
                .balanceAfter(merchantBalanceAfter)
                .build();

        ledgerEntryRepository.save(debitEntry);
        ledgerEntryRepository.save(creditEntry);

        transaction.getLedgerEntries().add(debitEntry);
        transaction.getLedgerEntries().add(creditEntry);

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
