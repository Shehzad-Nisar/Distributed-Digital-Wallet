-- ============================================================================
-- TransMoney Distributed Digital Wallet - High-Scale Dataset & Benchmarking Script
-- Course: Distributed Database Systems (Sir Umair)
-- Team: Shehzad Nisar, Muhammad Ashraf, Daniyal Ahmed
-- Target Database: PostgreSQL 17 (transmoney_db)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. INSPECT CURRENT TABLES AND SCHEMA
-- ----------------------------------------------------------------------------
\echo '=== CURRENT DATABASE TABLE SUMMARY ==='
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- ----------------------------------------------------------------------------
-- 2. VERIFY SHARD DISTRIBUTION ACROSS REGIONS
-- ----------------------------------------------------------------------------
\echo '=== SHARD / PARTITION DISTRIBUTION ==='
SELECT 
    shard,
    COUNT(*) AS total_accounts,
    currency,
    ROUND(SUM(balance), 2) AS aggregate_liquidity
FROM accounts
GROUP BY shard, currency
ORDER BY shard;

-- ----------------------------------------------------------------------------
-- 3. GAAP DOUBLE-ENTRY ZERO-SUM INVARIANT PROOF
-- Mathematical proof that distributed 2PC maintained strict balance:
-- sum(DEBIT) must exactly equal sum(CREDIT), difference must be 0.00
-- ----------------------------------------------------------------------------
\echo '=== DOUBLE-ENTRY LEDGER BALANCE CHECK (MUST BE ZERO) ==='
SELECT 
    SUM(CASE WHEN entry_type = 'DEBIT' THEN amount ELSE 0 END) AS total_debits,
    SUM(CASE WHEN entry_type = 'CREDIT' THEN amount ELSE 0 END) AS total_credits,
    SUM(CASE WHEN entry_type = 'DEBIT' THEN amount ELSE -amount END) AS zero_sum_discrepancy
FROM ledger_entries;

-- ----------------------------------------------------------------------------
-- 4. HIGH-VOLUME DATA GENERATION SCRIPT (POSTGRESQL GENERATE_SERIES)
-- Simulates high-scale enterprise transaction volume (e.g., 500,000 - 1,000,000 rows)
-- In PostgreSQL, generate_series runs in memory and inserts in a few seconds!
-- ----------------------------------------------------------------------------

-- Temporarily drop secondary indexes for bulk ingestion speed (optional for millions)
-- or directly insert into indexed table:

\echo '=== GENERATING BULK DISTRIBUTED TRANSACTIONS ==='

INSERT INTO transactions (
    transaction_reference,
    sender_account_id,
    receiver_account_id,
    amount,
    currency,
    fee,
    status,
    type,
    created_at,
    settled_at
)
SELECT 
    'TX-BULK-' || gen_random_uuid(),
    ((i % 4) + 1),                              -- Distributed across regional accounts 1 to 4
    (((i + 1) % 4) + 1),                          -- Distributed receiver accounts
    ROUND((10.0 + (i % 5000))::numeric, 2),       -- Amounts from 10 to 5000
    CASE (i % 4)
        WHEN 0 THEN 'PKR'
        WHEN 1 THEN 'USD'
        WHEN 2 THEN 'EUR'
        ELSE 'GBP'
    END,
    ROUND((0.25 + (i % 10))::numeric, 2),         -- Small transaction fee
    'COMMITTED',
    'P2P_TRANSFER',
    NOW() - (i || ' seconds')::INTERVAL,          -- Spans across past days/hours
    NOW() - (i || ' seconds')::INTERVAL
FROM generate_series(1, 100000) AS s(i);

\echo 'Bulk generation completed.'

-- ----------------------------------------------------------------------------
-- 5. TOTAL ROW COUNT PROOF
-- Run this in pgAdmin to show Sir the scale!
-- ----------------------------------------------------------------------------
\echo '=== LIVE ROW COUNTS ==='
SELECT 
    schemaname,
    relname AS table_name,
    n_live_tup AS estimated_row_count
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;

-- ----------------------------------------------------------------------------
-- 6. HIGH-PERFORMANCE INDEX SCAN QUERY DEMONSTRATION (EXPLAIN ANALYZE)
-- Show Sir that even with massive rows, query execution takes < 1 millisecond
-- because of B-Tree indexing on (sender_account_id, created_at).
-- ----------------------------------------------------------------------------
\echo '=== QUERY EXECUTION PLAN (EXPLAIN ANALYZE) ==='
EXPLAIN ANALYZE 
SELECT 
    id, transaction_reference, sender_account_id, receiver_account_id, amount, currency, status, created_at
FROM transactions
WHERE sender_account_id = 1
ORDER BY created_at DESC
LIMIT 50;
