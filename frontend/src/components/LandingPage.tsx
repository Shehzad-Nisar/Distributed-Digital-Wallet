import React, { useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  Globe,
  Layers,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
  Zap,
} from 'lucide-react';
import fintechClusterImg from '../assets/fintech_cluster.jpg';
import logoImg from '../assets/logo.png';
import type { Account, SystemHealth, User } from '../types';

interface LandingPageProps {
  health: SystemHealth | null;
  accounts: Account[];
  users: User[];
  currentUser: User | null;
  onEnterConsole: () => void;
  onOpenAuth: (mode: 'signin' | 'signup') => void;
  onNavigateTab?: (tab: 'console' | 'transfer' | 'ledger' | 'architecture') => void;
  onSelectAccount?: (id: number) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  health,
  accounts,
  users,
  currentUser,
  onEnterConsole,
  onOpenAuth,
  onNavigateTab,
  onSelectAccount,
}) => {
  const isHealthy = health?.database?.includes('Connected');
  const totalLiquidity = accounts.reduce((acc, a) => acc + Number(a.balance || 0), 0);

  const navigate = (tab: 'console' | 'transfer' | 'ledger' | 'architecture') => {
    if (onNavigateTab) {
      onNavigateTab(tab);
    } else {
      onEnterConsole();
    }
  };

  // Interactive Transfer Calculator State (Wise style for real users)
  const [sourceAccId, setSourceAccId] = useState<number>(() => accounts[0]?.id || 1);
  const [destAccId, setDestAccId] = useState<number>(() => accounts[1]?.id || (accounts[0]?.id ? accounts[0].id : 2));
  const [transferAmount, setTransferAmount] = useState<string>('5000');
  const [transferStatus, setTransferStatus] = useState<'idle' | 'processing' | 'success'>('idle');

  // Interactive 4-Step Guide
  const [activeStepIndex, setActiveStepIndex] = useState<number>(1);

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const sourceAcc = accounts.find((a) => a.id === sourceAccId) || accounts[0] || {
    id: 1,
    accountNumber: 'ACC-1001-NTH',
    balance: 50000,
    currency: 'PKR',
    status: 'ACTIVE',
    user: { fullName: 'Alice Johnson', username: 'alice' },
  };

  const destAcc = accounts.find((a) => a.id === destAccId) || accounts[1] || {
    id: 2,
    accountNumber: 'ACC-2002-CEN',
    balance: 75000,
    currency: 'PKR',
    status: 'ACTIVE',
    user: { fullName: 'Bob Smith', username: 'bob' },
  };

  const handleSimulateTransfer = () => {
    if (transferStatus !== 'idle') return;
    setTransferStatus('processing');
    setTimeout(() => {
      setTransferStatus('success');
      setTimeout(() => {
        setTransferStatus('idle');
      }, 4000);
    }, 1200);
  };

  const userSteps = [
    {
      step: 1,
      title: 'Sign Up in 60 Seconds',
      summary: 'Quick & Effortless',
      desc: 'Create your digital wallet account instantly with zero paperwork. Choose your preferred currency and start managing money immediately.',
      actionText: 'Register Free Account',
    },
    {
      step: 2,
      title: 'Select Sender & Recipient',
      summary: 'Pick Any Contact',
      desc: 'Choose which account to send from and select your recipient by account number or name across our entire regional network.',
      actionText: 'Explore Contacts',
    },
    {
      step: 3,
      title: 'Review Amount & Free Rate',
      summary: 'Zero Hidden Fees',
      desc: 'Enter the amount you wish to transfer. What you see is exactly what they get — zero transfer charges, zero surprises.',
      actionText: 'Check Rates',
    },
    {
      step: 4,
      title: 'Instant Delivery',
      summary: 'Under 1 Second',
      desc: 'Funds arrive in your recipient’s balance in milliseconds with immediate digital receipts and verified account protection.',
      actionText: 'Send Money Now',
    },
  ];

  return (
    <div className="space-y-24 pb-20 font-sans text-slate-900 bg-white">
      {/* =====================================================================
          1. HERO SECTION (Wise + Revolut Style for Real Users)
          ===================================================================== */}
      <section className="relative pt-6 sm:pt-14 pb-12 overflow-hidden bg-grid-tech border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Consumer Value Proposition */}
            <div className="lg:col-span-7 space-y-6 text-left">
              {/* Product Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-slate-200 bg-white shadow-2xs font-mono text-xs">
                <span className={`w-2.5 h-2.5 rounded-full ${isHealthy ? 'bg-emerald-500 animate-pulse' : 'bg-emerald-500'}`} />
                <span className="font-semibold text-slate-800 tracking-tight">FAST &amp; SECURE</span>
                <span className="text-slate-300">|</span>
                <span className="text-emerald-700 font-bold">ZERO HIDDEN FEES</span>
                <span className="text-slate-300">|</span>
                <span className="text-slate-600">INSTANT TRANSFERS</span>
              </div>

              {/* Main Headline */}
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-950 leading-[1.08] uppercase">
                  Move Money Anywhere. <br />
                  <span className="bg-gradient-to-r from-slate-900 via-slate-700 to-slate-500 bg-clip-text text-transparent">
                    Instantly.
                  </span>
                </h1>
                <p className="text-base sm:text-lg text-slate-600 font-normal max-w-2xl leading-relaxed font-sans">
                  Send payments across personal and business accounts in seconds. Enjoy instant transfers,
                  zero hidden charges, and bank-grade protection on every transaction.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => onOpenAuth('signup')}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-950 text-white font-semibold text-sm hover:bg-slate-800 transition active:scale-[0.98] cursor-pointer shadow-md group"
                >
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Open Free Account</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>

                <button
                  onClick={() => navigate('transfer')}
                  className="flex items-center gap-2 px-5 py-3.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-900 text-sm font-semibold transition active:scale-[0.98] cursor-pointer shadow-2xs"
                >
                  <Send className="w-4 h-4 text-slate-700" />
                  <span>Send Money Now</span>
                </button>

                <button
                  onClick={onEnterConsole}
                  className="flex items-center gap-2 px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-mono transition cursor-pointer"
                >
                  <Layers className="w-4 h-4" />
                  <span>Explore App</span>
                </button>

                {currentUser ? (
                  <button
                    onClick={onEnterConsole}
                    className="flex items-center gap-1.5 px-3.5 py-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-mono transition cursor-pointer"
                    title={`Signed in as ${currentUser.fullName}`}
                  >
                    <Wallet className="w-3.5 h-3.5 text-slate-700" />
                    <span>{currentUser.fullName}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => onOpenAuth('signin')}
                    className="flex items-center gap-1.5 px-3.5 py-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-mono transition cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5 text-slate-700" />
                    <span>Sign In</span>
                  </button>
                )}
              </div>

              {/* Consumer Trust Badges */}
              <div className="pt-4 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-600 font-mono">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span>Under 1 Second Delivery</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-slate-800" />
                  <span>100% Protected Balance</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-slate-800" />
                  <span>Zero Transfer Fees</span>
                </div>
              </div>
            </div>

            {/* Right Column: Wise-Style Instant Money Transfer Widget */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xl glow-card space-y-5 relative">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-mono text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Instant Money Transfer
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-[10px] font-mono text-emerald-800 font-bold border border-emerald-200">
                    LIVE CALCULATOR
                  </span>
                </div>

                {/* Sender Account */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-500 font-mono uppercase">
                    You Send From
                  </label>
                  <div className="relative">
                    <select
                      value={sourceAccId}
                      onChange={(e) => setSourceAccId(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-sans font-medium focus:outline-none focus:ring-2 focus:ring-slate-950 shadow-2xs"
                    >
                      {accounts.length > 0 ? (
                        accounts.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.user?.fullName || 'User'} ({a.accountNumber}) — {Number(a.balance).toLocaleString()} PKR
                          </option>
                        ))
                      ) : (
                        <>
                          <option value={1}>Alice Johnson (ACC-1001-NTH) — 50,000 PKR</option>
                          <option value={2}>Bob Smith (ACC-2002-CEN) — 75,000 PKR</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                {/* Recipient Account */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-500 font-mono uppercase">
                    Recipient Receives At
                  </label>
                  <div className="relative">
                    <select
                      value={destAccId}
                      onChange={(e) => setDestAccId(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-sans font-medium focus:outline-none focus:ring-2 focus:ring-slate-950 shadow-2xs"
                    >
                      {accounts.length > 0 ? (
                        accounts.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.user?.fullName || 'User'} ({a.accountNumber}) — {Number(a.balance).toLocaleString()} PKR
                          </option>
                        ))
                      ) : (
                        <>
                          <option value={2}>Bob Smith (ACC-2002-CEN) — 75,000 PKR</option>
                          <option value={3}>Charlie Brown (ACC-3003-STH) — 30,000 PKR</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                {/* Amount with Presets */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-500 font-mono uppercase">
                      Amount to Send
                    </label>
                    <span className="text-[11px] text-emerald-700 font-mono font-bold">Transfer Fee: 0.00 PKR (Free)</span>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      placeholder="e.g. 5000"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-mono text-base font-bold focus:outline-none focus:ring-2 focus:ring-slate-950 shadow-2xs"
                    />
                    <span className="absolute right-3.5 font-mono text-xs font-bold text-slate-400">PKR</span>
                  </div>
                  <div className="flex items-center gap-1.5 pt-1">
                    {['1000', '5000', '15000', '50000'].map((preset) => (
                      <button
                        key={preset}
                        onClick={() => setTransferAmount(preset)}
                        type="button"
                        className={`px-2.5 py-1 rounded text-[11px] font-mono border cursor-pointer transition ${
                          transferAmount === preset
                            ? 'bg-slate-900 text-white border-slate-900 font-bold'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        +{Number(preset).toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Transparent Guarantee Summary */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 font-sans text-xs space-y-2">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Transfer Speed:</span>
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5" /> Instant (&lt; 1 sec)
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Transfer Charges:</span>
                    <span className="text-slate-900 font-semibold">0.00 PKR (Completely Free)</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Recipient Gets Exactly:</span>
                    <span className="text-slate-950 font-bold text-sm">
                      {Number(transferAmount || 0).toLocaleString()} PKR
                    </span>
                  </div>
                </div>

                {/* Transfer Animation */}
                {transferStatus !== 'idle' && (
                  <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/70 font-mono text-xs space-y-2 animate-fadeIn">
                    <div className="flex items-center justify-between font-bold text-emerald-950">
                      <span className="flex items-center gap-1.5">
                        {transferStatus === 'processing' ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                            Sending to {destAcc.user?.fullName || 'recipient'}...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Transfer Delivered Successfully!
                          </>
                        )}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-900 font-bold">
                        {transferStatus === 'success' ? 'COMPLETED' : 'SENDING'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleSimulateTransfer}
                    disabled={transferStatus !== 'idle'}
                    className="flex-1 py-3 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold text-xs font-mono uppercase tracking-wider transition active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5 text-emerald-400" />
                    <span>
                      {transferStatus === 'idle' ? 'Send Money Instantly' : 'Delivering Payment...'}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      if (onSelectAccount) {
                        onSelectAccount(sourceAcc.id);
                      }
                      navigate('transfer');
                    }}
                    title="Open Full Console"
                    className="py-3 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold text-xs font-mono transition cursor-pointer flex items-center gap-1"
                  >
                    <span>Full App</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =====================================================================
          2. LIVE NETWORK STATS & TRUST STRIP
          ===================================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="p-4 sm:p-6 rounded-2xl border border-slate-200 bg-slate-50/70 font-sans shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest font-mono">
                  TransMoney Live Network Health
                </h3>
                <p className="text-[11px] text-slate-500">
                  Real-time network availability, instant payment routing, and customer fund protection.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 shadow-2xs">
                Network Status: <strong className="text-emerald-700">100% Operational</strong>
              </span>
              <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 shadow-2xs">
                Average Speed: <strong className="text-slate-950">&lt; 1 Second</strong>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-mono">
                Regional Hubs
              </span>
              <span className="text-lg font-black text-slate-950 mt-1 block">4 Active Regions</span>
              <span className="text-[11px] text-slate-500">North, Central, South, Enterprise</span>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-mono">
                Transfer Success Rate
              </span>
              <span className="text-lg font-black text-emerald-700 mt-1 block">100% Guaranteed</span>
              <span className="text-[11px] text-slate-500">Zero Lost or Failed Wires</span>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-mono">
                Hidden Fees
              </span>
              <span className="text-lg font-black text-slate-950 mt-1 block">0.00 PKR (Free)</span>
              <span className="text-[11px] text-slate-500">Free Peer-to-Peer Transfers</span>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-mono">
                Total Customer Funds
              </span>
              <span className="text-lg font-black text-slate-950 mt-1 block">
                {totalLiquidity.toLocaleString('en-US', { minimumFractionDigits: 0 })} PKR
              </span>
              <span className="text-[11px] text-slate-500">
                {accounts.length} Accounts • {users.length} Active Users
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          3. VISUAL PRODUCT SHOWCASE (3D Fintech Cards Banner)
          ===================================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="rounded-3xl border border-slate-200 overflow-hidden bg-white shadow-xl glow-card">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
            <div className="lg:col-span-5 p-8 sm:p-12 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-mono text-slate-700">
                <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                <span>ALL-IN-ONE DIGITAL WALLET</span>
              </div>
              <h2 className="text-3xl font-black text-slate-950 uppercase tracking-tight">
                One Wallet. <br />
                Instant Access.
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed font-sans">
                Manage your money with complete peace of mind. Check your real-time balance, transfer
                funds to friends and family in seconds, and track every transaction with instant digital receipts.
              </p>
              <div className="pt-2 flex items-center gap-3">
                <button
                  onClick={onEnterConsole}
                  className="px-5 py-2.5 rounded-xl bg-slate-950 text-white font-semibold text-xs font-mono uppercase tracking-wider hover:bg-slate-800 transition cursor-pointer"
                >
                  View Accounts
                </button>
                <button
                  onClick={() => navigate('ledger')}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-800 font-semibold text-xs font-mono hover:bg-slate-50 transition cursor-pointer"
                >
                  Transaction Activity
                </button>
              </div>
            </div>

            <div className="lg:col-span-7 bg-slate-50 border-t lg:border-t-0 lg:border-l border-slate-200 p-4 sm:p-8 flex items-center justify-center">
              <img
                src={fintechClusterImg}
                alt="TransMoney Digital Wallet Ecosystem"
                className="w-full h-auto rounded-2xl shadow-lg border border-slate-200 object-cover max-h-[380px]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          4. CUSTOMER BENEFITS BENTO GRID (Revolut / PayPal Style)
          ===================================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-xs font-mono uppercase tracking-widest text-slate-500 font-bold">
            Why You’ll Love It
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-950 uppercase tracking-tight">
            Built for Everyday Financial Freedom
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed font-sans">
            Everything you need to send, receive, and grow your money with zero hassle.
          </p>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Instant Peer-to-Peer Transfers (Spans 2 cols) */}
          <div className="md:col-span-2 p-7 rounded-2xl border border-slate-200 bg-white glow-card-hover space-y-6 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                  <Send className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-slate-700">
                  INSTANT PAYMENTS
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-950 uppercase tracking-tight">
                Send Money in Seconds
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed font-sans">
                Transfer money directly to any friend, family member, or merchant in real-time.
                Say goodbye to waiting days for inter-bank clearing — your payment lands in their wallet instantly.
              </p>
            </div>

            {/* Visual Receipt Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 font-sans text-xs space-y-3">
              <div className="flex items-center justify-between text-[11px] text-slate-500 pb-2 border-b border-slate-200">
                <span className="font-semibold text-slate-700">Recent Payment Proof</span>
                <span className="text-emerald-700 font-bold">Delivered Instantly</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-slate-200 shadow-2xs">
                <div>
                  <span className="font-bold text-slate-900 block text-sm">Bob Smith</span>
                  <span className="text-[11px] text-slate-500">ACC-2002-CEN • Today at 10:45 AM</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-emerald-600 text-sm block">+5,000 PKR</span>
                  <span className="text-[10px] text-slate-400">Zero Fee</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Bank-Grade Protection */}
          <div className="p-7 rounded-2xl border border-slate-200 bg-white glow-card-hover space-y-6 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-slate-700">
                  PROTECTION
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-950 uppercase tracking-tight">
                Bank-Grade Security
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed font-sans">
                Your money and personal details are protected by advanced multi-layer encryption
                and automated fraud defense around the clock.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
              <div className="flex items-center gap-2 text-slate-800 font-semibold">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>End-to-End Encryption</span>
              </div>
              <div className="flex items-center gap-2 text-slate-800 font-semibold">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Zero Unauthorized Transfers</span>
              </div>
              <div className="flex items-center gap-2 text-slate-800 font-semibold">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Guaranteed Account Protection</span>
              </div>
            </div>
          </div>

          {/* Card 3: Real-Time Balance Tracking */}
          <div className="p-7 rounded-2xl border border-slate-200 bg-white glow-card-hover space-y-6 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-slate-700">
                  TRANSPARENCY
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-950 uppercase tracking-tight">
                Real-Time Balance Updates
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed font-sans">
                Never wonder where your money went. Every deposit, payment, and transfer is updated
                to the exact second with complete digital statements.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1.5">
              <div className="text-[11px] text-slate-500 font-mono">Instant Notifications:</div>
              <div className="p-2 rounded bg-white border border-slate-200 font-sans text-[11px]">
                <strong className="text-slate-900">Payment Confirmed:</strong> You received 5,000 PKR from Alice.
              </div>
              <span className="text-[10px] text-emerald-700 font-bold block pt-1">
                ✓ 100% Accurate Balance Guarantee
              </span>
            </div>
          </div>

          {/* Card 4: High-Speed Regional Network (Spans 2 cols) */}
          <div className="md:col-span-2 p-7 rounded-2xl border border-slate-200 bg-white glow-card-hover space-y-6 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                  <Globe className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-slate-700">
                  NETWORK RELIABILITY
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-950 uppercase tracking-tight">
                Always Online Across All Regions
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed font-sans">
                Powered by a high-availability multi-hub network, TransMoney guarantees 99.99% uptime.
                Even during peak traffic hours, payments process smoothly without delays or server crashes.
              </p>
            </div>

            {/* 4 Regional Hubs Preview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block mb-1" />
                <span className="font-bold text-slate-900 block text-xs">North Region</span>
                <span className="text-[10px] text-slate-500">Online • Active</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block mb-1" />
                <span className="font-bold text-slate-900 block text-xs">Central Region</span>
                <span className="text-[10px] text-slate-500">Online • Active</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block mb-1" />
                <span className="font-bold text-slate-900 block text-xs">South Region</span>
                <span className="text-[10px] text-slate-500">Online • Active</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block mb-1" />
                <span className="font-bold text-slate-900 block text-xs">Enterprise Hub</span>
                <span className="text-[10px] text-slate-500">Online • Active</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* =====================================================================
          5. HOW IT WORKS (Simple 4-Step User Journey)
          ===================================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="rounded-3xl border border-slate-200 bg-slate-50/60 p-8 sm:p-12 space-y-8">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-mono uppercase tracking-widest text-slate-500 font-bold">
              Simple &amp; Seamless
            </span>
            <h2 className="text-3xl font-black text-slate-950 uppercase tracking-tight">
              How TransMoney Works in 4 Steps
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-sans">
              Sending money has never been this simple. Here is how easy it is to move funds.
            </p>
          </div>

          {/* Stepper Tabs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-sans text-xs">
            {userSteps.map((step) => (
              <button
                key={step.step}
                onClick={() => setActiveStepIndex(step.step)}
                className={`p-4 rounded-xl text-left border transition cursor-pointer ${
                  activeStepIndex === step.step
                    ? 'bg-white border-slate-900 shadow-md ring-2 ring-slate-900/10'
                    : 'bg-white/60 border-slate-200 hover:bg-white text-slate-600'
                }`}
              >
                <span className="text-[10px] font-mono font-bold text-slate-400 block mb-1">
                  STEP 0{step.step}
                </span>
                <span className="font-bold text-slate-900 block text-sm">
                  {step.title}
                </span>
              </button>
            ))}
          </div>

          {/* Step Detail Drawer */}
          {(() => {
            const current = userSteps.find((s) => s.step === activeStepIndex)!;
            return (
              <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-xs font-mono font-bold text-emerald-700 uppercase tracking-wider block">
                      {current.summary}
                    </span>
                    <h3 className="text-xl font-black text-slate-950 tracking-tight">
                      {current.title}
                    </h3>
                  </div>
                  <button
                    onClick={() => {
                      if (current.step === 1) onOpenAuth('signup');
                      else navigate('transfer');
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-950 text-white font-semibold text-xs font-mono hover:bg-slate-800 transition cursor-pointer self-start sm:self-auto"
                  >
                    {current.actionText} →
                  </button>
                </div>

                <p className="text-sm text-slate-700 leading-relaxed font-sans">
                  {current.desc}
                </p>
              </div>
            );
          })()}
        </div>
      </section>

      {/* =====================================================================
          6. COMPARISON TABLE: TRADITIONAL VS TRANSMONEY
          ===================================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-xs font-mono uppercase tracking-widest text-slate-500 font-bold">
            Transparent Comparison
          </span>
          <h2 className="text-3xl font-black text-slate-950 uppercase tracking-tight">
            Why Choose TransMoney?
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed font-sans">
            See how our modern digital wallet compares to traditional banking and other payment apps.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs font-sans text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase font-mono text-[11px]">
                <th className="p-4">Feature</th>
                <th className="p-4 text-slate-600">Traditional Banks</th>
                <th className="p-4 text-slate-600">Other E-Wallets</th>
                <th className="p-4 bg-slate-950 text-white font-bold">TransMoney Digital Wallet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="p-4 font-bold text-slate-900">Transfer Speed</td>
                <td className="p-4 text-slate-500">1 to 3 Business Days</td>
                <td className="p-4 text-slate-600">5 to 30 Minutes</td>
                <td className="p-4 bg-slate-50/50 font-bold text-emerald-700">
                  Instant (&lt; 1 Second)
                </td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-slate-900">Transfer Fees</td>
                <td className="p-4 text-rose-600">High Wire Charges ($$$)</td>
                <td className="p-4 text-amber-600">1.5% to 3.0% Hidden Cuts</td>
                <td className="p-4 bg-slate-50/50 font-bold text-emerald-700">
                  0.00 PKR (Completely Free)
                </td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-slate-900">Network Availability</td>
                <td className="p-4 text-slate-500">Weekend &amp; Holiday Outages</td>
                <td className="p-4 text-amber-600">Frequent Maintenance Lags</td>
                <td className="p-4 bg-slate-50/50 font-bold text-emerald-700">
                  99.99% Always Online (24/7/365)
                </td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-slate-900">Account Setup</td>
                <td className="p-4 text-rose-600">Branch visit &amp; days of review</td>
                <td className="p-4 text-slate-500">Complex identity forms</td>
                <td className="p-4 bg-slate-50/50 font-bold text-emerald-700">
                  Instant Digital Activation in 60s
                </td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-slate-900">Security Guarantee</td>
                <td className="p-4 text-slate-500">Traditional Insurance</td>
                <td className="p-4 text-slate-600">Basic App Protection</td>
                <td className="p-4 bg-slate-50/50 font-bold text-emerald-700">
                  Bank-Grade Encryption &amp; Fraud Defense
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* =====================================================================
          7. PROJECT LEADERSHIP & ENGINEERING TEAM (Prestigious Context)
          ===================================================================== */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="rounded-3xl border border-slate-900 bg-slate-950 text-white p-8 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-6 relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
              <div>
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest block">
                  Project Leadership &amp; Engineering Team
                </span>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight mt-1">
                  Distributed Digital Wallet Platform
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  Evaluated By: <strong className="text-white">Sir Umair</strong> • Course: Distributed Systems (2026)
                </p>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-emerald-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Verified System Architecture</span>
              </div>
            </div>

            {/* Core Engineers */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400 uppercase block">Systems Engineer</span>
                <span className="text-base font-bold text-white block">Shehzad Nisar</span>
                <span className="text-xs text-emerald-400 font-bold block">B22110006147</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400 uppercase block">Systems Engineer</span>
                <span className="text-base font-bold text-white block">Muhammad Ashraf</span>
                <span className="text-xs text-emerald-400 font-bold block">B22110006090</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400 uppercase block">Systems Engineer</span>
                <span className="text-base font-bold text-white block">Daniyal Ahmed</span>
                <span className="text-xs text-emerald-400 font-bold block">B21110006024</span>
              </div>
            </div>

            <div className="pt-2 text-xs text-slate-400 font-mono flex flex-wrap items-center justify-between gap-2 border-t border-slate-800">
              <span>TransMoney Digital Wallet Core Platform</span>
              <span>Open Source Repository: Shehzad-Nisar / Distributed-Digital-Wallet</span>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          8. EVERYDAY CUSTOMER FAQS (Accordion)
          ===================================================================== */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="text-center space-y-2">
          <span className="text-xs font-mono uppercase tracking-widest text-slate-500 font-bold">
            Got Questions?
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-950 uppercase tracking-tight">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3 font-sans">
          {[
            {
              q: 'How fast do my money transfers arrive?',
              a: 'Transfers sent on TransMoney arrive in less than a second. Because our platform uses direct real-time network routing, the recipient receives funds into their balance immediately.',
            },
            {
              q: 'Are there any fees to send money to other accounts?',
              a: 'No! All peer-to-peer transfers within the TransMoney network are 100% free with zero hidden commissions or surcharges.',
            },
            {
              q: 'How safe is my money in TransMoney?',
              a: 'Your funds are safeguarded by enterprise-grade encryption and automated balance verification. Money can never be lost or duplicated, and you receive an immediate digital confirmation for every payment.',
            },
            {
              q: 'Can I open multiple accounts under one login?',
              a: 'Yes! You can open separate accounts for personal spending, business transactions, or savings goals in just a few clicks from your dashboard.',
            },
          ].map((item, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-xl border border-slate-200 bg-white overflow-hidden transition shadow-2xs"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full px-5 py-4 text-left font-bold text-slate-900 text-sm flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition"
                >
                  <span className="font-mono text-xs text-slate-500 font-normal mr-2">0{idx + 1} //</span>
                  <span className="flex-1">{item.q}</span>
                  <ChevronRight
                    className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-90 text-slate-900' : ''}`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs text-slate-600 leading-relaxed font-sans border-t border-slate-100 bg-slate-50/50">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* =====================================================================
          9. FINAL CALL-TO-ACTION BANNER
          ===================================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="rounded-3xl bg-slate-950 text-white p-8 sm:p-12 text-center space-y-6 relative overflow-hidden shadow-2xl">
          <div className="max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
              Ready to Get Started?
            </span>
            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white">
              Experience the Future of Digital Money Movement
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 font-sans leading-relaxed">
              Join thousands of users moving money faster, safer, and completely fee-free.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onOpenAuth('signup')}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white text-slate-950 font-bold text-sm hover:bg-slate-100 transition active:scale-[0.98] cursor-pointer shadow-lg"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>Open Free Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => navigate('transfer')}
              className="flex items-center gap-2 px-5 py-3.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition active:scale-[0.98] cursor-pointer"
            >
              <Send className="w-4 h-4 text-emerald-400" />
              <span>Send Money Now</span>
            </button>

            <button
              onClick={onEnterConsole}
              className="flex items-center gap-2 px-5 py-3.5 rounded-xl border border-slate-800 text-slate-300 hover:text-white text-sm font-mono transition cursor-pointer"
            >
              <span>Explore Dashboard</span>
            </button>
          </div>
        </div>
      </section>

      {/* =====================================================================
          10. USER-FACING PRODUCT FOOTER
          ===================================================================== */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 border-t border-slate-200 text-xs font-mono text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <img src={logoImg} alt="TransMoney" className="w-6 h-6 rounded object-cover" />
          <span className="font-bold text-slate-900 uppercase">TransMoney Digital Wallet</span>
          <span>© 2026 TransMoney Inc. All rights reserved.</span>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          <button
            onClick={() => navigate('transfer')}
            className="hover:text-slate-900 transition cursor-pointer"
          >
            Send Money
          </button>
          <button
            onClick={() => navigate('ledger')}
            className="hover:text-slate-900 transition cursor-pointer"
          >
            Activity
          </button>
          <button
            onClick={onEnterConsole}
            className="hover:text-slate-900 transition cursor-pointer"
          >
            Accounts
          </button>
          <button
            onClick={() => onOpenAuth('signup')}
            className="hover:text-slate-900 transition cursor-pointer font-bold text-slate-900"
          >
            Get Started
          </button>
        </div>
      </footer>
    </div>
  );
};
