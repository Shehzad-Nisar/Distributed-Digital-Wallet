package com.transmoney.backend.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QrCodeResponse {

    private String qrPayload;
    private String qrImageDataUrl;
    private String qrSvg;
    private Long merchantId;
    private String merchantCode;
    private String merchantName;
    private Long accountId;
    private String accountNumber;
    private BigDecimal amount;
    private String currency;
    private String orderRef;
    private Boolean isDynamic;
    private LocalDateTime expiresAt;
    private String signature;
}
