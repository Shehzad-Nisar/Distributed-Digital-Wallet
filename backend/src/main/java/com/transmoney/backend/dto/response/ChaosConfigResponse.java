package com.transmoney.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChaosConfigResponse {
    private boolean enabled;
    private String mode;
    private int latencyMs;
    private double failureRatePercent;
    private long totalFaultsInjected;
    private long totalCrashesSimulated;
    private long totalDelaysInjected;
}
