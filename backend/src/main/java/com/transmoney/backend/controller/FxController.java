package com.transmoney.backend.controller;

import com.transmoney.backend.dto.request.ExchangeRequest;
import com.transmoney.backend.dto.request.FxQuoteRequest;
import com.transmoney.backend.dto.response.ApiResponse;
import com.transmoney.backend.dto.response.ExchangeResponse;
import com.transmoney.backend.dto.response.FxQuoteResponse;
import com.transmoney.backend.dto.response.FxRatesResponse;
import com.transmoney.backend.service.FxRateService;
import com.transmoney.backend.service.TransferService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Slf4j
@RestController
@RequestMapping("/api/fx")
@RequiredArgsConstructor
public class FxController {

    private final FxRateService fxRateService;
    private final TransferService transferService;

    /**
     * Returns live multi-currency rates against USD and key direct currency pairs.
     */
    @GetMapping("/rates")
    public ResponseEntity<ApiResponse<FxRatesResponse>> getLiveRates() {
        FxRatesResponse rates = fxRateService.getLiveRates();
        return ResponseEntity.ok(ApiResponse.<FxRatesResponse>builder()
                .success(true)
                .message("Real-time FX exchange rates retrieved successfully")
                .data(rates)
                .timestamp(LocalDateTime.now())
                .build());
    }

    /**
     * Generates a guaranteed 60-second FX conversion quote via GET query parameters.
     */
    @GetMapping("/quote")
    public ResponseEntity<ApiResponse<FxQuoteResponse>> getQuote(
            @RequestParam String sourceCurrency,
            @RequestParam String targetCurrency,
            @RequestParam BigDecimal amount
    ) {
        FxQuoteRequest request = FxQuoteRequest.builder()
                .sourceCurrency(sourceCurrency)
                .targetCurrency(targetCurrency)
                .amount(amount)
                .build();
        FxQuoteResponse quote = fxRateService.generateQuote(request);
        return ResponseEntity.ok(ApiResponse.<FxQuoteResponse>builder()
                .success(true)
                .message("Guaranteed FX quote generated successfully (valid for 60 seconds)")
                .data(quote)
                .timestamp(LocalDateTime.now())
                .build());
    }

    /**
     * Generates a guaranteed 60-second FX conversion quote via POST JSON body.
     */
    @PostMapping("/quote")
    public ResponseEntity<ApiResponse<FxQuoteResponse>> requestQuote(
            @Valid @RequestBody FxQuoteRequest request
    ) {
        FxQuoteResponse quote = fxRateService.generateQuote(request);
        return ResponseEntity.ok(ApiResponse.<FxQuoteResponse>builder()
                .success(true)
                .message("Guaranteed FX quote generated successfully (valid for 60 seconds)")
                .data(quote)
                .timestamp(LocalDateTime.now())
                .build());
    }

    /**
     * Executes an atomic multi-currency exchange between accounts via Two-Phase Commit,
     * enforcing slippage bounds, double-entry ledger bookkeeping, and distributed idempotency.
     */
    @PostMapping("/exchange")
    public ResponseEntity<ApiResponse<ExchangeResponse>> executeExchange(
            @RequestHeader(value = "X-Idempotency-Key", required = false) String idempotencyKeyHeader,
            @Valid @RequestBody ExchangeRequest request
    ) {
        if (idempotencyKeyHeader != null && !idempotencyKeyHeader.isBlank()) {
            request.setIdempotencyKey(idempotencyKeyHeader.trim());
        }

        ExchangeResponse response = transferService.executeExchange(request);

        return ResponseEntity.ok(ApiResponse.<ExchangeResponse>builder()
                .success(true)
                .message("Cross-currency exchange committed successfully via 2PC engine")
                .data(response)
                .timestamp(LocalDateTime.now())
                .build());
    }
}
