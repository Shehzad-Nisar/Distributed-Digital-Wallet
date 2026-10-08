package com.transmoney.backend.service.websocket;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.transmoney.backend.dto.event.TransactionEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Real-time WebSocket handler for client wallet push notifications.
 * Distributes instant balance and transaction push updates to active frontend sessions.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class WalletWebSocketHandler extends TextWebSocketHandler {

    private final ObjectMapper objectMapper;

    // Active sessions mapped to session ID
    private final Map<String, WebSocketSession> activeSessions = new ConcurrentHashMap<>();

    // Map account ID to set of session IDs subscribed to it
    private final Map<Long, Set<String>> accountSubscriptions = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        activeSessions.put(session.getId(), session);
        log.info("WebSocket connection established: session [{}] (total active: {})", session.getId(), activeSessions.size());
        sendWelcome(session);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        try {
            String payload = message.getPayload();
            JsonNode root = objectMapper.readTree(payload);
            String action = root.path("action").asText("PING");

            if ("SUBSCRIBE".equalsIgnoreCase(action)) {
                if (root.has("accountId")) {
                    Long accountId = root.get("accountId").asLong();
                    accountSubscriptions.computeIfAbsent(accountId, k -> ConcurrentHashMap.newKeySet()).add(session.getId());
                    log.info("Session [{}] subscribed to account ID {}", session.getId(), accountId);
                    session.sendMessage(new TextMessage(objectMapper.writeValueAsString(Map.of(
                            "type", "SUBSCRIBED",
                            "accountId", accountId,
                            "status", "SUCCESS"
                    ))));
                }
            } else if ("PING".equalsIgnoreCase(action)) {
                session.sendMessage(new TextMessage("{\"type\":\"PONG\"}"));
            }
        } catch (Exception e) {
            log.warn("Error handling incoming WebSocket message from session [{}]: {}", session.getId(), e.getMessage());
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        String sessionId = session.getId();
        activeSessions.remove(sessionId);
        accountSubscriptions.values().forEach(set -> set.remove(sessionId));
        log.info("WebSocket connection closed: session [{}] (remaining active: {})", sessionId, activeSessions.size());
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        log.warn("WebSocket transport error for session [{}]: {}", session.getId(), exception.getMessage());
    }

    /**
     * Broadcasts a transaction event in real-time to interested or all active sessions.
     */
    public void broadcastEvent(TransactionEvent event) {
        if (activeSessions.isEmpty()) {
            log.debug("No active WebSocket sessions to broadcast event [{}]", event.getEventId());
            return;
        }

        try {
            String jsonPayload = objectMapper.writeValueAsString(event);
            TextMessage message = new TextMessage(jsonPayload);

            // Broadcast to all active sessions (so user balance bar updates instantly across shards)
            activeSessions.values().forEach(session -> {
                if (session.isOpen()) {
                    try {
                        synchronized (session) {
                            session.sendMessage(message);
                        }
                    } catch (IOException e) {
                        log.warn("Failed to send WebSocket message to session [{}]: {}", session.getId(), e.getMessage());
                    }
                }
            });
            log.info("Broadcasted WebSocket event [{}] (type: {}) to {} active sessions",
                    event.getEventId(), event.getEventType(), activeSessions.size());
        } catch (Exception e) {
            log.error("Failed to serialize WebSocket event [{}]: {}", event.getEventId(), e.getMessage());
        }
    }

    public int getActiveSessionCount() {
        return activeSessions.size();
    }

    private void sendWelcome(WebSocketSession session) {
        try {
            String welcome = objectMapper.writeValueAsString(Map.of(
                    "type", "CONNECTION_ACK",
                    "sessionId", session.getId(),
                    "serverTime", System.currentTimeMillis(),
                    "message", "TransMoney Real-Time Wallet Stream Connected"
            ));
            session.sendMessage(new TextMessage(welcome));
        } catch (IOException e) {
            log.warn("Could not send welcome message: {}", e.getMessage());
        }
    }
}
