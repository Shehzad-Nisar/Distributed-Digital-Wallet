package com.transmoney.backend.dto.response;

import com.transmoney.backend.entity.LedgerEntry;
import com.transmoney.backend.entity.enums.LedgerEntryType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LedgerEntryResponse {

    private Long id;
    private String transactionId;
    private Long accountId;
    private LedgerEntryType entryType;
    private BigDecimal amount;
    private BigDecimal balanceAfter;
    private LocalDateTime createdAt;

    public static LedgerEntryResponse fromEntity(LedgerEntry entry) {
        if (entry == null) return null;
        return LedgerEntryResponse.builder()
                .id(entry.getId())
                .transactionId(entry.getTransaction() != null ? entry.getTransaction().getTransactionId() : null)
                .accountId(entry.getAccountId())
                .entryType(entry.getEntryType())
                .amount(entry.getAmount())
                .balanceAfter(entry.getBalanceAfter())
                .createdAt(entry.getCreatedAt())
                .build();
    }
}
