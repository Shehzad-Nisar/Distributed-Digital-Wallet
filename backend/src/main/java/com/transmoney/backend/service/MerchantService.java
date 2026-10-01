package com.transmoney.backend.service;

import com.transmoney.backend.dto.request.CreateQrRequest;
import com.transmoney.backend.dto.request.MerchantOnboardRequest;
import com.transmoney.backend.dto.request.PayQrRequest;
import com.transmoney.backend.dto.request.ScanQrRequest;
import com.transmoney.backend.dto.response.*;
import com.transmoney.backend.entity.Account;
import com.transmoney.backend.entity.Merchant;
import com.transmoney.backend.entity.SettlementBatch;
import com.transmoney.backend.entity.Transaction;
import com.transmoney.backend.entity.User;
import com.transmoney.backend.exception.ResourceNotFoundException;
import com.transmoney.backend.exception.TransactionException;
import com.transmoney.backend.repository.AccountRepository;
import com.transmoney.backend.repository.MerchantRepository;
import com.transmoney.backend.repository.SettlementBatchRepository;
import com.transmoney.backend.repository.UserRepository;
import com.transmoney.backend.service.coordinator.TwoPhaseCommitCoordinator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MerchantService {

    private final MerchantRepository merchantRepository;
    private final SettlementBatchRepository settlementBatchRepository;
    private final AccountRepository accountRepository;
    private final UserRepository userRepository;
    private final QrCodeService qrCodeService;
    private final TwoPhaseCommitCoordinator coordinator;
    private final IdempotencyService idempotencyService;
    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public MerchantResponse onboardMerchant(MerchantOnboardRequest request) {
        log.info("Onboarding merchant: businessName={}, category={}", request.getBusinessName(), request.getCategory());

        User user = null;
        if (request.getUserId() != null) {
            user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + request.getUserId()));
            // Upgrade role if not already merchant/admin
            if (!"ROLE_ADMIN".equalsIgnoreCase(user.getRole())) {
                user.setRole("ROLE_MERCHANT");
                userRepository.save(user);
            }
        }

        Account account;
        if (request.getAccountId() != null) {
            account = accountRepository.findById(request.getAccountId())
                    .orElseThrow(() -> new ResourceNotFoundException("Account not found with ID: " + request.getAccountId()));
        } else if (user != null) {
            List<Account> userAccounts = accountRepository.findByUserId(user.getId());
            if (userAccounts.isEmpty()) {
                throw new IllegalArgumentException("User has no accounts available for merchant settlement");
            }
            account = userAccounts.get(0);
        } else {
            throw new IllegalArgumentException("Either accountId or userId with existing accounts must be provided");
        }

        String merchantCode = generateMerchantCode();
        String secretKey = generateSecretKey();

        BigDecimal feeRate = request.getFeeRatePercent() != null ? request.getFeeRatePercent() : new BigDecimal("1.50");

        Merchant merchant = Merchant.builder()
                .merchantCode(merchantCode)
                .name(request.getBusinessName().trim())
                .category(request.getCategory().trim().toUpperCase())
                .accountId(account.getId())
                .user(user)
                .feeRatePercent(feeRate)
                .secretKey(secretKey)
                .status("ACTIVE")
                .accumulatedGross(BigDecimal.ZERO)
                .accumulatedFees(BigDecimal.ZERO)
                .accumulatedNetSettled(BigDecimal.ZERO)
                .unsettledBalance(BigDecimal.ZERO)
                .build();

        Merchant saved = merchantRepository.save(merchant);
        return mapToResponse(saved, account);
    }

    @Transactional(readOnly = true)
    public List<MerchantResponse> getAllMerchants() {
        return merchantRepository.findAll().stream()
                .map(m -> {
                    Account acc = accountRepository.findById(m.getAccountId()).orElse(null);
                    return mapToResponse(m, acc);
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public MerchantResponse getMerchantById(Long id) {
        Merchant merchant = merchantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Merchant not found with ID: " + id));
        Account acc = accountRepository.findById(merchant.getAccountId()).orElse(null);
        return mapToResponse(merchant, acc);
    }

    @Transactional(readOnly = true)
    public MerchantResponse getMerchantByUserId(Long userId) {
        List<Merchant> merchants = merchantRepository.findByUserId(userId);
        if (merchants.isEmpty()) {
            throw new ResourceNotFoundException("No merchant profile found for user ID: " + userId);
        }
        Merchant m = merchants.get(0);
        Account acc = accountRepository.findById(m.getAccountId()).orElse(null);
        return mapToResponse(m, acc);
    }

    public QrCodeResponse generateQrCode(CreateQrRequest request) {
        Merchant merchant = merchantRepository.findById(request.getMerchantId())
                .orElseThrow(() -> new ResourceNotFoundException("Merchant not found with ID: " + request.getMerchantId()));

        Account account = accountRepository.findById(merchant.getAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("Settlement account not found with ID: " + merchant.getAccountId()));

        boolean isDynamic = Boolean.TRUE.equals(request.getIsDynamic());
        int expiryMins = request.getExpiryMinutes() != null && request.getExpiryMinutes() > 0 ? request.getExpiryMinutes() : 15;
        LocalDateTime expiresAt = isDynamic ? LocalDateTime.now().plusMinutes(expiryMins) : null;
        String orderRef = request.getOrderRef() != null && !request.getOrderRef().isBlank()
                ? request.getOrderRef().trim()
                : (isDynamic ? "ORD-" + System.currentTimeMillis() % 1000000 : null);

        String payload = qrCodeService.generateSignedPayload(
                merchant.getMerchantCode(),
                account.getId(),
                request.getAmount(),
                account.getCurrency(),
                orderRef,
                isDynamic,
                expiresAt,
                merchant.getSecretKey()
        );

        String dataUrl = qrCodeService.renderQrAsDataUrl(payload, 280);
        String svg = qrCodeService.renderQrAsSvg(payload, 280);

        return QrCodeResponse.builder()
                .qrPayload(payload)
                .qrImageDataUrl(dataUrl)
                .qrSvg(svg)
                .merchantId(merchant.getId())
                .merchantCode(merchant.getMerchantCode())
                .merchantName(merchant.getName())
                .accountId(account.getId())
                .accountNumber(account.getAccountNumber())
                .amount(request.getAmount())
                .currency(account.getCurrency())
                .orderRef(orderRef)
                .isDynamic(isDynamic)
                .expiresAt(expiresAt)
                .signature("HMAC-SHA256")
                .build();
    }

    public QrScanDetailsResponse scanAndVerifyQr(ScanQrRequest request) {
        try {
            QrCodeService.QrPayloadData data = qrCodeService.parsePayload(request.getQrPayload());

            Merchant merchant = merchantRepository.findByMerchantCode(data.merchantCode())
                    .orElseGet(() -> merchantRepository.findByAccountId(data.accountId())
                            .orElse(null));

            if (merchant == null) {
                return QrScanDetailsResponse.builder()
                        .valid(false)
                        .message("Merchant not found or inactive for QR payload")
                        .build();
            }

            Account account = accountRepository.findById(merchant.getAccountId()).orElse(null);
            if (account == null) {
                return QrScanDetailsResponse.builder()
                        .valid(false)
                        .message("Merchant settlement account not found")
                        .build();
            }

            boolean sigValid = qrCodeService.verifySignature(data, merchant.getSecretKey());
            if (!sigValid) {
                return QrScanDetailsResponse.builder()
                        .valid(false)
                        .message("Invalid or tampered cryptographic QR signature")
                        .build();
            }

            boolean expired = qrCodeService.isExpired(data);
            if (expired) {
                return QrScanDetailsResponse.builder()
                        .valid(false)
                        .isExpired(true)
                        .merchantName(merchant.getName())
                        .merchantCode(merchant.getMerchantCode())
                        .message("This dynamic QR payment has expired. Please ask the merchant to refresh.")
                        .build();
            }

            BigDecimal amount = data.amount();
            BigDecimal estimatedFee = BigDecimal.ZERO;
            BigDecimal estimatedNet = BigDecimal.ZERO;

            if (amount != null && amount.compareTo(BigDecimal.ZERO) > 0) {
                estimatedFee = amount.multiply(merchant.getFeeRatePercent())
                        .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
                estimatedNet = amount.subtract(estimatedFee);
            }

            LocalDateTime expiresAt = data.expiresAtEpochSec() != null && data.expiresAtEpochSec() > 0
                    ? LocalDateTime.ofEpochSecond(data.expiresAtEpochSec(), 0, java.time.ZoneOffset.UTC)
                    : null;

            return QrScanDetailsResponse.builder()
                    .valid(true)
                    .merchantId(merchant.getId())
                    .merchantCode(merchant.getMerchantCode())
                    .merchantName(merchant.getName())
                    .merchantCategory(merchant.getCategory())
                    .merchantAccountId(account.getId())
                    .merchantAccountNumber(account.getAccountNumber())
                    .merchantShard(account.getShard().name())
                    .amount(amount)
                    .currency(data.currency())
                    .orderRef(data.orderRef())
                    .isDynamic(data.isDynamic())
                    .isExpired(false)
                    .expiresAt(expiresAt)
                    .feeRatePercent(merchant.getFeeRatePercent())
                    .estimatedFee(estimatedFee)
                    .estimatedNetAmount(estimatedNet)
                    .message("QR Code verified successfully")
                    .build();

        } catch (Exception ex) {
            log.warn("QR Scan verification failed: {}", ex.getMessage());
            return QrScanDetailsResponse.builder()
                    .valid(false)
                    .message("Invalid QR code format: " + ex.getMessage())
                    .build();
        }
    }

    public QrPaymentResponse processQrPayment(PayQrRequest request, String headerIdempotencyKey) {
        String idempotencyKey = request.getIdempotencyKey();
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            idempotencyKey = headerIdempotencyKey;
        }

        // 1. Idempotency Check
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            TransferResponse cached = idempotencyService.checkOrStartPayQr(idempotencyKey, request);
            if (cached != null) {
                return QrPaymentResponse.builder()
                        .transactionId(cached.getTransactionId())
                        .status(cached.getStatus())
                        .payerAccountId(cached.getSenderAccountId())
                        .merchantAccountId(cached.getReceiverAccountId())
                        .grossAmount(cached.getAmount())
                        .currency(cached.getCurrency())
                        .idempotencyKey(idempotencyKey)
                        .cachedReplay(true)
                        .timestamp(cached.getTimestamp())
                        .build();
            }
        }

        try {
            // 2. Parse & Verify Payload
            QrCodeService.QrPayloadData payloadData = qrCodeService.parsePayload(request.getQrPayload());

            Merchant merchant = merchantRepository.findByMerchantCode(payloadData.merchantCode())
                    .orElseGet(() -> merchantRepository.findByAccountId(payloadData.accountId())
                            .orElseThrow(() -> new ResourceNotFoundException("Merchant not found for QR payment")));

            if (!"ACTIVE".equalsIgnoreCase(merchant.getStatus())) {
                throw new TransactionException("Merchant is currently suspended or inactive");
            }

            if (!qrCodeService.verifySignature(payloadData, merchant.getSecretKey())) {
                throw new TransactionException("Invalid QR cryptographic signature. Payment rejected.");
            }

            if (qrCodeService.isExpired(payloadData)) {
                throw new TransactionException("QR Code has expired. Please scan an updated QR code.");
            }

            Account payerAccount = accountRepository.findById(request.getPayerAccountId())
                    .orElseThrow(() -> new ResourceNotFoundException("Payer account not found with ID: " + request.getPayerAccountId()));

            Account merchantAccount = accountRepository.findById(merchant.getAccountId())
                    .orElseThrow(() -> new ResourceNotFoundException("Merchant settlement account not found with ID: " + merchant.getAccountId()));

            // Determine Amount
            BigDecimal grossAmount;
            if (payloadData.isDynamic() && payloadData.amount() != null) {
                grossAmount = payloadData.amount();
            } else {
                if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
                    throw new IllegalArgumentException("Payment amount is required for static QR code payment");
                }
                grossAmount = request.getAmount();
            }

            // Calculate MDR Fee
            BigDecimal fee = grossAmount.multiply(merchant.getFeeRatePercent())
                    .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
            BigDecimal netAmount = grossAmount.subtract(fee);

            // 3. Execute cross-shard atomic 2PC
            String description = "QR Pay to " + merchant.getName();
            Transaction tx = coordinator.executeMerchantPayment(
                    payerAccount.getId(),
                    merchantAccount.getId(),
                    grossAmount,
                    fee,
                    payerAccount.getCurrency(),
                    description,
                    payloadData.orderRef()
            );

            // 4. Update Merchant Statistics
            merchant.setAccumulatedGross(merchant.getAccumulatedGross().add(grossAmount));
            merchant.setAccumulatedFees(merchant.getAccumulatedFees().add(fee));
            merchant.setUnsettledBalance(merchant.getUnsettledBalance().add(netAmount));
            merchantRepository.save(merchant);

            QrPaymentResponse response = QrPaymentResponse.builder()
                    .transactionId(tx.getTransactionId())
                    .status(tx.getStatus())
                    .payerAccountId(payerAccount.getId())
                    .payerAccountNumber(payerAccount.getAccountNumber())
                    .payerShard(payerAccount.getShard().name())
                    .merchantId(merchant.getId())
                    .merchantCode(merchant.getMerchantCode())
                    .merchantName(merchant.getName())
                    .merchantAccountId(merchantAccount.getId())
                    .merchantAccountNumber(merchantAccount.getAccountNumber())
                    .merchantShard(merchantAccount.getShard().name())
                    .grossAmount(grossAmount)
                    .feeAmount(fee)
                    .netAmount(netAmount)
                    .currency(tx.getCurrency())
                    .orderRef(payloadData.orderRef())
                    .idempotencyKey(idempotencyKey)
                    .cachedReplay(false)
                    .timestamp(tx.getCreatedAt())
                    .build();

            // Cache in idempotency store
            if (idempotencyKey != null && !idempotencyKey.isBlank()) {
                TransferResponse transferEquiv = TransferResponse.builder()
                        .transactionId(tx.getTransactionId())
                        .status(tx.getStatus())
                        .amount(grossAmount)
                        .currency(tx.getCurrency())
                        .senderAccountId(payerAccount.getId())
                        .receiverAccountId(merchantAccount.getId())
                        .senderShard(payerAccount.getShard().name())
                        .receiverShard(merchantAccount.getShard().name())
                        .isCrossShard(!payerAccount.getShard().equals(merchantAccount.getShard()))
                        .idempotencyKey(idempotencyKey)
                        .cachedReplay(false)
                        .timestamp(tx.getCreatedAt())
                        .build();
                idempotencyService.markCompleted(idempotencyKey, transferEquiv);
            }

            return response;

        } catch (Exception ex) {
            if (idempotencyKey != null && !idempotencyKey.isBlank()) {
                idempotencyService.markFailed(idempotencyKey, ex.getMessage());
            }
            throw ex;
        }
    }

    @Transactional
    public SettlementResponse executeSettlement(Long merchantId) {
        Merchant merchant = merchantRepository.findById(merchantId)
                .orElseThrow(() -> new ResourceNotFoundException("Merchant not found with ID: " + merchantId));

        Account account = accountRepository.findById(merchant.getAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("Settlement account not found with ID: " + merchant.getAccountId()));

        BigDecimal unsettled = merchant.getUnsettledBalance();
        BigDecimal gross = merchant.getAccumulatedGross();
        BigDecimal fees = merchant.getAccumulatedFees();

        // If unsettled is 0, settle the gross minus fees if any, or unsettled
        BigDecimal settlementAmount = unsettled.compareTo(BigDecimal.ZERO) > 0 ? unsettled : gross.subtract(fees);
        if (settlementAmount.compareTo(BigDecimal.ZERO) < 0) {
            settlementAmount = BigDecimal.ZERO;
        }

        String batchRef = "SETTLE-" + System.currentTimeMillis() % 100000000;

        SettlementBatch batch = SettlementBatch.builder()
                .batchReference(batchRef)
                .merchantId(merchant.getId())
                .merchantName(merchant.getName())
                .settlementAccountId(account.getId())
                .transactionCount(1) // batch aggregation
                .grossVolume(gross)
                .totalFees(fees)
                .netSettlementAmount(settlementAmount)
                .status("COMPLETED")
                .build();

        SettlementBatch savedBatch = settlementBatchRepository.save(batch);

        // Update merchant settled volume and reset unsettled
        merchant.setAccumulatedNetSettled(merchant.getAccumulatedNetSettled().add(settlementAmount));
        merchant.setUnsettledBalance(BigDecimal.ZERO);
        merchantRepository.save(merchant);

        log.info("Completed settlement batch [{}] for merchant [{}]: NetSettled={}",
                batchRef, merchant.getName(), settlementAmount);

        return SettlementResponse.builder()
                .batchReference(savedBatch.getBatchReference())
                .merchantId(merchant.getId())
                .merchantName(merchant.getName())
                .settlementAccountId(account.getId())
                .settlementAccountNumber(account.getAccountNumber())
                .transactionCount(savedBatch.getTransactionCount())
                .grossVolume(savedBatch.getGrossVolume())
                .totalFees(savedBatch.getTotalFees())
                .netSettlementAmount(savedBatch.getNetSettlementAmount())
                .status(savedBatch.getStatus())
                .settlementDate(savedBatch.getCreatedAt())
                .build();
    }

    @Transactional(readOnly = true)
    public List<SettlementResponse> getSettlementHistory(Long merchantId) {
        Merchant merchant = merchantRepository.findById(merchantId)
                .orElseThrow(() -> new ResourceNotFoundException("Merchant not found with ID: " + merchantId));

        Account account = accountRepository.findById(merchant.getAccountId()).orElse(null);

        return settlementBatchRepository.findByMerchantIdOrderByCreatedAtDesc(merchantId).stream()
                .map(b -> SettlementResponse.builder()
                        .batchReference(b.getBatchReference())
                        .merchantId(b.getMerchantId())
                        .merchantName(b.getMerchantName())
                        .settlementAccountId(b.getSettlementAccountId())
                        .settlementAccountNumber(account != null ? account.getAccountNumber() : "N/A")
                        .transactionCount(b.getTransactionCount())
                        .grossVolume(b.getGrossVolume())
                        .totalFees(b.getTotalFees())
                        .netSettlementAmount(b.getNetSettlementAmount())
                        .status(b.getStatus())
                        .settlementDate(b.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    private MerchantResponse mapToResponse(Merchant m, Account acc) {
        return MerchantResponse.builder()
                .id(m.getId())
                .merchantCode(m.getMerchantCode())
                .name(m.getName())
                .category(m.getCategory())
                .accountId(m.getAccountId())
                .accountNumber(acc != null ? acc.getAccountNumber() : null)
                .shard(acc != null ? acc.getShard().name() : null)
                .feeRatePercent(m.getFeeRatePercent())
                .accumulatedGross(m.getAccumulatedGross())
                .accumulatedFees(m.getAccumulatedFees())
                .accumulatedNetSettled(m.getAccumulatedNetSettled())
                .unsettledBalance(m.getUnsettledBalance())
                .status(m.getStatus())
                .createdAt(m.getCreatedAt())
                .build();
    }

    private String generateMerchantCode() {
        for (int i = 0; i < 50; i++) {
            String code = "MCH-" + (100000 + secureRandom.nextInt(900000));
            if (!merchantRepository.existsByMerchantCode(code)) {
                return code;
            }
        }
        return "MCH-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private String generateSecretKey() {
        byte[] bytes = new byte[24];
        secureRandom.nextBytes(bytes);
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}
