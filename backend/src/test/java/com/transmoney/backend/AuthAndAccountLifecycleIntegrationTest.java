package com.transmoney.backend;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.transmoney.backend.dto.request.*;
import com.transmoney.backend.entity.Account;
import com.transmoney.backend.entity.User;
import com.transmoney.backend.entity.enums.ShardType;
import com.transmoney.backend.repository.AccountRepository;
import com.transmoney.backend.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class AuthAndAccountLifecycleIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Test
    @DisplayName("Phase 1: Register, Login, and Me Authenticated Flow")
    public void testPhase1AuthLifecycle() throws Exception {
        String testEmail = "testuser_" + System.currentTimeMillis() + "@transmoney.com";
        RegisterRequest registerReq = RegisterRequest.builder()
                .fullName("Test Production User")
                .email(testEmail)
                .password("StrongPassword123!")
                .phoneNumber("+923005556677")
                .shard(ShardType.SHARD_1_US)
                .initialBalance(new BigDecimal("1500.00"))
                .currency("USD")
                .build();

        // 1. Register
        MvcResult regResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.token", notNullValue()))
                .andExpect(jsonPath("$.data.user.email", is(testEmail)))
                .andExpect(jsonPath("$.data.accounts[0].balance", is(1500.00)))
                .andReturn();

        // 2. Login with valid credentials
        LoginRequest loginReq = LoginRequest.builder()
                .email(testEmail)
                .password("StrongPassword123!")
                .build();

        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.token", notNullValue()))
                .andReturn();

        String loginToken = objectMapper.readTree(loginResult.getResponse().getContentAsString())
                .path("data").path("token").asText();

        // 3. Login with invalid password
        LoginRequest badLogin = LoginRequest.builder()
                .email(testEmail)
                .password("WrongPassword!")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badLogin)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)));

        // 4. Me Endpoint
        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + loginToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.user.email", is(testEmail)));
    }

    @Test
    @DisplayName("Phase 2: Deposit, Withdraw, and Account Freeze Lifecycle")
    public void testPhase2AccountLifecycle() throws Exception {
        User user = userRepository.save(User.builder()
                .fullName("Lifecycle Tester")
                .email("lifecycle_" + System.currentTimeMillis() + "@test.com")
                .role("ROLE_USER")
                .build());

        Account account = accountRepository.save(Account.builder()
                .user(user)
                .accountNumber("ACC-TEST-LC-" + System.currentTimeMillis())
                .shard(ShardType.SHARD_2_UK)
                .balance(new BigDecimal("1000.00"))
                .currency("GBP")
                .status("ACTIVE")
                .build());

        Long accId = account.getId();

        // 1. Deposit
        DepositRequest depositReq = DepositRequest.builder()
                .amount(new BigDecimal("500.00"))
                .paymentMethod("DEBIT_CARD")
                .referenceNotes("ATM Card Topup")
                .build();

        mockMvc.perform(post("/api/accounts/" + accId + "/deposit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(depositReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.balance", is(1500.00)));

        // 2. Withdraw
        WithdrawRequest withdrawReq = WithdrawRequest.builder()
                .amount(new BigDecimal("300.00"))
                .destinationBank("Barclays UK")
                .destinationAccountNumber("GB29BARC20201555555555")
                .referenceNotes("Rent payment")
                .build();

        mockMvc.perform(post("/api/accounts/" + accId + "/withdraw")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(withdrawReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.balance", is(1200.00)));

        // 3. Freeze Account
        UpdateAccountStatusRequest freezeReq = UpdateAccountStatusRequest.builder()
                .status("FROZEN")
                .build();

        mockMvc.perform(patch("/api/accounts/" + accId + "/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(freezeReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("FROZEN")));

        // 4. Attempt deposit while FROZEN (must fail)
        mockMvc.perform(post("/api/accounts/" + accId + "/deposit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(depositReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)));

        // 5. Unfreeze Account
        UpdateAccountStatusRequest unfreezeReq = UpdateAccountStatusRequest.builder()
                .status("ACTIVE")
                .build();

        mockMvc.perform(patch("/api/accounts/" + accId + "/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(unfreezeReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("ACTIVE")));
    }
}
