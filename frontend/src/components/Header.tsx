import React, { useState } from 'react';
import {
  ChevronDown,
  Database,
  ExternalLink,
  LogOut,
  Plus,
  Send,
  Users,
} from 'lucide-react';
import type { Account, SystemHealth, User } from '../types';

interface HeaderProps {
  health: SystemHealth | null;
  currentUser: User | null;
  userAccounts: Account[];
  activeAccountId: number | null;
  onSelectAccount: (id: number) => void;
  onOpenAuth: (mode: 'signin' | 'signup') => void;
  onOpenCreateAccount: () => void;
  onLogout: () => void;
  activeTab: 'landing' | 'console' | 'transfer' | 'ledger' | 'architecture';
  setActiveTab: (tab: 'landing' | 'console' | 'transfer' | 'ledger' | 'architecture') => void;
}

export const Header: React.FC<HeaderProps> = ({
  health,
  currentUser,
  userAccounts,
  activeAccountId,
  onSelectAccount,
  onOpenAuth,
  onOpenCreateAccount,
  onLogout,
  activeTab,
  setActiveTab,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const isHealthy = health?.database?.includes('Connected');

  const activeAccount = userAccounts.find((a) => a.id === activeAccountId) || userAccounts[0];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-4 sm:px-6 py-3 font-sans shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand & Tabs */}
        <div className="flex items-center gap-6">
          <div
            onClick={() => setActiveTab('landing')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded bg-black text-white font-black text-xs flex items-center justify-center font-mono tracking-tighter">
              TM
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black tracking-tight text-black uppercase">
                  TransMoney
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono border border-slate-200 bg-slate-100 text-slate-600 font-semibold">
                  2PC CLUSTER
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 font-mono text-xs">
            <button
              onClick={() => setActiveTab('console')}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer font-medium ${
                activeTab === 'console'
                  ? 'bg-black text-white font-semibold'
                  : 'text-slate-600 hover:text-black hover:bg-slate-100'
              }`}
            >
              Shards &amp; Overview
            </button>
            <button
              onClick={() => setActiveTab('transfer')}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer flex items-center gap-1.5 font-medium ${
                activeTab === 'transfer'
                  ? 'bg-black text-white font-semibold'
                  : 'text-slate-600 hover:text-black hover:bg-slate-100'
              }`}
            >
              <Send className="w-3 h-3" />
              <span>Send Money (2PC)</span>
            </button>
            <button
              onClick={() => setActiveTab('ledger')}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer font-medium ${
                activeTab === 'ledger'
                  ? 'bg-black text-white font-semibold'
                  : 'text-slate-600 hover:text-black hover:bg-slate-100'
              }`}
            >
              Ledger &amp; Search
            </button>
            <button
              onClick={() => setActiveTab('architecture')}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer font-medium ${
                activeTab === 'architecture'
                  ? 'bg-black text-white font-semibold'
                  : 'text-slate-600 hover:text-black hover:bg-slate-100'
              }`}
            >
              Architecture
            </button>
          </nav>
        </div>

        {/* Right Tools & User Session */}
        <div className="flex items-center gap-2.5">
          {/* PostgreSQL health indicator */}
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded border border-slate-200 bg-slate-50 font-mono text-[11px] text-slate-700">
            <span
              className={`w-2 h-2 rounded-full ${
                isHealthy ? 'bg-emerald-600 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <Database className="w-3 h-3 text-slate-500" />
            <span>{isHealthy ? 'PG 17: CONNECTED' : 'PG: OFFLINE'}</span>
          </div>

          {/* Swagger docs */}
          <a
            href="http://localhost:8080/swagger-ui.html"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded border border-slate-200 bg-white text-slate-700 hover:text-black hover:border-slate-400 font-mono text-[11px] transition shadow-2xs"
          >
            <span>API Docs</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          {/* User authentication pill / switcher */}
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:border-slate-400 text-xs transition cursor-pointer font-sans shadow-2xs"
              >
                <div className="w-5 h-5 rounded bg-slate-100 border border-slate-200 text-black font-mono text-[10px] flex items-center justify-center font-bold">
                  {currentUser.fullName.charAt(0)}
                </div>
                <div className="text-left hidden sm:block">
                  <span className="font-semibold text-black block leading-tight truncate max-w-[120px]">
                    {currentUser.fullName}
                  </span>
                  {activeAccount && (
                    <span className="text-[10px] text-slate-500 font-mono block leading-none">
                      {Number(activeAccount.balance).toFixed(0)} PKR
                    </span>
                  )}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {/* Session Dropdown */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-xl z-50 font-sans space-y-1">
                  <div className="p-2 border-b border-slate-100">
                    <span className="text-[11px] font-mono uppercase text-slate-400 block">Logged In As</span>
                    <span className="text-xs font-bold text-black block">{currentUser.fullName}</span>
                    <span className="text-[11px] text-slate-500 font-mono block truncate">{currentUser.email}</span>
                  </div>

                  {userAccounts.length > 0 && (
                    <div className="py-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 px-2 block mb-1">
                        Active Accounts ({userAccounts.length})
                      </span>
                      {userAccounts.map((acc) => (
                        <button
                          key={acc.id}
                          onClick={() => {
                            onSelectAccount(acc.id);
                            setDropdownOpen(false);
                          }}
                          className={`w-full p-1.5 rounded-lg text-left text-xs font-mono flex items-center justify-between transition cursor-pointer ${
                            acc.id === activeAccountId
                              ? 'bg-black text-white font-bold'
                              : 'text-slate-700 hover:bg-slate-100 hover:text-black'
                          }`}
                        >
                          <span className="truncate">{acc.accountNumber}</span>
                          <span className="shrink-0 text-[11px] ml-1">
                            {Number(acc.balance).toFixed(0)} PKR
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="pt-1 border-t border-slate-100 space-y-0.5">
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onOpenCreateAccount();
                      }}
                      className="w-full px-2 py-1.5 rounded text-left text-xs text-slate-700 hover:text-black hover:bg-slate-100 flex items-center gap-2 transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Open Account in New Shard</span>
                    </button>
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onOpenAuth('signin');
                      }}
                      className="w-full px-2 py-1.5 rounded text-left text-xs text-slate-700 hover:text-black hover:bg-slate-100 flex items-center gap-2 transition cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Switch Profile</span>
                    </button>
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onLogout();
                      }}
                      className="w-full px-2 py-1.5 rounded text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('signin')}
                className="px-3 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-black text-xs font-mono transition cursor-pointer shadow-2xs"
              >
                Sign In
              </button>
              <button
                onClick={() => onOpenAuth('signup')}
                className="px-3 py-1.5 rounded-md bg-black text-white hover:bg-slate-800 text-xs font-semibold uppercase tracking-wider transition cursor-pointer shadow-2xs"
              >
                Register
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile nav bar */}
      <div className="md:hidden flex items-center justify-around pt-3 mt-2 border-t border-slate-200 font-mono text-xs">
        <button
          onClick={() => setActiveTab('console')}
          className={`px-2 py-1 ${activeTab === 'console' ? 'text-black font-bold' : 'text-slate-500'}`}
        >
          Shards
        </button>
        <button
          onClick={() => setActiveTab('transfer')}
          className={`px-2 py-1 ${activeTab === 'transfer' ? 'text-black font-bold' : 'text-slate-500'}`}
        >
          Send (2PC)
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          className={`px-2 py-1 ${activeTab === 'ledger' ? 'text-black font-bold' : 'text-slate-500'}`}
        >
          Ledger
        </button>
        <button
          onClick={() => setActiveTab('architecture')}
          className={`px-2 py-1 ${activeTab === 'architecture' ? 'text-black font-bold' : 'text-slate-500'}`}
        >
          Arch
        </button>
      </div>
    </header>
  );
};
