package com.transmoney.backend.service;

import com.transmoney.backend.dto.response.LedgerEntryResponse;
import com.transmoney.backend.dto.response.ReconciliationResponse;
import com.transmoney.backend.entity.Account;
import com.transmoney.backend.entity.LedgerEntry;
import com.transmoney.backend.entity.Transaction;
import com.transmoney.backend.entity.enums.LedgerEntryType;
import com.transmoney.backend.exception.ResourceNotFoundException;
import com.transmoney.backend.repository.AccountRepository;
import com.transmoney.backend.repository.LedgerEntryRepository;
import com.transmoney.backend.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class LedgerService {

    private final LedgerEntryRepository ledgerEntryRepository;
    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;

    @Transactional
    public LedgerEntry recordSingleEntry(Transaction transaction, Long accountId, LedgerEntryType entryType, BigDecimal amount, BigDecimal balanceAfter) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Ledger entry amount must be strictly positive");
        }

        LedgerEntry entry = LedgerEntry.builder()
                .transaction(transaction)
                .accountId(accountId)
                .entryType(entryType)
                .amount(amount)
                .balanceAfter(balanceAfter)
                .build();

        LedgerEntry saved = ledgerEntryRepository.save(entry);
        if (transaction != null && transaction.getLedgerEntries() != null) {
            transaction.getLedgerEntries().add(saved);
        }

        log.debug("Recorded single ledger entry: id={}, accountId={}, type={}, amount={}, balanceAfter={}",
                saved.getId(), accountId, entryType, amount, balanceAfter);
        return saved;
    }

    @Transactional
    public List<LedgerEntry> recordDoubleEntry(Transaction transaction,
                                               Long debitAccountId, BigDecimal debitBalanceAfter,
                                               Long creditAccountId, BigDecimal creditBalanceAfter,
                                               BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Double-entry amount must be strictly positive");
        }

        LedgerEntry debitEntry = LedgerEntry.builder()
                .transaction(transaction)
                .accountId(debitAccountId)
                .entryType(LedgerEntryType.DEBIT)
                .amount(amount)
                .balanceAfter(debitBalanceAfter)
                .build();

        LedgerEntry creditEntry = LedgerEntry.builder()
                .transaction(transaction)
                .accountId(creditAccountId)
                .entryType(LedgerEntryType.CREDIT)
                .amount(amount)
                .balanceAfter(creditBalanceAfter)
                .build();

        LedgerEntry savedDebit = ledgerEntryRepository.save(debitEntry);
        LedgerEntry savedCredit = ledgerEntryRepository.save(creditEntry);

        if (transaction != null && transaction.getLedgerEntries() != null) {
            transaction.getLedgerEntries().add(savedDebit);
            transaction.getLedgerEntries().add(savedCredit);
        }

        log.info("Recorded GAAP double-entry [zero-sum balance]: DEBIT account {} ({}), CREDIT account {} ({})",
                debitAccountId, amount, creditAccountId, amount);

        List<LedgerEntry> entries = new ArrayList<>();
        entries.add(savedDebit);
        entries.add(savedCredit);
        return entries;
    }

    @Transactional(readOnly = true)
    public List<LedgerEntryResponse> getEntriesByAccountId(Long accountId) {
        return ledgerEntryRepository.findByAccountIdOrderByCreatedAtDesc(accountId)
                .stream()
                .map(LedgerEntryResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LedgerEntryResponse> getEntriesByTransactionId(String transactionId) {
        Transaction tx = transactionRepository.findByTransactionId(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found with ID: " + transactionId));
        return ledgerEntryRepository.findByTransaction(tx)
                .stream()
                .map(LedgerEntryResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ReconciliationResponse reconcileAccount(Long accountId) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with ID: " + accountId));

        List<LedgerEntry> entries = ledgerEntryRepository.findByAccountIdOrderByCreatedAtDesc(accountId);

        BigDecimal totalCredits = BigDecimal.ZERO;
        BigDecimal totalDebits = BigDecimal.ZERO;

        for (LedgerEntry entry : entries) {
            if (entry.getEntryType() == LedgerEntryType.CREDIT) {
                totalCredits = totalCredits.add(entry.getAmount());
            } else if (entry.getEntryType() == LedgerEntryType.DEBIT) {
                totalDebits = totalDebits.add(entry.getAmount());
            }
        }

        BigDecimal calculatedLedgerBalance = totalCredits.subtract(totalDebits);
        boolean isBalanced = account.getBalance().compareTo(calculatedLedgerBalance) == 0;

        String statusMessage = isBalanced
                ? "Account ledger is fully balanced. Invariant checksum passed."
                : String.format("DISCREPANCY DETECTED: Account balance is %s but ledger net is %s (delta: %s)",
                        account.getBalance(), calculatedLedgerBalance, account.getBalance().subtract(calculatedLedgerBalance));

        log.info("Reconciliation for account [{} - {}]: currentBalance={}, calculatedBalance={}, isBalanced={}",
                accountId, account.getAccountNumber(), account.getBalance(), calculatedLedgerBalance, isBalanced);

        return ReconciliationResponse.builder()
                .accountId(account.getId())
                .accountNumber(account.getAccountNumber())
                .currency(account.getCurrency())
                .currentBalance(account.getBalance())
                .calculatedLedgerBalance(calculatedLedgerBalance)
                .totalDebits(totalDebits)
                .totalCredits(totalCredits)
                .balanced(isBalanced)
                .totalEntries(entries.size())
                .statusMessage(statusMessage)
                .build();
    }
}
