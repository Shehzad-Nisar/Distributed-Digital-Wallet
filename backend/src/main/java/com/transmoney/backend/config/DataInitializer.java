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
        if (accountRepository.findByAccountNumber("ACC-US-001").isPresent()) {
            log.info("Country-based demo accounts already provisioned. Skipping initial data seeding.");
            return;
        }

        log.info("=== Initializing Country-Based Distributed Shard Data for TransMoney ===");

        // 1. Create Users from different countries
        User alice = userRepository.findByEmail("alice.us@transmoney.com")
                .orElseGet(() -> userRepository.save(User.builder()
                        .fullName("Alice Smith (United States)")
                        .email("alice.us@transmoney.com")
                        .phoneNumber("+1-202-555-0143")
                        .build()));

        User bob = userRepository.findByEmail("bob.uk@transmoney.com")
                .orElseGet(() -> userRepository.save(User.builder()
                        .fullName("Bob Jones (United Kingdom)")
                        .email("bob.uk@transmoney.com")
                        .phoneNumber("+44-20-7946-0912")
                        .build()));

        User charlie = userRepository.findByEmail("charlie.sg@transmoney.com")
                .orElseGet(() -> userRepository.save(User.builder()
                        .fullName("Charlie Tanaka (Singapore)")
                        .email("charlie.sg@transmoney.com")
                        .phoneNumber("+65-6789-0123")
                        .build()));

        User emirates = userRepository.findByEmail("treasury.ae@transmoney.com")
                .orElseGet(() -> userRepository.save(User.builder()
                        .fullName("Emirates Global Treasury (UAE)")
                        .email("treasury.ae@transmoney.com")
                        .phoneNumber("+971-4-312-0000")
                        .build()));

        log.info("Provisioned global users: US (Alice), UK (Bob), Singapore (Charlie), UAE (Emirates Treasury)");

        // 2. Create Accounts across country-specific shards
        Account usAccount = accountRepository.save(Account.builder()
                .accountNumber("ACC-US-001")
                .user(alice)
                .shard(ShardType.SHARD_1_US)
                .balance(new BigDecimal("10000.00"))
                .currency("USD")
                .status("ACTIVE")
                .build());

        Account ukAccount = accountRepository.save(Account.builder()
                .accountNumber("ACC-UK-002")
                .user(bob)
                .shard(ShardType.SHARD_2_UK)
                .balance(new BigDecimal("2500.00"))
                .currency("USD")
                .status("ACTIVE")
                .build());

        Account sgAccount = accountRepository.save(Account.builder()
                .accountNumber("ACC-SG-003")
                .user(charlie)
                .shard(ShardType.SHARD_3_SG)
                .balance(new BigDecimal("5000.00"))
                .currency("USD")
                .status("ACTIVE")
                .build());

        Account uaeAccount = accountRepository.save(Account.builder()
                .accountNumber("ACC-UAE-004")
                .user(emirates)
                .shard(ShardType.SHARD_4_UAE)
                .balance(new BigDecimal("100000.00"))
                .currency("USD")
                .status("ACTIVE")
                .build());

        log.info("Provisioned Country Shards: US (SHARD_1_US), UK (SHARD_2_UK), Singapore (SHARD_3_SG), UAE (SHARD_4_UAE)");

        // 3. Create Global Merchants
        merchantRepository.save(Merchant.builder()
                .name("Amazon Web Services (US)")
                .category("Cloud & Infrastructure")
                .accountId(usAccount.getId())
                .build());

        merchantRepository.save(Merchant.builder()
                .name("Deliveroo London (UK)")
                .category("Food & Delivery")
                .accountId(ukAccount.getId())
                .build());

        merchantRepository.save(Merchant.builder()
                .name("Grab Southeast Asia (SG)")
                .category("SuperApp & Logistics")
                .accountId(sgAccount.getId())
                .build());

        merchantRepository.save(Merchant.builder()
                .name("Emirates Global Aviation (UAE)")
                .category("Aviation & Cargo")
                .accountId(uaeAccount.getId())
                .build());

        log.info("Provisioned global merchants: Amazon AWS (US), Deliveroo (UK), Grab (SG), Emirates (UAE)");

        // 4. Execute an initial cross-country, cross-shard 2PC transfer
        try {
            TransferRequest initialTransfer = TransferRequest.builder()
                    .senderAccountId(usAccount.getId())
                    .receiverAccountId(ukAccount.getId())
                    .amount(new BigDecimal("500.00"))
                    .currency("USD")
                    .description("Cross-Border 2PC Wire: United States Shard -> United Kingdom Shard")
                    .build();

            transferService.executeTransfer(initialTransfer);
            log.info("Executed initial cross-country 2PC transfer: Alice (US Shard) -> Bob (UK Shard) for $500.00 USD");
        } catch (Exception e) {
            log.warn("Initial cross-border seed transfer failed (non-critical): {}", e.getMessage());
        }

        log.info("=== Country-Based Seed Data Provisioning Complete ===");
    }
}
