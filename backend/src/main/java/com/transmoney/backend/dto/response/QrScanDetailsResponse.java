package com.transmoney.backend.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QrScanDetailsResponse {

    private boolean valid;
    private Long merchantId;
    private String merchantCode;
    private String merchantName;
    private String merchantCategory;
    private Long merchantAccountId;
    private String merchantAccountNumber;
    private String merchantShard;
    private BigDecimal amount;
    private String currency;
    private String orderRef;
    private Boolean isDynamic;
    private Boolean isExpired;
    private LocalDateTime expiresAt;
    private BigDecimal feeRatePercent;
    private BigDecimal estimatedFee;
    private BigDecimal estimatedNetAmount;
    private String message;
}
