package com.transmoney.backend.dto.response;

import com.transmoney.backend.entity.enums.TransactionStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExchangeResponse {
    private String transactionId;
    private TransactionStatus status;
    private Long sourceAccountId;
    private String sourceAccountNumber;
    private String sourceShard;
    private BigDecimal sourceAmount;
    private String sourceCurrency;
    private BigDecimal sourceBalanceAfter;

    private Long targetAccountId;
    private String targetAccountNumber;
    private String targetShard;
    private BigDecimal targetAmount;
    private String targetCurrency;
    private BigDecimal targetBalanceAfter;

    private BigDecimal exchangeRate;
    private BigDecimal feeAmount;
    private Boolean isCrossShard;
    private String idempotencyKey;
    private Boolean cachedReplay;
    private LocalDateTime timestamp;
}
