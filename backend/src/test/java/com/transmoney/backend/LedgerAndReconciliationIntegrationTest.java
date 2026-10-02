package com.transmoney.backend;

import com.transmoney.backend.dto.request.CreateAccountRequest;
import com.transmoney.backend.dto.request.CreateUserRequest;
import com.transmoney.backend.dto.request.DepositRequest;
import com.transmoney.backend.dto.request.WithdrawRequest;
import com.transmoney.backend.dto.response.LedgerEntryResponse;
import com.transmoney.backend.dto.response.ReconciliationResponse;
import com.transmoney.backend.entity.Account;
import com.transmoney.backend.entity.User;
import com.transmoney.backend.entity.enums.LedgerEntryType;
import com.transmoney.backend.entity.enums.ShardType;
import com.transmoney.backend.service.AccountService;
import com.transmoney.backend.service.LedgerService;
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
class LedgerAndReconciliationIntegrationTest {

    @Autowired
    private UserService userService;

    @Autowired
    private AccountService accountService;

    @Autowired
    private LedgerService ledgerService;

    private Account testAccount;

    @BeforeEach
    void setUp() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        User user = userService.createUser(CreateUserRequest.builder()
                .fullName("Ledger User " + suffix)
                .email("ledger_" + suffix + "@example.com")
                .phoneNumber("+923000000000")
                .build());

        testAccount = accountService.createAccount(CreateAccountRequest.builder()
                .userId(user.getId())
                .accountNumber("LEDGER-ACC-" + suffix)
                .currency("PKR")
                .initialBalance(BigDecimal.ZERO)
                .shard(ShardType.SHARD_1_NORTH)
                .build());
    }

    @Test
    @DisplayName("Phase 5: Deposit records credit ledger entry and reconciliation passes")
    void testDepositRecordsLedgerAndReconciliationPasses() {
        // Deposit 5,000 PKR
        DepositRequest depositReq = DepositRequest.builder()
                .amount(new BigDecimal("5000.00"))
                .paymentMethod("BANK_TRANSFER")
                .referenceNotes("Initial deposit")
                .build();
        accountService.deposit(testAccount.getId(), depositReq);

        // Retrieve entries via LedgerService
        List<LedgerEntryResponse> entries = ledgerService.getEntriesByAccountId(testAccount.getId());
        assertFalse(entries.isEmpty(), "Ledger entries should not be empty after deposit");
        assertEquals(1, entries.size());
        assertEquals(LedgerEntryType.CREDIT, entries.get(0).getEntryType());
        assertEquals(new BigDecimal("5000.00"), entries.get(0).getAmount());

        // Reconcile account
        ReconciliationResponse reconciliation = ledgerService.reconcileAccount(testAccount.getId());
        assertTrue(reconciliation.isBalanced(), "Account should be balanced");
        assertEquals(new BigDecimal("5000.00"), reconciliation.getCurrentBalance());
        assertEquals(new BigDecimal("5000.00"), reconciliation.getCalculatedLedgerBalance());
        assertEquals(1, reconciliation.getTotalEntries());
    }

    @Test
    @DisplayName("Phase 5: Deposit and withdrawal maintain GAAP zero-sum invariant and reconciliation")
    void testDepositAndWithdrawalReconciliation() {
        // Deposit 10,000 PKR
        accountService.deposit(testAccount.getId(), DepositRequest.builder()
                .amount(new BigDecimal("10000.00"))
                .paymentMethod("ONLINE_BANKING")
                .build());

        // Withdraw 4,000 PKR
        accountService.withdraw(testAccount.getId(), WithdrawRequest.builder()
                .amount(new BigDecimal("4000.00"))
                .destinationBank("HBL")
                .destinationAccountNumber("PK12HBL0001")
                .build());

        // Ledger entries check
        List<LedgerEntryResponse> entries = ledgerService.getEntriesByAccountId(testAccount.getId());
        assertEquals(2, entries.size());

        // Reconcile account
        ReconciliationResponse reconciliation = ledgerService.reconcileAccount(testAccount.getId());
        assertTrue(reconciliation.isBalanced(), "Account ledger must balance");
        assertEquals(new BigDecimal("6000.00"), reconciliation.getCurrentBalance());
        assertEquals(new BigDecimal("6000.00"), reconciliation.getCalculatedLedgerBalance());
        assertEquals(new BigDecimal("4000.00"), reconciliation.getTotalDebits());
        assertEquals(new BigDecimal("10000.00"), reconciliation.getTotalCredits());
    }
}
