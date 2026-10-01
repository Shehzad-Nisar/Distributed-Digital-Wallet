import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Scan,
  Store,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  Copy,
  Building2,
  TrendingUp,
  Receipt,
} from 'lucide-react';
import type { Account, Merchant, QrPaymentResponse, QrScanDetails, SettlementBatch, User } from '../types';
import {
  getMerchants,
  generateQrCode,
  scanQrCode,
  payQrCode,
  settleMerchant,
  getSettlementHistory,
  onboardMerchant,
} from '../api/client';

interface MerchantPortalProps {
  currentUser: User | null;
  accounts: Account[];
  activeAccountId: number | null;
  onRefreshData: () => void;
}

export const MerchantPortal: React.FC<MerchantPortalProps> = ({
  currentUser,
  accounts,
  activeAccountId,
  onRefreshData,
}) => {
  const [subTab, setSubTab] = useState<'scan' | 'pos' | 'settlement'>('scan');
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [selectedMerchantId, setSelectedMerchantId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // --- Scan & Pay State ---
  const [rawPayloadInput, setRawPayloadInput] = useState<string>('');
  const [scannedDetails, setScannedDetails] = useState<QrScanDetails | null>(null);
  const [scanPayerAccountId, setScanPayerAccountId] = useState<number>(
    activeAccountId || (accounts.length > 0 ? accounts[0].id : 1)
  );
  const [customPayAmount, setCustomPayAmount] = useState<string>('');
  const [paymentResult, setPaymentResult] = useState<QrPaymentResponse | null>(null);
  const [payingState, setPayingState] = useState<'idle' | 'initiating' | 'preparing' | 'committing' | 'done'>('idle');

  // --- POS & QR Generator State ---
  const [qrAmount, setQrAmount] = useState<string>('500');
  const [isDynamic, setIsDynamic] = useState<boolean>(true);
  const [orderRef, setOrderRef] = useState<string>('ORD-' + Math.floor(1000 + Math.random() * 9000));
  const [expiryMins, setExpiryMins] = useState<number>(15);
  const [generatedQr, setGeneratedQr] = useState<{
    payload: string;
    svg: string;
    dataUrl: string;
    expiresAt?: string;
  } | null>(null);

  // --- Onboarding Modal/Form State ---
  const [showOnboardModal, setShowOnboardModal] = useState<boolean>(false);
  const [onboardName, setOnboardName] = useState<string>('');
  const [onboardCategory, setOnboardCategory] = useState<string>('RETAIL');
  const [onboardFeeRate, setOnboardFeeRate] = useState<string>('1.50');

  // --- Settlement State ---
  const [settlements, setSettlements] = useState<SettlementBatch[]>([]);
  const [settling, setSettling] = useState<boolean>(false);

  // Fetch all merchants
  const fetchMerchants = async () => {
    try {
      setLoading(true);
      const list = await getMerchants();
      setMerchants(list);
      if (list.length > 0 && !selectedMerchantId) {
        setSelectedMerchantId(list[0].id);
      }
    } catch (err: unknown) {
      console.error('Failed to load merchants', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMerchants();
  }, []);

  const activeMerchant = merchants.find((m) => m.id === selectedMerchantId) || merchants[0];

  // Fetch settlements when switching to settlement tab or changing merchant
  useEffect(() => {
    if (activeMerchant && subTab === 'settlement') {
      getSettlementHistory(activeMerchant.id)
        .then(setSettlements)
        .catch(console.error);
    }
  }, [activeMerchant?.id, subTab]);

  // Sync scan payer account with active account
  useEffect(() => {
    if (activeAccountId) {
      setScanPayerAccountId(activeAccountId);
    }
  }, [activeAccountId]);

  // Handle Scanning / Decoding QR Code
  const handleVerifyPayload = async (payloadToTest?: string) => {
    const targetPayload = payloadToTest || rawPayloadInput;
    if (!targetPayload.trim()) {
      setErrorMsg('Please enter or generate a QR payload first.');
      return;
    }
    setErrorMsg(null);
    setSuccessMsg(null);
    setPaymentResult(null);

    try {
      setLoading(true);
      const details = await scanQrCode(targetPayload.trim());
      setScannedDetails(details);
      if (details.amount) {
        setCustomPayAmount(String(details.amount));
      } else {
        setCustomPayAmount('');
      }
      if (!details.valid) {
        setErrorMsg(details.message || 'Invalid QR code.');
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setErrorMsg(e.response?.data?.message || 'Failed to scan and verify QR payload.');
      setScannedDetails(null);
    } finally {
      setLoading(false);
    }
  };

  // Preset Invoices Generator & Auto-scan
  const handleSelectPreset = async (merchantCode: string, amount: number, ref: string, dynamic: boolean = true) => {
    const targetMch = merchants.find((m) => m.merchantCode === merchantCode) || merchants[0];
    if (!targetMch) return;

    try {
      setLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);
      setPaymentResult(null);

      const qr = await generateQrCode({
        merchantId: targetMch.id,
        amount: dynamic ? amount : undefined,
        orderRef: ref,
        isDynamic: dynamic,
        expiryMinutes: 15,
      });

      setRawPayloadInput(qr.qrPayload);
      await handleVerifyPayload(qr.qrPayload);
    } catch (err: unknown) {
      console.error('Failed to create demo invoice', err);
    } finally {
      setLoading(false);
    }
  };

  // Execute QR Payment with 2PC Stepper
  const handleExecuteQrPayment = async () => {
    if (!scannedDetails || !scannedDetails.valid) {
      setErrorMsg('Cannot pay invalid or unverified QR code.');
      return;
    }

    const payAmount = scannedDetails.isDynamic && scannedDetails.amount
      ? scannedDetails.amount
      : parseFloat(customPayAmount);

    if (!payAmount || payAmount <= 0) {
      setErrorMsg('Please specify a positive payment amount.');
      return;
    }

    try {
      setErrorMsg(null);
      setSuccessMsg(null);
      setPayingState('initiating');

      // Visual 2PC phases
      await new Promise((r) => setTimeout(r, 400));
      setPayingState('preparing');
      await new Promise((r) => setTimeout(r, 500));
      setPayingState('committing');

      const idempotencyKey = 'IDEMP-QR-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
      const resp = await payQrCode({
        qrPayload: rawPayloadInput.trim(),
        payerAccountId: scanPayerAccountId,
        amount: scannedDetails.isDynamic ? undefined : payAmount,
        idempotencyKey,
      });

      setPayingState('done');
      setPaymentResult(resp);
      setSuccessMsg(`Paid ${resp.grossAmount} PKR to ${resp.merchantName} successfully!`);
      onRefreshData();
      fetchMerchants();
    } catch (err: unknown) {
      setPayingState('idle');
      const e = err as { response?: { data?: { message?: string } } };
      setErrorMsg(e.response?.data?.message || 'QR Payment failed during 2PC coordination.');
    }
  };

  // Generate QR in POS view
  const handleGeneratePosQr = async () => {
    if (!activeMerchant) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    const amt = isDynamic && qrAmount ? parseFloat(qrAmount) : undefined;
    if (isDynamic && (!amt || amt <= 0)) {
      setErrorMsg('Please enter a valid amount for dynamic invoice.');
      return;
    }

    try {
      setLoading(true);
      const res = await generateQrCode({
        merchantId: activeMerchant.id,
        amount: amt,
        orderRef: orderRef.trim() || undefined,
        isDynamic,
        expiryMinutes: expiryMins,
      });

      setGeneratedQr({
        payload: res.qrPayload,
        svg: res.qrSvg,
        dataUrl: res.qrImageDataUrl,
        expiresAt: res.expiresAt,
      });
      setSuccessMsg('Signed QR Code generated successfully!');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setErrorMsg(e.response?.data?.message || 'Failed to generate QR code.');
    } finally {
      setLoading(false);
    }
  };

  // Trigger End of Day Settlement
  const handleTriggerSettlement = async () => {
    if (!activeMerchant) return;
    try {
      setSettling(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const batch = await settleMerchant(activeMerchant.id);
      setSuccessMsg(`Settlement Batch ${batch.batchReference} executed! Net Payout: ${batch.netSettlementAmount} PKR`);
      fetchMerchants();
      const updatedHistory = await getSettlementHistory(activeMerchant.id);
      setSettlements(updatedHistory);
      onRefreshData();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setErrorMsg(e.response?.data?.message || 'Settlement execution failed.');
    } finally {
      setSettling(false);
    }
  };

  // Onboard New Merchant
  const handleOnboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onboardName.trim()) {
      setErrorMsg('Business name is required.');
      return;
    }

    try {
      setLoading(true);
      const created = await onboardMerchant({
        userId: currentUser?.id,
        businessName: onboardName.trim(),
        category: onboardCategory,
        accountId: activeAccountId || (accounts.length > 0 ? accounts[0].id : undefined),
        feeRatePercent: parseFloat(onboardFeeRate) || 1.5,
      });

      setShowOnboardModal(false);
      setOnboardName('');
      setSuccessMsg(`Merchant "${created.name}" onboarded with code ${created.merchantCode}!`);
      await fetchMerchants();
      setSelectedMerchantId(created.id);
      onRefreshData();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setErrorMsg(e.response?.data?.message || 'Failed to onboard merchant.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Mode Selector */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Store className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900">Merchant Services & QR Payments</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-semibold">
              PHASE 4 ACTIVE
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            Cryptographic HMAC QR Payloads &bull; Cross-Shard 2PC Settlement &bull; MDR Fee Engine (1.5%)
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg font-mono text-xs">
          <button
            onClick={() => setSubTab('scan')}
            className={`px-3.5 py-1.5 rounded-md flex items-center gap-2 transition cursor-pointer font-medium ${
              subTab === 'scan' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Scan className="w-3.5 h-3.5" />
            <span>Scan & Pay</span>
          </button>

          <button
            onClick={() => setSubTab('pos')}
            className={`px-3.5 py-1.5 rounded-md flex items-center gap-2 transition cursor-pointer font-medium ${
              subTab === 'pos' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>POS & Generator</span>
          </button>

          <button
            onClick={() => setSubTab('settlement')}
            className={`px-3.5 py-1.5 rounded-md flex items-center gap-2 transition cursor-pointer font-medium ${
              subTab === 'settlement' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Settlement Batches</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2 font-mono">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2 font-mono">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ========================================================
          MODE 1: SCAN & PAY (Customer Flow)
         ======================================================== */}
      {subTab === 'scan' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: QR Input & Demo Invoice Presets */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Scan className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Scan or Paste QR Code Payload</span>
                </label>
                <span className="text-[11px] font-mono text-slate-400">HMAC-SHA256 Token</span>
              </div>

              <textarea
                value={rawPayloadInput}
                onChange={(e) => setRawPayloadInput(e.target.value)}
                placeholder="Paste Base64 URL QR Payload or JSON token here..."
                rows={4}
                className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-slate-900 text-slate-800"
              />

              <div className="mt-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleVerifyPayload()}
                  disabled={loading || !rawPayloadInput.trim()}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 disabled:opacity-50 transition flex items-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verify QR Cryptography</span>
                </button>

                {rawPayloadInput && (
                  <button
                    onClick={() => {
                      setRawPayloadInput('');
                      setScannedDetails(null);
                      setPaymentResult(null);
                    }}
                    className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer font-mono"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Quick Demo Invoices */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
              <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>One-Click Merchant QR Invoices (Test Hub)</span>
              </h3>
              <p className="text-[11px] text-slate-500 font-mono mb-3">
                Select a merchant invoice below to automatically generate a signed QR code and decode it into the terminal:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  onClick={() => handleSelectPreset('MCH-FP-001', 850, 'ORD-FP-LUNCH', true)}
                  className="p-3 bg-white border border-slate-200 hover:border-indigo-400 rounded-lg text-left transition cursor-pointer group shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900">FoodPanda Express</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-rose-50 text-rose-600 rounded">DINING</span>
                  </div>
                  <div className="mt-1 text-sm font-bold text-slate-900 font-mono">850.00 PKR</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">Fixed Dynamic Invoice (15m)</div>
                </button>

                <button
                  onClick={() => handleSelectPreset('MCH-DARAZ-002', 4200, 'ORD-DZ-AIRPODS', true)}
                  className="p-3 bg-white border border-slate-200 hover:border-indigo-400 rounded-lg text-left transition cursor-pointer group shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900">Daraz Online</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded">ECOMMERCE</span>
                  </div>
                  <div className="mt-1 text-sm font-bold text-slate-900 font-mono">4,200.00 PKR</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">Wireless Earbuds Checkout</div>
                </button>

                <button
                  onClick={() => handleSelectPreset('MCH-KE-003', 12850, 'INV-KE-OCT', true)}
                  className="p-3 bg-white border border-slate-200 hover:border-indigo-400 rounded-lg text-left transition cursor-pointer group shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900">K-Electric Bill</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded">UTILITY</span>
                  </div>
                  <div className="mt-1 text-sm font-bold text-slate-900 font-mono">12,850.00 PKR</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">Monthly Power Tariff</div>
                </button>

                <button
                  onClick={() => handleSelectPreset('MCH-FP-001', 0, 'TIP-JAR', false)}
                  className="p-3 bg-white border border-slate-200 hover:border-indigo-400 rounded-lg text-left transition cursor-pointer group shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900">Static Table QR</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded">OPEN</span>
                  </div>
                  <div className="mt-1 text-sm font-bold text-emerald-600 font-mono">Open Amount</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">Table POS / Tip Jar (No Expiry)</div>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Decoded Payload & Payment Confirmation */}
          <div className="lg:col-span-6 space-y-6">
            {scannedDetails ? (
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[11px] font-mono text-indigo-600 uppercase font-semibold">Verified Merchant Invoice</span>
                    <h3 className="text-base font-bold text-slate-900">{scannedDetails.merchantName}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span>CRYPTOGRAPHIC SIGNATURE VALID</span>
                    </span>
                  </div>
                </div>

                {/* Amount Display & Breakdown */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="text-xs font-mono text-slate-500">Payable Purchase Amount</div>
                  {scannedDetails.isDynamic && scannedDetails.amount ? (
                    <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
                      {scannedDetails.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {scannedDetails.currency}
                    </div>
                  ) : (
                    <div className="mt-2">
                      <label className="text-xs text-slate-600 block mb-1">Enter Custom Amount ({scannedDetails.currency}):</label>
                      <input
                        type="number"
                        min="1"
                        value={customPayAmount}
                        onChange={(e) => setCustomPayAmount(e.target.value)}
                        placeholder="e.g. 500"
                        className="w-full text-base font-mono font-bold p-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                      />
                    </div>
                  )}

                  {/* Fee Breakdown Note */}
                  <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-2 text-[11px] font-mono text-slate-600">
                    <div>
                      <span>Platform MDR Fee ({scannedDetails.feeRatePercent}%):</span>
                      <div className="font-semibold text-slate-800">
                        {scannedDetails.estimatedFee ? scannedDetails.estimatedFee.toFixed(2) : (parseFloat(customPayAmount || '0') * (scannedDetails.feeRatePercent || 1.5) / 100).toFixed(2)} {scannedDetails.currency}
                      </div>
                    </div>
                    <div>
                      <span>Net Merchant Credited:</span>
                      <div className="font-semibold text-emerald-700">
                        {scannedDetails.estimatedNetAmount ? scannedDetails.estimatedNetAmount.toFixed(2) : (parseFloat(customPayAmount || '0') * (1 - (scannedDetails.feeRatePercent || 1.5) / 100)).toFixed(2)} {scannedDetails.currency}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Routing & Metadata */}
                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">DESTINATION ACCOUNT</span>
                    <span className="font-semibold text-slate-800">{scannedDetails.merchantAccountNumber}</span>
                    <span className="text-[10px] text-indigo-600 block mt-0.5">{scannedDetails.merchantShard}</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">INVOICE ORDER REF</span>
                    <span className="font-semibold text-slate-800">{scannedDetails.orderRef || 'OPEN-POS'}</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">{scannedDetails.isDynamic ? 'Dynamic Expirable' : 'Static Persistent'}</span>
                  </div>
                </div>

                {/* Select Payer Account */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1 font-mono">
                    PAY WITH ACCOUNT:
                  </label>
                  <select
                    value={scanPayerAccountId}
                    onChange={(e) => setScanPayerAccountId(Number(e.target.value))}
                    className="w-full text-xs font-mono p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden text-slate-800"
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.accountNumber} ({acc.shard}) &mdash; Bal: {acc.balance.toLocaleString()} {acc.currency}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2PC Live Progress Stepper during payment */}
                {payingState !== 'idle' && (
                  <div className="p-3 bg-slate-900 text-white rounded-lg font-mono text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1.5 text-amber-400">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Two-Phase Commit (2PC) Execution</span>
                      </span>
                      <span className="text-[10px] uppercase text-slate-400">{payingState}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                      <div className={`p-1.5 rounded ${payingState === 'initiating' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'bg-slate-800 text-slate-400'}`}>
                        1. Lock Rows
                      </div>
                      <div className={`p-1.5 rounded ${payingState === 'preparing' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'bg-slate-800 text-slate-400'}`}>
                        2. Phase 1 (Prepare)
                      </div>
                      <div className={`p-1.5 rounded ${payingState === 'committing' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'bg-slate-800 text-slate-400'}`}>
                        3. Phase 2 (Commit)
                      </div>
                    </div>
                  </div>
                )}

                {/* Confirm Pay Button */}
                <button
                  type="button"
                  onClick={handleExecuteQrPayment}
                  disabled={payingState !== 'idle' || loading || scannedDetails.isExpired}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Execute 2PC QR Payment</span>
                </button>
              </div>
            ) : (
              <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-12 text-center text-slate-500 font-mono text-xs">
                <QrCode className="w-12 h-12 mx-auto text-slate-400 mb-3 stroke-[1.2]" />
                <div className="font-semibold text-slate-700">No QR Code Decoded</div>
                <div className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                  Paste a QR payload on the left or click any One-Click Demo Invoice to preview cryptographic verification and cross-shard settlement.
                </div>
              </div>
            )}

            {/* Payment Receipt Result */}
            {paymentResult && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 font-mono text-xs text-emerald-950 space-y-3">
                <div className="flex items-center gap-2 font-bold text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>TRANSACTION COMMITTED ({paymentResult.transactionId})</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>Payer: <span className="font-semibold">{paymentResult.payerAccountNumber}</span> ({paymentResult.payerShard})</div>
                  <div>Merchant: <span className="font-semibold">{paymentResult.merchantName}</span> ({paymentResult.merchantShard})</div>
                  <div>Gross Amount: <span className="font-semibold">{paymentResult.grossAmount} {paymentResult.currency}</span></div>
                  <div>MDR Fee Deducted: <span className="font-semibold">{paymentResult.feeAmount} {paymentResult.currency}</span></div>
                  <div>Net Credited: <span className="font-semibold text-emerald-700">{paymentResult.netAmount} {paymentResult.currency}</span></div>
                  <div>Replay Cache: <span>{paymentResult.cachedReplay ? 'HIT (Idempotent)' : 'MISS (New Tx)'}</span></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          MODE 2: POS TERMINAL & QR GENERATOR (Merchant Flow)
         ======================================================== */}
      {subTab === 'pos' && (
        <div className="space-y-6">
          {/* Merchant Profile Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-500 font-mono">ACTIVE MERCHANT:</label>
                  <select
                    value={selectedMerchantId || ''}
                    onChange={(e) => setSelectedMerchantId(Number(e.target.value))}
                    className="font-bold text-sm text-slate-900 bg-transparent border-b border-slate-300 focus:outline-hidden py-0.5"
                  >
                    {merchants.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.merchantCode})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="text-xs text-slate-500 font-mono mt-0.5">
                  Category: <span className="font-semibold text-slate-700">{activeMerchant?.category}</span> &bull; Settlement Account: <span className="font-semibold text-slate-700">{activeMerchant?.accountNumber}</span> &bull; MDR Fee: <span className="font-semibold text-indigo-600">{activeMerchant?.feeRatePercent}%</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowOnboardModal(true)}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-mono transition cursor-pointer flex items-center gap-1.5 self-start md:self-auto"
            >
              <span>+ Register New Merchant</span>
            </button>
          </div>

          {/* Business Metrics Grid */}
          {activeMerchant && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs font-mono">
                <div className="text-[11px] text-slate-400">TOTAL PROCESSED VOLUME</div>
                <div className="text-xl font-bold text-slate-900 mt-1">
                  {Number(activeMerchant.accumulatedGross || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-xs text-slate-500">PKR</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs font-mono">
                <div className="text-[11px] text-slate-400">PLATFORM FEES PAID</div>
                <div className="text-xl font-bold text-slate-600 mt-1">
                  {Number(activeMerchant.accumulatedFees || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-xs text-slate-500">PKR</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs font-mono">
                <div className="text-[11px] text-slate-400">ACCUMULATED NET SETTLED</div>
                <div className="text-xl font-bold text-emerald-700 mt-1">
                  {Number(activeMerchant.accumulatedNetSettled || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-xs text-slate-500">PKR</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs font-mono">
                <div className="text-[11px] text-slate-400">UNSETTLED BALANCE</div>
                <div className="text-xl font-bold text-indigo-600 mt-1">
                  {Number(activeMerchant.unsettledBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-xs text-slate-500">PKR</span>
                </div>
              </div>
            </div>
          )}

          {/* POS Terminal & QR Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Terminal Form */}
            <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                  <Receipt className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Point of Sale Invoice Generator</span>
                </h3>
                <span className="text-[11px] font-mono text-slate-400">{activeMerchant?.name}</span>
              </div>

              <div className="space-y-3 font-mono text-xs">
                {/* QR Type Toggle */}
                <div>
                  <label className="text-slate-600 block mb-1 font-semibold">QR Code Type:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setIsDynamic(true)}
                      className={`p-2 rounded-lg border text-center transition cursor-pointer ${
                        isDynamic ? 'bg-indigo-50 border-indigo-400 text-indigo-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      Dynamic Invoice (Fixed Amount)
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsDynamic(false)}
                      className={`p-2 rounded-lg border text-center transition cursor-pointer ${
                        !isDynamic ? 'bg-indigo-50 border-indigo-400 text-indigo-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      Static POS (Open Amount)
                    </button>
                  </div>
                </div>

                {/* Amount */}
                {isDynamic && (
                  <div>
                    <label className="text-slate-600 block mb-1 font-semibold">Invoice Amount (PKR):</label>
                    <input
                      type="number"
                      min="1"
                      value={qrAmount}
                      onChange={(e) => setQrAmount(e.target.value)}
                      placeholder="e.g. 1500"
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-bold text-sm focus:outline-hidden"
                    />
                  </div>
                )}

                {/* Order Reference */}
                <div>
                  <label className="text-slate-600 block mb-1 font-semibold">Order / Bill Reference:</label>
                  <input
                    type="text"
                    value={orderRef}
                    onChange={(e) => setOrderRef(e.target.value)}
                    placeholder="e.g. ORD-98124"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden"
                  />
                </div>

                {/* Expiry Dropdown */}
                {isDynamic && (
                  <div>
                    <label className="text-slate-600 block mb-1 font-semibold">Expiration Window:</label>
                    <select
                      value={expiryMins}
                      onChange={(e) => setExpiryMins(Number(e.target.value))}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden"
                    >
                      <option value={5}>5 Minutes (Quick Checkout)</option>
                      <option value={15}>15 Minutes (Standard Retail)</option>
                      <option value={60}>1 Hour (Dining & Services)</option>
                      <option value={1440}>24 Hours (E-Commerce Invoicing)</option>
                    </select>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleGeneratePosQr}
                  disabled={loading}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 mt-2"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Generate Cryptographic QR</span>
                </button>
              </div>
            </div>

            {/* QR Code Presentation Display */}
            <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col items-center justify-center text-center">
              {generatedQr ? (
                <div className="space-y-4 max-w-sm w-full">
                  <div className="border border-slate-200 rounded-2xl p-6 bg-white shadow-sm inline-block">
                    {/* SVG Vector Render */}
                    <div
                      className="w-60 h-60 mx-auto"
                      dangerouslySetInnerHTML={{ __html: generatedQr.svg }}
                    />
                  </div>

                  <div>
                    <div className="font-bold text-slate-900 text-base">{activeMerchant?.name}</div>
                    <div className="text-xs text-slate-500 font-mono">
                      {isDynamic ? `${parseFloat(qrAmount).toFixed(2)} PKR &bull; Dynamic Expiry` : 'Static POS &bull; Open Amount'}
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2 font-mono text-xs">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedQr.payload);
                        setSuccessMsg('QR payload copied to clipboard!');
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Payload</span>
                    </button>

                    <button
                      onClick={() => {
                        setRawPayloadInput(generatedQr.payload);
                        handleVerifyPayload(generatedQr.payload);
                        setSubTab('scan');
                      }}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Scan className="w-3.5 h-3.5" />
                      <span>Test in Scanner</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-slate-400 font-mono text-xs py-12">
                  <QrCode className="w-16 h-16 mx-auto mb-2 opacity-30" />
                  <span>Configure POS settings on the left to render live scannable QR.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODE 3: END-OF-DAY SETTLEMENT BATCHES
         ======================================================== */}
      {subTab === 'settlement' && (
        <div className="space-y-6 font-mono">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>End-of-Day Settlement Engine ({activeMerchant?.name})</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Batches all unsettled gross revenue, deducts the 1.5% MDR platform fee, and issues bank payout.
              </p>
            </div>

            <button
              onClick={handleTriggerSettlement}
              disabled={settling}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${settling ? 'animate-spin' : ''}`} />
              <span>{settling ? 'Settling...' : 'Trigger Settlement Run'}</span>
            </button>
          </div>

          {/* Settlement Batches Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700">
              HISTORICAL SETTLEMENT BATCHES
            </div>

            {settlements.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5">Batch Reference</th>
                      <th className="px-4 py-2.5">Date</th>
                      <th className="px-4 py-2.5">Txs</th>
                      <th className="px-4 py-2.5">Gross Volume</th>
                      <th className="px-4 py-2.5">MDR Fees (1.5%)</th>
                      <th className="px-4 py-2.5">Net Payout</th>
                      <th className="px-4 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {settlements.map((s) => (
                      <tr key={s.batchReference} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-bold text-slate-900">{s.batchReference}</td>
                        <td className="px-4 py-3 text-slate-500">{new Date(s.settlementDate).toLocaleDateString()}</td>
                        <td className="px-4 py-3">{s.transactionCount}</td>
                        <td className="px-4 py-3 font-semibold">{s.grossVolume.toLocaleString()} PKR</td>
                        <td className="px-4 py-3 text-rose-600 font-semibold">{s.totalFees.toLocaleString()} PKR</td>
                        <td className="px-4 py-3 text-emerald-700 font-bold">{s.netSettlementAmount.toLocaleString()} PKR</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold">
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                No past settlement batches recorded for this merchant.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: ONBOARD NEW MERCHANT
         ======================================================== */}
      {showOnboardModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 font-mono flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <span>Onboard Merchant Profile</span>
              </h3>
              <button
                onClick={() => setShowOnboardModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleOnboardSubmit} className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Business Name:</label>
                <input
                  type="text"
                  required
                  value={onboardName}
                  onChange={(e) => setOnboardName(e.target.value)}
                  placeholder="e.g. Metro Supermarket"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Business Category:</label>
                <select
                  value={onboardCategory}
                  onChange={(e) => setOnboardCategory(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden"
                >
                  <option value="RETAIL">Retail & Groceries</option>
                  <option value="FOOD_BEVERAGE">Food & Beverage / Dining</option>
                  <option value="ECOMMERCE">E-Commerce & Digital Goods</option>
                  <option value="UTILITIES">Utilities & Public Services</option>
                  <option value="SERVICES">Consulting & Professional Services</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">MDR Fee Rate (%):</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.1"
                  value={onboardFeeRate}
                  onChange={(e) => setOnboardFeeRate(e.target.value)}
                  placeholder="1.50"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowOnboardModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold transition cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Register Merchant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
