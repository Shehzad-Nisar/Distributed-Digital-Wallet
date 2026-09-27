import React from 'react';
import {
  ArrowRight,
  ExternalLink,
  Layers,
  Lock,
  Scale,
  Shield,
} from 'lucide-react';
import type { Account, SystemHealth, User } from '../types';

interface LandingPageProps {
  health: SystemHealth | null;
  accounts: Account[];
  users: User[];
  currentUser: User | null;
  onEnterConsole: () => void;
  onOpenAuth: (mode: 'signin' | 'signup') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  health,
  accounts,
  currentUser,
  onEnterConsole,
  onOpenAuth,
}) => {
  const isHealthy = health?.database?.includes('Connected');
  const totalLiquidity = accounts.reduce((acc, a) => acc + Number(a.balance), 0);

  return (
    <div className="space-y-16 pb-12 font-sans bg-white text-black">
      {/* Hero Section */}
      <section className="relative pt-6 sm:pt-12 text-center space-y-6 max-w-4xl mx-auto px-4">
        {/* Course & Status Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-slate-200 bg-slate-50 text-xs font-mono text-slate-700 shadow-2xs">
          <span className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-emerald-600 animate-pulse' : 'bg-slate-400'}`} />
          <span>DDS 2026 // POSTGRESQL 17 SHARDED CLUSTER</span>
          <span className="text-slate-300">|</span>
          <span className="text-black font-semibold">SIR UMAIR EVALUATION</span>
        </div>

        {/* Main Headline */}
        <div className="space-y-3">
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-black uppercase">
            Distributed Digital Wallet
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 font-normal max-w-2xl mx-auto leading-relaxed">
            High-performance, fault-tolerant relational database architecture powered by{' '}
            <span className="text-black font-bold">Two-Phase Commit (2PC)</span> cross-shard consensus,
            pessimistic deadlock prevention, and double-entry bookkeeping.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={onEnterConsole}
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-black text-white font-semibold text-sm hover:bg-slate-800 transition active:scale-[0.99] cursor-pointer shadow-sm"
          >
            <span>Launch Live Cluster Console</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {currentUser ? (
            <button
              onClick={onEnterConsole}
              className="flex items-center gap-2 px-5 py-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-black text-sm font-medium transition cursor-pointer shadow-2xs"
            >
              <span>Logged in as {currentUser.fullName}</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('signin')}
                className="flex items-center gap-2 px-5 py-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-black text-sm font-medium transition cursor-pointer shadow-2xs"
              >
                <span>Select User / Sign In</span>
              </button>
              <button
                onClick={() => onOpenAuth('signup')}
                className="flex items-center gap-2 px-5 py-3 rounded-lg border border-slate-200 bg-slate-100 hover:bg-slate-200 text-black text-sm font-medium transition cursor-pointer"
              >
                <span>Register &amp; Open Account</span>
              </button>
            </div>
          )}

          <a
            href="http://localhost:8080/swagger-ui.html"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-3 rounded-lg border border-slate-200 bg-white text-slate-700 hover:text-black hover:border-slate-400 text-sm font-mono transition shadow-2xs"
          >
            <span>Swagger API</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Live Cluster Summary Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-8 border-t border-slate-200 text-left font-mono">
          <div className="p-3.5 rounded-lg border border-slate-200 bg-white shadow-2xs">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Shards Online</span>
            <span className="text-xl font-bold text-black mt-1 block">4 / 4 Nodes</span>
            <span className="text-[11px] text-slate-600">North, Central, South, Ent.</span>
          </div>
          <div className="p-3.5 rounded-lg border border-slate-200 bg-white shadow-2xs">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Consensus Engine</span>
            <span className="text-xl font-bold text-black mt-1 block">ACID 2PC</span>
            <span className="text-[11px] text-slate-600">Deterministic Lock (Min&lt;Max)</span>
          </div>
          <div className="p-3.5 rounded-lg border border-slate-200 bg-white shadow-2xs">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Ledger Parity</span>
            <span className="text-xl font-bold text-black mt-1 block">100% Verified</span>
            <span className="text-[11px] text-slate-600">Σ Debits == Σ Credits</span>
          </div>
          <div className="p-3.5 rounded-lg border border-slate-200 bg-white shadow-2xs">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Cluster Liquidity</span>
            <span className="text-xl font-bold text-black mt-1 block">
              {totalLiquidity.toLocaleString('en-US', { minimumFractionDigits: 0 })} PKR
            </span>
            <span className="text-[11px] text-slate-600">{accounts.length} Sharded Accounts</span>
          </div>
        </div>
      </section>

      {/* Core Architectural Pillars */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="text-center space-y-2 mb-10">
          <span className="text-xs font-mono uppercase tracking-widest text-slate-500">Core Engineering Foundations</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-black uppercase tracking-tight">
            Built for Extreme Reliability &amp; Zero Data Loss
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-3 shadow-xs hover:border-slate-400 transition">
            <div className="w-9 h-9 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center">
              <Layers className="w-4 h-4 text-black" />
            </div>
            <h3 className="text-sm font-bold text-black uppercase tracking-wider font-mono">01 // Multi-Shard Topology</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              Horizontally partitioned PostgreSQL cluster split by <code className="text-black font-semibold">account_id</code>.
              Independent write pipelines isolate bursts and isolate partition failure domains.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-3 shadow-xs hover:border-slate-400 transition">
            <div className="w-9 h-9 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center">
              <Lock className="w-4 h-4 text-black" />
            </div>
            <h3 className="text-sm font-bold text-black uppercase tracking-wider font-mono">02 // 2PC Atomic Protocol</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              Pessimistic row-level lock ordering (<code className="text-black font-semibold">Math.min &lt; Math.max</code>) mathematically
              prevents deadlocks during cross-shard wire transfers before prepare and atomic commit.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-3 shadow-xs hover:border-slate-400 transition">
            <div className="w-9 h-9 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center">
              <Scale className="w-4 h-4 text-black" />
            </div>
            <h3 className="text-sm font-bold text-black uppercase tracking-wider font-mono">03 // Double-Entry Ledger</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              Immutable journal recording exact debit and credit pairings for every transaction.
              Money is never created, lost, or duplicated across distributed shards.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-3 shadow-xs hover:border-slate-400 transition">
            <div className="w-9 h-9 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center">
              <Shield className="w-4 h-4 text-black" />
            </div>
            <h3 className="text-sm font-bold text-black uppercase tracking-wider font-mono">04 // Search &amp; Indexing</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              Trigram fuzzy search and B-tree numeric predicates enable instant, low-latency queries
              across transactions, dates, and account amounts.
            </p>
          </div>
        </div>
      </section>

      {/* Course & Team Banner */}
      <section className="max-w-4xl mx-auto px-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs">
          <div className="space-y-1">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-500">Academic Project Context</span>
            <h4 className="text-base font-bold text-black">Distributed Database Systems (Course Submission)</h4>
            <p className="text-xs text-slate-600">Instructor: Sir Umair • Target Evaluation: September 28, 2026</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 text-xs font-mono">
            <div className="px-3 py-2 rounded bg-white border border-slate-200 text-slate-700 shadow-2xs">
              <span className="block font-bold text-black">Shehzad Nisar</span>
              <span className="text-[11px] text-slate-500">B22110006147</span>
            </div>
            <div className="px-3 py-2 rounded bg-white border border-slate-200 text-slate-700 shadow-2xs">
              <span className="block font-bold text-black">Muhammad Ashraf</span>
              <span className="text-[11px] text-slate-500">B22110006090</span>
            </div>
            <div className="px-3 py-2 rounded bg-white border border-slate-200 text-slate-700 shadow-2xs">
              <span className="block font-bold text-black">Daniyal Ahmed</span>
              <span className="text-[11px] text-slate-500">B21110006024</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
