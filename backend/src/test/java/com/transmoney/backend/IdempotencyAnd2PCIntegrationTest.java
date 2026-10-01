package com.transmoney.backend;

import com.transmoney.backend.dto.request.CreateAccountRequest;
import com.transmoney.backend.dto.request.CreateUserRequest;
import com.transmoney.backend.dto.request.TransferRequest;
import com.transmoney.backend.dto.response.TransferResponse;
import com.transmoney.backend.entity.Account;
import com.transmoney.backend.entity.Transaction;
import com.transmoney.backend.entity.User;
import com.transmoney.backend.entity.enums.ShardType;
import com.transmoney.backend.entity.enums.TransactionStatus;
import com.transmoney.backend.entity.enums.TransactionType;
import com.transmoney.backend.exception.IdempotencyConflictException;
import com.transmoney.backend.repository.AccountRepository;
import com.transmoney.backend.repository.TransactionRepository;
import com.transmoney.backend.service.AccountService;
import com.transmoney.backend.service.TransferService;
import com.transmoney.backend.service.UserService;
import com.transmoney.backend.service.coordinator.TransactionRecoveryCoordinator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.util.UUID;
import java.util.concurrent.*;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class IdempotencyAnd2PCIntegrationTest {

    @Autowired
    private UserService userService;

    @Autowired
    private AccountService accountService;

    @Autowired
    private TransferService transferService;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private TransactionRecoveryCoordinator recoveryCoordinator;

    private Account senderAccount;
    private Account receiverAccount;

    @BeforeEach
    void setUp() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);

        User senderUser = userService.createUser(CreateUserRequest.builder()
                .fullName("Idemp Alice " + suffix)
                .email("idemp_alice_" + suffix + "@example.com")
                .phoneNumber("+923110000001")
                .build());

        senderAccount = accountService.createAccount(CreateAccountRequest.builder()
                .userId(senderUser.getId())
                .accountNumber("ACC-IDEMP-A-" + suffix)
                .currency("PKR")
                .initialBalance(new BigDecimal("10000.00"))
                .shard(ShardType.SHARD_1_NORTH)
                .build());

        User receiverUser = userService.createUser(CreateUserRequest.builder()
                .fullName("Idemp Bob " + suffix)
                .email("idemp_bob_" + suffix + "@example.com")
                .phoneNumber("+923110000002")
                .build());

        receiverAccount = accountService.createAccount(CreateAccountRequest.builder()
                .userId(receiverUser.getId())
                .accountNumber("ACC-IDEMP-B-" + suffix)
                .currency("PKR")
                .initialBalance(new BigDecimal("5000.00"))
                .shard(ShardType.SHARD_2_CENTRAL)
                .build());
    }

    @Test
    @DisplayName("Idempotent Replay: Duplicate transfer with same key returns cached result without double debit")
    void testIdempotentTransferReplay() {
        String idempotencyKey = "IDEMP-KEY-" + UUID.randomUUID();

        TransferRequest request = TransferRequest.builder()
                .senderAccountId(senderAccount.getId())
                .receiverAccountId(receiverAccount.getId())
                .amount(new BigDecimal("1500.00"))
                .currency("PKR")
                .description("Idempotency test payment")
                .idempotencyKey(idempotencyKey)
                .build();

        // First attempt -> processes and commits
        TransferResponse firstResponse = transferService.executeTransfer(request);
        assertNotNull(firstResponse);
        assertEquals(TransactionStatus.COMMITTED, firstResponse.getStatus());
        assertFalse(Boolean.TRUE.equals(firstResponse.getCachedReplay()));

        // Second attempt with exact same key -> should return cached replay
        TransferResponse secondResponse = transferService.executeTransfer(request);
        assertNotNull(secondResponse);
        assertEquals(firstResponse.getTransactionId(), secondResponse.getTransactionId());
        assertEquals(TransactionStatus.COMMITTED, secondResponse.getStatus());
        assertTrue(Boolean.TRUE.equals(secondResponse.getCachedReplay()));

        // Verify database balances: Only deducted ONCE!
        Account reloadedSender = accountRepository.findById(senderAccount.getId()).orElseThrow();
        Account reloadedReceiver = accountRepository.findById(receiverAccount.getId()).orElseThrow();

        assertEquals(new BigDecimal("8500.00"), reloadedSender.getBalance());
        assertEquals(new BigDecimal("6500.00"), reloadedReceiver.getBalance());
    }

    @Test
    @DisplayName("Idempotency Key Collision: Reusing key with different parameters throws conflict exception")
    void testIdempotencyConflictOnAlteredParameters() {
        String idempotencyKey = "IDEMP-KEY-" + UUID.randomUUID();

        TransferRequest originalReq = TransferRequest.builder()
                .senderAccountId(senderAccount.getId())
                .receiverAccountId(receiverAccount.getId())
                .amount(new BigDecimal("500.00"))
                .currency("PKR")
                .description("Initial attempt")
                .idempotencyKey(idempotencyKey)
                .build();

        transferService.executeTransfer(originalReq);

        // Same key, but amount is modified to 1000.00
        TransferRequest alteredReq = TransferRequest.builder()
                .senderAccountId(senderAccount.getId())
                .receiverAccountId(receiverAccount.getId())
                .amount(new BigDecimal("1000.00"))
                .currency("PKR")
                .description("Altered amount attempt")
                .idempotencyKey(idempotencyKey)
                .build();

        assertThrows(IdempotencyConflictException.class, () -> transferService.executeTransfer(alteredReq));
    }

    @Test
    @DisplayName("Recovery Coordinator: Sweeps and rolls back stale orphaned PREPARED and INITIATED transactions")
    void testTransactionRecoverySweep() {
        String staleTxId = "TX-STALE-" + UUID.randomUUID();

        Transaction orphanTx = Transaction.builder()
                .transactionId(staleTxId)
                .senderAccountId(senderAccount.getId())
                .receiverAccountId(receiverAccount.getId())
                .amount(new BigDecimal("200.00"))
                .currency("PKR")
                .description("Simulated network crash before commit")
                .type(TransactionType.P2P_TRANSFER)
                .status(TransactionStatus.PREPARED)
                .build();

        orphanTx = transactionRepository.save(orphanTx);

        // Verify it was saved as PREPARED
        assertEquals(TransactionStatus.PREPARED, orphanTx.getStatus());

        // Run recovery coordinator sweep for transactions older than 0 seconds (immediate threshold)
        int reconciled = recoveryCoordinator.triggerManualRecovery(0);
        assertTrue(reconciled >= 1, "Should have reconciled at least 1 stale transaction");

        // Transaction should now be FAILED
        Transaction reconciledTx = transactionRepository.findByTransactionId(staleTxId).orElseThrow();
        assertEquals(TransactionStatus.FAILED, reconciledTx.getStatus());
    }

    @Test
    @DisplayName("Deadlock Prevention: Bi-directional concurrent transfers complete without deadlocks")
    void testConcurrentBiDirectionalTransfers() throws InterruptedException, ExecutionException {
        ExecutorService executor = Executors.newFixedThreadPool(2);

        Callable<TransferResponse> task1 = () -> transferService.executeTransfer(TransferRequest.builder()
                .senderAccountId(senderAccount.getId())
                .receiverAccountId(receiverAccount.getId())
                .amount(new BigDecimal("100.00"))
                .currency("PKR")
                .description("A to B concurrent")
                .build());

        Callable<TransferResponse> task2 = () -> transferService.executeTransfer(TransferRequest.builder()
                .senderAccountId(receiverAccount.getId())
                .receiverAccountId(senderAccount.getId())
                .amount(new BigDecimal("100.00"))
                .currency("PKR")
                .description("B to A concurrent")
                .build());

        Future<TransferResponse> future1 = executor.submit(task1);
        Future<TransferResponse> future2 = executor.submit(task2);

        TransferResponse res1 = future1.get();
        TransferResponse res2 = future2.get();

        assertNotNull(res1);
        assertNotNull(res2);
        assertEquals(TransactionStatus.COMMITTED, res1.getStatus());
        assertEquals(TransactionStatus.COMMITTED, res2.getStatus());

        executor.shutdown();
    }
}
