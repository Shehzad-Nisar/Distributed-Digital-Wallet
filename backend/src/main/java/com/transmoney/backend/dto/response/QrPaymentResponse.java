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
public class QrPaymentResponse {

    private String transactionId;
    private TransactionStatus status;
    private Long payerAccountId;
    private String payerAccountNumber;
    private String payerShard;
    private Long merchantId;
    private String merchantCode;
    private String merchantName;
    private Long merchantAccountId;
    private String merchantAccountNumber;
    private String merchantShard;
    private BigDecimal grossAmount;
    private BigDecimal feeAmount;
    private BigDecimal netAmount;
    private String currency;
    private String orderRef;
    private String idempotencyKey;
    private boolean cachedReplay;
    private LocalDateTime timestamp;
}
