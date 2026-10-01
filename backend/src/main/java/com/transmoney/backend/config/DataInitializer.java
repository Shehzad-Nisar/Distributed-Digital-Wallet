package com.transmoney.backend.config;

import com.transmoney.backend.dto.request.TransferRequest;
import com.transmoney.backend.entity.Account;
import com.transmoney.backend.entity.Merchant;
import com.transmoney.backend.entity.User;
import com.transmoney.backend.entity.enums.ShardType;
import com.transmoney.backend.repository.AccountRepository;
import com.transmoney.backend.repository.MerchantRepository;
import com.transmoney.backend.repository.UserRepository;
import com.transmoney.backend.service.TransferService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final MerchantRepository merchantRepository;
    private final TransferService transferService;

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            log.info("Database already seeded. Skipping initial data provisioning.");
            return;
        }

        log.info("=== Initializing Seed Data for TransMoney Distributed Digital Wallet ===");

        // 1. Create Users
        User alice = userRepository.save(User.builder()
                .fullName("Alice Khan")
                .email("alice@transmoney.com")
                .phoneNumber("+923001112233")
                .build());

        User bob = userRepository.save(User.builder()
                .fullName("Bob Malik")
                .email("bob@transmoney.com")
                .phoneNumber("+923004445566")
                .build());

        User charlie = userRepository.save(User.builder()
                .fullName("Charlie Tariq")
                .email("charlie@transmoney.com")
                .phoneNumber("+923007778899")
                .build());

        User daraz = userRepository.save(User.builder()
                .fullName("Daraz Merchant Services")
                .email("daraz@merchants.transmoney.com")
                .phoneNumber("+923009990011")
                .build());

        log.info("Seeded 4 users: Alice, Bob, Charlie, and Daraz Merchant");

        // 2. Create Accounts across distributed shards
        Account aliceAccount = accountRepository.save(Account.builder()
                .accountNumber("ACC-ALICE-001")
                .user(alice)
                .shard(ShardType.SHARD_3_SOUTH)
                .balance(new BigDecimal("10000.00"))
                .currency("PKR")
                .status("ACTIVE")
                .build());

        Account bobAccount = accountRepository.save(Account.builder()
                .accountNumber("ACC-BOB-002")
                .user(bob)
                .shard(ShardType.SHARD_2_CENTRAL)
                .balance(new BigDecimal("1000.00"))
                .currency("PKR")
                .status("ACTIVE")
                .build());

        Account charlieAccount = accountRepository.save(Account.builder()
                .accountNumber("ACC-CHARLIE-003")
                .user(charlie)
                .shard(ShardType.SHARD_1_NORTH)
                .balance(new BigDecimal("5000.00"))
                .currency("PKR")
                .status("ACTIVE")
                .build());

        Account darazAccount = accountRepository.save(Account.builder()
                .accountNumber("ACC-DARAZ-004")
                .user(daraz)
                .shard(ShardType.SHARD_4_ENTERPRISE)
                .balance(new BigDecimal("100000.00"))
                .currency("PKR")
                .status("ACTIVE")
                .build());

        log.info("Seeded 4 accounts across Shards: Alice (SHARD_3_SOUTH), Bob (SHARD_2_CENTRAL), Charlie (SHARD_1_NORTH), Daraz (SHARD_4_ENTERPRISE)");

        // 3. Create Merchants
        merchantRepository.save(Merchant.builder()
                .merchantCode("MCH-FP-001")
                .name("FoodPanda Express")
                .category("Food & Dining")
                .user(bob)
                .accountId(bobAccount.getId())
                .feeRatePercent(new BigDecimal("1.50"))
                .secretKey("secret_foodpanda_2026")
                .build());

        merchantRepository.save(Merchant.builder()
                .merchantCode("MCH-DARAZ-002")
                .name("Daraz Online Shopping")
                .category("E-Commerce")
                .user(daraz)
                .accountId(darazAccount.getId())
                .feeRatePercent(new BigDecimal("1.25"))
                .secretKey("secret_daraz_2026")
                .build());

        merchantRepository.save(Merchant.builder()
                .merchantCode("MCH-KE-003")
                .name("K-Electric Utility Bill")
                .category("Utilities")
                .user(daraz)
                .accountId(darazAccount.getId())
                .feeRatePercent(new BigDecimal("0.50"))
                .secretKey("secret_kelectric_2026")
                .build());

        log.info("Seeded 3 merchants: FoodPanda Express (MCH-FP-001), Daraz Online (MCH-DARAZ-002), K-Electric (MCH-KE-003)");

        // 4. Execute an initial cross-shard 2PC transfer to prime the transaction ledger
        try {
            TransferRequest initialTransfer = TransferRequest.builder()
                    .senderAccountId(aliceAccount.getId())
                    .receiverAccountId(bobAccount.getId())
                    .amount(new BigDecimal("500.00"))
                    .currency("PKR")
                    .description("Initial Seed: Cross-shard transfer demo (Shard 3 -> Shard 2)")
                    .build();

            transferService.executeTransfer(initialTransfer);
            log.info("Executed initial cross-shard 2PC transfer: Alice (Shard 3) -> Bob (Shard 2) for PKR 500.00");
        } catch (Exception e) {
            log.warn("Initial seed transfer failed (non-critical): {}", e.getMessage());
        }

        log.info("=== Seed Data Initialization Complete ===");
    }
}
