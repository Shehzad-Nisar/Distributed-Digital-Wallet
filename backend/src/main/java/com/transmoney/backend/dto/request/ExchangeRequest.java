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
public class ExchangeRequest {

    @NotNull(message = "Source account ID is required")
    private Long sourceAccountId;

    @NotNull(message = "Target account ID is required")
    private Long targetAccountId;

    @NotNull(message = "Source amount is required")
    @DecimalMin(value = "0.01", message = "Source amount must be greater than zero")
    private BigDecimal sourceAmount;

    private String quoteId;

    private BigDecimal expectedRate;

    private BigDecimal minTargetAmount;

    private BigDecimal maxSlippagePercent;

    private String description;

    private String idempotencyKey;
}
