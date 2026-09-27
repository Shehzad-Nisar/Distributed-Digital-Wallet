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
     * with ordered pessimistic write locks to guarantee deadlock-free execution.
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

        // --- DEADLOCK PREVENTION: Ordered Pessimistic Locking ---
        Long firstLockId = Math.min(request.getSenderAccountId(), request.getReceiverAccountId());
        Long secondLockId = Math.max(request.getSenderAccountId(), request.getReceiverAccountId());

        Account firstLocked = accountRepository.findByIdForUpdate(firstLockId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with ID: " + firstLockId));
        Account secondLocked = accountRepository.findByIdForUpdate(secondLockId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with ID: " + secondLockId));

        Account senderAccount = firstLockId.equals(request.getSenderAccountId()) ? firstLocked : secondLocked;
        Account receiverAccount = firstLockId.equals(request.getReceiverAccountId()) ? firstLocked : secondLocked;

        // --- PHASE 1: PREPARE / VOTE ---
        boolean isCrossShard = !senderAccount.getShard().equals(receiverAccount.getShard());
        log.info("Phase 1 (Prepare): Validating accounts and shard topology [crossShard={}]", isCrossShard);

        if (!"ACTIVE".equalsIgnoreCase(senderAccount.getStatus())) {
            throw new TransactionException("Sender account is not ACTIVE");
        }
        if (!"ACTIVE".equalsIgnoreCase(receiverAccount.getStatus())) {
            throw new TransactionException("Receiver account is not ACTIVE");
        }

        if (!senderAccount.getCurrency().equalsIgnoreCase(request.getCurrency())) {
            throw new TransactionException("Currency mismatch: sender currency " + senderAccount.getCurrency()
                    + " does not match requested currency " + request.getCurrency());
        }
        if (!receiverAccount.getCurrency().equalsIgnoreCase(request.getCurrency())) {
            throw new TransactionException("Currency mismatch: receiver currency " + receiverAccount.getCurrency()
                    + " does not match requested currency " + request.getCurrency());
        }

        if (senderAccount.getBalance().compareTo(request.getAmount()) < 0) {
            log.warn("Phase 1 VOTE_ABORT: Sender account {} has insufficient balance (balance={}, required={})",
                    senderAccount.getId(), senderAccount.getBalance(), request.getAmount());
            throw new InsufficientBalanceException("Insufficient balance in account " + senderAccount.getId()
                    + ". Current balance: " + senderAccount.getBalance() + ", requested: " + request.getAmount());
        }

        log.info("Phase 1 VOTE_COMMIT: All participants validated successfully");

        // --- PHASE 2: COMMIT ---
        log.info("Phase 2 (Commit): Applying double-entry balance updates and immutable ledger entries");
        BigDecimal senderBalanceAfter = senderAccount.getBalance().subtract(request.getAmount());
        BigDecimal receiverBalanceAfter = receiverAccount.getBalance().add(request.getAmount());

        senderAccount.setBalance(senderBalanceAfter);
        receiverAccount.setBalance(receiverBalanceAfter);

        accountRepository.save(senderAccount);
        accountRepository.save(receiverAccount);

        Transaction transaction = Transaction.builder()
                .transactionId(txId)
                .senderAccountId(senderAccount.getId())
                .receiverAccountId(receiverAccount.getId())
                .amount(request.getAmount())
                .currency(request.getCurrency())
                .description(request.getDescription())
                .type(TransactionType.P2P_TRANSFER)
                .status(TransactionStatus.COMMITTED)
                .build();

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
}
