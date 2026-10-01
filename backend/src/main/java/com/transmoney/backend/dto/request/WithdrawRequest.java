package com.transmoney.backend.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WithdrawRequest {

    @Schema(description = "Amount to withdraw", example = "500.00")
    @NotNull(message = "Withdrawal amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be strictly greater than 0")
    private BigDecimal amount;

    @Schema(description = "Destination bank or wallet provider name", example = "Standard Chartered / HBL")
    @NotBlank(message = "Destination bank name is required")
    private String destinationBank;

    @Schema(description = "Destination IBAN or bank account number", example = "PK36SCBL0000001123456701")
    @NotBlank(message = "Destination account number is required")
    private String destinationAccountNumber;

    @Schema(description = "Optional withdrawal memo", example = "ATM/Cashout withdrawal")
    private String referenceNotes;
}
