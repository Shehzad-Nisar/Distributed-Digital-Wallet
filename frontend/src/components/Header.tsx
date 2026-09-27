import React from 'react';
import { Database, ExternalLink, ShieldCheck } from 'lucide-react';
import type { SystemHealth } from '../types';

interface HeaderProps {
  health: SystemHealth | null;
}

export const Header: React.FC<HeaderProps> = ({ health }) => {
  const isHealthy = health?.database?.includes('Connected');

  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-black text-xl">
            TM
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">TransMoney</h1>
              <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full font-semibold">
                2PC Cluster
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Distributed Relational Database System • PostgreSQL Sharded Cluster
            </p>
          </div>
        </div>

        {/* Team Badges & Status */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Health indicator */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${
              isHealthy
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isHealthy ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
              }`}
            />
            <Database className="w-3.5 h-3.5" />
            <span>{isHealthy ? 'PostgreSQL 17.2: Connected' : 'DB: Unreachable'}</span>
          </div>

          {/* Swagger link */}
          <a
            href="http://localhost:8080/swagger-ui.html"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <span>Swagger API</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>

          {/* Course tag */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/40 text-indigo-300 text-xs font-medium border border-indigo-800/40">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>Sir Umair • DDS 2026</span>
          </div>
        </div>
      </div>
    </header>
  );
};
