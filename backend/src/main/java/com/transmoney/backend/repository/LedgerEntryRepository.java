package com.transmoney.backend.repository;

import com.transmoney.backend.entity.LedgerEntry;
import com.transmoney.backend.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LedgerEntryRepository extends JpaRepository<LedgerEntry, Long> {

    List<LedgerEntry> findByTransaction(Transaction transaction);

    List<LedgerEntry> findByAccountIdOrderByCreatedAtDesc(Long accountId);
}
