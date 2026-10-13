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
    <div className="space-y-6 font-sans">
      {/* Top Banner / Header */}
      <div className="p-6 sm:p-7 rounded-3xl border border-[#EBE5DF] bg-white shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Scale className="w-4 h-4 text-[#00A389]" />
            <span className="text-xs font-mono uppercase tracking-wider text-[#00A389] font-bold">
              Phase 5 Compliance • GAAP Core
            </span>
          </div>
          <h2 className="text-xl font-black text-[#1A1D20] tracking-tight">
            GAAP Double-Entry Ledger &amp; Auditor Console
          </h2>
          <p className="text-xs text-[#5F6773] mt-1">
            Zero-sum financial ledger streams, running balance verification, and regulatory audit reports.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchEntries}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-[#EBE5DF] bg-white hover:bg-[#FAF7F4] text-xs font-semibold text-[#1A1D20] cursor-pointer transition shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#FF6651]' : 'text-[#5F6773]'}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleDownloadCsv}
            disabled={downloading || !selectedAccId}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#FF6651] hover:bg-[#E54D34] active:scale-95 text-white text-xs font-bold cursor-pointer shadow-md shadow-[#FF6651]/25 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{downloading ? 'Exporting...' : 'Export Statement (CSV)'}</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Account Selection & Reconciliation Invariant Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Account Selector & Verification Action */}
        <div className="p-6 rounded-3xl border border-[#EBE5DF] bg-white shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-[#1A1D20] flex items-center gap-2">
            <Database className="w-4 h-4 text-[#FF6651]" />
            <span>Audit Target Account</span>
          </h3>

          <div>
            <label className="block text-xs text-[#5F6773] mb-1.5 font-medium">Select Account to Inspect:</label>
            <select
              value={selectedAccId}
              onChange={(e) => setSelectedAccId(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-[#EBE5DF] bg-[#FAF7F4] text-xs text-[#1A1D20] font-medium focus:outline-none focus:border-[#FF6651] cursor-pointer"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.accountNumber} ({acc.shard}) - {acc.currency} {Number(acc.balance).toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          {selectedAccount && (
            <div className="p-3.5 rounded-2xl bg-[#FAF7F4] border border-[#EBE5DF] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#5F6773]">Account Holder:</span>
                <span className="text-[#1A1D20] font-bold">{selectedAccount.user?.fullName || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5F6773]">Assigned Shard:</span>
                <span className="text-[#1A1D20] font-mono text-[11px] font-semibold">{selectedAccount.shard}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5F6773]">Recorded Balance:</span>
                <span className="text-[#00A389] font-mono font-bold text-sm">
                  {selectedAccount.currency} {Number(selectedAccount.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          )}

          <button
            onClick={handleRunReconciliation}
            disabled={reconciling || !selectedAccId}
            className="w-full py-3 rounded-2xl bg-[#00A389] hover:bg-[#008F78] active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#00A389]/25 transition"
          >
            <ShieldCheck className={`w-4 h-4 ${reconciling ? 'animate-spin' : ''}`} />
            <span>{reconciling ? 'Calculating Checksums...' : 'Run Invariant Checksum'}</span>
          </button>
        </div>

        {/* Live Reconciliation Results */}
        <div className="lg:col-span-2 p-6 rounded-3xl border border-[#EBE5DF] bg-white shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#1A1D20] flex items-center gap-2">
              <Scale className="w-4 h-4 text-[#00A389]" />
              <span>Running Balance Reconciliation</span>
            </h3>
            {reconciliation && (
              <span
                className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                  reconciliation.balanced
                    ? 'bg-[#E5F7F3] text-[#00A389] border border-[#00A389]/25'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {reconciliation.balanced ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Balanced (Invariant Verified)</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Discrepancy Detected</span>
                  </>
                )}
              </span>
            )}
          </div>

          {reconciliation ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#FAF7F4] border border-[#EBE5DF]">
                  <div className="text-[10px] text-[#5F6773] font-medium">Account Balance</div>
                  <div className="text-sm font-mono font-bold text-[#1A1D20] mt-1">
                    {selectedAccount?.currency || 'PKR'} {Number(reconciliation.currentBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FAF7F4] border border-[#EBE5DF]">
                  <div className="text-[10px] text-[#5F6773] font-medium">Net Ledger Sum</div>
                  <div className="text-sm font-mono font-bold text-[#1A1D20] mt-1">
                    {selectedAccount?.currency || 'PKR'} {Number(reconciliation.calculatedLedgerBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#E5F7F3] border border-[#00A389]/20">
                  <div className="text-[10px] text-[#00A389] font-medium">Total Credits (Inflow)</div>
                  <div className="text-sm font-mono font-bold text-[#00A389] mt-1">
                    +{Number(reconciliation.totalCredits).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FFEAE5] border border-[#FF6651]/20">
                  <div className="text-[10px] text-[#FF6651] font-medium">Total Debits (Outflow)</div>
                  <div className="text-sm font-mono font-bold text-[#FF6651] mt-1">
                    -{Number(reconciliation.totalDebits).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              <div
                className={`p-4 rounded-2xl text-xs border ${
                  reconciliation.balanced
                    ? 'bg-[#E5F7F3] border-[#00A389]/25 text-[#00A389]'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                <div className="font-bold mb-0.5">Checksum Assertion:</div>
                <div className="text-[11px] font-medium">{reconciliation.statusMessage}</div>
                <div className="text-[10px] text-[#5F6773] mt-1">
                  Validated across {reconciliation.totalEntries} immutable ledger entry rows.
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-[#5F6773] border border-dashed border-[#EBE5DF] rounded-2xl bg-[#FAF7F4]">
              Click &quot;Run Invariant Checksum&quot; to perform live balance parity verification against the immutable ledger.
            </div>
          )}
        </div>
      </div>

      {/* Ledger Stream Table */}
      <div className="p-6 sm:p-7 rounded-3xl border border-[#EBE5DF] bg-white shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#FF6651]" />
            <h3 className="text-sm font-bold text-[#1A1D20]">
              Immutable Financial Ledger Stream
            </h3>
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-[#FFEAE5] text-[#FF6651] font-bold">
              {filteredEntries.length} entries
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Stream Filter Toggle */}
            <div className="flex rounded-xl border border-[#EBE5DF] p-1 bg-[#FAF7F4] text-xs">
              <button
                onClick={() => setStreamFilter('account')}
                className={`px-3 py-1 rounded-lg cursor-pointer transition font-semibold ${
                  streamFilter === 'account'
                    ? 'bg-white text-[#FF6651] shadow-2xs font-bold'
                    : 'text-[#5F6773] hover:text-[#1A1D20]'
                }`}
              >
                Target Account
              </button>
              <button
                onClick={() => setStreamFilter('all')}
                className={`px-3 py-1 rounded-lg cursor-pointer transition font-semibold ${
                  streamFilter === 'all'
                    ? 'bg-white text-[#FF6651] shadow-2xs font-bold'
                    : 'text-[#5F6773] hover:text-[#1A1D20]'
                }`}
              >
                Global Stream
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                type="text"
                placeholder="Search Tx ID, Amount..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl border border-[#EBE5DF] bg-[#FAF7F4] text-xs text-[#1A1D20] focus:bg-white focus:outline-none focus:border-[#FF6651] w-48 transition"
              />
            </div>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto rounded-2xl border border-[#EBE5DF]">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-[#FAF7F4] border-b border-[#EBE5DF] text-[#5F6773] font-semibold">
              <tr>
                <th className="px-4 py-3">Entry ID</th>
                <th className="px-4 py-3">Transaction ID</th>
                <th className="px-4 py-3">Account ID</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-right">Balance After</th>
                <th className="px-4 py-3 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2ECE5]">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-[#9CA3AF]">
                    {loading ? 'Loading ledger stream...' : 'No ledger entries found.'}
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-[#FAF7F4] transition">
                    <td className="px-4 py-3 text-[#9CA3AF] font-mono">#{entry.id}</td>
                    <td className="px-4 py-3 font-mono text-[#1A1D20] text-[11px] font-semibold">
                      {entry.transactionId || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-[#1A1D20]">
                      Acc #{entry.accountId}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          entry.entryType === 'CREDIT'
                            ? 'bg-[#E5F7F3] text-[#00A389]'
                            : 'bg-[#FFEAE5] text-[#FF6651]'
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
                      className={`px-4 py-3 text-right font-mono font-bold ${
                        entry.entryType === 'CREDIT' ? 'text-[#00A389]' : 'text-[#FF6651]'
                      }`}
                    >
                      {entry.entryType === 'CREDIT' ? '+' : '-'} {Number(entry.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[#1A1D20] font-semibold">
                      {entry.balanceAfter != null
                        ? `PKR ${Number(entry.balanceAfter).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-[#9CA3AF] text-[11px] font-mono">
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
