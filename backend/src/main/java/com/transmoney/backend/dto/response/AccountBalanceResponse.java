package com.transmoney.backend.dto.response;

import com.transmoney.backend.entity.enums.ShardType;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccountBalanceResponse {
    private Long accountId;
    private String accountNumber;
    private BigDecimal balance;
    private String currency;
    private ShardType shard;
    private String status;
}
