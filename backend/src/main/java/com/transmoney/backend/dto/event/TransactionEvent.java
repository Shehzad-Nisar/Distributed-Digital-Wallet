package com.transmoney.backend.dto.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionEvent implements Serializable {
    private String eventId;
    private String eventType; // e.g. TRANSACTION_COMMITTED, BALANCE_UPDATED, DEPOSIT_COMPLETED
    private String transactionId;
    private String transactionType;
    private Long senderAccountId;
    private Long receiverAccountId;
    private BigDecimal amount;
    private String currency;
    private BigDecimal targetAmount;
    private String targetCurrency;
    private BigDecimal senderNewBalance;
    private BigDecimal receiverNewBalance;
    private String description;
    private LocalDateTime timestamp;
}
