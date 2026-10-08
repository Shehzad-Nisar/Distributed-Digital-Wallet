package com.transmoney.backend;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.transmoney.backend.dto.request.ChaosConfigRequest;
import com.transmoney.backend.dto.request.CreateAccountRequest;
import com.transmoney.backend.dto.request.CreateUserRequest;
import com.transmoney.backend.dto.request.LoadTestRequest;
import com.transmoney.backend.dto.request.TransferRequest;
import com.transmoney.backend.dto.response.LoadBenchmarkResult;
import com.transmoney.backend.entity.Account;
import com.transmoney.backend.entity.Transaction;
import com.transmoney.backend.entity.User;
import com.transmoney.backend.entity.enums.ShardType;
import com.transmoney.backend.entity.enums.TransactionStatus;
import com.transmoney.backend.exception.CoordinatorCrashException;
import com.transmoney.backend.repository.TransactionRepository;
import com.transmoney.backend.service.AccountService;
import com.transmoney.backend.service.UserService;
import com.transmoney.backend.service.chaos.ChaosEngineeringService;
import com.transmoney.backend.service.coordinator.TransactionRecoveryCoordinator;
import com.transmoney.backend.service.coordinator.TwoPhaseCommitCoordinator;
import com.transmoney.backend.service.simulator.LoadSimulatorService;
import org.junit.jupiter.api.AfterEach;
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
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class LoadSimulationAndChaosIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserService userService;

    @Autowired
    private AccountService accountService;

    @Autowired
    private TwoPhaseCommitCoordinator coordinator;

    @Autowired
    private LoadSimulatorService loadSimulatorService;

    @Autowired
    private ChaosEngineeringService chaosService;

    @Autowired
    private TransactionRecoveryCoordinator recoveryCoordinator;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private Account acc1;
    private Account acc2;
    private Account acc3;

    @BeforeEach
    void setUp() {
        chaosService.reset();
        String uid = UUID.randomUUID().toString().substring(0, 8);
        User user = userService.createUser(CreateUserRequest.builder()
                .email("loaduser_" + uid + "@example.com")
                .fullName("Load Benchmark User")
                .build());

        acc1 = accountService.createAccount(CreateAccountRequest.builder()
                .userId(user.getId())
                .accountNumber("ACC-LOAD-1-" + uid)
                .currency("USD")
                .initialBalance(new BigDecimal("10000.00"))
                .shard(ShardType.SHARD_1_US)
                .build());

        acc2 = accountService.createAccount(CreateAccountRequest.builder()
                .userId(user.getId())
                .accountNumber("ACC-LOAD-2-" + uid)
                .currency("USD")
                .initialBalance(new BigDecimal("10000.00"))
                .shard(ShardType.SHARD_2_UK)
                .build());

        acc3 = accountService.createAccount(CreateAccountRequest.builder()
                .userId(user.getId())
                .accountNumber("ACC-LOAD-3-" + uid)
                .currency("USD")
                .initialBalance(new BigDecimal("10000.00"))
                .shard(ShardType.SHARD_3_SG)
                .build());
    }

    @AfterEach
    void tearDown() {
        chaosService.reset();
    }

    @Test
    @DisplayName("Phase 8: Multi-Threaded Load Benchmark with Latency Percentiles & Zero-Sum Invariant")
    void testConcurrentLoadSimulationAndZeroSumInvariant() {
        LoadTestRequest request = LoadTestRequest.builder()
                .concurrency(4)
                .totalTransactions(12)
                .transferAmount(new BigDecimal("10.00"))
                .scenario("MIXED")
                .hotAccountId(acc1.getId())
                .build();

        LoadBenchmarkResult result = loadSimulatorService.runBenchmark(request);

        assertThat(result.getStatus()).isEqualTo("COMPLETED");
        assertThat(result.getTotalAttempted()).isEqualTo(12);
        assertThat(result.getTotalSucceeded()).isEqualTo(12);
        assertThat(result.getTotalFailed()).isEqualTo(0);
        assertThat(result.getDeadlockCount()).isEqualTo(0);
        assertThat(result.isMoneyConserved()).isTrue();

        assertThat(result.getThroughputTps()).isGreaterThan(0.0);
        assertThat(result.getP50LatencyMs()).isGreaterThan(0.0);
        assertThat(result.getP95LatencyMs()).isGreaterThanOrEqualTo(result.getP50LatencyMs());
        assertThat(result.getP99LatencyMs()).isGreaterThanOrEqualTo(result.getP95LatencyMs());
    }

    @Test
    @DisplayName("Phase 8: High-Contention Hot Account Scenario (Deadlock Freedom & Conservation)")
    void testHighContentionHotAccountScenario() {
        LoadTestRequest request = LoadTestRequest.builder()
                .concurrency(6)
                .totalTransactions(16)
                .transferAmount(new BigDecimal("5.00"))
                .scenario("HOT_ACCOUNT")
                .hotAccountId(acc1.getId())
                .build();

        LoadBenchmarkResult result = loadSimulatorService.runBenchmark(request);

        assertThat(result.getStatus()).isEqualTo("COMPLETED");
        assertThat(result.getDeadlockCount()).isEqualTo(0);
        assertThat(result.isMoneyConserved()).isTrue();
    }

    @Test
    @DisplayName("Phase 8: Chaos Latency Injection Benchmark")
    void testChaosLatencyInjection() {
        chaosService.updateConfig(ChaosConfigRequest.builder()
                .enabled(true)
                .mode("LATENCY_SPIKE")
                .latencyMs(120)
                .build());

        long start = System.currentTimeMillis();
        coordinator.executeTransfer(TransferRequest.builder()
                .senderAccountId(acc1.getId())
                .receiverAccountId(acc2.getId())
                .amount(new BigDecimal("25.00"))
                .currency("USD")
                .description("Latency injection test transfer")
                .build());
        long elapsed = System.currentTimeMillis() - start;

        assertThat(elapsed).isGreaterThanOrEqualTo(110);
        assertThat(chaosService.getConfig().getTotalDelaysInjected()).isGreaterThan(0);
    }

    @Test
    @DisplayName("Phase 8: Chaos Coordinator Crash and Automated 2PC Recovery Sweep")
    void testChaosCoordinatorCrashAndRecoverySweep() {
        chaosService.updateConfig(ChaosConfigRequest.builder()
                .enabled(true)
                .mode("COORDINATOR_CRASH")
                .build());

        BigDecimal senderBalanceBefore = accountService.getBalance(acc1.getId()).getBalance();
        BigDecimal receiverBalanceBefore = accountService.getBalance(acc2.getId()).getBalance();

        // 1. Coordinator crashes immediately after PREPARED phase
        assertThatThrownBy(() -> coordinator.executeTransfer(TransferRequest.builder()
                .senderAccountId(acc1.getId())
                .receiverAccountId(acc2.getId())
                .amount(new BigDecimal("50.00"))
                .currency("USD")
                .description("Coordinator crash test")
                .build()))
                .isInstanceOf(CoordinatorCrashException.class)
                .hasMessageContaining("Coordinator crashed after PREPARED phase");

        assertThat(chaosService.getConfig().getTotalCrashesSimulated()).isGreaterThan(0);

        // Neither balance was debited or credited (ACID Safety)
        assertThat(accountService.getBalance(acc1.getId()).getBalance()).isEqualByComparingTo(senderBalanceBefore);
        assertThat(accountService.getBalance(acc2.getId()).getBalance()).isEqualByComparingTo(receiverBalanceBefore);

        // 2. Orphaned PREPARED transaction exists in DB
        List<Transaction> orphaned = transactionRepository.findByStatus(TransactionStatus.PREPARED);
        assertThat(orphaned).isNotEmpty();

        // 3. Trigger manual recovery sweep -> cleans up and marks FAILED
        int recovered = recoveryCoordinator.triggerManualRecovery(0);
        assertThat(recovered).isGreaterThan(0);

        List<Transaction> remainingOrphaned = transactionRepository.findByStatus(TransactionStatus.PREPARED);
        assertThat(remainingOrphaned).isEmpty();
    }

    @Test
    @DisplayName("Phase 8: Simulator and Chaos REST Endpoints Integration")
    void testSimulatorAndChaosRestEndpoints() throws Exception {
        // GET Status
        mockMvc.perform(get("/api/simulator/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.running").value(false));

        // GET Chaos Config
        mockMvc.perform(get("/api/simulator/chaos/config"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.enabled").value(false));

        // POST Chaos Config
        ChaosConfigRequest req = ChaosConfigRequest.builder()
                .enabled(true)
                .mode("LATENCY_SPIKE")
                .latencyMs(150)
                .failureRatePercent(5.0)
                .build();

        mockMvc.perform(post("/api/simulator/chaos/config")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.enabled").value(true))
                .andExpect(jsonPath("$.data.mode").value("LATENCY_SPIKE"))
                .andExpect(jsonPath("$.data.latencyMs").value(150));

        // POST Chaos Reset
        mockMvc.perform(post("/api/simulator/chaos/reset"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").value("RESET"));

        // POST Trigger Recovery
        mockMvc.perform(post("/api/simulator/chaos/trigger-recovery?staleOlderThanSeconds=0"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isNumber());
    }
}
