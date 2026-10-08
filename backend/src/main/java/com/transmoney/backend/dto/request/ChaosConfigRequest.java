package com.transmoney.backend.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChaosConfigRequest {
    private Boolean enabled;
    private String mode; // NONE, LATENCY_SPIKE, PREPARE_PARTITION, COORDINATOR_CRASH, PACKET_DROP
    private Integer latencyMs;
    private Double failureRatePercent;
}
