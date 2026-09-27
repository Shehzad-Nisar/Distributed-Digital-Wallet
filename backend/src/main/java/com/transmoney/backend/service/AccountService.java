package com.transmoney.backend.service;

import com.transmoney.backend.dto.request.CreateAccountRequest;
import com.transmoney.backend.dto.response.AccountBalanceResponse;
import com.transmoney.backend.entity.Account;
import com.transmoney.backend.entity.User;
import com.transmoney.backend.exception.ResourceNotFoundException;
import com.transmoney.backend.repository.AccountRepository;
import com.transmoney.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AccountService {

    private final AccountRepository accountRepository;
    private final UserRepository userRepository;

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
        Account account = getAccountById(accountId);
        return AccountBalanceResponse.builder()
                .accountId(account.getId())
                .accountNumber(account.getAccountNumber())
                .balance(account.getBalance())
                .currency(account.getCurrency())
                .shard(account.getShard())
                .status(account.getStatus())
                .build();
    }

    @Transactional(readOnly = true)
    public List<Account> getAccountsByUserId(Long userId) {
        return accountRepository.findByUserId(userId);
    }

    @Transactional(readOnly = true)
    public List<Account> getAllAccounts() {
        return accountRepository.findAll();
    }
}
