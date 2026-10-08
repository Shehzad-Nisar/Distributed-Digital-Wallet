import React, { useState, useEffect } from 'react';
import {
  Flame,
  Activity,
  ShieldAlert,
  RotateCcw,
  Play,
  StopCircle,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Gauge,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import {
  startLoadTest,
  getSimulatorStatus,
  cancelLoadTest,
  getChaosConfig,
  updateChaosConfig,
  resetChaosConfig,
  triggerChaosRecovery,
} from '../api/client';
import type {
  LoadBenchmarkResult,
  ChaosConfigResponse,
  ChaosConfigRequest,
} from '../types';

export const ChaosSimulatorView: React.FC = () => {
  // Load Simulator State
  const [concurrency, setConcurrency] = useState<number>(8);
  const [totalTransactions, setTotalTransactions] = useState<number>(50);
  const [currency, setCurrency] = useState<string>('USD');
  const [amountPerTransfer, setAmountPerTransfer] = useState<number>(5);
  const [highContention, setHighContention] = useState<boolean>(false);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<LoadBenchmarkResult | null>(null);

  // Chaos Monkey State
  const [chaosConfig, setChaosConfig] = useState<ChaosConfigResponse | null>(null);
  const [chaosEnabled, setChaosEnabled] = useState<boolean>(false);
  const [chaosMode, setChaosMode] = useState<ChaosConfigRequest['mode']>('NONE');
  const [latencyMs, setLatencyMs] = useState<number>(150);
  const [failureRate, setFailureRate] = useState<number>(10);

  // Recovery & Feedback
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRecovering, setIsRecovering] = useState<boolean>(false);

  // Fetch initial simulator status and chaos config
  const fetchStatus = async () => {
    try {
      const [status, chaos] = await Promise.all([
        getSimulatorStatus().catch(() => null),
        getChaosConfig().catch(() => null),
      ]);
      if (status) {
        setIsRunning(status.running);
        if (status.lastResult) setLastResult(status.lastResult);
      }
      if (chaos) {
        setChaosConfig(chaos);
        setChaosEnabled(chaos.enabled);
        setChaosMode(chaos.mode as ChaosConfigRequest['mode']);
        setLatencyMs(chaos.latencyMs || 150);
        setFailureRate(chaos.failureRatePercent || 10);
      }
    } catch (err) {
      console.error('Failed to fetch simulator status', err);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleRunLoadTest = async () => {
    setIsRunning(true);
    setErrorMessage(null);
    setActionMessage('Executing distributed 2PC concurrency benchmark...');
    try {
      const result = await startLoadTest({
        concurrencyLevel: concurrency,
        totalTransactions,
        currency,
        amountPerTransfer,
        highContentionMode: highContention,
      });
      setLastResult(result);
      setActionMessage(`Benchmark completed: ${result.totalSucceeded}/${result.totalAttempted} succeeded at ${result.transactionsPerSecond.toFixed(1)} TPS.`);
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || err?.message || 'Load test failed to execute');
    } finally {
      setIsRunning(false);
      fetchStatus();
    }
  };

  const handleCancelLoadTest = async () => {
    try {
      await cancelLoadTest();
      setActionMessage('Benchmark cancellation signal sent.');
      setIsRunning(false);
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || 'Failed to cancel benchmark');
    }
  };

  const handleApplyChaos = async () => {
    try {
      setErrorMessage(null);
      const updated = await updateChaosConfig({
        enabled: chaosEnabled,
        mode: chaosMode,
        latencyMs: chaosMode === 'LATENCY_SPIKE' ? latencyMs : 0,
        failureRatePercent: chaosMode === 'PACKET_DROP' ? failureRate : 0,
      });
      setChaosConfig(updated);
      setActionMessage(`Chaos Monkey configured: [${updated.mode}] ${updated.enabled ? 'ACTIVE' : 'STANDBY'}`);
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || 'Failed to update chaos configuration');
    }
  };

  const handleResetChaos = async () => {
    try {
      const reset = await resetChaosConfig();
      setChaosConfig(reset);
      setChaosEnabled(false);
      setChaosMode('NONE');
      setLatencyMs(0);
      setFailureRate(0);
      setActionMessage('Chaos Monkey disarmed and reset to NONE.');
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || 'Failed to reset chaos monkey');
    }
  };

  const handleTriggerRecovery = async () => {
    setIsRecovering(true);
    try {
      const count = await triggerChaosRecovery(0);
      setActionMessage(`Recovery Sweep: Reconciled and marked FAILED ${count} orphaned PREPARED transactions.`);
      setTimeout(() => setActionMessage(null), 5000);
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || 'Failed to trigger recovery sweep');
    } finally {
      setIsRecovering(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Notification */}
      <div className="border-b theme-border pb-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-red-500 animate-pulse" />
            <h2 className="text-xl font-bold theme-text-primary uppercase tracking-tight font-mono">
              High Concurrency Simulator &amp; Chaos Monkey Fault Engine
            </h2>
          </div>
          <p className="text-xs theme-text-secondary font-mono mt-0.5">
            Phase 8: Multi-threaded 2PC stress benchmarking, inter-shard latency injection, node crashes &amp; automated recovery
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchStatus}
            className="px-2.5 py-1.5 rounded theme-btn-secondary font-mono text-xs flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-2 text-xs font-mono text-emerald-400">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-xs font-mono text-red-400">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Grid: Benchmark Controller & Chaos Monkey Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel 1: Multi-Threaded Load Benchmark */}
        <div className="theme-bg-card border theme-border rounded-xl p-5 space-y-5">
          <div className="flex items-center justify-between border-b theme-border pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold theme-text-primary font-mono uppercase tracking-wider">
                2PC Concurrency Benchmark
              </h3>
            </div>
            <span
              className={`px-2 py-0.5 text-[10px] font-mono rounded font-semibold ${
                isRunning
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              }`}
            >
              {isRunning ? 'BENCHMARK RUNNING' : 'READY'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <label className="block text-slate-400 mb-1">Concurrency Workers ({concurrency})</label>
              <input
                type="range"
                min="1"
                max="32"
                value={concurrency}
                onChange={(e) => setConcurrency(Number(e.target.value))}
                disabled={isRunning}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>1 thread</span>
                <span>16</span>
                <span>32 threads</span>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Total Transfers ({totalTransactions})</label>
              <input
                type="range"
                min="10"
                max="200"
                step="10"
                value={totalTransactions}
                onChange={(e) => setTotalTransactions(Number(e.target.value))}
                disabled={isRunning}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>10</span>
                <span>100</span>
                <span>200</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <label className="block text-slate-400 mb-1">Currency Shards</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                disabled={isRunning}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white"
              >
                <option value="USD">USD (North America Shard 1)</option>
                <option value="EUR">EUR (Europe Shard 2)</option>
                <option value="GBP">GBP (UK Shard 2)</option>
                <option value="PKR">PKR (South Asia Shard 3)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Transfer Amount</label>
              <input
                type="number"
                min="1"
                max="1000"
                value={amountPerTransfer}
                onChange={(e) => setAmountPerTransfer(Number(e.target.value))}
                disabled={isRunning}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white"
              />
            </div>
          </div>

          {/* High Contention Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs font-mono">
            <div>
              <div className="font-semibold text-slate-200">High Contention Hot Account Scenario</div>
              <div className="text-[11px] text-slate-400">
                Directs all parallel transfers simultaneously into a single hot account to test row-level deadlock prevention
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={highContention}
                onChange={(e) => setHighContention(e.target.checked)}
                disabled={isRunning}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          {/* Execution Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            {!isRunning ? (
              <button
                onClick={handleRunLoadTest}
                className="flex-1 py-2.5 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition shadow-md"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Run 2PC Concurrency Benchmark</span>
              </button>
            ) : (
              <button
                onClick={handleCancelLoadTest}
                className="flex-1 py-2.5 px-4 rounded-lg bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition shadow-md"
              >
                <StopCircle className="w-4 h-4" />
                <span>Cancel Active Benchmark</span>
              </button>
            )}
          </div>
        </div>

        {/* Panel 2: Chaos Monkey Fault Injection Matrix */}
        <div className="theme-bg-card border theme-border rounded-xl p-5 space-y-5">
          <div className="flex items-center justify-between border-b theme-border pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <h3 className="text-sm font-bold theme-text-primary font-mono uppercase tracking-wider">
                Chaos Monkey Fault Injector
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={chaosEnabled}
                  onChange={(e) => setChaosEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-500"></div>
              </label>
              <span className={`text-[11px] font-mono font-bold ${chaosEnabled ? 'text-red-400' : 'text-slate-500'}`}>
                {chaosEnabled ? 'ARMED' : 'DISARMED'}
              </span>
            </div>
          </div>

          {/* Fault Modes */}
          <div className="space-y-2 text-xs font-mono">
            <label className="block text-slate-400">Chaos Injection Mode</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { id: 'NONE', label: 'None (Clean Baseline)', desc: 'Standard normal transactions' },
                { id: 'LATENCY_SPIKE', label: 'Latency Spike', desc: 'Simulates inter-shard WAN delays' },
                { id: 'PREPARE_PARTITION', label: 'Prepare Partition', desc: 'Phase 1 partition failure' },
                { id: 'COORDINATOR_CRASH', label: 'Coordinator Crash', desc: 'Crash right after PREPARED log' },
                { id: 'PACKET_DROP', label: 'Probabilistic Drop', desc: 'Random % drops across shards' },
              ].map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setChaosMode(mode.id as ChaosConfigRequest['mode'])}
                  className={`p-2.5 rounded-lg border text-left cursor-pointer transition flex flex-col justify-between ${
                    chaosMode === mode.id
                      ? 'border-red-500 bg-red-500/10 text-red-200'
                      : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="font-bold text-xs">{mode.label}</span>
                  <span className="text-[10px] text-slate-500">{mode.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Mode-Specific Parameters */}
          {chaosMode === 'LATENCY_SPIKE' && (
            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-slate-300">
                <span>Injected Latency Spike</span>
                <span className="text-amber-400 font-bold">{latencyMs} ms</span>
              </div>
              <input
                type="range"
                min="50"
                max="1000"
                step="50"
                value={latencyMs}
                onChange={(e) => setLatencyMs(Number(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>
          )}

          {chaosMode === 'PACKET_DROP' && (
            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-slate-300">
                <span>Packet Drop Probability</span>
                <span className="text-red-400 font-bold">{failureRate}%</span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                step="1"
                value={failureRate}
                onChange={(e) => setFailureRate(Number(e.target.value))}
                className="w-full accent-red-400 cursor-pointer"
              />
            </div>
          )}

          {/* Fault Telemetry Badges */}
          <div className="grid grid-cols-3 gap-2 text-center font-mono">
            <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
              <div className="text-[10px] text-slate-500">Faults Injected</div>
              <div className="text-sm font-bold text-slate-200">
                {chaosConfig?.totalFaultsInjected ?? 0}
              </div>
            </div>
            <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
              <div className="text-[10px] text-slate-500">Crashes Induced</div>
              <div className="text-sm font-bold text-red-400">
                {chaosConfig?.totalCrashesSimulated ?? 0}
              </div>
            </div>
            <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
              <div className="text-[10px] text-slate-500">Delays Injected</div>
              <div className="text-sm font-bold text-amber-400">
                {chaosConfig?.totalDelaysInjected ?? 0}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleApplyChaos}
              className="flex-1 py-2 px-3 rounded-lg bg-red-700 hover:bg-red-600 text-white font-mono text-xs font-bold cursor-pointer transition shadow"
            >
              Apply Fault Configuration
            </button>
            <button
              onClick={handleResetChaos}
              className="py-2 px-3 rounded-lg theme-btn-secondary font-mono text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
            <button
              onClick={handleTriggerRecovery}
              disabled={isRecovering}
              className="py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{isRecovering ? 'Sweeping...' : 'Sweep Recovery'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Benchmark Results Cards (Latency Percentiles, TPS & Invariants) */}
      {lastResult && (
        <div className="theme-bg-card border theme-border rounded-xl p-5 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b theme-border pb-3 gap-2">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold theme-text-primary font-mono uppercase tracking-wider">
                Benchmark Telemetry &amp; Latency Percentiles
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">
                Run ID: {lastResult.benchmarkRunId}
              </span>
            </div>

            {/* Money Conservation Invariant Badge */}
            <div className="flex items-center gap-2">
              {lastResult.moneyConservationVerified ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Zero-Sum Money Conserved</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-mono font-bold">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Invariant Violation Detected!</span>
                </div>
              )}
            </div>
          </div>

          {/* Primary Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 font-mono">
            <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-lg">
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                <span>Throughput</span>
              </div>
              <div className="text-xl font-bold text-cyan-400 mt-1">
                {lastResult.transactionsPerSecond.toFixed(1)}{' '}
                <span className="text-xs font-normal text-slate-500">tx/s</span>
              </div>
            </div>

            <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-lg">
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>P50 Latency</span>
              </div>
              <div className="text-xl font-bold text-emerald-400 mt-1">
                {lastResult.p50LatencyMs.toFixed(1)}{' '}
                <span className="text-xs font-normal text-slate-500">ms</span>
              </div>
            </div>

            <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-lg">
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>P95 Latency</span>
              </div>
              <div className="text-xl font-bold text-amber-400 mt-1">
                {lastResult.p95LatencyMs.toFixed(1)}{' '}
                <span className="text-xs font-normal text-slate-500">ms</span>
              </div>
            </div>

            <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-lg">
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-red-400" />
                <span>P99 Latency</span>
              </div>
              <div className="text-xl font-bold text-red-400 mt-1">
                {lastResult.p99LatencyMs.toFixed(1)}{' '}
                <span className="text-xs font-normal text-slate-500">ms</span>
              </div>
            </div>

            <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-lg">
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                <span>Success Rate</span>
              </div>
              <div className="text-xl font-bold text-white mt-1">
                {lastResult.totalSucceeded} / {lastResult.totalAttempted}
              </div>
            </div>

            <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-lg">
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-blue-400" />
                <span>Deadlocks</span>
              </div>
              <div className="text-xl font-bold text-emerald-400 mt-1">
                {lastResult.totalDeadlocks}{' '}
                <span className="text-[10px] text-slate-500 font-normal">(0 Deadlocks)</span>
              </div>
            </div>
          </div>

          {/* Secondary Details: Balances and Sample Errors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono pt-2">
            <div className="p-3 bg-slate-900/50 border border-slate-800/80 rounded-lg space-y-1">
              <div className="text-slate-400 font-semibold">Ledger Invariant Verification</div>
              <div className="flex justify-between text-slate-300">
                <span>Initial Net Balance Sum:</span>
                <span className="font-bold">{lastResult.initialNetBalance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Final Net Balance Sum:</span>
                <span className="font-bold">{lastResult.finalNetBalance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Benchmark Duration:</span>
                <span>{lastResult.durationMs} ms across {lastResult.concurrencyLevel} parallel workers</span>
              </div>
            </div>

            {lastResult.sampleErrors && lastResult.sampleErrors.length > 0 ? (
              <div className="p-3 bg-red-950/30 border border-red-900/50 rounded-lg space-y-1">
                <div className="text-red-400 font-semibold">Observed Exceptions / Chaos Injections</div>
                <div className="max-h-24 overflow-y-auto space-y-1">
                  {lastResult.sampleErrors.map((err, i) => (
                    <div key={i} className="text-[11px] text-red-300 truncate">
                      • {err}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-900/50 border border-slate-800/80 rounded-lg flex items-center justify-center text-slate-500">
                Zero exceptions observed during this test run.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
