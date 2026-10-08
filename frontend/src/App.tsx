import { useState, useEffect } from 'react';
import { Header, type AppTab } from './components/Header';
import { WalletHome } from './components/WalletHome';
import { TransferConsole } from './components/TransferConsole';
import { TransactionHistory } from './components/TransactionHistory';
import { MerchantPortal } from './components/MerchantPortal';
import { AuditorDashboard } from './components/AuditorDashboard';
import { CurrencyExchange } from './components/CurrencyExchange';
import { CoreBankingConsole } from './components/CoreBankingConsole';
import { AuthModal } from './components/AuthModal';
import { CreateAccountModal } from './components/CreateAccountModal';
import { DepositWithdrawModal } from './components/DepositWithdrawModal';
import { getAccounts, getHealth, getUsers, removeToken, updateAccountStatus } from './api/client';
import { walletSocket } from './api/websocket';
import type { Account, SystemHealth, User } from './types';
import { RefreshCw, X } from 'lucide-react';

export function App() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [liveToast, setLiveToast] = useState<{ message: string; type: string } | null>(null);

  // Active view: console (Wallet Home), transfer (Send Money), merchant, ledger, exchange, core
  const [activeTab, setActiveTab] = useState<AppTab>('console');

  // Modal states
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [createAccountModalOpen, setCreateAccountModalOpen] = useState<boolean>(false);
  const [depositModalOpen, setDepositModalOpen] = useState<boolean>(false);
  const [depositModalMode, setDepositModalMode] = useState<'deposit' | 'withdraw'>('deposit');

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

    // Real-Time WebSocket stream integration
    walletSocket.connect();
    const unbind = walletSocket.onEvent((event) => {
      setLiveToast({
        message: `${event.eventType}: ${event.amount} ${event.currency} [${event.transactionId}]`,
        type: event.eventType,
      });
      fetchData();
      setRefreshTrigger((prev) => prev + 1);
      setTimeout(() => setLiveToast(null), 5000);
    });

    return () => {
      clearInterval(interval);
      unbind();
    };
  }, []);

  useEffect(() => {
    if (selectedAccountId) {
      walletSocket.subscribe(selectedAccountId);
    }
  }, [selectedAccountId]);

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
    removeToken();
    localStorage.removeItem('transmoney_active_user_id');
  };

  const handleStatusToggle = async (acc: Account) => {
    try {
      const nextStatus = acc.status === 'ACTIVE' ? 'FROZEN' : 'ACTIVE';
      const updated = await updateAccountStatus(acc.id, nextStatus);
      setAccounts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to update account status');
    }
  };

  const handleDepositSuccess = (updatedAccount: Account) => {
    setAccounts((prev) => prev.map((a) => (a.id === updatedAccount.id ? updatedAccount : a)));
    setRefreshTrigger((prev) => prev + 1);
    fetchData();
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
    <div className="min-h-screen bg-white text-black flex flex-col font-sans">
      {/* Universal Clean FinTech Header */}
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

      {/* Real-Time WebSocket Toast Notification */}
      {liveToast && (
        <div className="fixed top-16 right-4 z-50 max-w-md bg-neutral-900 text-white p-3.5 rounded-2xl shadow-2xl border border-neutral-700 flex items-center justify-between gap-3 text-xs animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <div>
              <span className="text-[10px] text-emerald-400 font-bold block uppercase tracking-wider font-mono">
                Live Transaction Event
              </span>
              <span className="text-xs text-neutral-200 block truncate">{liveToast.message}</span>
            </div>
          </div>
          <button
            onClick={() => setLiveToast(null)}
            className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-8">
        {initialLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-3 font-mono">
            <RefreshCw className="w-7 h-7 animate-spin text-black" />
            <span className="text-xs uppercase tracking-wider">
              Securing Bank Vault &amp; Account Balances...
            </span>
          </div>
        ) : (
          <>
            {/* View 1: Main Wallet Home (SadaPay & Wise Model) */}
            {activeTab === 'console' && (
              <WalletHome
                accounts={accounts}
                currentUser={currentUser}
                selectedAccountId={selectedAccountId}
                onSelectAccount={(id) => setSelectedAccountId(id)}
                onOpenDeposit={() => {
                  setDepositModalMode('deposit');
                  setDepositModalOpen(true);
                }}
                onOpenWithdraw={() => {
                  setDepositModalMode('withdraw');
                  setDepositModalOpen(true);
                }}
                onOpenCreateAccount={() => setCreateAccountModalOpen(true)}
                onNavigateTab={(tab) => {
                  if (tab === 'transfer') setActiveTab('transfer');
                  else if (tab === 'merchant') setActiveTab('merchant');
                  else if (tab === 'exchange') setActiveTab('exchange');
                  else if (tab === 'ledger') setActiveTab('ledger');
                  else if (tab === 'core') setActiveTab('core');
                }}
                onStatusToggle={handleStatusToggle}
                refreshTrigger={refreshTrigger}
              />
            )}

            {/* View 2: Send Money (Frictionless Consumer Transfer Flow) */}
            {activeTab === 'transfer' && (
              <div className="space-y-6">
                <TransferConsole
                  accounts={accounts}
                  currentUser={currentUser}
                  activeAccountId={selectedAccountId}
                  onTransferComplete={handleTransferComplete}
                />
              </div>
            )}

            {/* View 3: Merchant Services & QR Code Payments */}
            {activeTab === 'merchant' && (
              <MerchantPortal
                currentUser={currentUser}
                accounts={accounts}
                activeAccountId={selectedAccountId}
                onRefreshData={fetchData}
              />
            )}

            {/* View 4: Official Statements & Double-Entry Ledger */}
            {activeTab === 'ledger' && (
              <div className="space-y-6">
                <AuditorDashboard
                  accounts={accounts}
                  selectedAccountId={selectedAccountId}
                  refreshTrigger={refreshTrigger}
                />

                <div className="pt-4 border-t border-slate-200">
                  <div className="mb-4">
                    <h3 className="text-base font-bold text-black">
                      Account Statement &amp; Transaction History
                    </h3>
                    <p className="text-xs text-slate-500">
                      Search, filter, and inspect verified transaction records across all regional nodes
                    </p>
                  </div>
                  <TransactionHistory
                    accounts={accounts}
                    selectedAccountId={selectedAccountId}
                    refreshTrigger={refreshTrigger}
                  />
                </div>
              </div>
            )}

            {/* View 5: Multi-Currency & Cross-Border Exchange Engine */}
            {activeTab === 'exchange' && (
              <CurrencyExchange
                accounts={accounts}
                currentUser={currentUser}
                onExchangeComplete={() => {
                  fetchData();
                  setRefreshTrigger((prev) => prev + 1);
                }}
              />
            )}

            {/* View 6: Core Banking & Distributed Infrastructure (Enterprise Console) */}
            {activeTab === 'core' && (
              <CoreBankingConsole
                health={health}
                accounts={accounts}
                selectedAccountId={selectedAccountId}
                currentUser={currentUser}
                onSelectAccount={(id) => setSelectedAccountId(id)}
                onOpenCreateAccount={() => setCreateAccountModalOpen(true)}
                onRefreshData={fetchData}
              />
            )}
          </>
        )}
      </main>

      {/* Global Clean FinTech Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500 font-sans">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-black font-mono">TransMoney</span>
            <span>•</span>
            <span>Next-Generation Multi-Currency Digital Wallet</span>
          </div>
          <div className="flex items-center gap-4 text-slate-600">
            <button
              onClick={() => setActiveTab('console')}
              className="hover:text-black cursor-pointer"
            >
              Wallet Home
            </button>
            <button
              onClick={() => setActiveTab('transfer')}
              className="hover:text-black cursor-pointer"
            >
              Send Money
            </button>
            <button
              onClick={() => setActiveTab('merchant')}
              className="hover:text-black cursor-pointer"
            >
              Merchants
            </button>
            <button
              onClick={() => setActiveTab('core')}
              className="hover:text-black cursor-pointer font-mono text-[11px]"
            >
              Core Banking
            </button>
            <a
              href="http://localhost:8080/swagger-ui.html"
              target="_blank"
              rel="noreferrer"
              className="hover:text-black font-mono text-[11px]"
            >
              API Docs
            </a>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
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

      <DepositWithdrawModal
        isOpen={depositModalOpen}
        onClose={() => setDepositModalOpen(false)}
        account={accounts.find((a) => a.id === selectedAccountId) || accounts[0] || null}
        mode={depositModalMode}
        onSuccess={handleDepositSuccess}
      />
    </div>
  );
}

export default App;
