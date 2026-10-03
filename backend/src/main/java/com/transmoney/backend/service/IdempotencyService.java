package com.transmoney.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.transmoney.backend.dto.request.TransferRequest;
import com.transmoney.backend.dto.response.TransferResponse;
import com.transmoney.backend.entity.IdempotencyRecord;
import com.transmoney.backend.entity.enums.IdempotencyStatus;
import com.transmoney.backend.exception.IdempotencyConflictException;
import com.transmoney.backend.repository.IdempotencyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class IdempotencyService {

    private final IdempotencyRepository idempotencyRepository;
    private final ObjectMapper objectMapper;

    /**
     * Checks if a transfer request with the given idempotency key was already processed
     * or is currently processing.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public TransferResponse checkOrStart(String idempotencyKey, TransferRequest request) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            return null;
        }

        String requestHash = computeHash(request);
        Optional<IdempotencyRecord> existingOpt = idempotencyRepository.findByIdempotencyKey(idempotencyKey);

        if (existingOpt.isPresent()) {
            IdempotencyRecord existing = existingOpt.get();

            if (!existing.getRequestHash().equals(requestHash)) {
                log.warn("Idempotency conflict: key [{}] was used with different payload", idempotencyKey);
                throw new IdempotencyConflictException(
                        "Idempotency key '" + idempotencyKey + "' was already used with different transfer parameters."
                );
            }

            if (existing.getStatus() == IdempotencyStatus.COMPLETED) {
                log.info("Idempotent replay: returning cached response for key [{}]", idempotencyKey);
                try {
                    TransferResponse cachedResponse = objectMapper.readValue(
                            existing.getResponsePayload(),
                            TransferResponse.class
                    );
                    cachedResponse.setCachedReplay(true);
                    cachedResponse.setIdempotencyKey(idempotencyKey);
                    return cachedResponse;
                } catch (JsonProcessingException e) {
                    log.error("Failed to deserialize cached idempotency payload", e);
                }
            } else if (existing.getStatus() == IdempotencyStatus.PENDING) {
                log.warn("Idempotency in-flight collision: key [{}] is currently being processed", idempotencyKey);
                throw new IdempotencyConflictException(
                        "A transfer with idempotency key '" + idempotencyKey + "' is currently in progress."
                );
            } else {
                existing.setStatus(IdempotencyStatus.PENDING);
                existing.setErrorMessage(null);
                idempotencyRepository.save(existing);
                return null;
            }
        }

        IdempotencyRecord newRecord = IdempotencyRecord.builder()
                .idempotencyKey(idempotencyKey)
                .requestHash(requestHash)
                .status(IdempotencyStatus.PENDING)
                .build();
        idempotencyRepository.save(newRecord);
        log.info("Registered PENDING idempotency key [{}]", idempotencyKey);

        return null;
    }

    /**
     * Checks or starts idempotency tracking for PayQrRequest.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public TransferResponse checkOrStartPayQr(String idempotencyKey, com.transmoney.backend.dto.request.PayQrRequest request) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            return null;
        }

        String requestHash = computeHashForPayQr(request);
        Optional<IdempotencyRecord> existingOpt = idempotencyRepository.findByIdempotencyKey(idempotencyKey);

        if (existingOpt.isPresent()) {
            IdempotencyRecord existing = existingOpt.get();

            if (!existing.getRequestHash().equals(requestHash)) {
                log.warn("Idempotency conflict: key [{}] was used with different payload", idempotencyKey);
                throw new IdempotencyConflictException(
                        "Idempotency key '" + idempotencyKey + "' was already used with different transfer parameters."
                );
            }

            if (existing.getStatus() == IdempotencyStatus.COMPLETED) {
                log.info("Idempotent replay: returning cached response for key [{}]", idempotencyKey);
                try {
                    TransferResponse cachedResponse = objectMapper.readValue(
                            existing.getResponsePayload(),
                            TransferResponse.class
                    );
                    cachedResponse.setCachedReplay(true);
                    cachedResponse.setIdempotencyKey(idempotencyKey);
                    return cachedResponse;
                } catch (JsonProcessingException e) {
                    log.error("Failed to deserialize cached idempotency payload", e);
                }
            } else if (existing.getStatus() == IdempotencyStatus.PENDING) {
                log.warn("Idempotency in-flight collision: key [{}] is currently being processed", idempotencyKey);
                throw new IdempotencyConflictException(
                        "A transfer with idempotency key '" + idempotencyKey + "' is currently in progress."
                );
            } else {
                existing.setStatus(IdempotencyStatus.PENDING);
                existing.setErrorMessage(null);
                idempotencyRepository.save(existing);
                return null;
            }
        }

        IdempotencyRecord newRecord = IdempotencyRecord.builder()
                .idempotencyKey(idempotencyKey)
                .requestHash(requestHash)
                .status(IdempotencyStatus.PENDING)
                .build();
        idempotencyRepository.save(newRecord);
        log.info("Registered PENDING idempotency key [{}]", idempotencyKey);

        return null;
    }

    /**
     * Checks or starts idempotency tracking for ExchangeRequest.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public com.transmoney.backend.dto.response.ExchangeResponse checkOrStartExchange(String idempotencyKey, com.transmoney.backend.dto.request.ExchangeRequest request) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            return null;
        }

        String requestHash = computeHashForExchange(request);
        Optional<IdempotencyRecord> existingOpt = idempotencyRepository.findByIdempotencyKey(idempotencyKey);

        if (existingOpt.isPresent()) {
            IdempotencyRecord existing = existingOpt.get();

            if (!existing.getRequestHash().equals(requestHash)) {
                log.warn("Idempotency conflict: key [{}] was used with different payload", idempotencyKey);
                throw new IdempotencyConflictException(
                        "Idempotency key '" + idempotencyKey + "' was already used with different exchange parameters."
                );
            }

            if (existing.getStatus() == IdempotencyStatus.COMPLETED) {
                log.info("Idempotent replay: returning cached exchange response for key [{}]", idempotencyKey);
                try {
                    com.transmoney.backend.dto.response.ExchangeResponse cachedResponse = objectMapper.readValue(
                            existing.getResponsePayload(),
                            com.transmoney.backend.dto.response.ExchangeResponse.class
                    );
                    cachedResponse.setCachedReplay(true);
                    cachedResponse.setIdempotencyKey(idempotencyKey);
                    return cachedResponse;
                } catch (JsonProcessingException e) {
                    log.error("Failed to deserialize cached idempotency payload", e);
                }
            } else if (existing.getStatus() == IdempotencyStatus.PENDING) {
                log.warn("Idempotency in-flight collision: key [{}] is currently being processed", idempotencyKey);
                throw new IdempotencyConflictException(
                        "An exchange with idempotency key '" + idempotencyKey + "' is currently in progress."
                );
            } else {
                existing.setStatus(IdempotencyStatus.PENDING);
                existing.setErrorMessage(null);
                idempotencyRepository.save(existing);
                return null;
            }
        }

        IdempotencyRecord newRecord = IdempotencyRecord.builder()
                .idempotencyKey(idempotencyKey)
                .requestHash(requestHash)
                .status(IdempotencyStatus.PENDING)
                .build();
        idempotencyRepository.save(newRecord);
        log.info("Registered PENDING idempotency key [{}] for currency exchange", idempotencyKey);

        return null;
    }

    /**
     * Marks the idempotency key as COMPLETED with the cached JSON exchange response.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markCompletedExchange(String idempotencyKey, com.transmoney.backend.dto.response.ExchangeResponse response) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            return;
        }

        idempotencyRepository.findByIdempotencyKey(idempotencyKey).ifPresent(record -> {
            try {
                record.setStatus(IdempotencyStatus.COMPLETED);
                record.setStatusCode(200);
                record.setTransactionId(response.getTransactionId());
                record.setResponsePayload(objectMapper.writeValueAsString(response));
                idempotencyRepository.save(record);
                log.info("Marked exchange idempotency key [{}] as COMPLETED", idempotencyKey);
            } catch (JsonProcessingException e) {
                log.error("Failed to serialize ExchangeResponse for idempotency caching", e);
            }
        });
    }

    /**
     * Marks the idempotency key as COMPLETED with the cached JSON response.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markCompleted(String idempotencyKey, TransferResponse response) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            return;
        }

        idempotencyRepository.findByIdempotencyKey(idempotencyKey).ifPresent(record -> {
            try {
                record.setStatus(IdempotencyStatus.COMPLETED);
                record.setStatusCode(201);
                record.setTransactionId(response.getTransactionId());
                record.setResponsePayload(objectMapper.writeValueAsString(response));
                idempotencyRepository.save(record);
                log.info("Marked idempotency key [{}] as COMPLETED", idempotencyKey);
            } catch (JsonProcessingException e) {
                log.error("Failed to serialize TransferResponse for idempotency caching", e);
            }
        });
    }

    /**
     * Marks the idempotency key as FAILED or cleans it up to allow safe retry.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markFailed(String idempotencyKey, String errorMessage) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            return;
        }

        idempotencyRepository.findByIdempotencyKey(idempotencyKey).ifPresent(record -> {
            record.setStatus(IdempotencyStatus.FAILED);
            record.setErrorMessage(errorMessage != null && errorMessage.length() > 500
                    ? errorMessage.substring(0, 500)
                    : errorMessage);
            idempotencyRepository.save(record);
            log.info("Marked idempotency key [{}] as FAILED", idempotencyKey);
        });
    }

    private String computeHash(TransferRequest req) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            String raw = String.format("%s:%s:%s:%s",
                    req.getSenderAccountId(),
                    req.getReceiverAccountId(),
                    req.getAmount().stripTrailingZeros().toPlainString(),
                    req.getCurrency() != null ? req.getCurrency().toUpperCase() : "PKR"
            );
            byte[] hash = digest.digest(raw.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }

    private String computeHashForPayQr(com.transmoney.backend.dto.request.PayQrRequest req) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            String raw = String.format("%s:%s:%s",
                    req.getPayerAccountId(),
                    req.getQrPayload(),
                    req.getAmount() != null ? req.getAmount().stripTrailingZeros().toPlainString() : "DEFAULT"
            );
            byte[] hash = digest.digest(raw.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }

    private String computeHashForExchange(com.transmoney.backend.dto.request.ExchangeRequest req) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            String raw = String.format("%s:%s:%s:%s",
                    req.getSourceAccountId(),
                    req.getTargetAccountId(),
                    req.getSourceAmount() != null ? req.getSourceAmount().stripTrailingZeros().toPlainString() : "0",
                    req.getQuoteId() != null ? req.getQuoteId() : "NO_QUOTE"
            );
            byte[] hash = digest.digest(raw.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }
}
