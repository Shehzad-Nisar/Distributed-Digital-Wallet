import React from 'react';
import { Layers, Plus, Wallet } from 'lucide-react';
import type { Account, ShardType } from '../types';

interface ShardClusterViewProps {
  accounts: Account[];
  selectedAccountId: number | null;
  onSelectAccount: (accountId: number) => void;
  onOpenCreateAccount?: () => void;
}

interface ShardMeta {
  code: string;
  label: string;
  region: string;
  role: string;
}

const SHARD_CONFIG: Record<string, ShardMeta> = {
  SHARD_1_NORTH: {
    code: 'SHARD-01',
    label: 'North Partition',
    region: 'Islamabad / KPK Cluster Node',
    role: 'Primary Shard (ACID Partition)',
  },
  SHARD_2_CENTRAL: {
    code: 'SHARD-02',
    label: 'Central Partition',
    region: 'Lahore / Punjab Central Node',
    role: 'Primary Shard (ACID Partition)',
  },
  SHARD_3_SOUTH: {
    code: 'SHARD-03',
    label: 'South Partition',
    region: 'Karachi / Sindh Coastal Node',
    role: 'Primary Shard (ACID Partition)',
  },
  SHARD_4_ENTERPRISE: {
    code: 'SHARD-04',
    label: 'Enterprise Partition',
    region: 'Corporate & Merchant Settlement Node',
    role: 'High-Throughput Settlement Node',
  },
  SHARD_1_US: {
    code: 'SHARD-01',
    label: 'US Partition',
    region: 'North America / New York Node',
    role: 'Primary Shard',
  },
  SHARD_2_UK: {
    code: 'SHARD-02',
    label: 'UK Partition',
    region: 'Europe / London Node',
    role: 'Primary Shard',
  },
  SHARD_3_SG: {
    code: 'SHARD-03',
    label: 'SG Partition',
    region: 'Asia-Pacific / Singapore Node',
    role: 'Primary Shard',
  },
  SHARD_4_UAE: {
    code: 'SHARD-04',
    label: 'UAE Partition',
    region: 'Middle East / Dubai Node',
    role: 'Settlement Shard',
  },
};

export const ShardClusterView: React.FC<ShardClusterViewProps> = ({
  accounts,
  selectedAccountId,
  onSelectAccount,
  onOpenCreateAccount,
}) => {
  const primaryShards: ShardType[] = [
    'SHARD_1_NORTH',
    'SHARD_2_CENTRAL',
    'SHARD_3_SOUTH',
    'SHARD_4_ENTERPRISE',
  ];

  const totalClusterLiquidity = accounts.reduce((sum, a) => sum + Number(a.balance), 0);

  return (
    <div className="space-y-4 font-sans bg-white text-black">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-black" />
          <h2 className="text-sm font-bold text-black uppercase tracking-wider font-mono">
            Distributed Shard Topology (PostgreSQL Partition Cluster)
          </h2>
        </div>
        <div className="flex items-center gap-3 font-mono text-xs">
          <span className="text-slate-600">
            Total Liquidity:{' '}
            <strong className="text-black font-bold">
              {totalClusterLiquidity.toLocaleString('en-US', { minimumFractionDigits: 0 })} PKR
            </strong>
          </span>
          {onOpenCreateAccount && (
            <button
              onClick={onOpenCreateAccount}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 text-black transition cursor-pointer text-[11px] font-medium"
            >
              <Plus className="w-3 h-3" />
              <span>Provision Account</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid of Shards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {primaryShards.map((shardKey, index) => {
          const cfg = SHARD_CONFIG[shardKey] || {
            code: `SHARD-0${index + 1}`,
            label: shardKey,
            region: 'Cluster Partition',
            role: 'Active Shard',
          };

          const shardAccounts = accounts.filter(
            (a) =>
              a.shard === shardKey ||
              (shardKey === 'SHARD_1_NORTH' && a.shard === 'SHARD_1_US') ||
              (shardKey === 'SHARD_2_CENTRAL' && a.shard === 'SHARD_2_UK') ||
              (shardKey === 'SHARD_3_SOUTH' && a.shard === 'SHARD_3_SG') ||
              (shardKey === 'SHARD_4_ENTERPRISE' && a.shard === 'SHARD_4_UAE')
          );

          const shardLiquidity = shardAccounts.reduce(
            (sum, a) => sum + Number(a.balance),
            0
          );

          return (
            <div
              key={shardKey}
              className="rounded-xl border border-slate-200 bg-white p-4 transition-all duration-200 hover:border-slate-400 flex flex-col justify-between space-y-4 shadow-xs"
            >
              <div>
                {/* Shard Meta Header */}
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-black border border-slate-200">
                    {cfg.code}
                  </span>
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    <span>ONLINE</span>
                  </div>
                </div>

                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-black uppercase tracking-tight">
                    {cfg.label}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono truncate">{cfg.region}</p>
                </div>

                {/* Liquidity Counter */}
                <div className="mt-3 p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block">
                    Shard Balance
                  </span>
                  <span className="text-base font-bold text-black font-mono block">
                    {shardLiquidity.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{' '}
                    <span className="text-xs text-slate-500 font-normal">PKR</span>
                  </span>
                </div>
              </div>

              {/* Accounts inside this shard */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  <span>Partition Accounts ({shardAccounts.length})</span>
                  <span>ID / BAL</span>
                </div>

                <div className="space-y-1.5">
                  {shardAccounts.length === 0 ? (
                    <div className="text-center py-3 text-[11px] text-slate-400 font-mono">
                      No accounts provisioned
                    </div>
                  ) : (
                    shardAccounts.map((acc) => {
                      const isSelected = selectedAccountId === acc.id;
                      return (
                        <button
                          key={acc.id}
                          onClick={() => onSelectAccount(acc.id)}
                          className={`w-full text-left p-2 rounded-lg text-xs font-mono transition flex items-center justify-between border cursor-pointer ${
                            isSelected
                              ? 'bg-black text-white font-bold border-black shadow-xs'
                              : 'bg-white hover:bg-slate-50 text-black border-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <Wallet className="w-3.5 h-3.5 shrink-0 opacity-70" />
                            <div className="truncate text-left">
                              <span className="block truncate font-semibold">
                                {acc.user?.fullName || `Account #${acc.id}`}
                              </span>
                              <span
                                className={`text-[10px] block ${
                                  isSelected ? 'text-slate-300' : 'text-slate-500'
                                }`}
                              >
                                {acc.accountNumber}
                              </span>
                            </div>
                          </div>

                          <div className="text-right shrink-0 ml-2">
                            <span className="block font-bold">
                              {Number(acc.balance).toFixed(0)}
                            </span>
                            <span
                              className={`text-[9px] block ${
                                isSelected ? 'text-slate-300' : 'text-slate-500'
                              }`}
                            >
                              PKR
                            </span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
