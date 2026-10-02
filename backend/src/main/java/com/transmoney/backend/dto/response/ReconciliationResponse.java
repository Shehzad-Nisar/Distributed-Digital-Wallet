package com.transmoney.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReconciliationResponse {

    private Long accountId;
    private String accountNumber;
    private String currency;
    private BigDecimal currentBalance;
    private BigDecimal calculatedLedgerBalance;
    private BigDecimal totalDebits;
    private BigDecimal totalCredits;
    private boolean balanced;
    private int totalEntries;
    private String statusMessage;
}
