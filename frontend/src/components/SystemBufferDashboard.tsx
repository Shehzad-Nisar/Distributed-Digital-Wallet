import React, { useState, useEffect } from 'react';
import {
  Activity,
  Cpu,
  Database,
  Radio,
  RefreshCw,
  Trash2,
  Zap,
  CheckCircle2,
  Clock,
  Layers,
  Flame,
} from 'lucide-react';
import {
  getCacheStats,
  clearCache,
  getQueueStats,
  warmCache,
} from '../api/client';
import { walletSocket } from '../api/websocket';
import type { CacheStatsResponse, QueueStatsResponse, TransactionEvent } from '../types';

export const SystemBufferDashboard: React.FC = () => {
  const [cacheStats, setCacheStats] = useState<CacheStatsResponse | null>(null);
  const [queueStats, setQueueStats] = useState<QueueStatsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [eventStream, setEventStream] = useState<TransactionEvent[]>([]);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const refreshMetrics = async () => {
    try {
      const [c, q] = await Promise.all([
        getCacheStats().catch(() => null),
        getQueueStats().catch(() => null),
      ]);
      if (c) setCacheStats(c);
      if (q) setQueueStats(q);
    } catch (err) {
      console.error('Error fetching system buffer metrics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshMetrics();
    const interval = setInterval(refreshMetrics, 3000);

    // Listen to real-time WebSocket connection state
    const unbindStatus = walletSocket.onStatus((connected) => {
      setWsConnected(connected);
    });

    // Listen to real-time incoming transaction events
    const unbindEvent = walletSocket.onEvent((event) => {
      setEventStream((prev) => [event, ...prev.slice(0, 19)]);
      refreshMetrics();
    });

    return () => {
      clearInterval(interval);
      unbindStatus();
      unbindEvent();
    };
  }, []);

  const handleWarmCache = async () => {
    try {
      const count = await warmCache();
      setActionMessage(`Pre-warmed cache for ${count} accounts.`);
      refreshMetrics();
      setTimeout(() => setActionMessage(null), 4000);
    } catch {
      setActionMessage('Failed to warm cache.');
    }
  };

  const handleClearCache = async () => {
    try {
      await clearCache();
      setActionMessage('Balance cache purged successfully.');
      refreshMetrics();
      setTimeout(() => setActionMessage(null), 4000);
    } catch {
      setActionMessage('Failed to clear cache.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl shadow-md border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              PHASE 7 PRODUCTION
            </span>
            <span className="text-xs text-slate-400 font-mono">Distributed High-Throughput Engine</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            Redis Balance Caching &amp; Asynchronous Queue Buffer
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Accelerates sub-millisecond balance reads via dual-tier Redis caching, decouples post-transaction
            heavy side effects with an async queue buffer, and broadcasts live WebSocket push notifications.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleWarmCache}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs rounded-xl shadow transition cursor-pointer"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Pre-Warm Cache</span>
          </button>
          <button
            onClick={handleClearCache}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-rose-300 font-semibold text-xs rounded-xl border border-slate-700 transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Purge Cache</span>
          </button>
          <button
            onClick={refreshMetrics}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition cursor-pointer"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Cache Hit Ratio */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-mono mb-2">
            <span>CACHE HIT RATIO</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {cacheStats ? `${cacheStats.hitRatePercentage}%` : '0%'}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between font-mono">
            <span>Hits: {cacheStats?.hits ?? 0}</span>
            <span>Misses: {cacheStats?.misses ?? 0}</span>
          </div>
        </div>

        {/* Metric 2: Cache Evictions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-mono mb-2">
            <span>2PC CACHE EVICTIONS</span>
            <Database className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {cacheStats?.evictions ?? 0}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between font-mono">
            <span>In-Memory Entries: {cacheStats?.inMemoryEntries ?? 0}</span>
            <span className={cacheStats?.redisConnected ? 'text-emerald-600' : 'text-amber-600'}>
              {cacheStats?.redisConnected ? '● Redis Online' : '● Local Fallback'}
            </span>
          </div>
        </div>

        {/* Metric 3: Async Queue Throughput */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-mono mb-2">
            <span>QUEUE THROUGHPUT</span>
            <Cpu className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {queueStats?.totalProcessed ?? 0}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between font-mono">
            <span>Enqueued: {queueStats?.totalEnqueued ?? 0}</span>
            <span>Buffer Depth: {queueStats?.pendingBufferSize ?? 0}</span>
          </div>
        </div>

        {/* Metric 4: WebSocket Real-Time Stream */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-mono mb-2">
            <span>WEBSOCKET STATUS</span>
            <Radio className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${wsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span className="text-lg font-bold text-slate-900 font-sans">
              {wsConnected ? 'Connected' : 'Connecting'}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between font-mono">
            <span>Active Clients: {queueStats?.activeWebSocketConnections ?? (wsConnected ? 1 : 0)}</span>
            <span className="text-emerald-600">Sub-10ms Push</span>
          </div>
        </div>
      </div>

      {/* Architectural Diagram & Real-Time Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Pipeline Architecture Explanation */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-700" />
            Asynchronous Buffer Architecture
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            When 2PC transfers, FX exchanges, or deposits finalize in PostgreSQL, post-transaction side effects
            are cleanly isolated from the synchronous ACID commit path:
          </p>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center justify-between text-slate-800 font-semibold mb-1">
                <span>1. Synchronous 2PC Commit</span>
                <span className="text-emerald-600 text-[10px] px-1.5 py-0.5 bg-emerald-50 rounded">ACID Guaranteed</span>
              </div>
              <p className="text-[11px] text-slate-500 font-sans">
                Ordered locks acquire accounts, validate balances, update balances, write GAAP journal entries.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center justify-between text-slate-800 font-semibold mb-1">
                <span>2. Cache Eviction &amp; Enqueue</span>
                <span className="text-sky-600 text-[10px] px-1.5 py-0.5 bg-sky-50 rounded">Dual-Tier Invalidate</span>
              </div>
              <p className="text-[11px] text-slate-500 font-sans">
                Sender &amp; receiver balance caches evicted in Redis &amp; local memory; <code className="text-slate-800">TransactionEvent</code> pushed to queue buffer.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center justify-between text-slate-800 font-semibold mb-1">
                <span>3. Async Worker Drain &amp; WS Push</span>
                <span className="text-purple-600 text-[10px] px-1.5 py-0.5 bg-purple-50 rounded">Zero Contention</span>
              </div>
              <p className="text-[11px] text-slate-500 font-sans">
                Background thread worker pulls events, dispatches notifications, and pushes real-time WebSocket frames to browser.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Live Event Stream Terminal */}
        <div className="lg:col-span-7 bg-slate-950 text-slate-200 p-6 rounded-2xl shadow-lg border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  Live WebSocket Transaction Stream
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {eventStream.length} Events Captured
              </span>
            </div>

            {eventStream.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs font-mono space-y-2">
                <Radio className="w-8 h-8 mx-auto opacity-30 text-emerald-400 animate-pulse" />
                <p>Waiting for live transaction events...</p>
                <p className="text-[11px] text-slate-600">
                  Execute a Send Money transfer, Deposit, or FX exchange to see live WebSocket push frames appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {eventStream.map((evt) => (
                  <div
                    key={evt.eventId || Math.random()}
                    className="p-3 bg-slate-900 border border-slate-800 rounded-xl font-mono text-xs hover:border-slate-700 transition"
                  >
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                        <Zap className="w-3 h-3" />
                        {evt.eventType}
                      </span>
                      <span className="text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString() : 'Just now'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-300 mt-1">
                      <span>
                        Tx: <span className="text-white font-semibold">{evt.transactionId}</span>
                      </span>
                      <span className="text-emerald-300 font-bold">
                        {evt.amount} {evt.currency}
                      </span>
                    </div>

                    {evt.description && (
                      <p className="text-[11px] text-slate-400 mt-1 truncate">
                        {evt.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800/80 mt-4 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Endpoint: <code className="text-slate-300">/ws/wallet</code>
            </span>
            <span>Channel: <code className="text-slate-300">transmoney:events</code></span>
          </div>
        </div>
      </div>
    </div>
  );
};
