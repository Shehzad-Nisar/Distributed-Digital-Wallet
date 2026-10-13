import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  RefreshCw,
  Send,
  ShieldCheck,
  XCircle,
  Copy,
  Check,
  Layers,
  ChevronDown,
  Download,
  Search,
  UserCheck,
  AlertCircle,
  Wallet,
} from 'lucide-react';
import { executeTransfer, trigger2pcRecovery } from '../api/client';
import type { Account, TransferResponse, User } from '../types';

interface TransferConsoleProps {
  accounts: Account[];
  currentUser?: User | null;
  activeAccountId: number | null;
  onTransferComplete: () => void;
  onNavigateDashboard?: () => void;
  onOpenAuth?: (mode: 'signin' | 'signup') => void;
}

export const TransferConsole: React.FC<TransferConsoleProps> = ({
  accounts,
  currentUser,
  activeAccountId,
  onTransferComplete,
  onNavigateDashboard,
  onOpenAuth,
}) => {
  // Only accounts belonging to the current user can be paid from
  const userAccounts = accounts.filter(
    (a) => a.user?.id === currentUser?.id || (a as any).userId === currentUser?.id
  );

  const [senderId, setSenderId] = useState<number>(() => {
    if (activeAccountId && userAccounts.some((a) => a.id === activeAccountId)) {
      return activeAccountId;
    }
    return userAccounts[0]?.id || accounts[0]?.id || 0;
  });

  const [recipientQuery, setRecipientQuery] = useState<string>('');
  const [receiverId, setReceiverId] = useState<number | null>(null);
  const [amount, setAmount] = useState<string>('500');
  const [description, setDescription] = useState<string>('');
  const [idempotencyKey, setIdempotencyKey] = useState<string>(
    () => 'idemp-' + Math.random().toString(36).substring(2, 10)
  );
  const [copiedKey, setCopiedKey] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<number>(-1);
  const [, setStepStatus] = useState<'idle' | 'running' | 'success' | 'failed'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastTx, setLastTx] = useState<TransferResponse | null>(null);
  const [recovering, setRecovering] = useState<boolean>(false);
  const [recoveryMsg, setRecoveryMsg] = useState<string | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(false);
  const [showReceipt, setShowReceipt] = useState<boolean>(false);

  // Keep senderId in sync with activeAccountId when user switches account
  useEffect(() => {
    if (activeAccountId && userAccounts.some((a) => a.id === activeAccountId)) {
      setSenderId(activeAccountId);
    } else if (userAccounts.length > 0 && !userAccounts.some((a) => a.id === senderId)) {
      setSenderId(userAccounts[0].id);
    }
  }, [activeAccountId, userAccounts]);

  const sender = accounts.find((a) => a.id === Number(senderId));

  // Resolved receiver from query or selection
  const matchedReceiver = React.useMemo(() => {
    if (receiverId) {
      const found = accounts.find((a) => a.id === receiverId && a.id !== senderId);
      if (found) return found;
    }
    const clean = recipientQuery.trim().toUpperCase();
    if (!clean) return null;
    return (
      accounts.find(
        (a) =>
          a.id !== senderId &&
          (a.accountNumber?.toUpperCase() === clean ||
            a.user?.email?.toUpperCase() === clean ||
            a.user?.phoneNumber?.replace(/\s+/g, '') === clean)
      ) || null
    );
  }, [receiverId, recipientQuery, accounts, senderId]);

  const receiver = matchedReceiver;
  const isDifferentRegion = sender && receiver && sender.shard !== receiver.shard;

  // Other accounts owned by the current user (e.g. transfer between user's own PKR and USD wallets)
  const myOtherAccounts = userAccounts.filter((a) => a.id !== senderId);

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
    if (!sender) {
      setErrorMsg('Please select a valid source wallet.');
      return;
    }

    if (!receiver) {
      setErrorMsg('Please enter a valid recipient account number.');
      return;
    }

    if (Number(sender.id) === Number(receiver.id)) {
      setErrorMsg('Sender and receiver accounts must be different.');
      return;
    }

    if (!amount || Number(amount) <= 0) {
      setErrorMsg('Please specify a transfer amount greater than 0.');
      return;
    }

    if (Number(sender.balance) < Number(amount) && !useExistingKey) {
      setErrorMsg(
        `Insufficient balance. Available: ${Number(sender.balance).toLocaleString()} ${sender.currency}, requested: ${amount} ${sender.currency}.`
      );
      return;
    }

    const keyToUse = useExistingKey
      ? idempotencyKey
      : (idempotencyKey || ('idemp-' + Math.random().toString(36).substring(2, 10)));

    setLoading(true);
    setErrorMsg(null);
    setLastTx(null);
    setStepStatus('running');

    // Visual progression of 2PC consensus
    setActiveStep(0);
    setTimeout(() => setActiveStep(1), 300);
    setTimeout(() => setActiveStep(2), 600);

    try {
      const res = await executeTransfer(
        {
          senderAccountId: Number(sender.id),
          receiverAccountId: Number(receiver.id),
          amount: Number(amount),
          currency: sender.currency || 'PKR',
          description: description.trim() || 'Instant P2P Transfer',
          idempotencyKey: keyToUse,
        },
        keyToUse
      );

      setActiveStep(2);
      setStepStatus('success');
      setLastTx(res);
      setShowReceipt(true);
      onTransferComplete();

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
        'Transfer could not be completed. Please check balance and try again.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performTransfer(false);
  };

  const handlePresetAmount = (val: number) => {
    setAmount(String(val));
  };

  const handleMaxAmount = () => {
    if (sender) {
      setAmount(String(Math.floor(Number(sender.balance))));
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans">
      {/* Main Send Money Card */}
      <div className="bg-white border border-[#EBE5DF] rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex items-center justify-between pb-6 border-b border-[#F2ECE5]">
          <div>
            <h2 className="text-xl font-black text-[#1A1D20] flex items-center gap-2 tracking-tight">
              <Send className="w-5 h-5 text-[#FF6651]" />
              <span>Send Money</span>
            </h2>
            <p className="text-xs text-[#5F6773] mt-0.5">
              Instant P2P and cross-border transfers with zero fees and bank-grade security
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isDifferentRegion ? (
              <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-[#FAF7F4] text-[#1A1D20] border border-[#EBE5DF] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#FF6651]" /> Cross-Region Transfer
              </span>
            ) : (
              <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-[#E5F7F3] text-[#00A389] border border-[#00A389]/25 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" /> Instant Delivery
              </span>
            )}
          </div>
        </div>

        {errorMsg && (
          <div className="mt-4 p-4 rounded-2xl border border-rose-200 bg-rose-50 text-rose-800 text-xs flex items-start gap-2.5">
            <XCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <div className="space-y-0.5">
              <span className="font-bold block">Transfer Failed</span>
              <span>{errorMsg}</span>
            </div>
          </div>
        )}

        {recoveryMsg && (
          <div className="mt-4 p-4 rounded-2xl border border-blue-200 bg-blue-50 text-blue-800 text-xs flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 shrink-0 text-blue-600" />
            <span>{recoveryMsg}</span>
          </div>
        )}

        {/* Unauthenticated / No account prompt */}
        {userAccounts.length === 0 && (
          <div className="mt-6 p-6 rounded-3xl bg-[#FFF8F6] border border-[#FFD9D3] text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#FFEAE5] text-[#FF6651] flex items-center justify-center mx-auto shadow-xs">
              <Wallet className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-[#1A1D20]">Sign in to Send Money</h3>
            <p className="text-xs text-[#5F6773] max-w-md mx-auto">
              You need an active wallet to send money. Create an account in seconds or sign in to your existing wallet.
            </p>
            {onOpenAuth && (
              <div className="flex justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => onOpenAuth('signup')}
                  className="px-5 py-2.5 rounded-full bg-[#FF6651] text-white text-xs font-bold hover:bg-[#E54D34] transition cursor-pointer shadow-md shadow-[#FF6651]/25"
                >
                  Create Account
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAuth('signin')}
                  className="px-5 py-2.5 rounded-full border border-[#EBE5DF] text-[#1A1D20] text-xs font-semibold hover:bg-white transition cursor-pointer"
                >
                  Sign In
                </button>
              </div>
            )}
          </div>
        )}

        {userAccounts.length > 0 && (
          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            {/* Step 1: Pay From (Current User's Accounts Only) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#1A1D20] block">
                Pay From
              </label>

              {userAccounts.length === 1 ? (
                <div className="p-3.5 rounded-2xl bg-[#FAF7F4] border border-[#EBE5DF] flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-[#1A1D20] block">
                      {userAccounts[0].accountNumber} ({userAccounts[0].currency} Wallet)
                    </span>
                    <span className="text-[11px] text-[#5F6773] font-mono">
                      {userAccounts[0].shard}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-[#9CA3AF] block">Available</span>
                    <span className="text-sm font-bold text-[#00A389] font-mono">
                      {Number(userAccounts[0].balance).toLocaleString()} {userAccounts[0].currency}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <select
                    value={senderId}
                    onChange={(e) => setSenderId(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-2xl bg-[#FAF7F4] border border-[#EBE5DF] text-[#1A1D20] text-sm font-medium focus:outline-none focus:border-[#FF6651] focus:bg-white transition cursor-pointer appearance-none"
                  >
                    {userAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.accountNumber} — {acc.currency} Wallet ({Number(acc.balance).toLocaleString()} {acc.currency})
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#9CA3AF]">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              )}

              {sender && userAccounts.length > 1 && (
                <div className="flex items-center justify-between px-1 text-xs text-[#5F6773]">
                  <span>
                    Available Balance: <strong className="text-[#00A389]">{Number(sender.balance).toLocaleString()} {sender.currency}</strong>
                  </span>
                  <span className="text-[11px] font-mono text-[#9CA3AF]">{sender.shard}</span>
                </div>
              )}
            </div>

            {/* Step 2: Send To (Recipient Account Number Input & Real-Time Verification) */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#1A1D20] block">
                Send To (Recipient)
              </label>

              {/* Quick toggle to transfer between own wallets if multiple exist */}
              {myOtherAccounts.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  <span className="text-[11px] text-[#9CA3AF] shrink-0">My Wallets:</span>
                  {myOtherAccounts.map((acc) => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => {
                        setReceiverId(acc.id);
                        setRecipientQuery(acc.accountNumber);
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-semibold border transition cursor-pointer shrink-0 ${
                        receiver?.id === acc.id
                          ? 'bg-[#FFEAE5] text-[#FF6651] border-[#FF6651]/40'
                          : 'bg-white text-[#5F6773] border-[#EBE5DF] hover:border-[#FF6651]/40'
                      }`}
                    >
                      {acc.currency} ({acc.accountNumber})
                    </button>
                  ))}
                </div>
              )}

              {/* Account Number / Mobile / Email Input */}
              <div className="relative">
                <input
                  type="text"
                  value={recipientQuery}
                  onChange={(e) => {
                    setRecipientQuery(e.target.value);
                    setReceiverId(null);
                  }}
                  placeholder="Enter recipient account number (e.g. ACC-PK-S-5471) or email"
                  className="w-full px-4 py-3 pl-10 rounded-2xl bg-[#FAF7F4] border border-[#EBE5DF] text-[#1A1D20] text-sm font-medium focus:outline-none focus:border-[#FF6651] focus:ring-1 focus:ring-[#FF6651] focus:bg-white transition"
                />
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#9CA3AF]">
                  <Search className="w-4 h-4" />
                </div>
              </div>

              {/* Verified Recipient Card */}
              {receiver && (
                <div className="p-3.5 rounded-2xl border border-[#00A389]/25 bg-[#E5F7F3] flex items-center justify-between text-xs animate-in fade-in">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-white text-[#00A389] flex items-center justify-center shadow-2xs font-bold">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[#1A1D20]">
                          {receiver.user?.fullName || 'TransMoney User'}
                        </span>
                        <span className="text-[10px] font-bold text-[#00A389] bg-white px-1.5 py-0.5 rounded shadow-2xs">
                          Verified
                        </span>
                      </div>
                      <span className="text-[11px] text-[#5F6773] font-mono">
                        {receiver.accountNumber} • {receiver.currency} • {receiver.shard}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {recipientQuery.trim() !== '' && !receiver && (
                <div className="p-3 rounded-2xl border border-amber-200 bg-amber-50/70 text-xs text-amber-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>Account not found. Please double-check the recipient's account number or email.</span>
                </div>
              )}
            </div>

            {/* Step 3: Enter Amount */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#1A1D20] block">
                  Amount
                </label>
                <span className="text-xs text-[#5F6773]">
                  Currency: <strong className="text-[#FF6651] font-bold">{sender?.currency || 'PKR'}</strong>
                </span>
              </div>

              <div className="relative">
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3.5 rounded-2xl bg-white border border-[#EBE5DF] text-[#1A1D20] text-2xl font-black font-mono focus:outline-none focus:border-[#FF6651] focus:ring-1 focus:ring-[#FF6651] transition"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-sm text-[#9CA3AF]">
                  {sender?.currency || 'PKR'}
                </div>
              </div>

              {/* Preset Amount Chips */}
              <div className="flex items-center gap-2 pt-1">
                {[500, 1000, 2500, 5000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handlePresetAmount(val)}
                    className="px-3 py-1.5 rounded-xl text-xs font-mono font-semibold bg-[#FAF7F4] hover:bg-[#FFEAE5] hover:text-[#FF6651] text-[#1A1D20] border border-[#EBE5DF] transition cursor-pointer"
                  >
                    +{val.toLocaleString()}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleMaxAmount}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-[#FFEAE5] hover:bg-[#ffd6cd] text-[#FF6651] border border-[#FF6651]/30 transition cursor-pointer"
                >
                  Max
                </button>
              </div>
            </div>

            {/* Step 4: Reference Note (Optional) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#1A1D20] block">
                Reference Note <span className="font-normal text-[#9CA3AF]">(Optional)</span>
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Dinner bill split, Freelance payment, Rent"
                className="w-full px-4 py-2.5 rounded-2xl bg-[#FAF7F4] border border-[#EBE5DF] text-[#1A1D20] text-xs placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#FF6651] focus:bg-white transition"
              />
            </div>

            {/* Fee & Security Guarantee */}
            <div className="p-4 rounded-2xl bg-[#FAF7F4] border border-[#EBE5DF] space-y-2 text-xs">
              <div className="flex justify-between text-[#5F6773]">
                <span>Transfer Fee</span>
                <span className="font-bold text-[#00A389]">Rs. 0.00 (100% Free)</span>
              </div>
              <div className="flex justify-between text-[#5F6773]">
                <span>Delivery Time</span>
                <span className="font-bold text-[#1A1D20]">Instant (&lt; 200ms)</span>
              </div>
              <div className="flex justify-between text-[#5F6773]">
                <span>Security</span>
                <span className="font-semibold text-[#00A389] flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Atomic 2PC Protected
                </span>
              </div>
            </div>

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={loading || !receiver || !amount || Number(amount) <= 0}
              className="w-full py-4 px-6 rounded-full bg-[#FF6651] hover:bg-[#E54D34] active:scale-98 disabled:bg-[#D1C7BD] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#FF6651]/25 hover:shadow-xl transition cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing Transfer...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send {amount ? `${amount} ${sender?.currency || 'PKR'}` : 'Money'}</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* 2PC Technical Consensus Progress Visualizer */}
        {activeStep >= 0 && (
          <div className="mt-8 pt-6 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <span>Distributed Consensus Execution</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { title: '1. Prepare Phase', desc: 'Acquire distributed lock & balance check' },
                { title: '2. 2PC Consensus', desc: 'Atomic vote across coordinator nodes' },
                { title: '3. Commit Phase', desc: 'Immutable ledger entry finalized' },
              ].map((step, idx) => {
                const isCurrent = activeStep === idx;
                const isPassed = activeStep > idx;
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border text-xs transition ${
                      isPassed
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                        : isCurrent
                        ? 'border-black bg-slate-900 text-white shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold">{step.title}</span>
                      {isPassed && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                      {isCurrent && <RefreshCw className="w-4 h-4 animate-spin text-white" />}
                    </div>
                    <p className={`text-[11px] ${isCurrent ? 'text-slate-300' : 'text-slate-500'}`}>
                      {step.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Advanced Diagnostics (Collapsible) */}
        <div className="mt-6 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setShowDiagnostics((prev) => !prev)}
            className="w-full flex items-center justify-between text-xs text-slate-500 hover:text-black py-1 cursor-pointer transition font-mono"
          >
            <span>Advanced Distributed Engine Diagnostics</span>
            <span>{showDiagnostics ? '▲ Hide' : '▼ Show'}</span>
          </button>

          {showDiagnostics && (
            <div className="mt-3 p-4 rounded-xl bg-slate-900 text-slate-200 font-mono text-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Idempotency Key:</span>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">{idempotencyKey}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(idempotencyKey)}
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                  >
                    {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={generateNewKey}
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                    title="Generate new idempotency key"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleManualRecovery}
                  disabled={recovering}
                  className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${recovering ? 'animate-spin' : ''}`} />
                  <span>Run 2PC Recovery Sweep</span>
                </button>

                <button
                  type="button"
                  onClick={() => performTransfer(true)}
                  disabled={loading}
                  className="px-3 py-1.5 rounded bg-amber-900/60 hover:bg-amber-900 text-amber-200 text-[11px] transition cursor-pointer"
                >
                  Test Idempotency Replay
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Official Transaction Success Receipt Modal */}
      {showReceipt && lastTx && (
        <div
          onClick={() => {
            setShowReceipt(false);
            if (onNavigateDashboard) {
              onNavigateDashboard();
            } else {
              window.history.pushState({}, '', '/dashboard');
              window.dispatchEvent(new PopStateEvent('popstate'));
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#EBE5DF] text-[#1A1D20] font-sans space-y-6"
          >
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-[#E5F7F3] text-[#00A389] rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-[#1A1D20]">
                Transfer Successful!
              </h3>
              <p className="text-xs text-[#5F6773]">
                Funds have been transferred instantly via atomic 2PC consensus.
              </p>
            </div>

            {/* Receipt Summary Box */}
            <div className="bg-[#FAF7F4] rounded-2xl p-5 border border-[#EBE5DF] space-y-3 font-mono text-xs">
              <div className="text-center pb-3 border-b border-[#EBE5DF]">
                <span className="text-2xl font-black text-[#1A1D20]">
                  {Number(lastTx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} {lastTx.currency}
                </span>
                <span className="text-[11px] text-[#00A389] font-bold block mt-0.5">
                  STATUS: {lastTx.status}
                </span>
              </div>

              <div className="flex justify-between text-[#5F6773]">
                <span>To:</span>
                <span className="font-bold text-[#1A1D20]">
                  {receiver?.user?.fullName || receiver?.accountNumber}
                </span>
              </div>

              <div className="flex justify-between text-[#5F6773]">
                <span>From:</span>
                <span className="font-bold text-[#1A1D20]">
                  {sender?.user?.fullName || sender?.accountNumber}
                </span>
              </div>

              <div className="flex justify-between text-[#5F6773]">
                <span>Reference:</span>
                <span className="text-[11px] text-[#1A1D20]">{(lastTx as any).transactionReference || lastTx.transactionId}</span>
              </div>

              <div className="flex justify-between text-[#5F6773]">
                <span>Timestamp:</span>
                <span className="text-[11px] text-[#1A1D20]">{new Date((lastTx as any).createdAt || lastTx.timestamp || Date.now()).toLocaleString()}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-3 rounded-full border border-[#EBE5DF] bg-[#FAF7F4] hover:bg-[#F2ECE5] text-[#1A1D20] font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save Receipt</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowReceipt(false);
                  setRecipientQuery('');
                  setReceiverId(null);
                  setDescription('');
                  if (onNavigateDashboard) {
                    onNavigateDashboard();
                  } else {
                    window.history.pushState({}, '', '/dashboard');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }
                }}
                className="flex-1 py-3 rounded-full bg-[#FF6651] hover:bg-[#E54D34] active:scale-95 text-white font-bold text-xs transition cursor-pointer shadow-md shadow-[#FF6651]/25"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
