package com.transmoney.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayQrRequest {

    @NotBlank(message = "QR Payload is required")
    private String qrPayload;

    @NotNull(message = "Payer Account ID is required")
    private Long payerAccountId;

    /**
     * Required if paying a static QR code (which has no pre-fixed amount).
     * Optional if paying a dynamic QR code that already specifies amount.
     */
    private BigDecimal amount;

    private String idempotencyKey;

    private String notes;
}
