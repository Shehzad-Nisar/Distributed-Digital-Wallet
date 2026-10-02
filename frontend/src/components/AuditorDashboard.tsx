import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Download,
  Search,
  Scale,
  ArrowDownRight,
  ArrowUpRight,
  Database,
  Layers,
} from 'lucide-react';
import type { Account, LedgerEntryResponse, ReconciliationResponse } from '../types';
import {
  getLedgerEntriesByAccount,
  getAllLedgerEntries,
  reconcileAccount,
  downloadStatementCsv,
} from '../api/client';

interface AuditorDashboardProps {
  accounts: Account[];
  selectedAccountId: number | null;
  refreshTrigger?: number;
}

export const AuditorDashboard: React.FC<AuditorDashboardProps> = ({
  accounts,
  selectedAccountId,
  refreshTrigger = 0,
}) => {
  const [selectedAccId, setSelectedAccId] = useState<number>(
    selectedAccountId || (accounts.length > 0 ? accounts[0].id : 1)
  );
  const [streamFilter, setStreamFilter] = useState<'account' | 'all'>('account');
  const [entries, setEntries] = useState<LedgerEntryResponse[]>([]);
  const [reconciliation, setReconciliation] = useState<ReconciliationResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [reconciling, setReconciling] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync selectedAccId when prop changes
  useEffect(() => {
    if (selectedAccountId) {
      setSelectedAccId(selectedAccountId);
    }
  }, [selectedAccountId]);

  // Load entries and reconciliation
  useEffect(() => {
    fetchEntries();
  }, [selectedAccId, streamFilter, refreshTrigger]);

  const fetchEntries = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      if (streamFilter === 'account' && selectedAccId) {
        const [data, recon] = await Promise.all([
          getLedgerEntriesByAccount(selectedAccId),
          reconcileAccount(selectedAccId).catch(() => null),
        ]);
        setEntries(data);
        setReconciliation(recon);
      } else {
        const data = await getAllLedgerEntries();
        setEntries(data);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to fetch ledger entries');
    } finally {
      setLoading(false);
    }
  };

  const handleRunReconciliation = async () => {
    if (!selectedAccId) return;
    setReconciling(true);
    setErrorMsg(null);
    try {
      const recon = await reconcileAccount(selectedAccId);
      setReconciliation(recon);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Reconciliation failed');
    } finally {
      setReconciling(false);
    }
  };

  const handleDownloadCsv = async () => {
    if (!selectedAccId) return;
    setDownloading(true);
    try {
      await downloadStatementCsv(selectedAccId);
    } catch (err: any) {
      setErrorMsg('Failed to download CSV statement');
    } finally {
      setDownloading(false);
    }
  };

  const selectedAccount = accounts.find((a) => a.id === selectedAccId);

  const filteredEntries = entries.filter((e) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (e.transactionId && e.transactionId.toLowerCase().includes(term)) ||
      e.id.toString().includes(term) ||
      e.entryType.toLowerCase().includes(term) ||
      e.amount.toString().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="p-6 rounded-xl border theme-border theme-bg-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Scale className="w-5 h-5 text-emerald-500" />
            <span className="text-xs font-mono uppercase tracking-wider text-emerald-500 font-semibold">
              Phase 5 Compliance
            </span>
          </div>
          <h2 className="text-xl font-bold theme-text-primary font-mono tracking-tight">
            GAAP Double-Entry Ledger &amp; Auditor Console
          </h2>
          <p className="text-xs theme-text-secondary font-mono mt-1">
            Zero-sum financial ledger streams, running balance verification, and regulatory audit reports.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchEntries}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border theme-border theme-bg-card hover:bg-slate-800 text-xs font-mono theme-text-secondary cursor-pointer transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleDownloadCsv}
            disabled={downloading || !selectedAccId}
            className="flex items-center gap-2 px-4 py-2 rounded-lg theme-btn-primary font-mono text-xs cursor-pointer shadow-md hover:opacity-90 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            {downloading ? 'Exporting...' : 'Export Statement (CSV)'}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Account Selection & Reconciliation Invariant Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Account Selector & Verification Action */}
        <div className="p-5 rounded-xl border theme-border theme-bg-card space-y-4">
          <h3 className="text-sm font-semibold theme-text-primary font-mono flex items-center gap-2">
            <Database className="w-4 h-4 text-sky-400" />
            Audit Target Account
          </h3>

          <div>
            <label className="block text-xs font-mono theme-text-muted mb-1.5">Select Account to Inspect:</label>
            <select
              value={selectedAccId}
              onChange={(e) => setSelectedAccId(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border theme-border bg-slate-900/50 text-xs font-mono theme-text-primary focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.accountNumber} ({acc.shard}) - PKR {acc.balance.toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          {selectedAccount && (
            <div className="p-3 rounded-lg bg-slate-900/40 border theme-border space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="theme-text-muted">Account Holder:</span>
                <span className="theme-text-primary font-medium">{selectedAccount.user?.fullName || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="theme-text-muted">Assigned Shard:</span>
                <span className="text-sky-400">{selectedAccount.shard}</span>
              </div>
              <div className="flex justify-between">
                <span className="theme-text-muted">Recorded Balance:</span>
                <span className="text-emerald-400 font-bold">
                  {selectedAccount.currency} {Number(selectedAccount.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          )}

          <button
            onClick={handleRunReconciliation}
            disabled={reconciling || !selectedAccId}
            className="w-full py-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-mono text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <ShieldCheck className={`w-4 h-4 ${reconciling ? 'animate-spin' : ''}`} />
            {reconciling ? 'Calculating Checksums...' : 'Run Invariant Checksum'}
          </button>
        </div>

        {/* Live Reconciliation Results */}
        <div className="lg:col-span-2 p-5 rounded-xl border theme-border theme-bg-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold theme-text-primary font-mono flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-400" />
              Running Balance Reconciliation
            </h3>
            {reconciliation && (
              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                  reconciliation.balanced
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}
              >
                {reconciliation.balanced ? (
                  <>
                    <CheckCircle2 className="w-3 h-3" />
                    Balanced (Invariant Verified)
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3 h-3" />
                    Discrepancy Detected
                  </>
                )}
              </span>
            )}
          </div>

          {reconciliation ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-slate-900/40 border theme-border">
                  <div className="text-[10px] font-mono theme-text-muted">Account Balance</div>
                  <div className="text-sm font-mono font-bold text-emerald-400 mt-1">
                    PKR {Number(reconciliation.currentBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/40 border theme-border">
                  <div className="text-[10px] font-mono theme-text-muted">Net Ledger Sum</div>
                  <div className="text-sm font-mono font-bold text-sky-400 mt-1">
                    PKR {Number(reconciliation.calculatedLedgerBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/40 border theme-border">
                  <div className="text-[10px] font-mono theme-text-muted">Total Credits (Inflow)</div>
                  <div className="text-sm font-mono font-bold text-emerald-400 mt-1">
                    + {Number(reconciliation.totalCredits).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/40 border theme-border">
                  <div className="text-[10px] font-mono theme-text-muted">Total Debits (Outflow)</div>
                  <div className="text-sm font-mono font-bold text-rose-400 mt-1">
                    - {Number(reconciliation.totalDebits).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              <div
                className={`p-3 rounded-lg text-xs font-mono border ${
                  reconciliation.balanced
                    ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-300'
                    : 'bg-rose-950/20 border-rose-500/20 text-rose-300'
                }`}
              >
                <div className="font-semibold mb-0.5">Checksum Assertion:</div>
                <div className="text-[11px] opacity-90">{reconciliation.statusMessage}</div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Validated across {reconciliation.totalEntries} immutable ledger entry rows.
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs font-mono theme-text-muted border border-dashed theme-border rounded-lg">
              Click &quot;Run Invariant Checksum&quot; to perform live balance parity verification against the ledger.
            </div>
          )}
        </div>
      </div>

      {/* Ledger Stream Table */}
      <div className="p-5 rounded-xl border theme-border theme-bg-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold theme-text-primary font-mono">
              Immutable Financial Ledger Stream
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {filteredEntries.length} entries
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Stream Filter Toggle */}
            <div className="flex rounded-lg border theme-border p-0.5 bg-slate-900/60 text-xs font-mono">
              <button
                onClick={() => setStreamFilter('account')}
                className={`px-2.5 py-1 rounded cursor-pointer transition-colors ${
                  streamFilter === 'account'
                    ? 'bg-emerald-500/20 text-emerald-400 font-semibold'
                    : 'theme-text-muted hover:theme-text-primary'
                }`}
              >
                Target Account
              </button>
              <button
                onClick={() => setStreamFilter('all')}
                className={`px-2.5 py-1 rounded cursor-pointer transition-colors ${
                  streamFilter === 'all'
                    ? 'bg-emerald-500/20 text-emerald-400 font-semibold'
                    : 'theme-text-muted hover:theme-text-primary'
                }`}
              >
                Global Stream
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search Tx ID, Amount..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1 rounded-lg border theme-border bg-slate-900/50 text-xs font-mono theme-text-primary focus:outline-none focus:border-emerald-500 w-48"
              />
            </div>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto rounded-lg border theme-border">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/80 border-b theme-border text-slate-400">
              <tr>
                <th className="px-4 py-2.5">Entry ID</th>
                <th className="px-4 py-2.5">Transaction ID</th>
                <th className="px-4 py-2.5">Account ID</th>
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5 text-right">Amount</th>
                <th className="px-4 py-2.5 text-right">Balance After</th>
                <th className="px-4 py-2.5 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y theme-border">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center theme-text-muted">
                    {loading ? 'Loading ledger stream...' : 'No ledger entries found.'}
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-2.5 text-slate-400 font-mono">#{entry.id}</td>
                    <td className="px-4 py-2.5 font-mono text-sky-400 text-[11px]">
                      {entry.transactionId || 'N/A'}
                    </td>
                    <td className="px-4 py-2.5 theme-text-primary">
                      Acc #{entry.accountId}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          entry.entryType === 'CREDIT'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {entry.entryType === 'CREDIT' ? (
                          <ArrowDownRight className="w-2.5 h-2.5" />
                        ) : (
                          <ArrowUpRight className="w-2.5 h-2.5" />
                        )}
                        {entry.entryType}
                      </span>
                    </td>
                    <td
                      className={`px-4 py-2.5 text-right font-bold ${
                        entry.entryType === 'CREDIT' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {entry.entryType === 'CREDIT' ? '+' : '-'} {Number(entry.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-300">
                      {entry.balanceAfter != null
                        ? `PKR ${Number(entry.balanceAfter).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                        : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-400 text-[11px]">
                      {new Date(entry.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
