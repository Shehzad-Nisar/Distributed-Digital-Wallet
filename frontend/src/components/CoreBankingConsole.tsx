import React, { useState } from 'react';
import {
  Cpu,
  Database,
  Flame,
  Network,
  RefreshCw,
  Server,
} from 'lucide-react';
import { ShardClusterView } from './ShardClusterView';
import { SystemBufferDashboard } from './SystemBufferDashboard';
import { ChaosSimulatorView } from './ChaosSimulatorView';
import { ArchitectureView } from './ArchitectureView';
import type { Account, SystemHealth, User } from '../types';

interface CoreBankingConsoleProps {
  health: SystemHealth | null;
  accounts: Account[];
  selectedAccountId: number | null;
  currentUser?: User | null;
  onSelectAccount: (id: number) => void;
  onOpenCreateAccount: () => void;
  onRefreshData: () => void;
}

export const CoreBankingConsole: React.FC<CoreBankingConsoleProps> = ({
  health,
  accounts,
  selectedAccountId,
  onSelectAccount,
  onOpenCreateAccount,
  onRefreshData,
}) => {
  const [subTab, setSubTab] = useState<'shards' | 'buffer' | 'chaos' | 'architecture'>('shards');
  const isHealthy = health?.database?.includes('Connected');

  return (
    <div className="space-y-6 font-sans">
      {/* Enterprise Infrastructure Header */}
      <div className="bg-neutral-950 text-white rounded-2xl p-6 border border-neutral-800 shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="text-base font-bold uppercase tracking-wider font-mono text-white">
                Core Banking &amp; Distributed Infrastructure
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] bg-white/10 text-neutral-300 font-mono">
                ENTERPRISE CONSOLE
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Distributed Database Management • Regional Shard Partitions • 2PC Consensus Engine • Redis In-Memory Cache
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center gap-2 text-xs font-mono">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-neutral-300">DB Status:</span>
              <span className="font-bold text-emerald-400">{isHealthy ? 'Connected' : 'Offline'}</span>
            </div>

            <button
              onClick={onRefreshData}
              className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 transition cursor-pointer"
              title="Refresh Engine State"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Academic Evaluation & System Attribution (Professionally Framed) */}
        <div className="mt-4 pt-4 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="text-neutral-500">Project Specs:</span>
            <span className="text-neutral-200">Distributed Database Systems (Sir Umair)</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-neutral-900 text-neutral-300 border border-neutral-800">
              Shehzad Nisar (B22110006147)
            </span>
            <span className="px-2 py-0.5 rounded bg-neutral-900 text-neutral-300 border border-neutral-800">
              Muhammad Ashraf (B22110006090)
            </span>
            <span className="px-2 py-0.5 rounded bg-neutral-900 text-neutral-300 border border-neutral-800">
              Daniyal Ahmed (B21110006024)
            </span>
          </div>
        </div>
      </div>

      {/* Enterprise Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setSubTab('shards')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 shrink-0 ${
            subTab === 'shards'
              ? 'bg-black text-white shadow-xs'
              : 'text-slate-600 hover:text-black hover:bg-slate-100'
          }`}
        >
          <Network className="w-4 h-4" />
          <span>Regional Shard Topology</span>
        </button>

        <button
          onClick={() => setSubTab('buffer')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 shrink-0 ${
            subTab === 'buffer'
              ? 'bg-black text-white shadow-xs'
              : 'text-slate-600 hover:text-black hover:bg-slate-100'
          }`}
        >
          <Cpu className="w-4 h-4 text-amber-500" />
          <span>Redis Cache &amp; Event Buffer</span>
        </button>

        <button
          onClick={() => setSubTab('chaos')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 shrink-0 ${
            subTab === 'chaos'
              ? 'bg-black text-white shadow-xs'
              : 'text-slate-600 hover:text-black hover:bg-slate-100'
          }`}
        >
          <Flame className="w-4 h-4 text-rose-500" />
          <span>Fault Injection &amp; Stress Testing</span>
        </button>

        <button
          onClick={() => setSubTab('architecture')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 shrink-0 ${
            subTab === 'architecture'
              ? 'bg-black text-white shadow-xs'
              : 'text-slate-600 hover:text-black hover:bg-slate-100'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Architecture Blueprints</span>
        </button>
      </div>

      {/* Sub-Tab Views */}
      <div className="pt-2">
        {subTab === 'shards' && (
          <div className="space-y-6">
            <ShardClusterView
              accounts={accounts}
              selectedAccountId={selectedAccountId}
              onSelectAccount={onSelectAccount}
              onOpenCreateAccount={onOpenCreateAccount}
            />
          </div>
        )}

        {subTab === 'buffer' && <SystemBufferDashboard />}

        {subTab === 'chaos' && <ChaosSimulatorView />}

        {subTab === 'architecture' && <ArchitectureView />}
      </div>
    </div>
  );
};
