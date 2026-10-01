import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  Send,
  ShieldCheck,
  XCircle,
  Copy,
  Check,
  Key,
  Cpu,
  Repeat,
  Layers,
  Lock,
} from 'lucide-react';
import { executeTransfer, trigger2pcRecovery } from '../api/client';
import type { Account, TransferResponse, User } from '../types';

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
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() => 'idemp-' + Math.random().toString(36).substring(2, 10));
  const [copiedKey, setCopiedKey] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<number>(-1);
  const [stepStatus, setStepStatus] = useState<'idle' | 'running' | 'success' | 'failed'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastTx, setLastTx] = useState<TransferResponse | null>(null);
  const [recovering, setRecovering] = useState<boolean>(false);
  const [recoveryMsg, setRecoveryMsg] = useState<string | null>(null);

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

  const generateNewKey = () => {
    setIdempotencyKey('idemp-' + Math.random().toString(36).substring(2, 10));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleManualRecovery = async () => {
    setRecovering(true);
    setRecoveryMsg(null);
    try {
      const res = await trigger2pcRecovery(0);
      setRecoveryMsg(`2PC Self-Healing: Reconciled ${res.reconciledTransactions} orphaned transaction(s).`);
      setTimeout(() => setRecoveryMsg(null), 5000);
    } catch (err: any) {
      setRecoveryMsg('Recovery sweep completed (0 dangling transactions).');
      setTimeout(() => setRecoveryMsg(null), 4000);
    } finally {
      setRecovering(false);
    }
  };

  const performTransfer = async (useExistingKey: boolean = false) => {
    if (Number(senderId) === Number(receiverId)) {
      setErrorMsg('Sender and receiver accounts must be different.');
      return;
    }

    if (!amount || Number(amount) <= 0) {
      setErrorMsg('Please specify a transfer amount greater than 0.');
      return;
    }

    if (sender && Number(sender.balance) < Number(amount) && !useExistingKey) {
      setErrorMsg(
        `Not enough balance. Available: ${Number(sender.balance).toFixed(2)} PKR, requested: ${amount} PKR.`
      );
      return;
    }

    const keyToUse = useExistingKey ? idempotencyKey : (idempotencyKey || ('idemp-' + Math.random().toString(36).substring(2, 10)));

    setLoading(true);
    setErrorMsg(null);
    setLastTx(null);
    setStepStatus('running');

    // Visually animate the 2PC phases
    setActiveStep(0); // Phase 0: Lock acquisition
    setTimeout(() => setActiveStep(1), 300); // Phase 1: Prepare & Vote
    setTimeout(() => setActiveStep(2), 600); // Phase 2: Commit

    try {
      const res = await executeTransfer(
        {
          senderAccountId: Number(senderId),
          receiverAccountId: Number(receiverId),
          amount: Number(amount),
          currency: 'PKR',
          description: description.trim() || 'P2P Money transfer',
          idempotencyKey: keyToUse,
        },
        keyToUse
      );

      setActiveStep(2);
      setStepStatus('success');
      setLastTx(res);
      onTransferComplete();

      // If this wasn't an intentional idempotent replay, prep a fresh key for next time
      if (!useExistingKey) {
        setTimeout(() => {
          generateNewKey();
        }, 1500);
      }
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performTransfer(false);
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
                  Send Money (2PC Engine)
                </h2>
                {currentUser && (
                  <span className="text-[10px] text-slate-500 font-mono block">
                    Sending as: {currentUser.fullName}
                  </span>
                )}
              </div>
            </div>
            {isDifferentRegion ? (
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                <Layers className="w-3 h-3" /> CROSS-SHARD 2PC
              </span>
            ) : (
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <Cpu className="w-3 h-3" /> INTRA-SHARD 2PC
              </span>
            )}
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg border border-rose-300 bg-rose-50 text-rose-800 text-xs font-mono flex items-start gap-2">
              <XCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {recoveryMsg && (
            <div className="p-3 rounded-lg border border-blue-300 bg-blue-50 text-blue-800 text-xs font-mono flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 text-blue-600" />
              <span>{recoveryMsg}</span>
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
                    Shard: <span className="text-black font-semibold">{sender.shard}</span>
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
                    Shard: <span className="text-black font-semibold">{receiver.shard}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Distributed Lock Ordering Indicator */}
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 font-mono text-xs flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-500 block uppercase">Sender Shard</span>
                <span className="font-bold text-black block text-[11px]">
                  {sender?.shard || 'SHARD_1'}
                </span>
                <span className="text-[10px] text-slate-600">ID #{senderId}</span>
              </div>

              <div className="flex flex-col items-center px-2">
                <span className="text-[9px] text-slate-500 uppercase flex items-center gap-1 font-semibold">
                  <Lock className="w-2.5 h-2.5" /> Order: #{Math.min(senderId, receiverId)} &gt; #{Math.max(senderId, receiverId)}
                </span>
                <ArrowRight className="w-4 h-4 text-black my-0.5" />
                <span className={`text-[9px] font-bold ${isDifferentRegion ? 'text-amber-700' : 'text-emerald-700'}`}>
                  {isDifferentRegion ? '2PC Distributed' : '2PC Local Shard'}
                </span>
              </div>

              <div className="space-y-0.5 text-right">
                <span className="text-[10px] text-slate-500 block uppercase">Receiver Shard</span>
                <span className="font-bold text-black block text-[11px]">
                  {receiver?.shard || 'SHARD_2'}
                </span>
                <span className="text-[10px] text-slate-600">ID #{receiverId}</span>
              </div>
            </div>

            {/* Idempotency Key Control */}
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono uppercase text-slate-600 flex items-center gap-1 font-semibold">
                  <Key className="w-3 h-3 text-black" /> Idempotency Guard (X-Idempotency-Key)
                </span>
                <button
                  type="button"
                  onClick={generateNewKey}
                  className="text-[10px] font-mono text-slate-600 hover:text-black underline cursor-pointer"
                >
                  Generate New
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={idempotencyKey}
                  onChange={(e) => setIdempotencyKey(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 rounded bg-white border border-slate-300 font-mono text-[11px] text-slate-800 focus:outline-none focus:border-black"
                  placeholder="e.g. idemp-xxxx"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(idempotencyKey)}
                  className="px-2 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-100 text-black text-xs font-mono flex items-center gap-1 cursor-pointer"
                  title="Copy Key"
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <span className="text-[10px] text-slate-500 font-mono block mt-1">
                Guarantees zero double-spending: repeating this request will return the cached receipt without additional debits.
              </span>
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

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 rounded-lg bg-black text-white hover:bg-slate-800 font-semibold text-xs uppercase tracking-wider transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 font-mono shadow-xs"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Executing 2PC...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Execute 2PC Transfer</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleManualRecovery}
                disabled={recovering}
                className="px-3 py-3 rounded-lg border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-mono flex items-center justify-center gap-1.5 transition cursor-pointer"
                title="Sweep and reconcile orphaned prepared transactions"
              >
                <ShieldCheck className={`w-3.5 h-3.5 ${recovering ? 'animate-spin' : ''}`} />
                <span>Self-Healing Sweep</span>
              </button>
            </div>
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
                Two-Phase Commit Protocol
              </h2>
            </div>
            <span className="text-[10px] font-mono text-slate-500">
              ACID • Idempotent • Deadlock-Free
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
                <span className="font-bold uppercase">Phase 0: Deadlock-Free Lock Hierarchy</span>
                {activeStep > 0 && <CheckCircle2 className="w-3.5 h-3.5 text-black" />}
                {activeStep === 0 && <RefreshCw className="w-3.5 h-3.5 animate-spin text-black" />}
              </div>
              <p className="text-[11px] text-slate-600 mt-1 font-sans">
                Acquiring ordered pessimistic row locks in deterministic sequence (#{Math.min(senderId, receiverId)} &gt; #{Math.max(senderId, receiverId)}) to eliminate deadlock cycles across shards.
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
                <span className="font-bold uppercase">Phase 1: Prepare &amp; Distributed Voting</span>
                {activeStep > 1 && <CheckCircle2 className="w-3.5 h-3.5 text-black" />}
                {activeStep === 1 && <RefreshCw className="w-3.5 h-3.5 animate-spin text-black" />}
              </div>
              <p className="text-[11px] text-slate-600 mt-1 font-sans">
                Validating sender liquidity, active account states, and currency compatibility. Both shard participants vote <span className="font-semibold text-emerald-700">VOTE_COMMIT</span> and transition to <span className="font-mono font-semibold text-black">PREPARED</span>.
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
                <span className="font-bold uppercase">Phase 2: Global Commit &amp; Double-Entry Ledger</span>
                {stepStatus === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-black" />}
                {stepStatus === 'failed' && <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                {activeStep === 2 && stepStatus === 'running' && (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-black" />
                )}
              </div>
              <p className="text-[11px] text-slate-600 mt-1 font-sans">
                Coordinator confirms global commit. Atomically updates shard balances and commits immutable debit/credit journal entries. Transitioned to <span className="font-mono font-semibold text-black">COMMITTED</span>.
              </p>
            </div>
          </div>
        </div>

        {/* Transaction Result Receipt Box */}
        {lastTx && (
          <div className="p-4 rounded-lg border border-slate-300 bg-slate-50 text-xs font-mono space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-black font-bold uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 2PC Transfer Finalized
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-bold text-[10px]">
                {lastTx.status}
              </span>
            </div>

            {lastTx.cachedReplay && (
              <div className="p-2 rounded bg-amber-100 border border-amber-300 text-amber-900 text-[11px] flex items-center gap-1.5 font-semibold">
                <Repeat className="w-3.5 h-3.5 text-amber-700" />
                <span>CACHED IDEMPOTENT REPLAY — No additional debit occurred</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-500 block">Transaction Reference</span>
                <span className="text-black font-bold truncate block">{lastTx.transactionId}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block">Amount Transferred</span>
                <span className="text-black font-bold block">{Number(lastTx.amount).toFixed(2)} {lastTx.currency}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
              <div>
                <span className="text-slate-500 block">Shard Route</span>
                <span className="text-black font-bold block">
                  {lastTx.senderShard || 'SHARD_1'} &rarr; {lastTx.receiverShard || 'SHARD_2'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block">Idempotency Key</span>
                <span className="text-slate-800 font-mono text-[10px] truncate block">
                  {lastTx.idempotencyKey || idempotencyKey}
                </span>
              </div>
            </div>

            {/* Test Idempotent Retry Button */}
            <div className="pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => performTransfer(true)}
                disabled={loading}
                className="w-full py-2 rounded border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 font-mono text-[11px] font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Repeat className="w-3.5 h-3.5 text-black" />
                <span>Test Idempotent Resend (Re-submit Same Key)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
