package com.transmoney.backend.service;

import com.transmoney.backend.dto.event.TransactionEvent;
import com.transmoney.backend.dto.request.CreateAccountRequest;
import com.transmoney.backend.dto.request.DepositRequest;
import com.transmoney.backend.dto.request.UpdateAccountStatusRequest;
import com.transmoney.backend.dto.request.WithdrawRequest;
import com.transmoney.backend.dto.response.AccountBalanceResponse;
import com.transmoney.backend.entity.Account;
import com.transmoney.backend.entity.Transaction;
import com.transmoney.backend.entity.User;
import com.transmoney.backend.entity.enums.LedgerEntryType;
import com.transmoney.backend.entity.enums.TransactionStatus;
import com.transmoney.backend.entity.enums.TransactionType;
import com.transmoney.backend.exception.InsufficientBalanceException;
import com.transmoney.backend.exception.ResourceNotFoundException;
import com.transmoney.backend.exception.TransactionException;
import com.transmoney.backend.repository.AccountRepository;
import com.transmoney.backend.repository.TransactionRepository;
import com.transmoney.backend.repository.UserRepository;
import com.transmoney.backend.service.cache.BalanceCacheService;
import com.transmoney.backend.service.queue.AsyncQueueBufferService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AccountService {

    private final AccountRepository accountRepository;
    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final LedgerService ledgerService;
    private final BalanceCacheService balanceCacheService;
    private final AsyncQueueBufferService queueBufferService;

    @Transactional
    public Account createAccount(CreateAccountRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + request.getUserId()));

        if (accountRepository.existsByAccountNumber(request.getAccountNumber())) {
            throw new IllegalArgumentException("Account with number " + request.getAccountNumber() + " already exists");
        }

        BigDecimal initialBalance = request.getInitialBalance() != null ? request.getInitialBalance() : BigDecimal.ZERO;

        Account account = Account.builder()
                .user(user)
                .accountNumber(request.getAccountNumber())
                .currency(request.getCurrency() != null ? request.getCurrency() : "PKR")
                .balance(initialBalance)
                .shard(request.getShard())
                .status("ACTIVE")
                .build();

        return accountRepository.save(account);
    }

    @Transactional(readOnly = true)
    public Account getAccountById(Long id) {
        return accountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with ID: " + id));
    }

    @Transactional(readOnly = true)
    public AccountBalanceResponse getBalance(Long accountId) {
        return balanceCacheService.getBalance(accountId).orElseGet(() -> {
            Account account = getAccountById(accountId);
            AccountBalanceResponse response = AccountBalanceResponse.builder()
                    .accountId(account.getId())
                    .accountNumber(account.getAccountNumber())
                    .balance(account.getBalance())
                    .currency(account.getCurrency())
                    .shard(account.getShard())
                    .status(account.getStatus())
                    .build();
            balanceCacheService.putBalance(accountId, response);
            return response;
        });
    }

    @Transactional(readOnly = true)
    public List<Account> getAccountsByUserId(Long userId) {
        return accountRepository.findByUserId(userId);
    }

    @Transactional(readOnly = true)
    public List<Account> getAllAccounts() {
        return accountRepository.findAll();
    }

    @Transactional
    public Account deposit(Long accountId, DepositRequest request) {
        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Deposit amount must be strictly positive");
        }

        Account account = accountRepository.findByIdForUpdate(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with ID: " + accountId));

        if (!"ACTIVE".equalsIgnoreCase(account.getStatus())) {
            throw new TransactionException("Cannot deposit to account " + account.getAccountNumber() + " because it is " + account.getStatus());
        }

        BigDecimal newBalance = account.getBalance().add(request.getAmount());
        account.setBalance(newBalance);
        Account savedAccount = accountRepository.save(account);

        String txId = "DEP-" + UUID.randomUUID().toString();
        String description = "Deposit via " + (request.getPaymentMethod() != null ? request.getPaymentMethod() : "BANK_LOAD")
                + (request.getReferenceNotes() != null && !request.getReferenceNotes().isBlank() ? " (" + request.getReferenceNotes() + ")" : "");

        Transaction transaction = Transaction.builder()
                .transactionId(txId)
                .senderAccountId(null)
                .receiverAccountId(account.getId())
                .amount(request.getAmount())
                .currency(account.getCurrency())
                .description(description)
                .type(TransactionType.DEPOSIT)
                .status(TransactionStatus.COMMITTED)
                .build();
        Transaction savedTx = transactionRepository.save(transaction);

        ledgerService.recordSingleEntry(savedTx, account.getId(), LedgerEntryType.CREDIT, request.getAmount(), newBalance);

        // Phase 7: Evict balance cache and push event to async queue buffer
        balanceCacheService.evictBalance(account.getId());
        queueBufferService.enqueueEvent(TransactionEvent.builder()
                .eventId("EVT-" + UUID.randomUUID())
                .eventType("DEPOSIT_COMPLETED")
                .transactionId(txId)
                .transactionType("DEPOSIT")
                .senderAccountId(null)
                .receiverAccountId(account.getId())
                .amount(request.getAmount())
                .currency(account.getCurrency())
                .targetAmount(request.getAmount())
                .targetCurrency(account.getCurrency())
                .receiverNewBalance(newBalance)
                .description(description)
                .timestamp(LocalDateTime.now())
                .build());

        log.info("Deposit [{}] completed: Credited {} {} to account {}", txId, request.getAmount(), account.getCurrency(), account.getAccountNumber());
        return savedAccount;
    }

    @Transactional
    public Account withdraw(Long accountId, WithdrawRequest request) {
        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Withdrawal amount must be strictly positive");
        }

        Account account = accountRepository.findByIdForUpdate(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with ID: " + accountId));

        if (!"ACTIVE".equalsIgnoreCase(account.getStatus())) {
            throw new TransactionException("Cannot withdraw from account " + account.getAccountNumber() + " because it is " + account.getStatus());
        }

        if (account.getBalance().compareTo(request.getAmount()) < 0) {
            throw new InsufficientBalanceException("Insufficient balance for withdrawal. Available: "
                    + account.getBalance() + ", Requested: " + request.getAmount());
        }

        BigDecimal newBalance = account.getBalance().subtract(request.getAmount());
        account.setBalance(newBalance);
        Account savedAccount = accountRepository.save(account);

        String txId = "WTH-" + UUID.randomUUID().toString();
        String description = "Withdrawal to " + request.getDestinationBank() + " [" + request.getDestinationAccountNumber() + "]"
                + (request.getReferenceNotes() != null && !request.getReferenceNotes().isBlank() ? " (" + request.getReferenceNotes() + ")" : "");

        Transaction transaction = Transaction.builder()
                .transactionId(txId)
                .senderAccountId(account.getId())
                .receiverAccountId(null)
                .amount(request.getAmount())
                .currency(account.getCurrency())
                .description(description)
                .type(TransactionType.WITHDRAWAL)
                .status(TransactionStatus.COMMITTED)
                .build();
        Transaction savedTx = transactionRepository.save(transaction);

        ledgerService.recordSingleEntry(savedTx, account.getId(), LedgerEntryType.DEBIT, request.getAmount(), newBalance);

        // Phase 7: Evict balance cache and push event to async queue buffer
        balanceCacheService.evictBalance(account.getId());
        queueBufferService.enqueueEvent(TransactionEvent.builder()
                .eventId("EVT-" + UUID.randomUUID())
                .eventType("WITHDRAWAL_COMPLETED")
                .transactionId(txId)
                .transactionType("WITHDRAWAL")
                .senderAccountId(account.getId())
                .receiverAccountId(null)
                .amount(request.getAmount())
                .currency(account.getCurrency())
                .targetAmount(request.getAmount())
                .targetCurrency(account.getCurrency())
                .senderNewBalance(newBalance)
                .description(description)
                .timestamp(LocalDateTime.now())
                .build());

        log.info("Withdrawal [{}] completed: Debited {} {} from account {}", txId, request.getAmount(), account.getCurrency(), account.getAccountNumber());
        return savedAccount;
    }

    @Transactional
    public Account updateAccountStatus(Long accountId, UpdateAccountStatusRequest request) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with ID: " + accountId));

        account.setStatus(request.getStatus().trim().toUpperCase());
        Account saved = accountRepository.save(account);
        balanceCacheService.evictBalance(accountId);
        log.info("Account {} status updated to {}", account.getAccountNumber(), saved.getStatus());
        return saved;
    }
}
