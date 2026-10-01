package com.transmoney.backend.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateQrRequest {

    @NotNull(message = "Merchant ID is required")
    private Long merchantId;

    private BigDecimal amount;

    private String orderRef;

    private String description;

    @Builder.Default
    private Boolean isDynamic = true;

    @Builder.Default
    private Integer expiryMinutes = 15;
}
