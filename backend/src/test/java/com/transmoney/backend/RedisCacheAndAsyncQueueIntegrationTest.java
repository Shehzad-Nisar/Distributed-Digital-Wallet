package com.transmoney.backend;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.transmoney.backend.dto.request.CreateAccountRequest;
import com.transmoney.backend.dto.request.CreateUserRequest;
import com.transmoney.backend.dto.request.DepositRequest;
import com.transmoney.backend.dto.request.TransferRequest;
import com.transmoney.backend.dto.response.AccountBalanceResponse;
import com.transmoney.backend.dto.response.ApiResponse;
import com.transmoney.backend.dto.response.CacheStatsResponse;
import com.transmoney.backend.dto.response.QueueStatsResponse;
import com.transmoney.backend.entity.Account;
import com.transmoney.backend.entity.User;
import com.transmoney.backend.entity.enums.ShardType;
import com.transmoney.backend.service.AccountService;
import com.transmoney.backend.service.UserService;
import com.transmoney.backend.service.cache.BalanceCacheService;
import com.transmoney.backend.service.coordinator.TwoPhaseCommitCoordinator;
import com.transmoney.backend.service.queue.AsyncQueueBufferService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class RedisCacheAndAsyncQueueIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserService userService;

    @Autowired
    private AccountService accountService;

    @Autowired
    private TwoPhaseCommitCoordinator coordinator;

    @Autowired
    private BalanceCacheService balanceCacheService;

    @Autowired
    private AsyncQueueBufferService queueBufferService;

    @Autowired
    private ObjectMapper objectMapper;

    private User testUser;

    @BeforeEach
    void setUp() {
        balanceCacheService.clearAll();
        String uniqueSuffix = UUID.randomUUID().toString().substring(0, 8);
        testUser = userService.createUser(CreateUserRequest.builder()
                .email("cacheuser_" + uniqueSuffix + "@example.com")
                .fullName("Cache Testing User")
                .build());
    }

    @Test
    @DisplayName("Phase 7: Balance Cache Hit, Miss, and Instant Eviction on Deposit")
    void testBalanceCacheLifecycleAndEviction() {
        Account account = accountService.createAccount(CreateAccountRequest.builder()
                .userId(testUser.getId())
                .accountNumber("ACC-CACHE-101-" + UUID.randomUUID().toString().substring(0, 5))
                .currency("USD")
                .initialBalance(new BigDecimal("500.00"))
                .shard(ShardType.SHARD_1_US)
                .build());

        long initialHits = balanceCacheService.getHits();
        long initialEvictions = balanceCacheService.getEvictions();

        // 1. First getBalance call -> Cache Miss, then populates cache
        AccountBalanceResponse firstRead = accountService.getBalance(account.getId());
        assertThat(firstRead.getBalance()).isEqualByComparingTo("500.00");

        // 2. Second getBalance call -> Cache Hit!
        AccountBalanceResponse secondRead = accountService.getBalance(account.getId());
        assertThat(secondRead.getBalance()).isEqualByComparingTo("500.00");
        assertThat(balanceCacheService.getHits()).isGreaterThan(initialHits);

        // 3. Deposit funds -> Triggers cache eviction
        accountService.deposit(account.getId(), DepositRequest.builder()
                .amount(new BigDecimal("250.00"))
                .paymentMethod("CREDIT_CARD")
                .referenceNotes("Cache test deposit")
                .build());

        assertThat(balanceCacheService.getEvictions()).isGreaterThan(initialEvictions);

        // 4. Subsequent read -> Fresh balance from DB, re-caches new balance
        AccountBalanceResponse postDepositRead = accountService.getBalance(account.getId());
        assertThat(postDepositRead.getBalance()).isEqualByComparingTo("750.00");
    }

    @Test
    @DisplayName("Phase 7: 2PC Multi-Shard Transfer Evicts Caches and Buffers Async Transaction Event")
    void test2PCTransferEvictsBothCachesAndBuffersEvent() throws Exception {
        Account sender = accountService.createAccount(CreateAccountRequest.builder()
                .userId(testUser.getId())
                .accountNumber("ACC-SND-" + UUID.randomUUID().toString().substring(0, 6))
                .currency("EUR")
                .initialBalance(new BigDecimal("1000.00"))
                .shard(ShardType.SHARD_2_UK)
                .build());

        Account receiver = accountService.createAccount(CreateAccountRequest.builder()
                .userId(testUser.getId())
                .accountNumber("ACC-RCV-" + UUID.randomUUID().toString().substring(0, 6))
                .currency("EUR")
                .initialBalance(new BigDecimal("200.00"))
                .shard(ShardType.SHARD_3_SG)
                .build());

        // Warm cache for both
        accountService.getBalance(sender.getId());
        accountService.getBalance(receiver.getId());

        long enqueuedBefore = queueBufferService.getTotalEnqueued();
        long evictionsBefore = balanceCacheService.getEvictions();

        // Execute 2PC transfer
        coordinator.executeTransfer(TransferRequest.builder()
                .senderAccountId(sender.getId())
                .receiverAccountId(receiver.getId())
                .amount(new BigDecimal("300.00"))
                .currency("EUR")
                .description("Phase 7 async buffer test transfer")
                .build());

        // Assert caches were evicted for both sender and receiver
        assertThat(balanceCacheService.getEvictions()).isGreaterThanOrEqualTo(evictionsBefore + 2);

        // Assert event was placed in async queue buffer
        assertThat(queueBufferService.getTotalEnqueued()).isGreaterThan(enqueuedBefore);

        // Allow async consumer worker brief moment to drain and process
        TimeUnit.MILLISECONDS.sleep(150);

        assertThat(queueBufferService.getTotalProcessed()).isGreaterThan(0);

        // Validate final balances
        assertThat(accountService.getBalance(sender.getId()).getBalance()).isEqualByComparingTo("700.00");
        assertThat(accountService.getBalance(receiver.getId()).getBalance()).isEqualByComparingTo("500.00");
    }

    @Test
    @DisplayName("Phase 7: System Buffer APIs Return Real-Time Cache and Queue Metrics")
    void testSystemBufferApiEndpoints() throws Exception {
        // Test Cache Stats API
        mockMvc.perform(get("/api/system/cache-stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.hits").isNumber())
                .andExpect(jsonPath("$.data.misses").isNumber())
                .andExpect(jsonPath("$.data.evictions").isNumber());

        // Test Queue Stats API
        mockMvc.perform(get("/api/system/queue-stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.queueStatus").value("OPERATIONAL"))
                .andExpect(jsonPath("$.data.totalEnqueued").isNumber());

        // Test Cache Warming API
        mockMvc.perform(post("/api/system/warm-cache"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isNumber());

        // Test Cache Clear API
        mockMvc.perform(post("/api/system/cache-clear"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").value("CLEARED"));
    }
}
