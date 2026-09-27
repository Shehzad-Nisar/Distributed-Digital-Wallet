package com.transmoney.backend.controller;

import com.transmoney.backend.dto.request.TransferRequest;
import com.transmoney.backend.dto.response.ApiResponse;
import com.transmoney.backend.dto.response.PageResponse;
import com.transmoney.backend.dto.response.TransactionResponse;
import com.transmoney.backend.dto.response.TransferResponse;
import com.transmoney.backend.entity.enums.TransactionStatus;
import com.transmoney.backend.entity.enums.TransactionType;
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

@Tag(name = "Transfers & Transactions", description = "Endpoints for executing distributed 2PC transfers and querying transaction audits")
@RestController
@RequiredArgsConstructor
public class TransferController {

    private final TransferService transferService;

    @Operation(
            summary = "Execute money transfer (2PC Coordinator)",
            description = "Initiates a distributed money transfer between accounts. Uses deterministic pessimistic locking, " +
                    "phase-1 voting (prepare), and phase-2 commit with double-entry ledger verification."
    )
    @PostMapping("/api/transfers")
    public ResponseEntity<ApiResponse<TransferResponse>> transfer(@Valid @RequestBody TransferRequest request) {
        TransferResponse response = transferService.executeTransfer(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Transfer completed successfully via 2PC coordinator", response));
    }

    @Operation(
            summary = "Get transaction details by Transaction ID",
            description = "Fetches complete transaction record including the immutable double-entry ledger entries (debit & credit)."
    )
    @GetMapping({"/api/transfers/{transactionId}", "/api/transactions/{transactionId}"})
    public ResponseEntity<ApiResponse<TransactionResponse>> getTransactionStatus(
            @Parameter(description = "Unique Transaction ID (e.g. TX-...)") @PathVariable String transactionId) {
        TransactionResponse response = transferService.getTransactionByTransactionId(transactionId);
        return ResponseEntity.ok(ApiResponse.ok("Transaction retrieved successfully", response));
    }

    @Operation(
            summary = "Global transaction search, filter and sort",
            description = "Searches across all transactions in the system with optional account, amount, date, and keyword filters."
    )
    @GetMapping("/api/transactions")
    public ResponseEntity<ApiResponse<PageResponse<TransactionResponse>>> getAllTransactions(
            @Parameter(description = "Optional account ID filter") @RequestParam(required = false) Long accountId,
            @Parameter(description = "Keyword search (matches description or transaction ID)") @RequestParam(required = false) String search,
            @Parameter(description = "Minimum amount filter") @RequestParam(required = false) BigDecimal minAmount,
            @Parameter(description = "Maximum amount filter") @RequestParam(required = false) BigDecimal maxAmount,
            @Parameter(description = "Start timestamp (ISO-8601)") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @Parameter(description = "End timestamp (ISO-8601)") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @Parameter(description = "Transaction type filter") @RequestParam(required = false) TransactionType type,
            @Parameter(description = "Transaction status filter") @RequestParam(required = false) TransactionStatus status,
            @Parameter(description = "Sort property (createdAt, amount, id)") @RequestParam(required = false, defaultValue = "createdAt") String sort,
            @Parameter(description = "Sort direction (asc, desc)") @RequestParam(required = false, defaultValue = "desc") String order,
            @Parameter(description = "Page number (0-indexed)") @RequestParam(required = false, defaultValue = "0") int page,
            @Parameter(description = "Page size (1-100)") @RequestParam(required = false, defaultValue = "20") int size
    ) {
        PageResponse<TransactionResponse> response = transferService.searchTransactions(
                accountId, search, minAmount, maxAmount, startDate, endDate, type, status, sort, order, page, size
        );
        return ResponseEntity.ok(ApiResponse.ok("Transactions retrieved successfully", response));
    }
}
