package com.transmoney.backend.service.queue;

import com.transmoney.backend.dto.event.TransactionEvent;
import com.transmoney.backend.service.cache.BalanceCacheService;
import com.transmoney.backend.service.websocket.WalletWebSocketHandler;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Asynchronous consumer that pulls events from the queue buffer,
 * invalidates balance caches, emits real-time WebSocket push updates,
 * and tracks audit dispatch metrics.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AsyncTransactionEventConsumer {

    private final AsyncQueueBufferService queueBufferService;
    private final BalanceCacheService balanceCacheService;
    private final WalletWebSocketHandler webSocketHandler;

    private final AtomicBoolean running = new AtomicBoolean(false);
    private ExecutorService workerExecutor;

    @PostConstruct
    public void startWorker() {
        running.set(true);
        workerExecutor = Executors.newSingleThreadExecutor(r -> {
            Thread t = new Thread(r, "wallet-async-event-consumer");
            t.setDaemon(true);
            return t;
        });

        workerExecutor.submit(this::processLoop);
        log.info("AsyncTransactionEventConsumer background worker started");
    }

    private void processLoop() {
        while (running.get()) {
            try {
                TransactionEvent event = queueBufferService.pollMemoryQueue();
                if (event != null) {
                    processEvent(event);
                } else {
                    // Back off briefly when queue is empty
                    TimeUnit.MILLISECONDS.sleep(25);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            } catch (Exception e) {
                log.error("Error processing transaction event in async queue consumer: {}", e.getMessage(), e);
            }
        }
    }

    /**
     * Process an individual dequeued transaction event.
     */
    public void processEvent(TransactionEvent event) {
        try {
            log.info("Processing async event [{}] for tx [{}] (type: {})",
                    event.getEventId(), event.getTransactionId(), event.getEventType());

            // 1. Evict or synchronize cache for involved accounts
            if (event.getSenderAccountId() != null) {
                balanceCacheService.evictBalance(event.getSenderAccountId());
            }
            if (event.getReceiverAccountId() != null) {
                balanceCacheService.evictBalance(event.getReceiverAccountId());
            }

            // 2. Broadcast real-time push update to connected WebSocket clients
            webSocketHandler.broadcastEvent(event);

            // 3. Mark processed
            queueBufferService.incrementProcessed();
            log.info("Completed async processing for event [{}]", event.getEventId());
        } catch (Exception ex) {
            log.error("Failed to process event [{}]: {}", event.getEventId(), ex.getMessage(), ex);
        }
    }

    @PreDestroy
    public void stopWorker() {
        running.set(false);
        if (workerExecutor != null) {
            workerExecutor.shutdownNow();
        }
        log.info("AsyncTransactionEventConsumer worker shut down");
    }
}
