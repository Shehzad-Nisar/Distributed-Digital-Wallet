package com.transmoney.backend;

import com.transmoney.backend.dto.request.CreateAccountRequest;
import com.transmoney.backend.dto.request.CreateUserRequest;
import com.transmoney.backend.dto.request.TransferRequest;
import com.transmoney.backend.dto.response.PageResponse;
import com.transmoney.backend.dto.response.TransactionResponse;
import com.transmoney.backend.entity.Account;
import com.transmoney.backend.entity.User;
import com.transmoney.backend.entity.enums.ShardType;
import com.transmoney.backend.service.AccountService;
import com.transmoney.backend.service.TransferService;
import com.transmoney.backend.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class TransactionSearchAndApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserService userService;

    @Autowired
    private AccountService accountService;

    @Autowired
    private TransferService transferService;

    private Account acc1;
    private Account acc2;

    @BeforeEach
    void setUp() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);

        User u1 = userService.createUser(CreateUserRequest.builder()
                .fullName("Test User 1 " + suffix)
                .email("user1_" + suffix + "@searchtest.com")
                .phoneNumber("+923001111111")
                .build());

        acc1 = accountService.createAccount(CreateAccountRequest.builder()
                .userId(u1.getId())
                .accountNumber("ACC-S1-" + suffix)
                .currency("PKR")
                .initialBalance(new BigDecimal("20000.00"))
                .shard(ShardType.SHARD_3_SOUTH)
                .build());

        User u2 = userService.createUser(CreateUserRequest.builder()
                .fullName("Test User 2 " + suffix)
                .email("user2_" + suffix + "@searchtest.com")
                .phoneNumber("+923002222222")
                .build());

        acc2 = accountService.createAccount(CreateAccountRequest.builder()
                .userId(u2.getId())
                .accountNumber("ACC-S2-" + suffix)
                .currency("PKR")
                .initialBalance(new BigDecimal("5000.00"))
                .shard(ShardType.SHARD_1_NORTH)
                .build());

        // Create 2 distinct transfers for testing search & filtering
        transferService.executeTransfer(TransferRequest.builder()
                .senderAccountId(acc1.getId())
                .receiverAccountId(acc2.getId())
                .amount(new BigDecimal("1200.00"))
                .currency("PKR")
                .description("Grocery shopping at Supermarket")
                .build());

        transferService.executeTransfer(TransferRequest.builder()
                .senderAccountId(acc1.getId())
                .receiverAccountId(acc2.getId())
                .amount(new BigDecimal("3500.00"))
                .currency("PKR")
                .description("Monthly Electricity utility payment")
                .build());
    }

    @Test
    @DisplayName("Verify account transactions search by keyword (Proposal Section 6 & 7)")
    void testSearchByKeyword() throws Exception {
        mockMvc.perform(get("/api/accounts/{id}/transactions", acc1.getId())
                        .param("search", "Grocery")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].amount").value(1200.00))
                .andExpect(jsonPath("$.data.content[0].description", containsString("Grocery")));
    }

    @Test
    @DisplayName("Verify transaction numeric range filtering and sorting")
    void testNumericRangeFilterAndSort() throws Exception {
        mockMvc.perform(get("/api/accounts/{id}/transactions", acc1.getId())
                        .param("minAmount", "2000")
                        .param("maxAmount", "5000")
                        .param("sort", "amount")
                        .param("order", "desc")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].amount").value(3500.00));
    }

    @Test
    @DisplayName("Verify global transactions API with pagination metadata")
    void testGlobalTransactionsEndpoint() throws Exception {
        mockMvc.perform(get("/api/transactions")
                        .param("page", "0")
                        .param("size", "10")
                        .param("sort", "createdAt")
                        .param("order", "desc")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content", not(empty())))
                .andExpect(jsonPath("$.data.page").value(0))
                .andExpect(jsonPath("$.data.totalElements", greaterThanOrEqualTo(2)));
    }

    @Test
    @DisplayName("Verify Swagger OpenAPI documentation JSON endpoint is accessible")
    void testSwaggerOpenApiDocs() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.openapi", startsWith("3.")))
                .andExpect(jsonPath("$.info.title", containsString("TransMoney")));
    }

    @Test
    @DisplayName("Verify static dashboard is served at root /")
    void testStaticDashboardServed() throws Exception {
        mockMvc.perform(get("/index.html"))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("TransMoney")));
    }
}
