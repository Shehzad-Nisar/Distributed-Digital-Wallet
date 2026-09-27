import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import { createAccount } from '../api/client';
import type { Account, ShardType, User } from '../types';

interface CreateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onAccountCreated: (account: Account) => void;
}

const SHARD_OPTIONS: { value: ShardType; label: string; desc: string }[] = [
  { value: 'SHARD_1_NORTH', label: 'Shard 1 (North)', desc: 'Islamabad / KPK Cluster' },
  { value: 'SHARD_2_CENTRAL', label: 'Shard 2 (Central)', desc: 'Lahore / Punjab Cluster' },
  { value: 'SHARD_3_SOUTH', label: 'Shard 3 (South)', desc: 'Karachi / Coastal Cluster' },
  { value: 'SHARD_4_ENTERPRISE', label: 'Shard 4 (Enterprise)', desc: 'Corporate / B2B Cluster' },
];

export const CreateAccountModal: React.FC<CreateAccountModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onAccountCreated,
}) => {
  const [accountNumber, setAccountNumber] = useState(
    `ACC-${currentUser?.fullName?.split(' ')[0]?.toUpperCase() || 'USR'}-${Math.floor(100 + Math.random() * 900)}`
  );
  const [shard, setShard] = useState<ShardType>('SHARD_2_CENTRAL');
  const [initialBalance, setInitialBalance] = useState('2500');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !currentUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const newAcc = await createAccount({
        userId: currentUser.id,
        accountNumber: accountNumber.trim().toUpperCase(),
        currency: 'PKR',
        initialBalance: Number(initialBalance) || 0,
        shard,
      });

      onAccountCreated(newAcc);
      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to create account.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs font-sans">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-black">
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <div>
            <h3 className="text-base font-bold text-black uppercase tracking-tight">
              Open Sharded Account
            </h3>
            <p className="text-xs text-slate-500 font-mono">
              Account Owner: {currentUser.fullName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-black hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-lg border border-rose-300 bg-rose-50 text-xs text-rose-800 font-mono">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="text-[11px] font-mono uppercase text-slate-600 block mb-1">
              Account Identifier *
            </label>
            <input
              type="text"
              required
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-black text-xs font-mono uppercase focus:outline-none focus:border-black transition"
            />
          </div>

          <div>
            <label className="text-[11px] font-mono uppercase text-slate-600 block mb-1">
              Initial Deposit (PKR) *
            </label>
            <input
              type="number"
              min="0"
              step="100"
              required
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-black text-xs font-mono focus:outline-none focus:border-black transition"
            />
          </div>

          <div>
            <label className="text-[11px] font-mono uppercase text-slate-600 block mb-1">
              Choose Shard Node *
            </label>
            <div className="space-y-1.5">
              {SHARD_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setShard(opt.value)}
                  className={`w-full p-2.5 rounded-lg border text-left transition cursor-pointer flex items-center justify-between ${
                    shard === opt.value
                      ? 'border-black bg-slate-50 text-black font-semibold'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold font-mono block">{opt.label}</span>
                    <span className="text-[10px] text-slate-500 block">{opt.desc}</span>
                  </div>
                  {shard === opt.value && <Check className="w-4 h-4 text-black shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-black text-white hover:bg-slate-800 font-semibold text-xs uppercase tracking-wider transition disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {loading ? 'Creating...' : 'Open Account in Shard'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
