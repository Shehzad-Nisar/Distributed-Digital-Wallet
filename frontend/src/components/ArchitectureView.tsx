import React from 'react';
import { Database, GitCommit, Layers } from 'lucide-react';

export const ArchitectureView: React.FC = () => {
  return (
    <div className="space-y-8 font-sans max-w-5xl mx-auto pb-8 bg-white text-black">
      {/* Title */}
      <div className="border-b border-slate-200 pb-4 space-y-1">
        <span className="text-xs font-mono uppercase tracking-widest text-slate-500">
          Course Project Specification
        </span>
        <h2 className="text-2xl font-black text-black uppercase tracking-tight">
          Distributed Relational Database Architecture
        </h2>
        <p className="text-xs text-slate-600 font-mono">
          PostgreSQL Sharded Cluster • ACID Two-Phase Commit (2PC) • Raft High-Availability
        </p>
      </div>

      {/* 6-Layer Architecture Overview */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-black uppercase tracking-wider font-mono flex items-center gap-2">
          <Layers className="w-4 h-4 text-black" />
          <span>Six-Layer Horizontally Scalable Architecture</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 font-mono text-xs">
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 shadow-xs">
            <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] text-slate-700 font-bold">
              LAYER 01
            </span>
            <h4 className="font-bold text-black uppercase">Client Presentation</h4>
            <p className="text-[11px] text-slate-600 font-sans">
              Stateless React 19 single-page console communicating over REST JSON APIs with client-side idempotency.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 shadow-xs">
            <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] text-slate-700 font-bold">
              LAYER 02
            </span>
            <h4 className="font-bold text-black uppercase">Gateway &amp; Routing</h4>
            <p className="text-[11px] text-slate-600 font-sans">
              Reverse proxy and load balancer distributing stateless read/write traffic across healthy API instances.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 shadow-xs">
            <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] text-slate-700 font-bold">
              LAYER 03
            </span>
            <h4 className="font-bold text-black uppercase">2PC Application Engine</h4>
            <p className="text-[11px] text-slate-600 font-sans">
              Spring Boot 3 service layer executing deterministic pessimistic row-locking and distributed 2PC orchestration.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 shadow-xs">
            <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] text-slate-700 font-bold">
              LAYER 04
            </span>
            <h4 className="font-bold text-black uppercase">Distributed Caching</h4>
            <p className="text-[11px] text-slate-600 font-sans">
              Absorbs high-frequency read spikes for account balances and frequent transaction lookups.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 shadow-xs">
            <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] text-slate-700 font-bold">
              LAYER 05
            </span>
            <h4 className="font-bold text-black uppercase">Write Pipeline Serialization</h4>
            <p className="text-[11px] text-slate-600 font-sans">
              Serializes concurrent balance mutations per account partition to prevent race conditions and lost updates.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 shadow-xs">
            <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] text-slate-700 font-bold">
              LAYER 06
            </span>
            <h4 className="font-bold text-black uppercase">Sharded Relational Storage</h4>
            <p className="text-[11px] text-slate-600 font-sans">
              PostgreSQL 17 sharded cluster partitioned by <code className="text-black font-semibold">account_id</code> with immutable ledger entries.
            </p>
          </div>
        </div>
      </div>

      {/* 2PC Consensus Protocol Flow */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-black uppercase tracking-wider font-mono flex items-center gap-2">
          <GitCommit className="w-4 h-4 text-black" />
          <span>Cross-Shard Two-Phase Commit Protocol Sequence</span>
        </h3>

        <div className="p-5 rounded-xl border border-slate-200 bg-slate-50 font-mono text-xs space-y-4 shadow-xs">
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded bg-black text-white font-bold flex items-center justify-center shrink-0">
              0
            </span>
            <div>
              <span className="text-black font-bold block uppercase">
                Deterministic Row-Lock Ordering (Deadlock Prevention)
              </span>
              <p className="text-[11px] text-slate-600 font-sans mt-0.5">
                The 2PC Coordinator sorts sender and receiver account IDs in strictly ascending numerical order
                (<code className="text-black font-semibold">Math.min(accA, accB)</code> before <code className="text-black font-semibold">Math.max(accA, accB)</code>)
                before acquiring row locks via <code className="text-black font-semibold">SELECT ... FOR UPDATE</code>.
                This breaks circular wait chains and mathematically eliminates distributed deadlocks.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded bg-black text-white font-bold flex items-center justify-center shrink-0">
              1
            </span>
            <div>
              <span className="text-black font-bold block uppercase">
                Phase 1: Prepare &amp; Participant Voting
              </span>
              <p className="text-[11px] text-slate-600 font-sans mt-0.5">
                Coordinator checks participating shard availability, verifies account active statuses, validates currency compatibility,
                and verifies sender balance sufficiency. If all checks pass, participants vote <code className="text-black font-semibold">VOTE_COMMIT</code>.
                If balance is insufficient, vote is <code className="text-black font-semibold">VOTE_ABORT</code> and transaction rolls back with zero balance mutation.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded bg-black text-white font-bold flex items-center justify-center shrink-0">
              2
            </span>
            <div>
              <span className="text-black font-bold block uppercase">
                Phase 2: Atomic Cross-Shard Commit &amp; Double-Entry Audit
              </span>
              <p className="text-[11px] text-slate-600 font-sans mt-0.5">
                On unanimous commit votes, the coordinator applies balance updates across shards simultaneously.
                Two immutable ledger entries are written: a <code className="text-black font-semibold">DEBIT</code> entry for the sender and a <code className="text-black font-semibold">CREDIT</code> entry for the recipient.
                Sum of debits strictly equals sum of credits.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Shard Mapping Table */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-black uppercase tracking-wider font-mono flex items-center gap-2">
          <Database className="w-4 h-4 text-black" />
          <span>Cluster Partition Topology &amp; Pre-Seeded Accounts</span>
        </h3>

        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white font-mono text-xs shadow-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Shard Node</th>
                <th className="py-2.5 px-3">Geographic Region</th>
                <th className="py-2.5 px-3">Initial Account</th>
                <th className="py-2.5 px-3">Seed User</th>
                <th className="py-2.5 px-3 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-2.5 px-3 font-bold text-black">SHARD_1_NORTH</td>
                <td className="py-2.5 px-3 text-slate-600">Islamabad / KPK Cluster</td>
                <td className="py-2.5 px-3 text-black">ACC-CHARLIE-003</td>
                <td className="py-2.5 px-3 text-black">Charlie Tariq</td>
                <td className="py-2.5 px-3 text-right font-bold text-black">5,000.00 PKR</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-black">SHARD_2_CENTRAL</td>
                <td className="py-2.5 px-3 text-slate-600">Lahore / Punjab Cluster</td>
                <td className="py-2.5 px-3 text-black">ACC-BOB-002</td>
                <td className="py-2.5 px-3 text-black">Bob Malik</td>
                <td className="py-2.5 px-3 text-right font-bold text-black">1,000.00 PKR</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-black">SHARD_3_SOUTH</td>
                <td className="py-2.5 px-3 text-slate-600">Karachi / Coastal Cluster</td>
                <td className="py-2.5 px-3 text-black">ACC-ALICE-001</td>
                <td className="py-2.5 px-3 text-black">Alice Khan</td>
                <td className="py-2.5 px-3 text-right font-bold text-black">10,000.00 PKR</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-black">SHARD_4_ENTERPRISE</td>
                <td className="py-2.5 px-3 text-slate-600">Corporate Settlement Node</td>
                <td className="py-2.5 px-3 text-black">ACC-DARAZ-004</td>
                <td className="py-2.5 px-3 text-black">Daraz Merchant</td>
                <td className="py-2.5 px-3 text-right font-bold text-black">100,000.00 PKR</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
