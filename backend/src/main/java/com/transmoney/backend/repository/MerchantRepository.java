package com.transmoney.backend.repository;

import com.transmoney.backend.entity.Merchant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MerchantRepository extends JpaRepository<Merchant, Long> {

    List<Merchant> findByNameContainingIgnoreCase(String name);

    List<Merchant> findByCategoryIgnoreCase(String category);

    Optional<Merchant> findByAccountId(Long accountId);
}
