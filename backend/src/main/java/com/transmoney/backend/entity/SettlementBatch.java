package com.transmoney.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "settlement_batches", indexes = {
    @Index(name = "idx_settle_batch_ref", columnList = "batch_reference", unique = true),
    @Index(name = "idx_settle_merchant_id", columnList = "merchant_id")
})
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SettlementBatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "batch_reference", nullable = false, unique = true, length = 64)
    private String batchReference;

    @Column(name = "merchant_id", nullable = false)
    private Long merchantId;

    @Column(name = "merchant_name", nullable = false)
    private String merchantName;

    @Column(name = "settlement_account_id", nullable = false)
    private Long settlementAccountId;

    @Column(name = "transaction_count", nullable = false)
    private Integer transactionCount;

    @Column(name = "gross_volume", nullable = false, precision = 18, scale = 2)
    private BigDecimal grossVolume;

    @Column(name = "total_fees", nullable = false, precision = 18, scale = 2)
    private BigDecimal totalFees;

    @Column(name = "net_settlement_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal netSettlementAmount;

    @Column(name = "status", nullable = false, length = 32)
    @Builder.Default
    private String status = "COMPLETED";

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
