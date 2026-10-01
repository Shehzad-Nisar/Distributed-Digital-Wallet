package com.transmoney.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MerchantOnboardRequest {

    private Long userId;

    @NotBlank(message = "Business name is required")
    private String businessName;

    @NotBlank(message = "Business category is required")
    private String category;

    private Long accountId;

    private BigDecimal feeRatePercent;
}
