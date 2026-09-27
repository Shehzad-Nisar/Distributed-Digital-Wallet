import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  Send,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { executeTransfer } from '../api/client';
import type { Account, TransactionResponse, User } from '../types';

interface TransferConsoleProps {
  accounts: Account[];
  currentUser: User | null;
  activeAccountId: number | null;
  onTransferComplete: () => void;
}

export const TransferConsole: React.FC<TransferConsoleProps> = ({
  accounts,
  currentUser,
  activeAccountId,
  onTransferComplete,
}) => {
  const [senderId, setSenderId] = useState<number>(
    activeAccountId || accounts[0]?.id || 1
  );
  const [receiverId, setReceiverId] = useState<number>(
    accounts[1]?.id || (accounts[0]?.id === 1 ? 2 : 1)
  );
  const [amount, setAmount] = useState<string>('500');
  const [description, setDescription] = useState<string>('Money transfer');
  const [loading, setLoading] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<number>(-1);
  const [stepStatus, setStepStatus] = useState<'idle' | 'running' | 'success' | 'failed'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastTx, setLastTx] = useState<TransactionResponse | null>(null);

  useEffect(() => {
    if (activeAccountId && activeAccountId !== senderId) {
      setSenderId(activeAccountId);
      if (receiverId === activeAccountId) {
        const other = accounts.find((a) => a.id !== activeAccountId);
        if (other) setReceiverId(other.id);
      }
    }
  }, [activeAccountId, accounts]);

  const sender = accounts.find((a) => a.id === Number(senderId));
  const receiver = accounts.find((a) => a.id === Number(receiverId));
  const isDifferentRegion = sender && receiver && sender.shard !== receiver.shard;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(senderId) === Number(receiverId)) {
      setErrorMsg('Sender and receiver accounts must be different.');
      return;
    }

    if (!amount || Number(amount) <= 0) {
      setErrorMsg('Please specify a transfer amount greater than 0.');
      return;
    }

    if (sender && Number(sender.balance) < Number(amount)) {
      setErrorMsg(
        `Not enough balance. Available: ${Number(sender.balance).toFixed(2)} PKR, requested: ${amount} PKR.`
      );
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setLastTx(null);
    setStepStatus('running');

    setActiveStep(0);
    setTimeout(() => setActiveStep(1), 350);
    setTimeout(() => setActiveStep(2), 700);

    try {
      const res = await executeTransfer({
        senderAccountId: Number(senderId),
        receiverAccountId: Number(receiverId),
        amount: Number(amount),
        currency: 'PKR',
        description: description.trim() || 'Money transfer',
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
        'Transfer could not be completed. Please try again.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans bg-white text-black">
      {/* Form Column */}
      <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4 text-black" />
              <div>
                <h2 className="text-sm font-bold text-black uppercase tracking-wider font-mono">
                  Send Money
                </h2>
                {currentUser && (
                  <span className="text-[10px] text-slate-500 font-mono block">
                    Sending as: {currentUser.fullName}
                  </span>
                )}
              </div>
            </div>
            {isDifferentRegion ? (
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-black border border-slate-300">
                INSTANT TRANSFER
              </span>
            ) : (
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                SAME REGION
              </span>
            )}
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg border border-rose-300 bg-rose-50 text-rose-800 text-xs font-mono flex items-start gap-2">
              <XCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Sender and Receiver selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-mono uppercase text-slate-600 block mb-1">
                  From Account
                </label>
                <select
                  value={senderId}
                  onChange={(e) => setSenderId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-black text-xs font-mono focus:outline-none focus:border-black transition"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.accountNumber} ({acc.user?.fullName?.split(' ')[0] || `Acc #${acc.id}`}) — {Number(acc.balance).toFixed(0)} PKR
                    </option>
                  ))}
                </select>
                {sender && (
                  <div className="mt-1 text-[10px] font-mono text-slate-500">
                    Region: <span className="text-black font-semibold">{sender.shard?.replace('SHARD_', 'HUB-').replace('_NORTH','').replace('_CENTRAL','').replace('_SOUTH','').replace('_ENTERPRISE','')}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase text-slate-600 block mb-1">
                  To Account
                </label>
                <select
                  value={receiverId}
                  onChange={(e) => setReceiverId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-black text-xs font-mono focus:outline-none focus:border-black transition"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.accountNumber} ({acc.user?.fullName?.split(' ')[0] || `Acc #${acc.id}`}) — {Number(acc.balance).toFixed(0)} PKR
                    </option>
                  ))}
                </select>
                {receiver && (
                  <div className="mt-1 text-[10px] font-mono text-slate-500">
                    Region: <span className="text-black font-semibold">{receiver.shard?.replace('SHARD_', 'HUB-').replace('_NORTH','').replace('_CENTRAL','').replace('_SOUTH','').replace('_ENTERPRISE','')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Transfer Route Visualizer */}
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 font-mono text-xs flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-500 block uppercase">From</span>
                <span className="font-bold text-black block">
                  {sender?.accountNumber || `Acc #${senderId}`}
                </span>
                <span className="text-[10px] text-slate-600">{sender?.user?.fullName}</span>
              </div>

              <div className="flex flex-col items-center px-2">
                <span className="text-[9px] text-slate-500 uppercase">Instant</span>
                <ArrowRight className="w-4 h-4 text-black my-0.5" />
                <span className="text-[9px] text-emerald-600 font-bold">
                  {isDifferentRegion ? 'Cross-Region' : 'Same Region'}
                </span>
              </div>

              <div className="space-y-0.5 text-right">
                <span className="text-[10px] text-slate-500 block uppercase">To</span>
                <span className="font-bold text-black block">
                  {receiver?.accountNumber || `Acc #${receiverId}`}
                </span>
                <span className="text-[10px] text-slate-600">{receiver?.user?.fullName}</span>
              </div>
            </div>

            {/* Amount input & preset quick buttons */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-mono uppercase text-slate-600">
                  Amount (PKR)
                </label>
                {sender && (
                  <span className="text-[11px] font-mono text-slate-500">
                    Available: {Number(sender.balance).toFixed(2)} PKR
                  </span>
                )}
              </div>
              <input
                type="number"
                min="1"
                step="50"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="500"
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-black text-sm font-mono focus:outline-none focus:border-black transition"
              />

              <div className="flex items-center gap-2 mt-2 font-mono text-[11px]">
                {['100', '500', '1000', '2500'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmount(preset)}
                    className="px-2.5 py-1 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 text-black transition cursor-pointer"
                  >
                    +{preset}
                  </button>
                ))}
                {sender && (
                  <button
                    type="button"
                    onClick={() => setAmount(String(Math.floor(Number(sender.balance))))}
                    className="px-2.5 py-1 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 text-black transition cursor-pointer"
                  >
                    Max
                  </button>
                )}
              </div>
            </div>

            {/* Note / memo */}
            <div>
              <label className="text-[11px] font-mono uppercase text-slate-600 block mb-1">
                Note (optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's this transfer for?"
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-black text-xs placeholder:text-slate-400 focus:outline-none focus:border-black transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-black text-white hover:bg-slate-800 font-semibold text-xs uppercase tracking-wider transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 font-mono shadow-xs"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Money Now</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Transfer Status Column */}
      <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-black" />
              <h2 className="text-sm font-bold text-black uppercase tracking-wider font-mono">
                Transfer Status
              </h2>
            </div>
            <span className="text-[10px] font-mono text-slate-500">
              Secured & Guaranteed
            </span>
          </div>

          {/* Stepper Display */}
          <div className="space-y-3 font-mono">
            {/* Step 0 */}
            <div
              className={`p-3.5 rounded-lg border transition ${
                activeStep >= 0
                  ? 'border-black bg-slate-50 text-black'
                  : 'border-slate-200 bg-white text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold uppercase">Step 1 — Verifying Accounts</span>
                {activeStep > 0 && <CheckCircle2 className="w-3.5 h-3.5 text-black" />}
                {activeStep === 0 && <RefreshCw className="w-3.5 h-3.5 animate-spin text-black" />}
              </div>
              <p className="text-[11px] text-slate-600 mt-1 font-sans">
                Confirming both accounts are active and the sender has sufficient balance for this transfer.
              </p>
            </div>

            {/* Step 1 */}
            <div
              className={`p-3.5 rounded-lg border transition ${
                activeStep >= 1
                  ? 'border-black bg-slate-50 text-black'
                  : 'border-slate-200 bg-white text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold uppercase">Step 2 — Authorizing Transfer</span>
                {activeStep > 1 && <CheckCircle2 className="w-3.5 h-3.5 text-black" />}
                {activeStep === 1 && <RefreshCw className="w-3.5 h-3.5 animate-spin text-black" />}
              </div>
              <p className="text-[11px] text-slate-600 mt-1 font-sans">
                Verifying currency compatibility and authorizing the full transfer amount across all systems.
              </p>
            </div>

            {/* Step 2 */}
            <div
              className={`p-3.5 rounded-lg border transition ${
                activeStep >= 2
                  ? stepStatus === 'failed'
                    ? 'border-rose-500 bg-rose-50 text-rose-800'
                    : 'border-black bg-slate-50 text-black'
                  : 'border-slate-200 bg-white text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold uppercase">Step 3 — Completing Transfer</span>
                {stepStatus === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-black" />}
                {stepStatus === 'failed' && <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                {activeStep === 2 && stepStatus === 'running' && (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-black" />
                )}
              </div>
              <p className="text-[11px] text-slate-600 mt-1 font-sans">
                Updating balances for both accounts and recording the transfer permanently in your history.
              </p>
            </div>
          </div>
        </div>

        {/* Transaction Result Receipt Box */}
        {lastTx && (
          <div className="p-4 rounded-lg border border-slate-300 bg-slate-50 text-xs font-mono space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-black font-bold uppercase tracking-wider">
                Transfer Complete ✓
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-bold text-[10px]">
                {lastTx.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-500 block">Reference ID</span>
                <span className="text-black font-bold truncate block">{lastTx.transactionId}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block">Amount Sent</span>
                <span className="text-black font-bold block">{Number(lastTx.amount).toFixed(2)} {lastTx.currency}</span>
              </div>
            </div>

            {lastTx.ledgerEntries && lastTx.ledgerEntries.length > 0 && (
              <div className="pt-2 border-t border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                  Transaction Breakdown
                </span>
                {lastTx.ledgerEntries.map((le) => (
                  <div key={le.id} className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-700">
                      {le.type === 'DEBIT' ? '💸 Sent from' : '💰 Received by'} Account #{le.accountId}
                    </span>
                    <span className="text-black font-bold">
                      {le.type === 'DEBIT' ? '-' : '+'}{Number(le.amount).toFixed(2)} PKR → Balance: {Number(le.balanceAfter).toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
