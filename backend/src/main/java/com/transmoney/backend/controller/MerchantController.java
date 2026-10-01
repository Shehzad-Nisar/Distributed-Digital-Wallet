package com.transmoney.backend.controller;

import com.transmoney.backend.dto.request.CreateQrRequest;
import com.transmoney.backend.dto.request.MerchantOnboardRequest;
import com.transmoney.backend.dto.request.PayQrRequest;
import com.transmoney.backend.dto.request.ScanQrRequest;
import com.transmoney.backend.dto.response.*;
import com.transmoney.backend.service.MerchantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Merchant Services & QR Payments", description = "Merchant onboarding, dynamic & static QR payment codes, 2PC QR execution, and batch settlement")
@RestController
@RequestMapping("/api/merchants")
@RequiredArgsConstructor
public class MerchantController {

    private final MerchantService merchantService;

    @Operation(summary = "Onboard a new merchant", description = "Registers a business profile with settlement account and generates cryptographic signing secret")
    @PostMapping("/onboard")
    public ResponseEntity<ApiResponse<MerchantResponse>> onboardMerchant(@Valid @RequestBody MerchantOnboardRequest request) {
        MerchantResponse response = merchantService.onboardMerchant(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Merchant onboarded successfully", response));
    }

    @Operation(summary = "List all active merchants", description = "Retrieves all registered merchants in the cluster")
    @GetMapping
    public ResponseEntity<ApiResponse<List<MerchantResponse>>> getAllMerchants() {
        List<MerchantResponse> merchants = merchantService.getAllMerchants();
        return ResponseEntity.ok(ApiResponse.ok("Merchants retrieved successfully", merchants));
    }

    @Operation(summary = "Get merchant by ID", description = "Fetches detailed merchant metrics and account details")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MerchantResponse>> getMerchantById(@PathVariable Long id) {
        MerchantResponse merchant = merchantService.getMerchantById(id);
        return ResponseEntity.ok(ApiResponse.ok("Merchant retrieved successfully", merchant));
    }

    @Operation(summary = "Get merchant by User ID", description = "Fetches merchant profile registered under a user")
    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<MerchantResponse>> getMerchantByUserId(@PathVariable Long userId) {
        MerchantResponse merchant = merchantService.getMerchantByUserId(userId);
        return ResponseEntity.ok(ApiResponse.ok("Merchant profile retrieved", merchant));
    }

    @Operation(summary = "Generate signed QR code", description = "Creates a signed dynamic or static QR payload with Base64 PNG and SVG vectors")
    @PostMapping("/qr/generate")
    public ResponseEntity<ApiResponse<QrCodeResponse>> generateQrCode(@Valid @RequestBody CreateQrRequest request) {
        QrCodeResponse response = merchantService.generateQrCode(request);
        return ResponseEntity.ok(ApiResponse.ok("QR Code generated successfully", response));
    }

    @Operation(summary = "Scan and verify QR code payload", description = "Cryptographically verifies HMAC signature, checks expiry, and calculates fees")
    @PostMapping("/qr/scan")
    public ResponseEntity<ApiResponse<QrScanDetailsResponse>> scanAndVerifyQr(@Valid @RequestBody ScanQrRequest request) {
        QrScanDetailsResponse response = merchantService.scanAndVerifyQr(request);
        return ResponseEntity.ok(ApiResponse.ok("QR Code scan result", response));
    }

    @Operation(summary = "Execute QR Code Payment", description = "Debits payer and credits merchant atomically across shards using 2PC with MDR fee deduction")
    @PostMapping("/qr/pay")
    public ResponseEntity<ApiResponse<QrPaymentResponse>> payQr(
            @Valid @RequestBody PayQrRequest request,
            @RequestHeader(value = "X-Idempotency-Key", required = false) String idempotencyKeyHeader
    ) {
        QrPaymentResponse response = merchantService.processQrPayment(request, idempotencyKeyHeader);
        return ResponseEntity.ok(ApiResponse.ok("QR Payment executed successfully", response));
    }

    @Operation(summary = "Execute settlement batch", description = "Executes batch settlement for a merchant, transferring unsettled revenue to bank settlement account")
    @PostMapping("/{id}/settle")
    public ResponseEntity<ApiResponse<SettlementResponse>> settleMerchant(@PathVariable Long id) {
        SettlementResponse response = merchantService.executeSettlement(id);
        return ResponseEntity.ok(ApiResponse.ok("Settlement batch completed successfully", response));
    }

    @Operation(summary = "Get settlement history", description = "Retrieves all historical settlement batches for a merchant")
    @GetMapping("/{id}/settlements")
    public ResponseEntity<ApiResponse<List<SettlementResponse>>> getSettlementHistory(@PathVariable Long id) {
        List<SettlementResponse> history = merchantService.getSettlementHistory(id);
        return ResponseEntity.ok(ApiResponse.ok("Settlement history retrieved", history));
    }
}
