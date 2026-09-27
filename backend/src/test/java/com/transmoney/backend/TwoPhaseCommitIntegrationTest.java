package com.transmoney.backend;

import com.transmoney.backend.dto.request.CreateAccountRequest;
import com.transmoney.backend.dto.request.CreateUserRequest;
import com.transmoney.backend.dto.request.TransferRequest;
import com.transmoney.backend.dto.response.AccountBalanceResponse;
import com.transmoney.backend.dto.response.TransactionResponse;
import com.transmoney.backend.dto.response.TransferResponse;
import com.transmoney.backend.entity.Account;
import com.transmoney.backend.entity.User;
import com.transmoney.backend.entity.enums.LedgerEntryType;
import com.transmoney.backend.entity.enums.ShardType;
import com.transmoney.backend.entity.enums.TransactionStatus;
import com.transmoney.backend.exception.InsufficientBalanceException;
import com.transmoney.backend.service.AccountService;
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
class TwoPhaseCommitIntegrationTest {

    @Autowired
    private UserService userService;

    @Autowired
    private AccountService accountService;

    @Autowired
    private TransferService transferService;

    private Account senderAccount;
    private Account receiverAccount;

    @BeforeEach
    void setUp() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);

        // 1. Create Sender User and Account (SHARD_3_SOUTH)
        User senderUser = userService.createUser(CreateUserRequest.builder()
                .fullName("Alice Johnson " + suffix)
                .email("alice_" + suffix + "@example.com")
                .phoneNumber("+923001234567")
                .build());

        senderAccount = accountService.createAccount(CreateAccountRequest.builder()
                .userId(senderUser.getId())
                .accountNumber("ACC-ALICE-" + suffix)
                .currency("PKR")
                .initialBalance(new BigDecimal("10000.00"))
                .shard(ShardType.SHARD_3_SOUTH)
                .build());

        // 2. Create Receiver User and Account (SHARD_2_CENTRAL)
        User receiverUser = userService.createUser(CreateUserRequest.builder()
                .fullName("Bob Ahmed " + suffix)
                .email("bob_" + suffix + "@example.com")
                .phoneNumber("+923007654321")
                .build());

        receiverAccount = accountService.createAccount(CreateAccountRequest.builder()
                .userId(receiverUser.getId())
                .accountNumber("ACC-BOB-" + suffix)
                .currency("PKR")
                .initialBalance(new BigDecimal("1000.00"))
                .shard(ShardType.SHARD_2_CENTRAL)
                .build());
    }

    @Test
    @DisplayName("Verify successful cross-shard 2PC transfer and double-entry bookkeeping")
    void testSuccessfulCrossShardTransfer() {
        BigDecimal transferAmount = new BigDecimal("2500.00");

        TransferRequest transferRequest = TransferRequest.builder()
                .senderAccountId(senderAccount.getId())
                .receiverAccountId(receiverAccount.getId())
                .amount(transferAmount)
                .currency("PKR")
                .description("Cross-shard P2P settlement")
                .build();

        TransferResponse response = transferService.executeTransfer(transferRequest);

        assertNotNull(response);
        assertNotNull(response.getTransactionId());
        assertEquals(TransactionStatus.COMMITTED, response.getStatus());
        assertEquals(0, transferAmount.compareTo(response.getAmount()));
        assertEquals("PKR", response.getCurrency());

        // Verify Sender balance reduced
        AccountBalanceResponse senderBal = accountService.getBalance(senderAccount.getId());
        assertEquals(0, new BigDecimal("7500.00").compareTo(senderBal.getBalance()));

        // Verify Receiver balance increased
        AccountBalanceResponse receiverBal = accountService.getBalance(receiverAccount.getId());
        assertEquals(0, new BigDecimal("3500.00").compareTo(receiverBal.getBalance()));

        // Verify Audit & Double-Entry Ledger
        TransactionResponse txAudit = transferService.getTransactionByTransactionId(response.getTransactionId());
        assertEquals(TransactionStatus.COMMITTED, txAudit.getStatus());
        assertEquals(2, txAudit.getLedgerEntries().size());

        boolean hasDebit = txAudit.getLedgerEntries().stream()
                .anyMatch(e -> e.getType() == LedgerEntryType.DEBIT &&
                        e.getAccountId().equals(senderAccount.getId()) &&
                        e.getAmount().compareTo(transferAmount) == 0 &&
                        e.getBalanceAfter().compareTo(new BigDecimal("7500.00")) == 0);

        boolean hasCredit = txAudit.getLedgerEntries().stream()
                .anyMatch(e -> e.getType() == LedgerEntryType.CREDIT &&
                        e.getAccountId().equals(receiverAccount.getId()) &&
                        e.getAmount().compareTo(transferAmount) == 0 &&
                        e.getBalanceAfter().compareTo(new BigDecimal("3500.00")) == 0);

        assertTrue(hasDebit, "Expected debit ledger entry for sender");
        assertTrue(hasCredit, "Expected credit ledger entry for receiver");
    }

    @Test
    @DisplayName("Verify insufficient balance rejects transfer with InsufficientBalanceException and maintains consistency")
    void testInsufficientBalanceRejection() {
        BigDecimal transferAmount = new BigDecimal("50000.00");

        TransferRequest transferRequest = TransferRequest.builder()
                .senderAccountId(senderAccount.getId())
                .receiverAccountId(receiverAccount.getId())
                .amount(transferAmount)
                .currency("PKR")
                .description("Excessive transfer")
                .build();

        assertThrows(InsufficientBalanceException.class, () -> transferService.executeTransfer(transferRequest));

        // Verify Sender balance unchanged
        AccountBalanceResponse senderBal = accountService.getBalance(senderAccount.getId());
        assertEquals(0, new BigDecimal("10000.00").compareTo(senderBal.getBalance()));

        // Verify Receiver balance unchanged
        AccountBalanceResponse receiverBal = accountService.getBalance(receiverAccount.getId());
        assertEquals(0, new BigDecimal("1000.00").compareTo(receiverBal.getBalance()));
    }
}
