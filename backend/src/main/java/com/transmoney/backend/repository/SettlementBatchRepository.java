package com.transmoney.backend.repository;

import com.transmoney.backend.entity.SettlementBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SettlementBatchRepository extends JpaRepository<SettlementBatch, Long> {

    List<SettlementBatch> findByMerchantIdOrderByCreatedAtDesc(Long merchantId);

    Optional<SettlementBatch> findByBatchReference(String batchReference);
}
