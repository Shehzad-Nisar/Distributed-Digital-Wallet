package com.transmoney.backend.controller;

import com.transmoney.backend.dto.request.CreateAccountRequest;
import com.transmoney.backend.dto.request.DepositRequest;
import com.transmoney.backend.dto.request.UpdateAccountStatusRequest;
import com.transmoney.backend.dto.request.WithdrawRequest;
import com.transmoney.backend.dto.response.AccountBalanceResponse;
import com.transmoney.backend.dto.response.ApiResponse;
import com.transmoney.backend.dto.response.PageResponse;
import com.transmoney.backend.dto.response.TransactionResponse;
import com.transmoney.backend.entity.Account;
import com.transmoney.backend.entity.enums.TransactionStatus;
import com.transmoney.backend.entity.enums.TransactionType;
import com.transmoney.backend.service.AccountService;
import com.transmoney.backend.service.TransferService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Tag(name = "Account Management", description = "Endpoints for managing accounts, querying real-time shard balances, depositing, withdrawing, and searching transaction history")
@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;
    private final TransferService transferService;

    @Operation(summary = "Create a new wallet account", description = "Provisions a new account assigned to a designated regional shard with an initial balance.")
    @PostMapping
    public ResponseEntity<ApiResponse<Account>> createAccount(@Valid @RequestBody CreateAccountRequest request) {
        Account account = accountService.createAccount(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Account created successfully", account));
    }

    @Operation(summary = "Get account details by ID", description = "Retrieves account metadata including its allocated database shard and status.")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Account>> getAccountById(@PathVariable Long id) {
        Account account = accountService.getAccountById(id);
        return ResponseEntity.ok(ApiResponse.ok(account));
    }

    @Operation(summary = "Get real-time account balance", description = "Queries the current available balance for the specified account.")
    @GetMapping("/{id}/balance")
    public ResponseEntity<ApiResponse<AccountBalanceResponse>> getBalance(@PathVariable Long id) {
        AccountBalanceResponse balanceResponse = accountService.getBalance(id);
        return ResponseEntity.ok(ApiResponse.ok("Account balance retrieved successfully", balanceResponse));
    }

    @Operation(summary = "List all accounts", description = "Returns all accounts, optionally filtered by user ID.")
    @GetMapping
    public ResponseEntity<ApiResponse<List<Account>>> getAllAccounts(
            @Parameter(description = "Optional user ID filter") @RequestParam(required = false) Long userId) {
        List<Account> accounts;
        if (userId != null) {
            accounts = accountService.getAccountsByUserId(userId);
        } else {
            accounts = accountService.getAllAccounts();
        }
        return ResponseEntity.ok(ApiResponse.ok(accounts));
    }

    @Operation(summary = "Search and filter account transactions", description = "Supports text search, amount range, date range, type/status filter, and sorting.")
    @GetMapping("/{id}/transactions")
    public ResponseEntity<ApiResponse<PageResponse<TransactionResponse>>> getAccountTransactions(
            @Parameter(description = "Account ID") @PathVariable Long id,
            @Parameter(description = "Keyword search (matches description or transaction ID)") @RequestParam(required = false) String search,
            @Parameter(description = "Minimum amount filter") @RequestParam(required = false) BigDecimal minAmount,
            @Parameter(description = "Maximum amount filter") @RequestParam(required = false) BigDecimal maxAmount,
            @Parameter(description = "Start timestamp (ISO-8601, e.g. 2026-09-01T00:00:00)") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @Parameter(description = "End timestamp (ISO-8601, e.g. 2026-09-30T23:59:59)") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @Parameter(description = "Transaction type filter") @RequestParam(required = false) TransactionType type,
            @Parameter(description = "Transaction status filter") @RequestParam(required = false) TransactionStatus status,
            @Parameter(description = "Sort property (createdAt, amount, id)") @RequestParam(required = false, defaultValue = "createdAt") String sort,
            @Parameter(description = "Sort direction (asc, desc)") @RequestParam(required = false, defaultValue = "desc") String order,
            @Parameter(description = "Page number (0-indexed)") @RequestParam(required = false, defaultValue = "0") int page,
            @Parameter(description = "Page size (1-100)") @RequestParam(required = false, defaultValue = "20") int size
    ) {
        PageResponse<TransactionResponse> response = transferService.searchTransactions(
                id, search, minAmount, maxAmount, startDate, endDate, type, status, sort, order, page, size
        );
        return ResponseEntity.ok(ApiResponse.ok("Transactions retrieved successfully", response));
    }

    @Operation(summary = "Deposit / Add funds into account", description = "Simulates an instant top-up/deposit into the account via Debit Card or Bank Wire, generating a double-entry CREDIT ledger record.")
    @PostMapping("/{id}/deposit")
    public ResponseEntity<ApiResponse<Account>> deposit(
            @PathVariable Long id,
            @Valid @RequestBody DepositRequest request) {
        Account account = accountService.deposit(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Funds deposited successfully", account));
    }

    @Operation(summary = "Withdraw funds from account", description = "Debits account balance and transfers funds to an external bank or payout destination, generating an immutable DEBIT ledger record.")
    @PostMapping("/{id}/withdraw")
    public ResponseEntity<ApiResponse<Account>> withdraw(
            @PathVariable Long id,
            @Valid @RequestBody WithdrawRequest request) {
        Account account = accountService.withdraw(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Funds withdrawn successfully", account));
    }

    @Operation(summary = "Update account operational status", description = "Updates account status to ACTIVE or FROZEN. Frozen accounts cannot send or receive transfers.")
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<Account>> updateAccountStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateAccountStatusRequest request) {
        Account account = accountService.updateAccountStatus(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Account status updated to " + account.getStatus(), account));
    }
}
