package com.transmoney.backend;

import com.transmoney.backend.dto.request.CreateAccountRequest;
import com.transmoney.backend.dto.request.CreateUserRequest;
import com.transmoney.backend.dto.request.ExchangeRequest;
import com.transmoney.backend.dto.request.FxQuoteRequest;
import com.transmoney.backend.dto.request.TransferRequest;
import com.transmoney.backend.dto.response.*;
import com.transmoney.backend.entity.Account;
import com.transmoney.backend.entity.User;
import com.transmoney.backend.entity.enums.ShardType;
import com.transmoney.backend.entity.enums.TransactionStatus;
import com.transmoney.backend.exception.TransactionException;
import com.transmoney.backend.service.AccountService;
import com.transmoney.backend.service.FxRateService;
import com.transmoney.backend.service.LedgerService;
import com.transmoney.backend.service.TransferService;
import com.transmoney.backend.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class MultiCurrencyAndFxIntegrationTest {

    @Autowired
    private FxRateService fxRateService;

    @Autowired
    private UserService userService;

    @Autowired
    private AccountService accountService;

    @Autowired
    private TransferService transferService;

    @Autowired
    private LedgerService ledgerService;

    private User testUser;
    private Account usdAccount;
    private Account pkrAccount;
    private Account eurAccount;

    @BeforeEach
    void setUp() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);

        testUser = userService.createUser(CreateUserRequest.builder()
                .fullName("Fintech Globetrotter " + suffix)
                .email("globetrotter_" + suffix + "@example.com")
                .phoneNumber("+12025550199")
                .build());

        // Multi-currency accounts for the same user across multiple shards
        usdAccount = accountService.createAccount(CreateAccountRequest.builder()
                .userId(testUser.getId())
                .accountNumber("ACC-USD-" + suffix)
                .currency("USD")
                .initialBalance(BigDecimal.ZERO)
                .shard(ShardType.SHARD_1_US)
                .build());
        accountService.deposit(usdAccount.getId(), com.transmoney.backend.dto.request.DepositRequest.builder()
                .amount(new BigDecimal("5000.00"))
                .paymentMethod("WIRE_TRANSFER")
                .referenceNotes("Initial USD Load")
                .build());

        pkrAccount = accountService.createAccount(CreateAccountRequest.builder()
                .userId(testUser.getId())
                .accountNumber("ACC-PKR-" + suffix)
                .currency("PKR")
                .initialBalance(BigDecimal.ZERO)
                .shard(ShardType.SHARD_3_SOUTH)
                .build());
        accountService.deposit(pkrAccount.getId(), com.transmoney.backend.dto.request.DepositRequest.builder()
                .amount(new BigDecimal("50000.00"))
                .paymentMethod("BANK_TRANSFER")
                .referenceNotes("Initial PKR Load")
                .build());

        eurAccount = accountService.createAccount(CreateAccountRequest.builder()
                .userId(testUser.getId())
                .accountNumber("ACC-EUR-" + suffix)
                .currency("EUR")
                .initialBalance(BigDecimal.ZERO)
                .shard(ShardType.SHARD_2_UK)
                .build());
        accountService.deposit(eurAccount.getId(), com.transmoney.backend.dto.request.DepositRequest.builder()
                .amount(new BigDecimal("1000.00"))
                .paymentMethod("SEPA_TRANSFER")
                .referenceNotes("Initial EUR Load")
                .build());
    }

    @Test
    @DisplayName("FX Rates Engine: Should calculate live cross-rates and locked quotes with spread margin")
    void testFxRatesAndQuotes() {
        FxRatesResponse rates = fxRateService.getLiveRates();
        assertNotNull(rates);
        assertEquals("USD", rates.getBaseCurrency());
        assertTrue(rates.getSupportedCurrencies().contains("USD"));
        assertTrue(rates.getSupportedCurrencies().contains("EUR"));
        assertTrue(rates.getSupportedCurrencies().contains("PKR"));

        // Generate a 60-second quote for 100 USD -> PKR
        FxQuoteResponse quote = fxRateService.generateQuote(FxQuoteRequest.builder()
                .sourceCurrency("USD")
                .targetCurrency("PKR")
                .amount(new BigDecimal("100.00"))
                .build());

        assertNotNull(quote);
        assertNotNull(quote.getQuoteId());
        assertEquals("USD", quote.getSourceCurrency());
        assertEquals("PKR", quote.getTargetCurrency());
        assertEquals(new BigDecimal("100.00"), quote.getSourceAmount());
        assertTrue(quote.getMarketRate().compareTo(BigDecimal.ZERO) > 0);
        assertTrue(quote.getNetTargetAmount().compareTo(BigDecimal.ZERO) > 0);
        assertTrue(quote.getSpreadFeeAmount().compareTo(BigDecimal.ZERO) > 0);
        assertNotNull(quote.getExpiresAt());
    }

    @Test
    @DisplayName("Cross-Currency 2PC Transfer: Atomic cross-shard transfer from USD to PKR account")
    void testCrossCurrencyP2PTransfer() {
        BigDecimal transferUsd = new BigDecimal("200.00");

        TransferResponse response = transferService.executeTransfer(TransferRequest.builder()
                .senderAccountId(usdAccount.getId())
                .receiverAccountId(pkrAccount.getId())
                .amount(transferUsd)
                .currency("USD")
                .description("Cross-border USD to PKR remittance")
                .build());

        assertNotNull(response);
        assertEquals(TransactionStatus.COMMITTED, response.getStatus());
        assertEquals("USD", response.getCurrency());
        assertEquals(new BigDecimal("200.00"), response.getAmount());
        assertEquals("PKR", response.getTargetCurrency());
        assertNotNull(response.getTargetAmount());
        assertTrue(response.getTargetAmount().compareTo(new BigDecimal("50000.00")) > 0); // ~200 * 278 = ~55,600 PKR
        assertTrue(response.getIsCrossShard());

        // Assert balances
        Account updatedUsd = accountService.getAccountById(usdAccount.getId());
        Account updatedPkr = accountService.getAccountById(pkrAccount.getId());

        assertEquals(new BigDecimal("4800.00"), updatedUsd.getBalance());
        assertEquals(new BigDecimal("50000.00").add(response.getTargetAmount()), updatedPkr.getBalance());

        // Reconcile each account against its respective ledger entries
        ReconciliationResponse usdReconciliation = ledgerService.reconcileAccount(usdAccount.getId());
        assertTrue(usdReconciliation.isBalanced());

        ReconciliationResponse pkrReconciliation = ledgerService.reconcileAccount(pkrAccount.getId());
        assertTrue(pkrReconciliation.isBalanced());
    }

    @Test
    @DisplayName("Currency Exchange 2PC: Self-account exchange from USD to EUR with quote and idempotency")
    void testCurrencyExchangeWithQuoteAndIdempotency() {
        // 1. Get quote
        FxQuoteResponse quote = fxRateService.generateQuote(FxQuoteRequest.builder()
                .sourceCurrency("USD")
                .targetCurrency("EUR")
                .amount(new BigDecimal("500.00"))
                .build());

        String idempotencyKey = "IDEM-FX-" + UUID.randomUUID();

        ExchangeRequest req = ExchangeRequest.builder()
                .sourceAccountId(usdAccount.getId())
                .targetAccountId(eurAccount.getId())
                .sourceAmount(new BigDecimal("500.00"))
                .quoteId(quote.getQuoteId())
                .idempotencyKey(idempotencyKey)
                .build();

        ExchangeResponse res1 = transferService.executeExchange(req);
        assertNotNull(res1);
        assertEquals(TransactionStatus.COMMITTED, res1.getStatus());
        assertEquals("USD", res1.getSourceCurrency());
        assertEquals("EUR", res1.getTargetCurrency());
        assertEquals(new BigDecimal("500.00"), res1.getSourceAmount());
        assertEquals(new BigDecimal("4500.00"), res1.getSourceBalanceAfter());
        assertFalse(res1.getCachedReplay());

        // 2. Replay with identical idempotency key -> Must return cached response
        ExchangeResponse res2 = transferService.executeExchange(req);
        assertNotNull(res2);
        assertTrue(res2.getCachedReplay());
        assertEquals(res1.getTransactionId(), res2.getTransactionId());

        // Check balances were debited/credited only ONCE
        Account finalUsd = accountService.getAccountById(usdAccount.getId());
        assertEquals(new BigDecimal("4500.00"), finalUsd.getBalance());
    }

    @Test
    @DisplayName("Slippage Protection: Should vote ABORT when minimum target amount constraint is violated")
    void testSlippageProtectionAbort() {
        // Request 100 USD -> EUR, but demand an impossible floor of 1000 EUR
        TransferRequest request = TransferRequest.builder()
                .senderAccountId(usdAccount.getId())
                .receiverAccountId(eurAccount.getId())
                .amount(new BigDecimal("100.00"))
                .currency("USD")
                .minTargetAmount(new BigDecimal("1000.00")) // Impossible slippage constraint
                .build();

        TransactionException ex = assertThrows(TransactionException.class, () ->
                transferService.executeTransfer(request)
        );

        assertTrue(ex.getMessage().contains("Slippage boundary violation"));

        // Balances must remain unchanged
        Account currentUsd = accountService.getAccountById(usdAccount.getId());
        Account currentEur = accountService.getAccountById(eurAccount.getId());
        assertEquals(new BigDecimal("5000.00"), currentUsd.getBalance());
        assertEquals(new BigDecimal("1000.00"), currentEur.getBalance());
    }

    @Test
    @DisplayName("Multi-Currency Ledger Audit: Statements and zero-sum invariant check across distinct currencies")
    void testMultiCurrencyLedgerStatements() {
        // Perform an exchange
        transferService.executeExchange(ExchangeRequest.builder()
                .sourceAccountId(usdAccount.getId())
                .targetAccountId(eurAccount.getId())
                .sourceAmount(new BigDecimal("100.00"))
                .build());

        // Export statement for USD account
        String usdCsv = ledgerService.generateCsvStatement(usdAccount.getId());
        assertTrue(usdCsv.contains("USD"));
        assertTrue(usdCsv.contains("DEBIT"));

        // Export statement for EUR account
        String eurCsv = ledgerService.generateCsvStatement(eurAccount.getId());
        assertTrue(eurCsv.contains("EUR"));
        assertTrue(eurCsv.contains("CREDIT"));

        // Reconcile both
        assertTrue(ledgerService.reconcileAccount(usdAccount.getId()).isBalanced());
        assertTrue(ledgerService.reconcileAccount(eurAccount.getId()).isBalanced());
    }
}
