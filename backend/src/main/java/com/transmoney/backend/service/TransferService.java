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

    public TransferResponse executeTransfer(TransferRequest request) {
        Transaction tx = coordinator.executeTransfer(request);

        return TransferResponse.builder()
                .transactionId(tx.getTransactionId())
                .status(tx.getStatus())
                .amount(tx.getAmount())
                .currency(tx.getCurrency())
                .timestamp(tx.getCreatedAt())
                .build();
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
