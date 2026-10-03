package com.transmoney.backend.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FxQuoteResponse {
    private String quoteId;
    private String sourceCurrency;
    private String targetCurrency;
    private BigDecimal sourceAmount;
    private BigDecimal marketRate;
    private BigDecimal effectiveRate;
    private BigDecimal spreadMarginPercent;
    private BigDecimal spreadFeeAmount;
    private BigDecimal grossTargetAmount;
    private BigDecimal netTargetAmount;
    private BigDecimal minGuaranteedAmount; // with standard 0.5% slippage floor
    private LocalDateTime issuedAt;
    private LocalDateTime expiresAt;
    private Long validitySeconds;
}
