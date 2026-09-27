package com.transmoney.backend.controller;

import com.transmoney.backend.dto.request.TransferRequest;
import com.transmoney.backend.dto.response.ApiResponse;
import com.transmoney.backend.dto.response.TransactionResponse;
import com.transmoney.backend.dto.response.TransferResponse;
import com.transmoney.backend.service.TransferService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class TransferController {

    private final TransferService transferService;

    @PostMapping("/api/transfers")
    public ResponseEntity<ApiResponse<TransferResponse>> transfer(@Valid @RequestBody TransferRequest request) {
        TransferResponse response = transferService.executeTransfer(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Transfer completed successfully via 2PC coordinator", response));
    }

    @GetMapping({"/api/transfers/{transactionId}", "/api/transactions/{transactionId}"})
    public ResponseEntity<ApiResponse<TransactionResponse>> getTransactionStatus(@PathVariable String transactionId) {
        TransactionResponse response = transferService.getTransactionByTransactionId(transactionId);
        return ResponseEntity.ok(ApiResponse.ok("Transaction retrieved successfully", response));
    }
}
