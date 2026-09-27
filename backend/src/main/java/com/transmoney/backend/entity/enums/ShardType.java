package com.transmoney.backend.entity.enums;

public enum ShardType {
    // Country-based Distributed Shards
    SHARD_1_US,          // United States (North America Region)
    SHARD_2_UK,          // United Kingdom (Europe Region)
    SHARD_3_SG,          // Singapore (Asia-Pacific Region)
    SHARD_4_UAE,         // United Arab Emirates (Middle East / Global Region)

    // Legacy regional aliases for backward compatibility
    SHARD_1_NORTH,
    SHARD_2_CENTRAL,
    SHARD_3_SOUTH,
    SHARD_4_ENTERPRISE
}
