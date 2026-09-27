import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { LandingPage } from './components/LandingPage';
import { ShardClusterView } from './components/ShardClusterView';
import { TransferConsole } from './components/TransferConsole';
import { TransactionHistory } from './components/TransactionHistory';
import { ArchitectureView } from './components/ArchitectureView';
import { AuthModal } from './components/AuthModal';
import { CreateAccountModal } from './components/CreateAccountModal';
import { getAccounts, getHealth, getUsers } from './api/client';
import type { Account, SystemHealth, User } from './types';
import { RefreshCw, Send, Wallet } from 'lucide-react';

export function App() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);

  // View state: landing, console, transfer, ledger, architecture
  const [activeTab, setActiveTab] = useState<'landing' | 'console' | 'transfer' | 'ledger' | 'architecture'>('landing');

  // Modal states
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [createAccountModalOpen, setCreateAccountModalOpen] = useState<boolean>(false);

  const fetchData = async () => {
    try {
      const [h, accs, usrs] = await Promise.all([
        getHealth(),
        getAccounts(),
        getUsers().catch(() => [] as User[]),
      ]);
      setHealth(h);
      setAccounts(accs);
      setUsers(usrs);

      // Restore user session if stored
      const savedUserId = localStorage.getItem('transmoney_active_user_id');
      if (savedUserId && usrs.length > 0) {
        const found = usrs.find((u) => u.id === Number(savedUserId));
        if (found) {
          setCurrentUser(found);
          const userAcc = accs.find((a) => a.user?.id === found.id);
          if (userAcc && !selectedAccountId) {
            setSelectedAccountId(userAcc.id);
          }
        }
      } else if (!currentUser && usrs.length > 0) {
        // Default to first user (e.g. Alice) for smooth demoing
        setCurrentUser(usrs[0]);
        const userAcc = accs.find((a) => a.user?.id === usrs[0].id);
        if (userAcc) {
          setSelectedAccountId(userAcc.id);
        }
      }

      if (!selectedAccountId && accs.length > 0) {
        setSelectedAccountId(accs[0].id);
      }
    } catch (err) {
      console.error('Error fetching cluster data', err);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 12000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectUser = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('transmoney_active_user_id', String(user.id));
    const userAcc = accounts.find((a) => a.user?.id === user.id);
    if (userAcc) {
      setSelectedAccountId(userAcc.id);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('transmoney_active_user_id');
  };

  const handleUserCreated = (newUser: User, newAccount: Account) => {
    setUsers((prev) => [...prev, newUser]);
    setAccounts((prev) => [...prev, newAccount]);
    setCurrentUser(newUser);
    setSelectedAccountId(newAccount.id);
    localStorage.setItem('transmoney_active_user_id', String(newUser.id));
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleAccountCreated = (newAccount: Account) => {
    setAccounts((prev) => [...prev, newAccount]);
    setSelectedAccountId(newAccount.id);
    setRefreshTrigger((prev) => prev + 1);
    fetchData();
  };

  const handleTransferComplete = () => {
    fetchData();
    setRefreshTrigger((prev) => prev + 1);
  };

  const currentUserAccounts = accounts.filter(
    (a) => a.user?.id === currentUser?.id || (a as any).userId === currentUser?.id
  );

  return (
    <div className="min-h-screen theme-bg-app theme-text-primary flex flex-col font-sans">
      {/* Universal Header with Theme Switcher */}
      <Header
        health={health}
        currentUser={currentUser}
        userAccounts={currentUserAccounts}
        activeAccountId={selectedAccountId}
        onSelectAccount={(id) => setSelectedAccountId(id)}
        onOpenAuth={(mode) => {
          setAuthModalMode(mode);
          setAuthModalOpen(true);
        }}
        onOpenCreateAccount={() => setCreateAccountModalOpen(true)}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-8">
        {/* Course & Attribution Banner (visible on interior tabs) */}
        {activeTab !== 'landing' && (
          <div className="theme-bg-card theme-border border rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 font-mono text-xs shadow-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full theme-btn-primary animate-pulse" />
                <h2 className="font-bold theme-text-primary uppercase tracking-wider">
                  Distributed Relational Database System — Course Project
                </h2>
              </div>
              <p className="text-[11px] theme-text-secondary font-sans">
                PostgreSQL Sharded Cluster • 2PC Cross-Shard Consensus • Double-Entry Ledger Bookkeeping • Sir Umair Evaluation
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded theme-bg-card-subtle theme-text-primary border theme-border font-semibold">
                Shehzad Nisar (B22110006147)
              </span>
              <span className="px-2.5 py-1 rounded theme-bg-card-subtle theme-text-primary border theme-border font-semibold">
                Muhammad Ashraf (B22110006090)
              </span>
              <span className="px-2.5 py-1 rounded theme-bg-card-subtle theme-text-primary border theme-border font-semibold">
                Daniyal Ahmed (B21110006024)
              </span>
              <button
                onClick={() => {
                  fetchData();
                  setRefreshTrigger((prev) => prev + 1);
                }}
                title="Refresh Shard State"
                className="p-1.5 rounded theme-btn-secondary transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {initialLoading ? (
          <div className="flex flex-col items-center justify-center py-24 theme-text-muted space-y-3 font-mono">
            <RefreshCw className="w-7 h-7 animate-spin theme-text-primary" />
            <span className="text-xs uppercase tracking-wider">
              Connecting to PostgreSQL Sharded Partitions...
            </span>
          </div>
        ) : (
          <>
            {/* View 1: Landing Page */}
            {activeTab === 'landing' && (
              <LandingPage
                health={health}
                accounts={accounts}
                users={users}
                currentUser={currentUser}
                onEnterConsole={() => setActiveTab('console')}
                onOpenAuth={(mode) => {
                  setAuthModalMode(mode);
                  setAuthModalOpen(true);
                }}
              />
            )}

            {/* View 2: Console (Shards + Fast 2PC Wire + Ledger) */}
            {activeTab === 'console' && (
              <div className="space-y-8">
                {/* Active user quick status bar */}
                {currentUser && (
                  <div className="p-4 rounded-xl theme-bg-card theme-border border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-mono text-xs shadow-xs">
                    <div className="flex items-center gap-2.5">
                      <Wallet className="w-4 h-4 theme-text-primary" />
                      <div>
                        <span className="theme-text-muted uppercase text-[10px] block">Active User Perspective</span>
                        <span className="font-bold theme-text-primary text-sm">
                          {currentUser.fullName} ({currentUserAccounts.length} Sharded Account{currentUserAccounts.length === 1 ? '' : 's'})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveTab('transfer')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded theme-btn-primary font-semibold uppercase text-[11px] cursor-pointer"
                      >
                        <Send className="w-3 h-3" />
                        <span>Send 2PC Wire</span>
                      </button>
                      <button
                        onClick={() => setCreateAccountModalOpen(true)}
                        className="px-3 py-1.5 rounded theme-btn-secondary text-[11px] cursor-pointer"
                      >
                        + Open Another Account
                      </button>
                    </div>
                  </div>
                )}

                {/* Shard Topology Cards */}
                <ShardClusterView
                  accounts={accounts}
                  selectedAccountId={selectedAccountId}
                  onSelectAccount={(id) => setSelectedAccountId(id)}
                  onOpenCreateAccount={() => {
                    if (currentUser) {
                      setCreateAccountModalOpen(true);
                    } else {
                      setAuthModalMode('signup');
                      setAuthModalOpen(true);
                    }
                  }}
                />

                {/* 2PC Transfer Console */}
                <TransferConsole
                  accounts={accounts}
                  currentUser={currentUser}
                  activeAccountId={selectedAccountId}
                  onTransferComplete={handleTransferComplete}
                />

                {/* Transaction History & Ledger */}
                <TransactionHistory
                  accounts={accounts}
                  selectedAccountId={selectedAccountId}
                  refreshTrigger={refreshTrigger}
                />
              </div>
            )}

            {/* View 3: Send Money (Dedicated 2PC Flow) */}
            {activeTab === 'transfer' && (
              <div className="space-y-6">
                <div className="border-b theme-border pb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold theme-text-primary uppercase tracking-tight font-mono">
                      Send Money // Cross-Shard 2PC Consensus
                    </h2>
                    <p className="text-xs theme-text-secondary font-mono">
                      Execute cross-border/cross-shard atomic fund transfers with zero deadlock risk
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('console')}
                    className="px-3 py-1.5 rounded theme-btn-secondary font-mono text-xs cursor-pointer"
                  >
                    &larr; Back to Topology
                  </button>
                </div>

                <TransferConsole
                  accounts={accounts}
                  currentUser={currentUser}
                  activeAccountId={selectedAccountId}
                  onTransferComplete={handleTransferComplete}
                />

                <ShardClusterView
                  accounts={accounts}
                  selectedAccountId={selectedAccountId}
                  onSelectAccount={(id) => setSelectedAccountId(id)}
                />
              </div>
            )}

            {/* View 4: Ledger & Audit (Dedicated view) */}
            {activeTab === 'ledger' && (
              <div className="space-y-6">
                <div className="border-b theme-border pb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold theme-text-primary uppercase tracking-tight font-mono">
                      Audit Ledger &amp; Multi-Criteria Search
                    </h2>
                    <p className="text-xs theme-text-secondary font-mono">
                      Immutable double-entry bookkeeping journal entries with dynamic B-tree and trigram search
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('console')}
                    className="px-3 py-1.5 rounded theme-btn-secondary font-mono text-xs cursor-pointer"
                  >
                    &larr; Back to Topology
                  </button>
                </div>

                <TransactionHistory
                  accounts={accounts}
                  selectedAccountId={selectedAccountId}
                  refreshTrigger={refreshTrigger}
                />
              </div>
            )}

            {/* View 5: System Architecture */}
            {activeTab === 'architecture' && <ArchitectureView />}
          </>
        )}
      </main>

      {/* Global Themed Footer */}
      <footer className="border-t theme-border theme-bg-card py-6 text-center text-xs font-mono theme-text-muted">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>
            TransMoney Distributed Digital Wallet System • Built with Spring Boot 3, PostgreSQL 17, and React 19
          </span>
          <div className="flex items-center gap-4 theme-text-secondary">
            <button
              onClick={() => setActiveTab('landing')}
              className="hover:theme-text-primary cursor-pointer"
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('architecture')}
              className="hover:theme-text-primary cursor-pointer"
            >
              Architecture
            </button>
            <a
              href="http://localhost:8080/swagger-ui.html"
              target="_blank"
              rel="noreferrer"
              className="hover:theme-text-primary"
            >
              Swagger
            </a>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        users={users}
        accounts={accounts}
        currentUser={currentUser}
        onSelectUser={handleSelectUser}
        onUserCreated={handleUserCreated}
        initialMode={authModalMode}
      />

      <CreateAccountModal
        isOpen={createAccountModalOpen}
        onClose={() => setCreateAccountModalOpen(false)}
        currentUser={currentUser}
        onAccountCreated={handleAccountCreated}
      />
    </div>
  );
}

export default App;
