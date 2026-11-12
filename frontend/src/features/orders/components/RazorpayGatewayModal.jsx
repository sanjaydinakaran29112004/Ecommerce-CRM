import React, { useState, useEffect } from 'react';
import { formatCurrency } from '@/utils/formatCurrency';
import {
  ShieldCheck,
  Lock,
  CheckCircle2,
  QrCode,
  CreditCard,
  Building2,
  Sparkles,
  ArrowRight,
  Printer,
  Loader2,
  Copy,
  Check,
  Truck,
} from 'lucide-react';

export function RazorpayGatewayModal({ isOpen, onClose, orderData, onPaymentSuccess }) {
  const [method, setMethod] = useState('upi');
  const [step, setStep] = useState('SELECT'); // SELECT | PROCESSING | SUCCESS
  const [upiId, setUpiId] = useState('customer@okhdfcbank');
  const [cardNumber, setCardNumber] = useState('4532 8920 1823 4902');
  const [cardExpiry, setCardExpiry] = useState('09/28');
  const [cardCvv, setCardCvv] = useState('724');
  const [cardName, setCardName] = useState(orderData?.customer?.name || 'Sanjay Dinakaran');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [paymentResult, setPaymentResult] = useState(null);
  const [copiedId, setCopiedId] = useState(false);
  const [countdown, setCountdown] = useState(299); // 5 min timer

  const totalAmount = orderData?.pricing?.total || 17699;
  const orderNumber = orderData?.orderNumber || `ORD-2026-${Math.floor(9000 + Math.random() * 900)}`;

  // Reset state on open and automatically align with the order's chosen payment method!
  useEffect(() => {
    if (isOpen) {
      setStep('SELECT');
      setPaymentResult(null);
      setCountdown(299);
      if (orderData?.customer?.name) {
        setCardName(orderData.customer.name);
      }

      // Auto-select method based on what was chosen on the order page!
      const pm = (orderData?.paymentMethod || '').toLowerCase();
      if (pm.includes('card')) {
        setMethod('card');
      } else if (pm.includes('netbanking') || pm.includes('net banking')) {
        setMethod('netbanking');
      } else if (pm.includes('cash on delivery') || pm.includes('cod')) {
        setMethod('cod');
      } else {
        setMethod('upi');
      }
    }
  }, [isOpen, orderData]);

  // Countdown timer for QR
  useEffect(() => {
    if (!isOpen || step !== 'SELECT') return;
    const timer = setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, step]);

  if (!isOpen) return null;

  const handleSimulatePayment = () => {
    setStep('PROCESSING');

    // Realistic banking latency simulation (or instant verification for COD)
    const delay = method === 'cod' ? 500 : 1800;
    setTimeout(() => {
      const generatedPayId = method === 'cod' ? `cod_Ref${Date.now().toString().slice(-6)}` : `pay_Rzp${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
      const generatedRrn = method === 'cod' ? 'COD-PAY-ON-DELIVERY' : `RRN-${Math.floor(100000000000 + Math.random() * 900000000000)}`;
      const result = {
        paymentId: generatedPayId,
        bankRrn: generatedRrn,
        method: method === 'cod' ? 'Cash on Delivery' : method.toUpperCase(),
        amount: totalAmount,
        paidAt: method === 'cod' ? null : new Date().toISOString(),
        orderNumber,
        customerName: orderData?.customer?.name || cardName,
        status: method === 'cod' ? 'COD_PENDING' : 'CAPTURED',
      };
      setPaymentResult(result);
      setStep('SUCCESS');
      if (onPaymentSuccess) {
        onPaymentSuccess(result);
      }
    }, delay);
  };

  const copyPaymentId = () => {
    if (paymentResult?.paymentId) {
      navigator.clipboard.writeText(paymentResult.paymentId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
        
        {/* Razorpay Branded Header */}
        <div className="bg-[#0c2340] text-white p-5 flex items-center justify-between border-b border-blue-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-md">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm tracking-tight text-white">EntryKode Payments</span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-emerald-500/30">
                  LIVE GATEWAY
                </span>
              </div>
              <p className="text-[11px] text-slate-300 flex items-center gap-1 mt-0.5">
                <Lock className="w-3 h-3 text-emerald-400 inline" />
                <span>256-bit Bank-Grade SSL Encryption • Razorpay Engine</span>
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-300 block font-semibold uppercase tracking-wider">Amount to Pay</span>
            <span className="text-lg font-black text-white tracking-tight">{formatCurrency(totalAmount)}</span>
          </div>
        </div>

        {/* Modal Body Based on Step */}
        {step === 'SELECT' && (
          <div className="p-0 flex flex-col md:flex-row min-h-[380px]">
            {/* Left Method Tabs */}
            <div className="w-full md:w-48 bg-slate-50 border-r border-slate-200 p-2 space-y-1">
              <button
                onClick={() => setMethod('upi')}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-all ${
                  method === 'upi'
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <QrCode className="w-4 h-4 shrink-0" />
                <span>UPI / QR Code</span>
              </button>

              <button
                onClick={() => setMethod('card')}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-all ${
                  method === 'card'
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <CreditCard className="w-4 h-4 shrink-0" />
                <span>Card (Debit/Credit)</span>
              </button>

              <button
                onClick={() => setMethod('netbanking')}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-all ${
                  method === 'netbanking'
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Building2 className="w-4 h-4 shrink-0" />
                <span>Net Banking</span>
              </button>

              <button
                onClick={() => setMethod('cod')}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-all ${
                  method === 'cod'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Truck className="w-4 h-4 shrink-0" />
                <span>Cash on Delivery</span>
              </button>

              <div className="pt-4 px-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">
                  Order Details
                </span>
                <p className="text-[11px] font-bold text-slate-800">{orderNumber}</p>
                <p className="text-[11px] text-slate-500 truncate">{orderData?.customer?.name}</p>
              </div>
            </div>

            {/* Right Method Form */}
            <div className="flex-1 p-5 flex flex-col justify-between">
              {method === 'upi' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Scan & Pay using any UPI App</span>
                    <span className="text-[10px] font-mono text-amber-600 bg-amber-50 px-2 py-0.5 rounded font-semibold border border-amber-200">
                      ⏱ {formatTimer(countdown)}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    {/* Visual QR Code Generator Simulation */}
                    <div className="w-28 h-28 bg-white p-2 rounded-lg border border-slate-200 shadow-xs flex items-center justify-center shrink-0 relative">
                      <svg viewBox="0 0 100 100" className="w-full h-full text-slate-800 fill-current">
                        {/* Realistic Mock QR Pattern */}
                        <rect x="0" y="0" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="6" />
                        <rect x="8" y="8" width="14" height="14" />
                        <rect x="70" y="0" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="6" />
                        <rect x="78" y="8" width="14" height="14" />
                        <rect x="0" y="70" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="6" />
                        <rect x="8" y="78" width="14" height="14" />
                        <rect x="40" y="10" width="10" height="10" />
                        <rect x="15" y="45" width="10" height="10" />
                        <rect x="45" y="45" width="20" height="20" fill="#4f46e5" />
                        <rect x="75" y="45" width="10" height="10" />
                        <rect x="40" y="75" width="10" height="10" />
                        <rect x="75" y="75" width="15" height="15" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="bg-white px-1 py-0.5 rounded text-[9px] font-bold text-brand-600 shadow-xs border border-brand-200">
                          ₹
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <p className="font-semibold text-slate-800">Scan with GPay, PhonePe, Paytm, BHIM</p>
                      <p className="text-[11px] text-slate-500">Point your camera to complete the instantaneous transaction</p>
                      <div className="flex items-center gap-1.5 pt-1">
                        <span className="text-[10px] font-bold text-slate-400">Merchant UPI:</span>
                        <code className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-slate-700">
                          entrykode@icici
                        </code>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Or Enter Customer UPI ID (VPA)
                    </label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="mobile@upi or username@okhdfcbank"
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 font-medium focus:border-brand-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              )}

              {method === 'card' && (
                <div className="space-y-3.5">
                  {/* Digital Credit/Debit Card Visual Preview */}
                  <div className="w-full bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 text-white p-4 rounded-xl shadow-md border border-slate-700/80 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-brand-300">EntryKode PayCard</span>
                      <span className="font-extrabold italic text-sm text-amber-400">VISA</span>
                    </div>

                    <div className="mt-4 font-mono font-bold tracking-wider text-sm sm:text-base text-slate-100">
                      {cardNumber || '•••• •••• •••• ••••'}
                    </div>

                    <div className="mt-3 flex items-center justify-between text-[10px] text-slate-300 font-medium">
                      <div>
                        <span className="text-[8px] uppercase tracking-wider block text-slate-400">Cardholder</span>
                        <span className="font-bold text-white uppercase">{cardName || 'Customer'}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[8px] uppercase tracking-wider block text-slate-400">Expires</span>
                        <span className="font-bold font-mono text-white">{cardExpiry || 'MM/YY'}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Card Number</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="4532 •••• •••• 4902"
                        className="w-full text-xs p-2 pl-9 rounded-lg border border-slate-300 font-mono font-medium focus:border-brand-500 focus:outline-hidden"
                      />
                      <CreditCard className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Expiry Date</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="MM / YY"
                        className="w-full text-xs p-2 rounded-lg border border-slate-300 font-mono text-center font-medium focus:border-brand-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">CVV / CVC</label>
                      <input
                        type="password"
                        maxLength="3"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        placeholder="•••"
                        className="w-full text-xs p-2 rounded-lg border border-slate-300 font-mono text-center font-medium focus:border-brand-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Cardholder Name</label>
                    <input
                      type="text"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder="Name as printed on card"
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 font-medium focus:border-brand-500 focus:outline-hidden"
                    />
                  </div>

                  <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
                    <Lock className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>Protected by Visa Secure & Mastercard 3D-Secure 2.0 banking verification</span>
                  </p>
                </div>
              )}

              {method === 'netbanking' && (
                <div className="space-y-3">
                  <label className="block text-[11px] font-semibold text-slate-700">1. Select Your Bank</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['HDFC Bank', 'ICICI Bank', 'SBI Bank', 'Axis Bank', 'Kotak Bank', 'Punjab National'].map((bank) => (
                      <button
                        key={bank}
                        type="button"
                        onClick={() => setSelectedBank(bank)}
                        className={`p-2.5 rounded-lg border text-xs font-semibold text-center transition-all cursor-pointer ${
                          selectedBank === bank
                            ? 'border-brand-600 bg-brand-50 text-brand-700 ring-2 ring-brand-500/20'
                            : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                        }`}
                      >
                        {bank}
                      </button>
                    ))}
                  </div>

                  {/* Simulated Bank Portal Credentials Form */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 mt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-brand-600" />
                        <span className="text-xs font-bold text-slate-800">{selectedBank} NetBanking Portal</span>
                      </div>
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold border border-emerald-200">
                        Secure Gateway
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500">
                      You will be verified securely via {selectedBank} Retail Banking 2-factor OTP authorization.
                    </p>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Customer / User ID</label>
                      <input
                        type="text"
                        defaultValue="409281729"
                        placeholder="Enter Bank Customer ID"
                        className="w-full text-xs p-2 rounded-lg border border-slate-300 font-mono font-medium focus:border-brand-500 focus:outline-hidden bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {method === 'cod' && (
                <div className="space-y-4">
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
                    <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                      <Truck className="w-4 h-4 text-amber-700" />
                      <span>Pay with Cash at Doorstep</span>
                    </div>
                    <p className="text-xs text-amber-900/80 leading-relaxed">
                      Zero advance online payment required. Pay <strong className="text-amber-950 font-bold">{formatCurrency(totalAmount)}</strong> in cash directly to our delivery courier when the package is delivered.
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600">
                    <span className="font-semibold block text-slate-800 mb-0.5">Delivery Address:</span>
                    <p className="text-[11px] text-slate-500">{orderData?.shippingAddress || 'Customer shipping address on file'}</p>
                  </div>
                </div>
              )}

              {/* Bottom Action Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3 mt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSimulatePayment}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-md flex items-center gap-2 cursor-pointer transition-all active:scale-98 ${
                    method === 'cod'
                      ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-600/20'
                  }`}
                >
                  {method === 'cod' ? (
                    <>
                      <Truck className="w-3.5 h-3.5" />
                      <span>Confirm COD Order ({formatCurrency(totalAmount)})</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                      <span>Authorize & Pay {formatCurrency(totalAmount)}</span>
                    </>
                  )}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Processing Step */}
        {step === 'PROCESSING' && (
          <div className="p-12 flex flex-col items-center justify-center text-center space-y-4 min-h-[380px]">
            <div className="w-16 h-16 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600 animate-pulse">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-slate-900">Contacting Payment Gateway...</h3>
              <p className="text-xs text-slate-500 max-w-sm">
                Authenticating transaction of <strong className="text-slate-800">{formatCurrency(totalAmount)}</strong> with issuing bank. Please do not refresh or close.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full text-[11px] text-slate-600 font-mono">
              <Lock className="w-3 h-3 text-emerald-600" />
              <span>Verifying 3D Secure 2.0 Token...</span>
            </div>
          </div>
        )}

        {/* Success Step */}
        {step === 'SUCCESS' && paymentResult && (
          <div className="p-8 flex flex-col items-center text-center space-y-5 min-h-[380px]">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center ring-8 ring-emerald-50">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <span className={`text-xs font-bold uppercase tracking-wider ${paymentResult.method === 'Cash on Delivery' ? 'text-amber-600' : 'text-emerald-600'}`}>
                {paymentResult.method === 'Cash on Delivery' ? 'Order Confirmed (Cash on Delivery)' : 'Payment Captured'}
              </span>
              <h3 className="text-xl font-extrabold text-slate-900">
                {paymentResult.method === 'Cash on Delivery'
                  ? `Order Confirmed — ${formatCurrency(paymentResult.amount)}`
                  : `${formatCurrency(paymentResult.amount)} Successfully Paid!`}
              </h3>
              <p className="text-xs text-slate-500">
                {paymentResult.method === 'Cash on Delivery'
                  ? `Order ${paymentResult.orderNumber} is confirmed. Please keep cash ready when courier arrives.`
                  : `Order ${paymentResult.orderNumber} has been successfully verified & marked as PAID.`}
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="w-full max-w-md bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-left text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Razorpay Payment ID:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-brand-600">{paymentResult.paymentId}</span>
                  <button onClick={copyPaymentId} className="text-slate-400 hover:text-slate-600 p-0.5">
                    {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Bank Reference No (RRN):</span>
                <span className="font-mono text-slate-700">{paymentResult.bankRrn}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Payment Mode:</span>
                <span className="font-semibold text-slate-800">{paymentResult.method}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-semibold text-slate-800">{paymentResult.customerName}</span>
              </div>
            </div>

            {/* Close / Return Button */}
            <div className="flex items-center gap-3 w-full max-w-md pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>Print Receipt</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Done & View in CRM
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
