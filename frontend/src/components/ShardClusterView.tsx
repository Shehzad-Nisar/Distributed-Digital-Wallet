import React from 'react';
import { Layers, Plus, Wallet } from 'lucide-react';
import type { Account, ShardType } from '../types';

interface ShardClusterViewProps {
  accounts: Account[];
  selectedAccountId: number | null;
  onSelectAccount: (accountId: number) => void;
  onOpenCreateAccount?: () => void;
}

interface RegionMeta {
  code: string;
  label: string;
  region: string;
  role: string;
}

const REGION_CONFIG: Record<string, RegionMeta> = {
  SHARD_1_NORTH: {
    code: 'HUB-01',
    label: 'North Region',
    region: 'Islamabad / KPK',
    role: 'Primary Hub',
  },
  SHARD_2_CENTRAL: {
    code: 'HUB-02',
    label: 'Central Region',
    region: 'Lahore / Punjab',
    role: 'Primary Hub',
  },
  SHARD_3_SOUTH: {
    code: 'HUB-03',
    label: 'South Region',
    region: 'Karachi / Sindh',
    role: 'Primary Hub',
  },
  SHARD_4_ENTERPRISE: {
    code: 'HUB-04',
    label: 'Business Hub',
    region: 'Corporate & Merchant',
    role: 'Business Hub',
  },
  SHARD_1_US: {
    code: 'HUB-01',
    label: 'US Region',
    region: 'North America / New York',
    role: 'Primary Hub',
  },
  SHARD_2_UK: {
    code: 'HUB-02',
    label: 'UK Region',
    region: 'Europe / London',
    role: 'Primary Hub',
  },
  SHARD_3_SG: {
    code: 'HUB-03',
    label: 'Asia Region',
    region: 'Asia-Pacific / Singapore',
    role: 'Primary Hub',
  },
  SHARD_4_UAE: {
    code: 'HUB-04',
    label: 'Middle East Region',
    region: 'Middle East / Dubai',
    role: 'Business Hub',
  },
};

export const ShardClusterView: React.FC<ShardClusterViewProps> = ({
  accounts,
  selectedAccountId,
  onSelectAccount,
  onOpenCreateAccount,
}) => {
  const primaryRegions: ShardType[] = [
    'SHARD_1_NORTH',
    'SHARD_2_CENTRAL',
    'SHARD_3_SOUTH',
    'SHARD_4_ENTERPRISE',
  ];

  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0);

  return (
    <div className="space-y-4 font-sans bg-white text-black">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-black" />
          <h2 className="text-sm font-bold text-black uppercase tracking-wider font-mono">
            Regional Hubs Overview
          </h2>
        </div>
        <div className="flex items-center gap-3 font-mono text-xs">
          <span className="text-slate-600">
            Total Balance:{' '}
            <strong className="text-black font-bold">
              {totalBalance.toLocaleString('en-US', { minimumFractionDigits: 0 })} PKR
            </strong>
          </span>
          {onOpenCreateAccount && (
            <button
              onClick={onOpenCreateAccount}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 text-black transition cursor-pointer text-[11px] font-medium"
            >
              <Plus className="w-3 h-3" />
              <span>Open Account</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid of Regions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {primaryRegions.map((regionKey, index) => {
          const cfg = REGION_CONFIG[regionKey] || {
            code: `HUB-0${index + 1}`,
            label: regionKey,
            region: 'Service Region',
            role: 'Active Hub',
          };

          const regionAccounts = accounts.filter(
            (a) =>
              a.shard === regionKey ||
              (regionKey === 'SHARD_1_NORTH' && a.shard === 'SHARD_1_US') ||
              (regionKey === 'SHARD_2_CENTRAL' && a.shard === 'SHARD_2_UK') ||
              (regionKey === 'SHARD_3_SOUTH' && a.shard === 'SHARD_3_SG') ||
              (regionKey === 'SHARD_4_ENTERPRISE' && a.shard === 'SHARD_4_UAE')
          );

          const regionBalance = regionAccounts.reduce(
            (sum, a) => sum + Number(a.balance),
            0
          );

          return (
            <div
              key={regionKey}
              className="rounded-xl border border-slate-200 bg-white p-4 transition-all duration-200 hover:border-slate-400 flex flex-col justify-between space-y-4 shadow-xs"
            >
              <div>
                {/* Region Meta Header */}
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-black border border-slate-200">
                    {cfg.code}
                  </span>
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>ACTIVE</span>
                  </div>
                </div>

                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-black uppercase tracking-tight">
                    {cfg.label}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono truncate">{cfg.region}</p>
                </div>

                {/* Balance Counter */}
                <div className="mt-3 p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block">
                    Region Balance
                  </span>
                  <span className="text-base font-bold text-black font-mono block">
                    {regionBalance.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{' '}
                    <span className="text-xs text-slate-500 font-normal">PKR</span>
                  </span>
                </div>
              </div>

              {/* Accounts inside this region */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  <span>Accounts ({regionAccounts.length})</span>
                  <span>ID / BAL</span>
                </div>

                <div className="space-y-1.5">
                  {regionAccounts.length === 0 ? (
                    <div className="text-center py-3 text-[11px] text-slate-400 font-mono">
                      No accounts in this region
                    </div>
                  ) : (
                    regionAccounts.map((acc) => {
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
