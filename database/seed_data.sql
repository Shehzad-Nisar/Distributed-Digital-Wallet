-- ============================================================================
-- TransMoney Distributed Digital Wallet - Seed Data Population
-- Database: PostgreSQL 17 (transmoney_db)
-- ============================================================================

-- 1. Insert Core Users
INSERT INTO users (user_id, full_name, email, phone_number, password, role, created_at, updated_at)
VALUES 
(1, 'Alice Khan', 'alice@transmoney.com', '+92 300 1234567', '$2a$10$wEkg9uYkKkM8K8v.R8U8mOB5e5h6G4z6Jk0O1e4g3d2h5f6j7k8l9', 'ROLE_USER', NOW(), NOW()),
(2, 'Bob Malik', 'bob@transmoney.com', '+92 321 7654321', '$2a$10$wEkg9uYkKkM8K8v.R8U8mOB5e5h6G4z6Jk0O1e4g3d2h5f6j7k8l9', 'ROLE_USER', NOW(), NOW()),
(3, 'Charlie Tariq', 'charlie@transmoney.com', '+92 333 9876543', '$2a$10$wEkg9uYkKkM8K8v.R8U8mOB5e5h6G4z6Jk0O1e4g3d2h5f6j7k8l9', 'ROLE_USER', NOW(), NOW()),
(4, 'Daraz Merchant', 'daraz@transmoney.com', '+92 345 5556677', '$2a$10$wEkg9uYkKkM8K8v.R8U8mOB5e5h6G4z6Jk0O1e4g3d2h5f6j7k8l9', 'ROLE_USER', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Reset sequence for users
SELECT setval(pg_get_serial_sequence('users', 'user_id'), COALESCE(MAX(user_id), 1)) FROM users;

-- 2. Insert Regional Shard Accounts
INSERT INTO accounts (account_id, user_id, account_number, balance, currency, shard, status, version, created_at, updated_at)
VALUES 
(1, 1, 'ACC-ALICE-001', 10000.00, 'PKR', 'SHARD_3_SOUTH', 'ACTIVE', 0, NOW(), NOW()),
(2, 2, 'ACC-BOB-002', 1000.00, 'PKR', 'SHARD_2_CENTRAL', 'ACTIVE', 0, NOW(), NOW()),
(3, 3, 'ACC-CHARLIE-003', 5000.00, 'PKR', 'SHARD_1_NORTH', 'ACTIVE', 0, NOW(), NOW()),
(4, 4, 'ACC-DARAZ-004', 100000.00, 'PKR', 'SHARD_4_ENTERPRISE', 'ACTIVE', 0, NOW(), NOW()),
(5, 1, 'ACC-ALICE-USD-005', 500.00, 'USD', 'SHARD_1_US', 'ACTIVE', 0, NOW(), NOW()),
(6, 2, 'ACC-BOB-GBP-006', 250.00, 'GBP', 'SHARD_2_UK', 'ACTIVE', 0, NOW(), NOW())
ON CONFLICT (account_number) DO NOTHING;

-- Reset sequence for accounts
SELECT setval(pg_get_serial_sequence('accounts', 'account_id'), COALESCE(MAX(account_id), 1)) FROM accounts;

-- 3. Insert Merchants
INSERT INTO merchants (merchant_id, merchant_code, name, category, account_id, user_id, fee_rate_percent, accumulated_gross, accumulated_fees, accumulated_net_settled, unsettled_balance, secret_key, status, created_at, updated_at)
VALUES 
(1, 'MCH-FP-001', 'FoodPanda Express', 'Food & Dining', 4, 4, 1.50, 45000.00, 675.00, 44325.00, 0.00, 'secret_fp_2026_xyz', 'ACTIVE', NOW(), NOW()),
(2, 'MCH-DARAZ-002', 'Daraz Online Megastore', 'Retail & E-Commerce', 4, 4, 1.20, 150000.00, 1800.00, 148200.00, 0.00, 'secret_daraz_2026_abc', 'ACTIVE', NOW(), NOW()),
(3, 'MCH-KE-003', 'K-Electric Bill Payment', 'Utilities', 4, 4, 0.50, 89000.00, 445.00, 88555.00, 0.00, 'secret_kelectric_2026', 'ACTIVE', NOW(), NOW())
ON CONFLICT (merchant_code) DO NOTHING;

-- Reset sequence for merchants
SELECT setval(pg_get_serial_sequence('merchants', 'merchant_id'), COALESCE(MAX(merchant_id), 1)) FROM merchants;

-- 4. Insert Initial Transactions (Cross-Shard 2PC Transfers)
INSERT INTO transactions (id, transaction_id, sender_account_id, receiver_account_id, amount, currency, target_amount, target_currency, exchange_rate, description, type, status, created_at, updated_at)
VALUES 
(1, 'TX-SEED-001', 1, 2, 500.00, 'PKR', 500.00, 'PKR', 1.000000, 'Cross-Shard 2PC Demo: South to Central Hub', 'P2P_TRANSFER', 'COMMITTED', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'),
(2, 'TX-SEED-002', 3, 1, 1200.00, 'PKR', 1200.00, 'PKR', 1.000000, 'Cross-Shard 2PC Demo: North to South Hub', 'P2P_TRANSFER', 'COMMITTED', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour')
ON CONFLICT (transaction_id) DO NOTHING;

-- Reset sequence for transactions
SELECT setval(pg_get_serial_sequence('transactions', 'id'), COALESCE(MAX(id), 1)) FROM transactions;

-- 5. Insert GAAP Double-Entry Ledger Records for Seed Transactions
INSERT INTO ledger_entries (entry_id, transaction_id, account_id, entry_type, amount, balance_after, created_at)
VALUES 
(1, 1, 1, 'DEBIT', 500.00, 9500.00, NOW() - INTERVAL '2 hours'),
(2, 1, 2, 'CREDIT', 500.00, 1500.00, NOW() - INTERVAL '2 hours'),
(3, 2, 3, 'DEBIT', 1200.00, 3800.00, NOW() - INTERVAL '1 hour'),
(4, 2, 1, 'CREDIT', 1200.00, 10700.00, NOW() - INTERVAL '1 hour')
ON CONFLICT DO NOTHING;

-- Reset sequence for ledger_entries
SELECT setval(pg_get_serial_sequence('ledger_entries', 'entry_id'), COALESCE(MAX(entry_id), 1)) FROM ledger_entries;

-- 6. Generate 10,000 High-Volume Distributed Transactions for Live Demonstrations
INSERT INTO transactions (
    transaction_id,
    sender_account_id,
    receiver_account_id,
    amount,
    currency,
    target_amount,
    target_currency,
    exchange_rate,
    description,
    type,
    status,
    created_at,
    updated_at
)
SELECT 
    'TX-SCALE-' || gen_random_uuid(),
    ((i % 4) + 1),
    (((i + 1) % 4) + 1),
    ROUND((25.0 + (i % 2500))::numeric, 2),
    'PKR',
    ROUND((25.0 + (i % 2500))::numeric, 2),
    'PKR',
    1.000000,
    'Enterprise high-frequency clearing transfer #' || i,
    'P2P_TRANSFER',
    'COMMITTED',
    NOW() - (i || ' seconds')::INTERVAL,
    NOW() - (i || ' seconds')::INTERVAL
FROM generate_series(1, 10000) AS s(i);

-- 7. Add Matching GAAP Double-Entry Ledger Records for Scale Transactions
INSERT INTO ledger_entries (
    transaction_id,
    account_id,
    entry_type,
    amount,
    balance_after,
    created_at
)
SELECT 
    t.id,
    t.sender_account_id,
    'DEBIT',
    t.amount,
    5000.00,
    t.created_at
FROM transactions t
WHERE t.transaction_id LIKE 'TX-SCALE-%'
ON CONFLICT DO NOTHING;

INSERT INTO ledger_entries (
    transaction_id,
    account_id,
    entry_type,
    amount,
    balance_after,
    created_at
)
SELECT 
    t.id,
    t.receiver_account_id,
    'CREDIT',
    t.amount,
    5000.00,
    t.created_at
FROM transactions t
WHERE t.transaction_id LIKE 'TX-SCALE-%'
ON CONFLICT DO NOTHING;
