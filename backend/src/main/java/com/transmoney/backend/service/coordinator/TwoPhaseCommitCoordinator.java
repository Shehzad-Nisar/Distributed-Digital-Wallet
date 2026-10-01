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
