package com.transmoney.backend.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SettlementResponse {

    private String batchReference;
    private Long merchantId;
    private String merchantName;
    private Long settlementAccountId;
    private String settlementAccountNumber;
    private Integer transactionCount;
    private BigDecimal grossVolume;
    private BigDecimal totalFees;
    private BigDecimal netSettlementAmount;
    private String status;
    private LocalDateTime settlementDate;
}
