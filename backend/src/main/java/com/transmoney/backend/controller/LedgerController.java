package com.transmoney.backend.controller;

import com.transmoney.backend.dto.response.ApiResponse;
import com.transmoney.backend.dto.response.LedgerEntryResponse;
import com.transmoney.backend.dto.response.ReconciliationResponse;
import com.transmoney.backend.service.LedgerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/ledger")
@RequiredArgsConstructor
public class LedgerController {

    private final LedgerService ledgerService;

    @GetMapping("/accounts/{accountId}/entries")
    public ResponseEntity<ApiResponse<List<LedgerEntryResponse>>> getEntriesByAccount(@PathVariable Long accountId) {
        List<LedgerEntryResponse> entries = ledgerService.getEntriesByAccountId(accountId);
        return ResponseEntity.ok(ApiResponse.ok("Ledger entries retrieved successfully", entries));
    }

    @GetMapping("/transactions/{txId}/entries")
    public ResponseEntity<ApiResponse<List<LedgerEntryResponse>>> getEntriesByTransaction(@PathVariable String txId) {
        List<LedgerEntryResponse> entries = ledgerService.getEntriesByTransactionId(txId);
        return ResponseEntity.ok(ApiResponse.ok("Transaction ledger entries retrieved successfully", entries));
    }

    @GetMapping("/reconcile/{accountId}")
    public ResponseEntity<ApiResponse<ReconciliationResponse>> reconcileAccount(@PathVariable Long accountId) {
        ReconciliationResponse reconciliation = ledgerService.reconcileAccount(accountId);
        return ResponseEntity.ok(ApiResponse.ok("Account reconciliation completed", reconciliation));
    }
}
