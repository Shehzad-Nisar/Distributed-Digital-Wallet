package com.transmoney.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "merchants", indexes = {
    @Index(name = "idx_merchant_name", columnList = "name"),
    @Index(name = "idx_merchant_code", columnList = "merchant_code", unique = true),
    @Index(name = "idx_merchant_account_id", columnList = "account_id")
})
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Merchant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "merchant_id")
    private Long id;

    @Column(name = "merchant_code", nullable = false, unique = true, length = 64)
    private String merchantCode;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "category", length = 100)
    private String category;

    @Column(name = "account_id", nullable = false)
    private Long accountId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "accounts", "password"})
    private User user;

    @Column(name = "fee_rate_percent", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal feeRatePercent = new BigDecimal("1.50");

    @Column(name = "accumulated_gross", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal accumulatedGross = BigDecimal.ZERO;

    @Column(name = "accumulated_fees", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal accumulatedFees = BigDecimal.ZERO;

    @Column(name = "accumulated_net_settled", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal accumulatedNetSettled = BigDecimal.ZERO;

    @Column(name = "unsettled_balance", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal unsettledBalance = BigDecimal.ZERO;

    @Column(name = "secret_key", length = 128)
    private String secretKey;

    @Column(name = "status", nullable = false, length = 32)
    @Builder.Default
    private String status = "ACTIVE";

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        if (merchantCode == null || merchantCode.isBlank()) {
            merchantCode = "MCH-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        }
        if (secretKey == null || secretKey.isBlank()) {
            secretKey = java.util.UUID.randomUUID().toString().replace("-", "");
        }
        if (feeRatePercent == null) {
            feeRatePercent = new BigDecimal("1.50");
        }
        if (accumulatedGross == null) accumulatedGross = BigDecimal.ZERO;
        if (accumulatedFees == null) accumulatedFees = BigDecimal.ZERO;
        if (accumulatedNetSettled == null) accumulatedNetSettled = BigDecimal.ZERO;
        if (unsettledBalance == null) unsettledBalance = BigDecimal.ZERO;
        if (status == null) status = "ACTIVE";
    }
}
