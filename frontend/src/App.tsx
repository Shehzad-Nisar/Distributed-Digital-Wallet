import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ShardClusterView } from './components/ShardClusterView';
import { TransferConsole } from './components/TransferConsole';
import { TransactionHistory } from './components/TransactionHistory';
import { getAccounts, getHealth } from './api/client';
import type { Account, SystemHealth } from './types';
import { RefreshCw } from 'lucide-react';

export function App() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);

  const fetchData = async () => {
    try {
      const [h, accs] = await Promise.all([getHealth(), getAccounts()]);
      setHealth(h);
      setAccounts(accs);
      if (!selectedAccountId && accs.length > 0) {
        setSelectedAccountId(accs[0].id);
      }
    } catch (err) {
      console.error('Error fetching initial data', err);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleTransferComplete = () => {
    fetchData();
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header health={health} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-8">
        {/* Banner with course and team context */}
        <div className="bg-gradient-to-r from-blue-950/40 via-indigo-950/40 to-slate-900 border border-indigo-900/40 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-indigo-300">
              Distributed Relational Database System — Course Project
            </h2>
            <p className="text-xs text-slate-400">
              Two-Phase Commit (2PC) Cross-Shard Coordination • PostgreSQL Sharding • Double-Entry Bookkeeping
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
              Shehzad Nisar (B22110006147)
            </span>
            <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
              Muhammad Ashraf (B22110006090)
            </span>
            <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
              Daniyal Ahmed (B21110006024)
            </span>
            <button
              onClick={() => {
                fetchData();
                setRefreshTrigger((prev) => prev + 1);
              }}
              title="Refresh Cluster State"
              className="p-1.5 rounded bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 border border-blue-500/30 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {initialLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
            <span className="text-sm">Connecting to PostgreSQL Sharded Cluster...</span>
          </div>
        ) : (
          <>
            {/* Shards Topology Cards */}
            <ShardClusterView
              accounts={accounts}
              selectedAccountId={selectedAccountId}
              onSelectAccount={(id) => setSelectedAccountId(id)}
            />

            {/* 2PC Transfer Console & Consensus Visualizer */}
            <TransferConsole
              accounts={accounts}
              onTransferComplete={handleTransferComplete}
            />

            {/* Transaction Search, Sort & Filtering Table */}
            <TransactionHistory
              accounts={accounts}
              selectedAccountId={selectedAccountId}
              refreshTrigger={refreshTrigger}
            />
          </>
        )}
      </main>

      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        TransMoney Distributed Digital Wallet System • Built with Spring Boot 3, PostgreSQL 17, and React (Vite)
      </footer>
    </div>
  );
}

export default App;
