import React from 'react';
import { Layers, Server, Wallet } from 'lucide-react';
import type { Account, ShardType } from '../types';

interface ShardClusterViewProps {
  accounts: Account[];
  selectedAccountId: number | null;
  onSelectAccount: (accountId: number) => void;
}

const SHARD_CONFIG: Record<
  ShardType,
  { label: string; region: string; color: string; border: string; bg: string }
> = {
  SHARD_1_NORTH: {
    label: 'Shard 1 (North)',
    region: 'Islamabad / KPK / North Cluster',
    color: 'text-cyan-400',
    border: 'border-cyan-500/30 hover:border-cyan-500/60',
    bg: 'bg-cyan-500/10',
  },
  SHARD_2_CENTRAL: {
    label: 'Shard 2 (Central)',
    region: 'Lahore / Punjab Central Cluster',
    color: 'text-blue-400',
    border: 'border-blue-500/30 hover:border-blue-500/60',
    bg: 'bg-blue-500/10',
  },
  SHARD_3_SOUTH: {
    label: 'Shard 3 (South)',
    region: 'Karachi / Sindh / Coastal Cluster',
    color: 'text-purple-400',
    border: 'border-purple-500/30 hover:border-purple-500/60',
    bg: 'bg-purple-500/10',
  },
  SHARD_4_ENTERPRISE: {
    label: 'Shard 4 (Enterprise)',
    region: 'Corporate / Merchant / B2B Cluster',
    color: 'text-pink-400',
    border: 'border-pink-500/30 hover:border-pink-500/60',
    bg: 'bg-pink-500/10',
  },
};

export const ShardClusterView: React.FC<ShardClusterViewProps> = ({
  accounts,
  selectedAccountId,
  onSelectAccount,
}) => {
  const shards: ShardType[] = [
    'SHARD_1_NORTH',
    'SHARD_2_CENTRAL',
    'SHARD_3_SOUTH',
    'SHARD_4_ENTERPRISE',
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-400" />
          <h2 className="text-base font-bold text-white uppercase tracking-wider">
            Distributed Shards Topology (PostgreSQL Partitions)
          </h2>
        </div>
        <span className="text-xs text-slate-400">
          Consistent Hashing by <code className="text-blue-400">account_id</code>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {shards.map((shard) => {
          const cfg = SHARD_CONFIG[shard];
          const shardAccounts = accounts.filter((a) => a.shard === shard);
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
                  className={`text-xs font-bold px-2 py-0.5 rounded ${cfg.bg} ${cfg.color}`}
                >
                  {cfg.label}
                </span>
                <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                  <Server className="w-3 h-3 text-emerald-400" />
                  <span>Primary</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 mb-3">{cfg.region}</p>

              <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-slate-400">Shard Liquidity:</span>
                  <span className="text-sm font-extrabold text-white">
                    {totalLiquidity.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{' '}
                    <span className="text-[10px] text-slate-400">PKR</span>
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Accounts in Shard ({shardAccounts.length})
                  </span>
                  <div className="space-y-1.5">
                    {shardAccounts.map((acc) => {
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
                            {Number(acc.balance).toFixed(0)} PKR
                          </span>
                        </button>
                      );
                    })}
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
