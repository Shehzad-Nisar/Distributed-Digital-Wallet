package com.transmoney.backend.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DepositRequest {

    @Schema(description = "Amount to deposit", example = "1000.00")
    @NotNull(message = "Deposit amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be strictly greater than 0")
    private BigDecimal amount;

    @Schema(description = "Source payment method (e.g., DEBIT_CARD, BANK_WIRE, CASH_LOAD)", example = "DEBIT_CARD")
    private String paymentMethod;

    @Schema(description = "Optional transaction note or reference", example = "Direct salary load")
    private String referenceNotes;
}
