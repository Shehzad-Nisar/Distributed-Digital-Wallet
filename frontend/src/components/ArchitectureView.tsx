import React from 'react';
import { Globe, Layers, ShieldCheck } from 'lucide-react';

export const ArchitectureView: React.FC = () => {
  return (
    <div className="space-y-8 font-sans max-w-5xl mx-auto pb-8 bg-white text-black">
      {/* Title */}
      <div className="border-b border-slate-200 pb-4 space-y-1">
        <span className="text-xs font-mono uppercase tracking-widest text-slate-500">
          About TransMoney
        </span>
        <h2 className="text-2xl font-black text-black uppercase tracking-tight">
          How TransMoney Works
        </h2>
        <p className="text-xs text-slate-600 font-mono">
          A fast, secure, and reliable digital wallet built for real people.
        </p>
      </div>

      {/* Platform Overview */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-black uppercase tracking-wider font-mono flex items-center gap-2">
          <Layers className="w-4 h-4 text-black" />
          <span>Platform Overview</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 font-mono text-xs">
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 shadow-xs">
            <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] text-slate-700 font-bold">
              01
            </span>
            <h4 className="font-bold text-black uppercase">Easy-to-Use App</h4>
            <p className="text-[11px] text-slate-600 font-sans">
              A clean, fast interface that works on any device. No downloads needed — access your wallet from any browser.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 shadow-xs">
            <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] text-slate-700 font-bold">
              02
            </span>
            <h4 className="font-bold text-black uppercase">Smart Routing</h4>
            <p className="text-[11px] text-slate-600 font-sans">
              Transfers are automatically routed through the fastest available path, keeping your money moving without delays.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 shadow-xs">
            <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] text-slate-700 font-bold">
              03
            </span>
            <h4 className="font-bold text-black uppercase">Transfer Engine</h4>
            <p className="text-[11px] text-slate-600 font-sans">
              Every transfer is processed with a guaranteed all-or-nothing mechanism — the money either arrives in full or is returned instantly.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 shadow-xs">
            <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] text-slate-700 font-bold">
              04
            </span>
            <h4 className="font-bold text-black uppercase">Fast Balance Updates</h4>
            <p className="text-[11px] text-slate-600 font-sans">
              Your balance refreshes immediately after every transfer, so you always see your real balance in real time.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 shadow-xs">
            <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] text-slate-700 font-bold">
              05
            </span>
            <h4 className="font-bold text-black uppercase">Conflict-Free Processing</h4>
            <p className="text-[11px] text-slate-600 font-sans">
              Multiple simultaneous transfers never interfere with each other. Every transaction is handled in strict order to prevent errors.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 shadow-xs">
            <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] text-slate-700 font-bold">
              06
            </span>
            <h4 className="font-bold text-black uppercase">Secure Storage</h4>
            <p className="text-[11px] text-slate-600 font-sans">
              All account data and transaction records are stored securely with full audit history. Nothing is ever deleted.
            </p>
          </div>
        </div>
      </div>

      {/* How a Transfer Works */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-black uppercase tracking-wider font-mono flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-black" />
          <span>How Every Transfer Is Protected</span>
        </h3>

        <div className="p-5 rounded-xl border border-slate-200 bg-slate-50 font-mono text-xs space-y-4 shadow-xs">
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded bg-black text-white font-bold flex items-center justify-center shrink-0">
              1
            </span>
            <div>
              <span className="text-black font-bold block uppercase">
                Identity & Balance Check
              </span>
              <p className="text-[11px] text-slate-600 font-sans mt-0.5">
                Before any money moves, we verify both accounts are active and the sender has enough balance. If anything looks wrong, the transfer is stopped immediately with no money moved.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded bg-black text-white font-bold flex items-center justify-center shrink-0">
              2
            </span>
            <div>
              <span className="text-black font-bold block uppercase">
                Transfer Authorization
              </span>
              <p className="text-[11px] text-slate-600 font-sans mt-0.5">
                All systems confirm they are ready to receive and process the transfer. If any system is unavailable, the transfer is held until everything is confirmed — no partial transfers allowed.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded bg-black text-white font-bold flex items-center justify-center shrink-0">
              3
            </span>
            <div>
              <span className="text-black font-bold block uppercase">
                Instant Completion & Record
              </span>
              <p className="text-[11px] text-slate-600 font-sans mt-0.5">
                Once confirmed, the sender's balance is reduced and the recipient's balance is increased simultaneously. A permanent record is created for both sides — every PKR is always accounted for.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Regional Hubs Table */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-black uppercase tracking-wider font-mono flex items-center gap-2">
          <Globe className="w-4 h-4 text-black" />
          <span>Regional Shard Topology & Partition Routing</span>
        </h3>

        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white font-mono text-xs shadow-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Shard Partition</th>
                <th className="py-2.5 px-3">Regional Hub</th>
                <th className="py-2.5 px-3">Database Target</th>
                <th className="py-2.5 px-3">2PC Coordinator</th>
                <th className="py-2.5 px-3 text-right">Consensus SLA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-2.5 px-3 font-bold text-black">SHARD_1_NORTH</td>
                <td className="py-2.5 px-3 text-slate-600">North Hub (Islamabad / KPK)</td>
                <td className="py-2.5 px-3 text-black">Partition Cluster Alpha</td>
                <td className="py-2.5 px-3 text-emerald-700 font-semibold">Active Leader</td>
                <td className="py-2.5 px-3 text-right font-bold text-black">&lt; 12ms</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-black">SHARD_2_CENTRAL</td>
                <td className="py-2.5 px-3 text-slate-600">Central Hub (Lahore / Punjab)</td>
                <td className="py-2.5 px-3 text-black">Partition Cluster Beta</td>
                <td className="py-2.5 px-3 text-emerald-700 font-semibold">Active Leader</td>
                <td className="py-2.5 px-3 text-right font-bold text-black">&lt; 10ms</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-black">SHARD_3_SOUTH</td>
                <td className="py-2.5 px-3 text-slate-600">South Hub (Karachi / Sindh)</td>
                <td className="py-2.5 px-3 text-black">Partition Cluster Gamma</td>
                <td className="py-2.5 px-3 text-emerald-700 font-semibold">Active Leader</td>
                <td className="py-2.5 px-3 text-right font-bold text-black">&lt; 14ms</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-black">SHARD_4_ENTERPRISE</td>
                <td className="py-2.5 px-3 text-slate-600">Enterprise & Global Clearing</td>
                <td className="py-2.5 px-3 text-black">Partition Cluster Delta</td>
                <td className="py-2.5 px-3 text-emerald-700 font-semibold">Active Leader</td>
                <td className="py-2.5 px-3 text-right font-bold text-black">&lt; 8ms</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
