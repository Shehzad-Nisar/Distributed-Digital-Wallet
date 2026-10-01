package com.transmoney.backend.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MerchantResponse {

    private Long id;
    private String merchantCode;
    private String name;
    private String category;
    private Long accountId;
    private String accountNumber;
    private String shard;
    private BigDecimal feeRatePercent;
    private BigDecimal accumulatedGross;
    private BigDecimal accumulatedFees;
    private BigDecimal accumulatedNetSettled;
    private BigDecimal unsettledBalance;
    private String status;
    private LocalDateTime createdAt;
}
