package com.transmoney.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QueueStatsResponse {
    private long totalEnqueued;
    private long totalProcessed;
    private int pendingBufferSize;
    private int activeWebSocketConnections;
    private String queueStatus;
}
