package com.transmoney.backend.service.queue;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.transmoney.backend.dto.event.TransactionEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Asynchronous Queue Buffer service.
 * Decouples post-transaction side effects (notifications, websocket push, audit propagation)
 * from the synchronous 2PC commit critical path.
 */
@Slf4j
@Service
public class AsyncQueueBufferService {

    public static final String REDIS_QUEUE_KEY = "transmoney:queue:events";
    public static final String REDIS_CHANNEL = "transmoney:events:channel";

    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    // Resilient in-process high-capacity non-blocking queue buffer
    private final BlockingQueue<TransactionEvent> memoryQueue = new LinkedBlockingQueue<>(10000);

    // Queue Metrics
    private final AtomicLong totalEnqueued = new AtomicLong(0);
    private final AtomicLong totalProcessed = new AtomicLong(0);

    public AsyncQueueBufferService(@Autowired(required = false) RedisTemplate<String, Object> redisTemplate,
                                   ObjectMapper objectMapper) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    /**
     * Enqueue a transaction event into the asynchronous buffer.
     */
    public void enqueueEvent(TransactionEvent event) {
        if (event == null) return;

        totalEnqueued.incrementAndGet();

        // 1. Enqueue in-process memory queue for immediate worker consumption
        boolean offered = memoryQueue.offer(event);
        if (!offered) {
            log.warn("Memory queue buffer full! Dropping event [{}]", event.getEventId());
        }

        // 2. Also publish to Redis (Queue / Channel) if Redis is connected
        if (redisTemplate != null) {
            try {
                String json = objectMapper.writeValueAsString(event);
                redisTemplate.opsForList().rightPush(REDIS_QUEUE_KEY, json);
                redisTemplate.convertAndSend(REDIS_CHANNEL, json);
                log.debug("Enqueued event [{}] to Redis queue and channel", event.getEventId());
            } catch (Exception ex) {
                log.debug("Redis queue dispatch bypassed ({}), processed via memory buffer", ex.getMessage());
            }
        }

        log.debug("Enqueued event [{}] (type: {}, tx: {}) to async buffer",
                event.getEventId(), event.getEventType(), event.getTransactionId());
    }

    /**
     * Poll next event from the in-memory queue buffer.
     */
    public TransactionEvent pollMemoryQueue() {
        return memoryQueue.poll();
    }

    public void incrementProcessed() {
        totalProcessed.incrementAndGet();
    }

    public long getTotalEnqueued() {
        return totalEnqueued.get();
    }

    public long getTotalProcessed() {
        return totalProcessed.get();
    }

    public int getPendingBufferSize() {
        return memoryQueue.size();
    }
}
