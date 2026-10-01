package com.transmoney.backend.repository;

import com.transmoney.backend.entity.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long>, JpaSpecificationExecutor<Transaction> {

    Optional<Transaction> findByTransactionId(String transactionId);

    @Query("SELECT t FROM Transaction t WHERE t.senderAccountId = :accountId OR t.receiverAccountId = :accountId ORDER BY t.createdAt DESC")
    List<Transaction> findByAccountId(@Param("accountId") Long accountId);

    @Query("SELECT t FROM Transaction t WHERE t.senderAccountId = :accountId OR t.receiverAccountId = :accountId")
    Page<Transaction> findByAccountId(@Param("accountId") Long accountId, Pageable pageable);

    List<Transaction> findByStatusAndCreatedAtBefore(com.transmoney.backend.entity.enums.TransactionStatus status, java.time.LocalDateTime cutoffTime);
}
