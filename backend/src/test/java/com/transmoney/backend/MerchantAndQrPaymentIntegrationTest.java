package com.transmoney.backend;

import com.transmoney.backend.dto.request.*;
import com.transmoney.backend.dto.response.*;
import com.transmoney.backend.entity.Account;
import com.transmoney.backend.entity.Merchant;
import com.transmoney.backend.entity.Transaction;
import com.transmoney.backend.entity.User;
import com.transmoney.backend.entity.enums.ShardType;
import com.transmoney.backend.entity.enums.TransactionStatus;
import com.transmoney.backend.entity.enums.TransactionType;
import com.transmoney.backend.exception.TransactionException;
import com.transmoney.backend.repository.AccountRepository;
import com.transmoney.backend.repository.MerchantRepository;
import com.transmoney.backend.repository.TransactionRepository;
import com.transmoney.backend.service.AccountService;
import com.transmoney.backend.service.MerchantService;
import com.transmoney.backend.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class MerchantAndQrPaymentIntegrationTest {

    @Autowired
    private UserService userService;

    @Autowired
    private AccountService accountService;

    @Autowired
    private MerchantService merchantService;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private MerchantRepository merchantRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    private User merchantUser;
    private Account merchantAccount;
    private User customerUser;
    private Account customerAccount;

    @BeforeEach
    void setUp() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);

        // Provision Merchant User & Account on Shard 3 (SG)
        merchantUser = userService.createUser(CreateUserRequest.builder()
                .fullName("Merchant " + suffix)
                .email("merchant." + suffix + "@retail.com")
                .phoneNumber("+92300" + (1000000 + (int)(Math.random() * 8999999)))
                .build());

        merchantAccount = accountService.createAccount(CreateAccountRequest.builder()
                .userId(merchantUser.getId())
                .accountNumber("ACC-MCH-" + suffix)
                .initialBalance(BigDecimal.ZERO)
                .currency("PKR")
                .shard(ShardType.SHARD_3_SG)
                .build());

        // Provision Customer User & Account on Shard 1 (US)
        customerUser = userService.createUser(CreateUserRequest.builder()
                .fullName("Customer " + suffix)
                .email("customer." + suffix + "@domain.com")
                .phoneNumber("+92300" + (1000000 + (int)(Math.random() * 8999999)))
                .build());

        customerAccount = accountService.createAccount(CreateAccountRequest.builder()
                .userId(customerUser.getId())
                .accountNumber("ACC-CUST-" + suffix)
                .initialBalance(new BigDecimal("10000.00"))
                .currency("PKR")
                .shard(ShardType.SHARD_1_US)
                .build());
    }

    @Test
    @DisplayName("Should onboard merchant, generate merchant code, and assign settlement account")
    void testMerchantOnboarding() {
        MerchantOnboardRequest request = MerchantOnboardRequest.builder()
                .userId(merchantUser.getId())
                .businessName("SuperMart Wholesale")
                .category("RETAIL")
                .accountId(merchantAccount.getId())
                .feeRatePercent(new BigDecimal("2.00"))
                .build();

        MerchantResponse response = merchantService.onboardMerchant(request);

        assertNotNull(response.getId());
        assertNotNull(response.getMerchantCode());
        assertTrue(response.getMerchantCode().startsWith("MCH-"));
        assertEquals("SuperMart Wholesale", response.getName());
        assertEquals("RETAIL", response.getCategory());
        assertEquals(merchantAccount.getId(), response.getAccountId());
        assertEquals(new BigDecimal("2.00"), response.getFeeRatePercent());
        assertEquals("ACTIVE", response.getStatus());

        // Verify user role was upgraded
        User updatedUser = userService.getUserById(merchantUser.getId());
        assertEquals("ROLE_MERCHANT", updatedUser.getRole());
    }

    @Test
    @DisplayName("Should generate dynamic QR code with HMAC signature, SVG vector, and verify payload")
    void testGenerateAndVerifyDynamicQrCode() {
        MerchantResponse m = merchantService.onboardMerchant(MerchantOnboardRequest.builder()
                .userId(merchantUser.getId())
                .businessName("Cafe Bistro")
                .category("FOOD_BEVERAGE")
                .accountId(merchantAccount.getId())
                .feeRatePercent(new BigDecimal("1.50"))
                .build());

        CreateQrRequest qrReq = CreateQrRequest.builder()
                .merchantId(m.getId())
                .amount(new BigDecimal("500.00"))
                .orderRef("INV-101")
                .description("Table 5 Espresso Order")
                .isDynamic(true)
                .expiryMinutes(20)
                .build();

        QrCodeResponse qrResp = merchantService.generateQrCode(qrReq);

        assertNotNull(qrResp.getQrPayload());
        assertNotNull(qrResp.getQrImageDataUrl());
        assertTrue(qrResp.getQrImageDataUrl().startsWith("data:image/png;base64,"));
        assertNotNull(qrResp.getQrSvg());
        assertTrue(qrResp.getQrSvg().contains("<svg"));
        assertEquals(new BigDecimal("500.00"), qrResp.getAmount());
        assertEquals("INV-101", qrResp.getOrderRef());
        assertNotNull(qrResp.getExpiresAt());

        // Verify QR Scan endpoint decodes correctly
        QrScanDetailsResponse scanResp = merchantService.scanAndVerifyQr(
                ScanQrRequest.builder().qrPayload(qrResp.getQrPayload()).build()
        );

        assertTrue(scanResp.isValid());
        assertFalse(scanResp.getIsExpired());
        assertEquals("Cafe Bistro", scanResp.getMerchantName());
        assertEquals(0, new BigDecimal("500.00").compareTo(scanResp.getAmount()));
        assertEquals(0, new BigDecimal("1.50").compareTo(scanResp.getFeeRatePercent()));
        assertEquals(0, new BigDecimal("7.50").compareTo(scanResp.getEstimatedFee())); // 500 * 1.5%
        assertEquals(0, new BigDecimal("492.50").compareTo(scanResp.getEstimatedNetAmount())); // 500 - 7.50
    }

    @Test
    @DisplayName("Should execute cross-shard 2PC QR payment with MDR fee deduction atomically")
    void testCrossShard2pcQrPaymentWithMdrFee() {
        MerchantResponse m = merchantService.onboardMerchant(MerchantOnboardRequest.builder()
                .userId(merchantUser.getId())
                .businessName("TechStore Hub")
                .category("ELECTRONICS")
                .accountId(merchantAccount.getId())
                .feeRatePercent(new BigDecimal("1.50"))
                .build());

        QrCodeResponse qr = merchantService.generateQrCode(CreateQrRequest.builder()
                .merchantId(m.getId())
                .amount(new BigDecimal("2000.00"))
                .orderRef("ORD-TECH-99")
                .isDynamic(true)
                .build());

        PayQrRequest payReq = PayQrRequest.builder()
                .qrPayload(qr.getQrPayload())
                .payerAccountId(customerAccount.getId())
                .build();

        QrPaymentResponse payResp = merchantService.processQrPayment(payReq, null);

        assertEquals(TransactionStatus.COMMITTED, payResp.getStatus());
        assertEquals(0, new BigDecimal("2000.00").compareTo(payResp.getGrossAmount()));
        assertEquals(0, new BigDecimal("30.00").compareTo(payResp.getFeeAmount())); // 2000 * 1.5% = 30.00
        assertEquals(0, new BigDecimal("1970.00").compareTo(payResp.getNetAmount())); // 2000 - 30.00 = 1970.00
        assertEquals(customerAccount.getId(), payResp.getPayerAccountId());
        assertEquals(merchantAccount.getId(), payResp.getMerchantAccountId());
        assertFalse(payResp.isCachedReplay());

        // Verify account balances post-commit
        Account refreshedPayer = accountRepository.findById(customerAccount.getId()).orElseThrow();
        Account refreshedMerchant = accountRepository.findById(merchantAccount.getId()).orElseThrow();

        // Payer debited gross amount: 10,000 - 2,000 = 8,000 PKR
        assertEquals(0, new BigDecimal("8000.00").compareTo(refreshedPayer.getBalance()));
        // Merchant credited net amount: 0 + 1,970 = 1,970 PKR
        assertEquals(0, new BigDecimal("1970.00").compareTo(refreshedMerchant.getBalance()));

        // Verify transaction record
        Transaction tx = transactionRepository.findByTransactionId(payResp.getTransactionId()).orElseThrow();
        assertEquals(TransactionType.MERCHANT_PAYMENT, tx.getType());
        assertEquals(TransactionStatus.COMMITTED, tx.getStatus());

        // Verify merchant cumulative metrics
        Merchant refreshedMerchantEntity = merchantRepository.findById(m.getId()).orElseThrow();
        assertEquals(0, new BigDecimal("2000.00").compareTo(refreshedMerchantEntity.getAccumulatedGross()));
        assertEquals(0, new BigDecimal("30.00").compareTo(refreshedMerchantEntity.getAccumulatedFees()));
        assertEquals(0, new BigDecimal("1970.00").compareTo(refreshedMerchantEntity.getUnsettledBalance()));
    }

    @Test
    @DisplayName("Should prevent double-spend using idempotency key on QR payments")
    void testQrPaymentIdempotencyReplay() {
        MerchantResponse m = merchantService.onboardMerchant(MerchantOnboardRequest.builder()
                .userId(merchantUser.getId())
                .businessName("BookStore")
                .category("RETAIL")
                .accountId(merchantAccount.getId())
                .feeRatePercent(new BigDecimal("1.00"))
                .build());

        QrCodeResponse qr = merchantService.generateQrCode(CreateQrRequest.builder()
                .merchantId(m.getId())
                .amount(new BigDecimal("1000.00"))
                .isDynamic(true)
                .build());

        String key = "IDEMP-QR-" + UUID.randomUUID();

        PayQrRequest payReq = PayQrRequest.builder()
                .qrPayload(qr.getQrPayload())
                .payerAccountId(customerAccount.getId())
                .idempotencyKey(key)
                .build();

        // First Execution
        QrPaymentResponse resp1 = merchantService.processQrPayment(payReq, null);
        assertFalse(resp1.isCachedReplay());
        assertEquals(TransactionStatus.COMMITTED, resp1.getStatus());

        Account payerAfterFirst = accountRepository.findById(customerAccount.getId()).orElseThrow();
        assertEquals(0, new BigDecimal("9000.00").compareTo(payerAfterFirst.getBalance()));

        // Second Execution with same key
        QrPaymentResponse resp2 = merchantService.processQrPayment(payReq, null);
        assertTrue(resp2.isCachedReplay());
        assertEquals(resp1.getTransactionId(), resp2.getTransactionId());

        // Payer balance must NOT be debited again
        Account payerAfterSecond = accountRepository.findById(customerAccount.getId()).orElseThrow();
        assertEquals(0, new BigDecimal("9000.00").compareTo(payerAfterSecond.getBalance()));
    }

    @Test
    @DisplayName("Should reject tampered QR code payloads")
    void testTamperedQrPayloadRejection() {
        MerchantResponse m = merchantService.onboardMerchant(MerchantOnboardRequest.builder()
                .userId(merchantUser.getId())
                .businessName("Pharmacy Store")
                .category("HEALTH")
                .accountId(merchantAccount.getId())
                .build());

        QrCodeResponse qr = merchantService.generateQrCode(CreateQrRequest.builder()
                .merchantId(m.getId())
                .amount(new BigDecimal("500.00"))
                .isDynamic(true)
                .build());

        // Tamper payload by altering payload characters
        String tamperedPayload = qr.getQrPayload().substring(0, qr.getQrPayload().length() - 5) + "ABCDE";

        QrScanDetailsResponse scanResult = merchantService.scanAndVerifyQr(
                ScanQrRequest.builder().qrPayload(tamperedPayload).build()
        );
        assertFalse(scanResult.isValid());

        PayQrRequest payReq = PayQrRequest.builder()
                .qrPayload(tamperedPayload)
                .payerAccountId(customerAccount.getId())
                .build();

        assertThrows(Exception.class, () -> merchantService.processQrPayment(payReq, null));
    }

    @Test
    @DisplayName("Should execute settlement batch and record settlement history")
    void testMerchantSettlementBatch() {
        MerchantResponse m = merchantService.onboardMerchant(MerchantOnboardRequest.builder()
                .userId(merchantUser.getId())
                .businessName("Gourmet Bakery")
                .category("FOOD_BEVERAGE")
                .accountId(merchantAccount.getId())
                .feeRatePercent(new BigDecimal("1.50"))
                .build());

        // Process a QR payment to accumulate unsettled balance
        QrCodeResponse qr = merchantService.generateQrCode(CreateQrRequest.builder()
                .merchantId(m.getId())
                .amount(new BigDecimal("3000.00"))
                .isDynamic(true)
                .build());

        merchantService.processQrPayment(PayQrRequest.builder()
                .qrPayload(qr.getQrPayload())
                .payerAccountId(customerAccount.getId())
                .build(), null);

        // Execute Settlement
        SettlementResponse settlement = merchantService.executeSettlement(m.getId());

        assertNotNull(settlement.getBatchReference());
        assertTrue(settlement.getBatchReference().startsWith("SETTLE-"));
        assertEquals("COMPLETED", settlement.getStatus());
        assertEquals(0, new BigDecimal("3000.00").compareTo(settlement.getGrossVolume()));
        assertEquals(0, new BigDecimal("45.00").compareTo(settlement.getTotalFees())); // 3000 * 1.5%
        assertEquals(0, new BigDecimal("2955.00").compareTo(settlement.getNetSettlementAmount()));

        // Verify settlement history
        List<SettlementResponse> history = merchantService.getSettlementHistory(m.getId());
        assertEquals(1, history.size());
        assertEquals(settlement.getBatchReference(), history.get(0).getBatchReference());

        // Unsettled balance should be reset to 0
        Merchant updatedMerchant = merchantRepository.findById(m.getId()).orElseThrow();
        assertEquals(0, BigDecimal.ZERO.compareTo(updatedMerchant.getUnsettledBalance()));
        assertEquals(0, new BigDecimal("2955.00").compareTo(updatedMerchant.getAccumulatedNetSettled()));
    }
}
