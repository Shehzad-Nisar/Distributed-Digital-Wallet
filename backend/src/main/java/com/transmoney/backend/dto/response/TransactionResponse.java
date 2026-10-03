package com.transmoney.backend.dto.response;

import com.transmoney.backend.entity.enums.LedgerEntryType;
import com.transmoney.backend.entity.enums.TransactionStatus;
import com.transmoney.backend.entity.enums.TransactionType;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionResponse {
    private String transactionId;
    private TransactionStatus status;
    private TransactionType type;
    private BigDecimal amount;
    private String currency;
    private BigDecimal targetAmount;
    private String targetCurrency;
    private BigDecimal exchangeRate;
    private Long senderAccountId;
    private Long receiverAccountId;
    private String description;
    private List<LedgerEntryDto> ledgerEntries;
    private LocalDateTime timestamp;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LedgerEntryDto {
        private Long id;
        private LedgerEntryType type;
        private Long accountId;
        private BigDecimal amount;
        private BigDecimal balanceAfter;
        private LocalDateTime timestamp;
    }
}
