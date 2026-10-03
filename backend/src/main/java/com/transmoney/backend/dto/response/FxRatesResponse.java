package com.transmoney.backend.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FxRatesResponse {
    private String baseCurrency;
    private LocalDateTime timestamp;
    private BigDecimal defaultSpreadPercent;
    private List<String> supportedCurrencies;
    private Map<String, BigDecimal> ratesAgainstUsd;
    private Map<String, BigDecimal> directPairs;
}
