package com.transmoney.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SimulatorStatusResponse {
    private boolean isRunning;
    private int progressPercentage;
    private LoadBenchmarkResult latestResult;
}
