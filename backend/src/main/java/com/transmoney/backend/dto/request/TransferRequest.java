package com.transmoney.backend.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransferRequest {

    @NotNull(message = "Sender account ID is required")
    private Long senderAccountId;

    @NotNull(message = "Receiver account ID is required")
    private Long receiverAccountId;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Transfer amount must be greater than zero")
    private BigDecimal amount;

    @Builder.Default
    private String currency = "PKR";

    private String targetCurrency;

    private BigDecimal expectedRate;

    private BigDecimal minTargetAmount;

    private BigDecimal maxSlippagePercent;

    private String description;

    private String idempotencyKey;
}
