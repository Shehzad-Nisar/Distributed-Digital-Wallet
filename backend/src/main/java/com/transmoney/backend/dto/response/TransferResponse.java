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
public class TransferResponse {
    private String transactionId;
    private TransactionStatus status;
    private BigDecimal amount;
    private String currency;
    private LocalDateTime timestamp;
}
