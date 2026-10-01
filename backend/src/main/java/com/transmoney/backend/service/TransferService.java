package com.transmoney.backend.service;

import com.transmoney.backend.dto.request.TransferRequest;
import com.transmoney.backend.dto.response.TransactionResponse;
import com.transmoney.backend.dto.response.TransferResponse;
import com.transmoney.backend.entity.LedgerEntry;
import com.transmoney.backend.entity.Transaction;
import com.transmoney.backend.exception.ResourceNotFoundException;
import com.transmoney.backend.repository.LedgerEntryRepository;
import com.transmoney.backend.repository.TransactionRepository;
import com.transmoney.backend.service.coordinator.TwoPhaseCommitCoordinator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TransferService {

    private final TwoPhaseCommitCoordinator coordinator;
    private final TransactionRepository transactionRepository;
    private final LedgerEntryRepository ledgerEntryRepository;
    private final IdempotencyService idempotencyService;
    private final com.transmoney.backend.repository.AccountRepository accountRepository;

    public TransferResponse executeTransfer(TransferRequest request) {
        String idempotencyKey = request.getIdempotencyKey();

        // Check or record in-flight idempotency state
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            TransferResponse cached = idempotencyService.checkOrStart(idempotencyKey, request);
            if (cached != null) {
                return cached;
            }
        }

        try {
            Transaction tx = coordinator.executeTransfer(request);

            com.transmoney.backend.entity.Account sender = accountRepository.findById(tx.getSenderAccountId()).orElse(null);
            com.transmoney.backend.entity.Account receiver = accountRepository.findById(tx.getReceiverAccountId()).orElse(null);

            boolean isCross = sender != null && receiver != null && !sender.getShard().equals(receiver.getShard());

            TransferResponse response = TransferResponse.builder()
                    .transactionId(tx.getTransactionId())
                    .status(tx.getStatus())
                    .amount(tx.getAmount())
                    .currency(tx.getCurrency())
                    .senderAccountId(tx.getSenderAccountId())
                    .receiverAccountId(tx.getReceiverAccountId())
                    .senderShard(sender != null ? sender.getShard().name() : null)
                    .receiverShard(receiver != null ? receiver.getShard().name() : null)
                    .isCrossShard(isCross)
                    .idempotencyKey(idempotencyKey)
                    .cachedReplay(false)
                    .timestamp(tx.getCreatedAt())
                    .build();

            if (idempotencyKey != null && !idempotencyKey.isBlank()) {
                idempotencyService.markCompleted(idempotencyKey, response);
            }

            return response;
        } catch (Exception ex) {
            if (idempotencyKey != null && !idempotencyKey.isBlank()) {
                idempotencyService.markFailed(idempotencyKey, ex.getMessage());
            }
            throw ex;
        }
    }

    @Transactional(readOnly = true)
    public TransactionResponse getTransactionByTransactionId(String transactionId) {
        Transaction tx = transactionRepository.findByTransactionId(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found with ID: " + transactionId));

        List<LedgerEntry> entries = ledgerEntryRepository.findByTransaction(tx);

        List<TransactionResponse.LedgerEntryDto> entryDtos = entries.stream()
                .map(e -> TransactionResponse.LedgerEntryDto.builder()
                        .id(e.getId())
                        .type(e.getEntryType())
                        .accountId(e.getAccountId())
                        .amount(e.getAmount())
                        .balanceAfter(e.getBalanceAfter())
                        .timestamp(e.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        return mapToTransactionResponse(tx, entries);
    }

    @Transactional(readOnly = true)
    public com.transmoney.backend.dto.response.PageResponse<TransactionResponse> searchTransactions(
            Long accountId,
            String search,
            java.math.BigDecimal minAmount,
            java.math.BigDecimal maxAmount,
            java.time.LocalDateTime startDate,
            java.time.LocalDateTime endDate,
            com.transmoney.backend.entity.enums.TransactionType type,
            com.transmoney.backend.entity.enums.TransactionStatus status,
            String sortProperty,
            String direction,
            int page,
            int size
    ) {
        org.springframework.data.domain.Sort.Direction sortDirection = "asc".equalsIgnoreCase(direction)
                ? org.springframework.data.domain.Sort.Direction.ASC
                : org.springframework.data.domain.Sort.Direction.DESC;

        String property = (sortProperty != null && !sortProperty.isBlank()) ? sortProperty : "createdAt";
        if (!java.util.List.of("createdAt", "amount", "id", "status", "type").contains(property)) {
            property = "createdAt";
        }

        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(
                page, Math.min(Math.max(size, 1), 100), org.springframework.data.domain.Sort.by(sortDirection, property)
        );

        org.springframework.data.jpa.domain.Specification<Transaction> spec =
                com.transmoney.backend.repository.specification.TransactionSpecification.filter(
                        accountId, search, minAmount, maxAmount, startDate, endDate, type, status
                );

        org.springframework.data.domain.Page<Transaction> pageResult = transactionRepository.findAll(spec, pageable);

        org.springframework.data.domain.Page<TransactionResponse> dtoPage = pageResult.map(tx ->
                mapToTransactionResponse(tx, ledgerEntryRepository.findByTransaction(tx))
        );

        return com.transmoney.backend.dto.response.PageResponse.of(dtoPage);
    }

    private TransactionResponse mapToTransactionResponse(Transaction tx, List<LedgerEntry> entries) {
        List<TransactionResponse.LedgerEntryDto> entryDtos = entries != null
                ? entries.stream()
                .map(e -> TransactionResponse.LedgerEntryDto.builder()
                        .id(e.getId())
                        .type(e.getEntryType())
                        .accountId(e.getAccountId())
                        .amount(e.getAmount())
                        .balanceAfter(e.getBalanceAfter())
                        .timestamp(e.getCreatedAt())
                        .build())
                .collect(Collectors.toList())
                : List.of();

        return TransactionResponse.builder()
                .transactionId(tx.getTransactionId())
                .status(tx.getStatus())
                .type(tx.getType())
                .amount(tx.getAmount())
                .currency(tx.getCurrency())
                .senderAccountId(tx.getSenderAccountId())
                .receiverAccountId(tx.getReceiverAccountId())
                .description(tx.getDescription())
                .ledgerEntries(entryDtos)
                .timestamp(tx.getCreatedAt())
                .build();
    }
}
