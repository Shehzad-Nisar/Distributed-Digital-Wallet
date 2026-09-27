import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Lock, RefreshCw, Send, XCircle } from 'lucide-react';
import { executeTransfer } from '../api/client';
import type { Account, TransactionResponse } from '../types';

interface TransferConsoleProps {
  accounts: Account[];
  onTransferComplete: () => void;
}

export const TransferConsole: React.FC<TransferConsoleProps> = ({
  accounts,
  onTransferComplete,
}) => {
  const [senderId, setSenderId] = useState<number>(accounts[0]?.id || 1);
  const [receiverId, setReceiverId] = useState<number>(accounts[1]?.id || 2);
  const [amount, setAmount] = useState<string>('500');
  const [description, setDescription] = useState<string>(
    'Real-time cross-shard 2PC transfer'
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<number>(-1);
  const [stepStatus, setStepStatus] = useState<'idle' | 'running' | 'success' | 'failed'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastTx, setLastTx] = useState<TransactionResponse | null>(null);

  const sender = accounts.find((a) => a.id === Number(senderId));
  const receiver = accounts.find((a) => a.id === Number(receiverId));
  const isCrossShard = sender && receiver && sender.shard !== receiver.shard;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (senderId === receiverId) {
      setErrorMsg('Sender and receiver must be different accounts.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setLastTx(null);
    setStepStatus('running');

    // Simulate step progression visually
    setActiveStep(0); // Lock step
    setTimeout(() => setActiveStep(1), 300); // Prepare step
    setTimeout(() => setActiveStep(2), 600); // Commit step

    try {
      const res = await executeTransfer({
        senderAccountId: Number(senderId),
        receiverAccountId: Number(receiverId),
        amount: Number(amount),
        currency: 'PKR',
        description,
      });

      setActiveStep(2);
      setStepStatus('success');
      setLastTx(res);
      onTransferComplete();
    } catch (err: any) {
      setStepStatus('failed');
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Transaction failed during 2PC coordination';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Form column */}
      <div className="lg:col-span-6 bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white">Execute 2PC Money Transfer</h2>
          </div>
          {isCrossShard ? (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
              Cross-Shard 2PC Active
            </span>
          ) : (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Same-Shard Local ACID
            </span>
          )}
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <XCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sender */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Debit Account (Sender)
            </label>
            <select
              value={senderId}
              onChange={(e) => setSenderId(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  #{a.id} • {a.user?.fullName} ({a.shard}) — [
                  {Number(a.balance).toFixed(0)} PKR]
                </option>
              ))}
            </select>
          </div>

          {/* Receiver */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Credit Account (Recipient)
            </label>
            <select
              value={receiverId}
              onChange={(e) => setReceiverId(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  #{a.id} • {a.user?.fullName} ({a.shard}) — [
                  {Number(a.balance).toFixed(0)} PKR]
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Amount (PKR)
            </label>
            <input
              type="number"
              step="0.01"
              min="1"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 500.00"
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <div className="flex gap-2 mt-2">
              {[100, 500, 1000, 2500].map((v) => (
                <button
                  type="button"
                  key={v}
                  onClick={() => setAmount(String(v))}
                  className="px-2.5 py-1 text-[11px] rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-750 font-medium transition"
                >
                  +{v}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Memo / Note
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Executing Distributed 2PC...</span>
              </>
            ) : (
              <>
                <span>Commit Transfer Across Shards</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Protocol Visualizer column */}
      <div className="lg:col-span-6 bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-bold text-white">2PC Consensus Lifecycle</h2>
            </div>
            <span className="text-xs text-slate-400">Strict Serializability</span>
          </div>

          <div className="space-y-3">
            {/* Step 0 */}
            <div
              className={`p-3.5 rounded-lg border text-xs transition-all duration-300 ${
                activeStep === 0 && stepStatus === 'running'
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                  : activeStep >= 0 && stepStatus === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-slate-800/40 border-slate-800 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between font-bold mb-1">
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-700/80 flex items-center justify-center text-[10px]">
                    0
                  </span>
                  Deterministic Pessimistic Locking
                </span>
                {stepStatus === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              </div>
              <p className="text-[11px] text-slate-400 ml-7">
                Acquires exclusive write locks on sender (#{senderId}) and receiver (#{receiverId}) in ascending ID order to prevent distributed deadlocks.
              </p>
            </div>

            {/* Step 1 */}
            <div
              className={`p-3.5 rounded-lg border text-xs transition-all duration-300 ${
                activeStep === 1 && stepStatus === 'running'
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                  : activeStep >= 1 && stepStatus === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-slate-800/40 border-slate-800 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between font-bold mb-1">
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-700/80 flex items-center justify-center text-[10px]">
                    1
                  </span>
                  Phase 1: Prepare & Vote Protocol
                </span>
                {stepStatus === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              </div>
              <p className="text-[11px] text-slate-400 ml-7">
                Validates participant accounts active state, matching currency (PKR), and ensures sender balance is sufficient before casting <code className="text-emerald-400">VOTE_COMMIT</code>.
              </p>
            </div>

            {/* Step 2 */}
            <div
              className={`p-3.5 rounded-lg border text-xs transition-all duration-300 ${
                activeStep === 2 && stepStatus === 'running'
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                  : activeStep >= 2 && stepStatus === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-slate-800/40 border-slate-800 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between font-bold mb-1">
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-700/80 flex items-center justify-center text-[10px]">
                    2
                  </span>
                  Phase 2: Atomic Commit & Double-Entry Ledger
                </span>
                {stepStatus === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              </div>
              <p className="text-[11px] text-slate-400 ml-7">
                Both legs commit atomically across shards. Double-entry bookkeeping creates balanced DEBIT and CREDIT rows for an unalterable audit trail.
              </p>
            </div>
          </div>
        </div>

        {/* Last TX summary */}
        {lastTx && (
          <div className="mt-4 p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold">Last Transfer Committed</span>
              <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded font-mono font-semibold">
                {lastTx.status}
              </span>
            </div>
            <div className="font-mono text-[11px] text-slate-300 truncate">
              TX-ID: {lastTx.transactionId}
            </div>
            <div className="text-[11px] text-slate-400">
              Amount: <strong className="text-white">{lastTx.amount} PKR</strong> • Ledger Entries: 2 (Balanced)
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
