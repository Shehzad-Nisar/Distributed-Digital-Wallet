import React from 'react';
import { Globe2, Server, Wallet } from 'lucide-react';
import type { Account, ShardType } from '../types';

interface ShardClusterViewProps {
  accounts: Account[];
  selectedAccountId: number | null;
  onSelectAccount: (accountId: number) => void;
}

const SHARD_CONFIG: Record<
  ShardType,
  { label: string; flag: string; country: string; region: string; color: string; border: string; bg: string }
> = {
  SHARD_1_US: {
    label: 'Shard 1 (United States)',
    flag: '🇺🇸',
    country: 'United States',
    region: 'North America • New York / AWS us-east-1',
    color: 'text-blue-400',
    border: 'border-blue-500/30 hover:border-blue-500/60',
    bg: 'bg-blue-500/10',
  },
  SHARD_2_UK: {
    label: 'Shard 2 (United Kingdom)',
    flag: '🇬🇧',
    country: 'United Kingdom',
    region: 'Europe • London / AWS eu-west-2',
    color: 'text-purple-400',
    border: 'border-purple-500/30 hover:border-purple-500/60',
    bg: 'bg-purple-500/10',
  },
  SHARD_3_SG: {
    label: 'Shard 3 (Singapore)',
    flag: '🇸🇬',
    country: 'Singapore (APAC)',
    region: 'Asia-Pacific • Singapore / AWS ap-southeast-1',
    color: 'text-emerald-400',
    border: 'border-emerald-500/30 hover:border-emerald-500/60',
    bg: 'bg-emerald-500/10',
  },
  SHARD_4_UAE: {
    label: 'Shard 4 (UAE / Global)',
    flag: '🇦🇪',
    country: 'United Arab Emirates',
    region: 'Middle East • Dubai DIFC Treasury',
    color: 'text-amber-400',
    border: 'border-amber-500/30 hover:border-amber-500/60',
    bg: 'bg-amber-500/10',
  },
  // Legacy aliases
  SHARD_1_NORTH: {
    label: 'Shard 1 (United States)',
    flag: '🇺🇸',
    country: 'United States',
    region: 'North America Cluster',
    color: 'text-blue-400',
    border: 'border-blue-500/30 hover:border-blue-500/60',
    bg: 'bg-blue-500/10',
  },
  SHARD_2_CENTRAL: {
    label: 'Shard 2 (United Kingdom)',
    flag: '🇬🇧',
    country: 'United Kingdom',
    region: 'Europe Cluster',
    color: 'text-purple-400',
    border: 'border-purple-500/30 hover:border-purple-500/60',
    bg: 'bg-purple-500/10',
  },
  SHARD_3_SOUTH: {
    label: 'Shard 3 (Singapore)',
    flag: '🇸🇬',
    country: 'Singapore',
    region: 'Asia-Pacific Cluster',
    color: 'text-emerald-400',
    border: 'border-emerald-500/30 hover:border-emerald-500/60',
    bg: 'bg-emerald-500/10',
  },
  SHARD_4_ENTERPRISE: {
    label: 'Shard 4 (UAE / Global)',
    flag: '🇦🇪',
    country: 'United Arab Emirates',
    region: 'Global Enterprise Cluster',
    color: 'text-amber-400',
    border: 'border-amber-500/30 hover:border-amber-500/60',
    bg: 'bg-amber-500/10',
  },
};

export const ShardClusterView: React.FC<ShardClusterViewProps> = ({
  accounts,
  selectedAccountId,
  onSelectAccount,
}) => {
  // Prefer the 4 primary country shards
  const countryShards: ShardType[] = [
    'SHARD_1_US',
    'SHARD_2_UK',
    'SHARD_3_SG',
    'SHARD_4_UAE',
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe2 className="w-5 h-5 text-blue-400" />
          <h2 className="text-base font-bold text-white uppercase tracking-wider">
            Multi-Country Distributed Shards (PostgreSQL Geo-Partitions)
          </h2>
        </div>
        <span className="text-xs text-slate-400">
          Sharded by Country & Currency Zone (<code className="text-blue-400">account_id</code>)
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {countryShards.map((shard) => {
          const cfg = SHARD_CONFIG[shard];
          // Match accounts by current shard or legacy equivalent
          const shardAccounts = accounts.filter(
            (a) =>
              a.shard === shard ||
              (shard === 'SHARD_1_US' && a.shard === 'SHARD_1_NORTH') ||
              (shard === 'SHARD_2_UK' && a.shard === 'SHARD_2_CENTRAL') ||
              (shard === 'SHARD_3_SG' && a.shard === 'SHARD_3_SOUTH') ||
              (shard === 'SHARD_4_UAE' && a.shard === 'SHARD_4_ENTERPRISE')
          );

          const totalLiquidity = shardAccounts.reduce(
            (sum, a) => sum + Number(a.balance),
            0
          );

          return (
            <div
              key={shard}
              className={`rounded-xl border bg-slate-900/80 p-4 transition-all duration-200 shadow-md ${cfg.border}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1.5 ${cfg.bg} ${cfg.color}`}
                >
                  <span className="text-sm">{cfg.flag}</span>
                  <span>{cfg.country}</span>
                </span>
                <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                  <Server className="w-3 h-3 text-emerald-400" />
                  <span>Primary Node</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 mb-3">{cfg.region}</p>

              <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-slate-400">Shard Liquidity:</span>
                  <span className="text-sm font-extrabold text-white">
                    ${totalLiquidity.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{' '}
                    <span className="text-[10px] text-slate-400">USD</span>
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Country Accounts ({shardAccounts.length})
                  </span>
                  <div className="space-y-1.5">
                    {shardAccounts.length === 0 ? (
                      <div className="text-[11px] text-slate-500 py-1 italic">
                        No active accounts in this partition
                      </div>
                    ) : (
                      shardAccounts.map((acc) => {
                        const isSelected = selectedAccountId === acc.id;
                        return (
                          <button
                            key={acc.id}
                            onClick={() => onSelectAccount(acc.id)}
                            className={`w-full text-left p-2 rounded-lg text-xs transition flex items-center justify-between border ${
                              isSelected
                                ? 'bg-blue-600 text-white border-blue-500 font-bold shadow-md shadow-blue-500/20'
                                : 'bg-slate-800/60 hover:bg-slate-800 text-slate-200 border-slate-750'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <Wallet className="w-3.5 h-3.5 opacity-70" />
                              <span className="truncate">
                                {acc.user?.fullName || `Account #${acc.id}`}
                              </span>
                            </div>
                            <span className="font-mono text-[11px] shrink-0 ml-1">
                              ${Number(acc.balance).toFixed(0)} {acc.currency || 'USD'}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
