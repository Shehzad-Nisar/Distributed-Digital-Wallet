package com.transmoney.backend.controller;

import com.transmoney.backend.dto.request.CreateAccountRequest;
import com.transmoney.backend.dto.response.AccountBalanceResponse;
import com.transmoney.backend.dto.response.ApiResponse;
import com.transmoney.backend.entity.Account;
import com.transmoney.backend.service.AccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;

    @PostMapping
    public ResponseEntity<ApiResponse<Account>> createAccount(@Valid @RequestBody CreateAccountRequest request) {
        Account account = accountService.createAccount(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Account created successfully", account));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Account>> getAccountById(@PathVariable Long id) {
        Account account = accountService.getAccountById(id);
        return ResponseEntity.ok(ApiResponse.ok(account));
    }

    @GetMapping("/{id}/balance")
    public ResponseEntity<ApiResponse<AccountBalanceResponse>> getBalance(@PathVariable Long id) {
        AccountBalanceResponse balanceResponse = accountService.getBalance(id);
        return ResponseEntity.ok(ApiResponse.ok("Account balance retrieved successfully", balanceResponse));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Account>>> getAllAccounts(@RequestParam(required = false) Long userId) {
        List<Account> accounts;
        if (userId != null) {
            accounts = accountService.getAccountsByUserId(userId);
        } else {
            accounts = accountService.getAllAccounts();
        }
        return ResponseEntity.ok(ApiResponse.ok(accounts));
    }
}
