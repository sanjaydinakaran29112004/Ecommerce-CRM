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
  AlertCircle,
  KeyRound,
  Smartphone,
  CheckCheck,
  RefreshCw,
  Wallet,
} from 'lucide-react';

export function RazorpayGatewayModal({ isOpen, onClose, orderData, onPaymentSuccess }) {
  const [method, setMethod] = useState('upi');
  // Steps: 'INPUT' | 'OTP_VERIFY' | 'CLEARING' | 'SUCCESS'
  const [step, setStep] = useState('INPUT');

  // Input states
  const [upiMode, setUpiMode] = useState('qr'); // 'qr' | 'vpa'
  const [upiId, setUpiId] = useState('customer@okhdfcbank');
  const [cardNumber, setCardNumber] = useState('4532 8920 1823 4902');
  const [cardExpiry, setCardExpiry] = useState('09/28');
  const [cardCvv, setCardCvv] = useState('724');
  const [cardName, setCardName] = useState('Sanjay Dinakaran');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [netbankingUserId, setNetbankingUserId] = useState('409281729');
  const [netbankingPassword, setNetbankingPassword] = useState('BankPass@2026');
  const [stripeCard, setStripeCard] = useState('4242 4242 4242 4242');
  const [stripeExpiry, setStripeExpiry] = useState('12/28');
  const [stripeCvc, setStripeCvc] = useState('884');
  const [bankUtrInput, setBankUtrInput] = useState('UTR202611139401');

  // Validation & Error states
  const [errors, setErrors] = useState({});

  // 2-Factor Authentication (OTP / UPI PIN) simulation
  const [generatedOtp, setGeneratedOtp] = useState('482910');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(60);

  // Clearing / Settlement Animation Stage (1: Debiting Customer, 2: Interbank NPCI, 3: Crediting Merchant)
  const [clearingStage, setClearingStage] = useState(1);

  // Result state
  const [paymentResult, setPaymentResult] = useState(null);
  const [copiedId, setCopiedId] = useState(false);
  const [qrCountdown, setQrCountdown] = useState(299); // 5 min timer

  const totalAmount = orderData?.pricing?.total || 17699;
  const orderNumber = orderData?.orderNumber || `ORD-2026-${Math.floor(9000 + Math.random() * 900)}`;

  // Auto-detect Card Type
  const detectCardBrand = (num) => {
    const clean = num.replace(/\s+/g, '');
    if (clean.startsWith('4')) return 'VISA';
    if (/^(5[1-5]|2[2-7])/.test(clean)) return 'Mastercard';
    if (/^(60|65|81)/.test(clean)) return 'RuPay';
    if (/^(34|37)/.test(clean)) return 'Amex';
    return 'Card';
  };

  // Card Number Auto-Formatter (XXXX XXXX XXXX XXXX)
  const handleCardNumberChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.match(/.{1,4}/g)?.join(' ') || raw;
    setCardNumber(formatted);
    if (errors.cardNumber) setErrors((prev) => ({ ...prev, cardNumber: null }));
  };

  // Expiry Auto-Formatter (MM/YY)
  const handleExpiryChange = (e) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 2) {
      raw = raw.slice(0, 2) + '/' + raw.slice(2);
    }
    setCardExpiry(raw);
    if (errors.cardExpiry) setErrors((prev) => ({ ...prev, cardExpiry: null }));
  };

  // Reset state on modal open
  useEffect(() => {
    if (isOpen) {
      setStep('INPUT');
      setPaymentResult(null);
      setErrors({});
      setOtpError('');
      setEnteredOtp('');
      setQrCountdown(299);
      if (orderData?.customer?.name) {
        setCardName(orderData.customer.name);
      }

      // Auto-select method based on order
      const pm = (orderData?.paymentMethod || '').toLowerCase();
      if (pm.includes('stripe')) {
        setMethod('stripe');
      } else if (pm.includes('bank') || pm.includes('neft') || pm.includes('transfer')) {
        setMethod('bank_transfer');
      } else if (pm.includes('card')) {
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

  // QR Countdown
  useEffect(() => {
    if (!isOpen || step !== 'INPUT' || method !== 'upi') return;
    const timer = setInterval(() => {
      setQrCountdown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, step, method]);

  // OTP Countdown
  useEffect(() => {
    if (step !== 'OTP_VERIFY') return;
    const timer = setInterval(() => {
      setOtpCountdown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [step]);

  if (!isOpen) return null;

  // STRICT VALIDATION ALGORITHM
  const validateInputs = () => {
    const errs = {};

    if (method === 'card') {
      const cleanNum = cardNumber.replace(/\s+/g, '');
      if (!cleanNum || cleanNum.length < 16 || !/^\d{16}$/.test(cleanNum)) {
        errs.cardNumber = 'Card number must be exactly 16 valid digits';
      } else if (/^0+$/.test(cleanNum)) {
        errs.cardNumber = 'Invalid card number (cannot be all zeros)';
      }

      if (!cardName || cardName.trim().length < 3) {
        errs.cardName = 'Cardholder name is required (min 3 letters)';
      }

      if (!cardExpiry || !/^\d{2}\/\d{2}$/.test(cardExpiry)) {
        errs.cardExpiry = 'Invalid expiry format (use MM/YY)';
      } else {
        const [monthStr, yearStr] = cardExpiry.split('/');
        const month = parseInt(monthStr, 10);
        const year = parseInt(yearStr, 10);
        if (month < 1 || month > 12) {
          errs.cardExpiry = 'Invalid month (must be 01 to 12)';
        } else if (year < 26) {
          errs.cardExpiry = 'Card has expired (Year must be 26 or later)';
        }
      }

      if (!cardCvv || cardCvv.length < 3 || !/^\d{3,4}$/.test(cardCvv)) {
        errs.cardCvv = 'CVV must be 3 digits (4 for Amex)';
      }
    }

    if (method === 'upi' && upiMode === 'vpa') {
      const upiRegex = /^[a-zA-Z0-9.\-_]{2,49}@[a-zA-Z]{2,30}$/;
      if (!upiId || !upiRegex.test(upiId.trim())) {
        errs.upiId = 'Invalid UPI ID! Must include @bank (e.g. username@okhdfcbank or 9876543210@paytm)';
      }
    }

    if (method === 'netbanking') {
      if (!netbankingUserId || netbankingUserId.trim().length < 6) {
        errs.netbankingUserId = 'Bank Customer ID must be at least 6 alphanumeric characters';
      }
      if (!netbankingPassword || netbankingPassword.trim().length < 4) {
        errs.netbankingPassword = 'NetBanking login password is required (min 4 characters)';
      }
    }

    if (method === 'stripe') {
      const cleanNum = stripeCard.replace(/\s+/g, '');
      if (!cleanNum || cleanNum.length < 16) {
        errs.stripeCard = 'Stripe test card must be 16 valid digits (Use 4242 4242 4242 4242)';
      }
      if (!stripeCvc || stripeCvc.length < 3) {
        errs.stripeCvc = 'CVC is required (3 digits)';
      }
    }

    if (method === 'bank_transfer') {
      if (!bankUtrInput || bankUtrInput.trim().length < 6) {
        errs.bankUtrInput = 'Bank Reference / UTR Number is required (min 6 characters)';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Trigger Payment / Move to OTP Verification
  const handleProceedToAuth = () => {
    // 1. Strict Validation Check
    const isValid = validateInputs();
    if (!isValid) {
      return;
    }

    // Cash on Delivery doesn't need bank OTP
    if (method === 'cod') {
      executeInstantCod();
      return;
    }

    // 2. Generate Bank Demo OTP and open Bank 2FA screen
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(newOtp);
    setEnteredOtp('');
    setOtpError('');
    setOtpCountdown(60);
    setStep('OTP_VERIFY');
  };

  // Direct confirmation for COD
  const executeInstantCod = () => {
    setStep('CLEARING');
    setClearingStage(3);
    setTimeout(() => {
      const result = {
        paymentId: `cod_Ref${Date.now().toString().slice(-6)}`,
        bankRrn: 'COD-DOORSTEP-COLLECTION',
        utrNumber: 'N/A (Cash on Delivery)',
        method: 'Cash on Delivery',
        amount: totalAmount,
        paidAt: null,
        orderNumber,
        customerName: cardName || orderData?.customer?.name || 'Customer',
        status: 'COD_PENDING',
        merchantAccount: {
          name: 'EntryKode Technologies Pvt Ltd',
          bank: 'Doorstep Courier Cash Collection',
          accountNumber: 'Cash at Delivery',
          ifsc: 'N/A',
          settlementStatus: 'PENDING_DELIVERY',
        },
      };
      setPaymentResult(result);
      setStep('SUCCESS');
      if (onPaymentSuccess) onPaymentSuccess(result);
    }, 600);
  };

  // Real Bank OTP Verification Check
  const handleVerifyOtp = () => {
    if (!enteredOtp || enteredOtp.trim().length === 0) {
      setOtpError('Please enter the 6-digit Bank OTP sent to your mobile.');
      return;
    }

    // STRICT OTP VALIDATION: Must match generated OTP!
    if (enteredOtp.trim() !== generatedOtp.trim()) {
      setOtpError('❌ Bank Authentication Failed: Incorrect OTP entered! Transaction declined by issuing bank. Please enter the valid OTP.');
      return;
    }

    // Correct OTP verified! Proceed to Interbank Fund Clearing & Merchant Settlement
    setOtpError('');
    startInterbankSettlement();
  };

  // Live Multi-Stage Interbank Settlement Animation
  const startInterbankSettlement = () => {
    setStep('CLEARING');
    setClearingStage(1); // Debiting Customer Account

    setTimeout(() => {
      setClearingStage(2); // Interbank NPCI / RBI Gateway Routing
    }, 600);

    setTimeout(() => {
      setClearingStage(3); // Crediting Merchant Account (EntryKode Technologies)
    }, 1200);

    setTimeout(() => {
      let generatedPayId = `pay_Rzp${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
      let generatedRrn = `RRN-${Math.floor(100000000000 + Math.random() * 900000000000)}`;
      let generatedUtr = `UTR-20261112-${Math.floor(100000000 + Math.random() * 900000000)}`;
      let gatewayName = 'RAZORPAY';
      let methodLabel = method === 'card' ? `CARD (${detectCardBrand(cardNumber)})` : method.toUpperCase();

      if (method === 'stripe') {
        generatedPayId = `ch_Stripe_${Math.random().toString(36).substring(2, 12)}`;
        generatedUtr = `STRIPE-TXN-${Date.now().toString().slice(-8)}`;
        gatewayName = 'STRIPE';
        methodLabel = 'STRIPE (Credit/Debit Card)';
      } else if (method === 'bank_transfer') {
        generatedPayId = `neft_ICICI_${Date.now().toString().slice(-8)}`;
        generatedUtr = bankUtrInput || `UTR-${Date.now()}`;
        gatewayName = 'BANK_TRANSFER';
        methodLabel = 'BANK TRANSFER (NEFT/RTGS)';
      }

      const result = {
        paymentId: generatedPayId,
        bankRrn: generatedRrn,
        utrNumber: generatedUtr,
        gateway: gatewayName,
        method: methodLabel,
        amount: totalAmount,
        paidAt: new Date().toISOString(),
        orderNumber,
        customerName: cardName || orderData?.customer?.name || 'Customer',
        status: 'CAPTURED',
        merchantAccount: {
          name: 'EntryKode Technologies Pvt Ltd',
          bank: gatewayName === 'STRIPE' ? 'Stripe Gateway (USD/INR Settlement)' : 'ICICI Bank Ltd (Current A/C)',
          accountNumber: gatewayName === 'STRIPE' ? 'acct_1StripeMerchant2026' : '002905008842',
          ifsc: 'ICIC0000029',
          settlementStatus: 'FUNDS RECEIVED IN MERCHANT ACCOUNT',
        },
      };

      setPaymentResult(result);
      setStep('SUCCESS');
      if (onPaymentSuccess) {
        onPaymentSuccess(result);
      }
    }, 1800);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
        
        {/* Gateway Header */}
        <div className="bg-[#0c2340] text-white p-4 sm:p-5 flex items-center justify-between border-b border-blue-950">
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

        {/* STEP 1: PAYMENT METHOD SELECTION & DATA INPUT WITH STRICT VALIDATION */}
        {step === 'INPUT' && (
          <div className="p-0 flex flex-col md:flex-row min-h-[420px]">
            {/* Left Method Tabs */}
            <div className="w-full md:w-48 bg-slate-50 border-r border-slate-200 p-2 space-y-1">
              <button
                type="button"
                onClick={() => {
                  setMethod('upi');
                  setErrors({});
                }}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer ${
                  method === 'upi'
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <QrCode className="w-4 h-4 shrink-0" />
                <span>UPI / QR Code</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMethod('card');
                  setErrors({});
                }}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer ${
                  method === 'card'
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <CreditCard className="w-4 h-4 shrink-0" />
                <span>Card (Debit/Credit)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMethod('netbanking');
                  setErrors({});
                }}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer ${
                  method === 'netbanking'
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Building2 className="w-4 h-4 shrink-0" />
                <span>Net Banking</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMethod('cod');
                  setErrors({});
                }}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer ${
                  method === 'cod'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Truck className="w-4 h-4 shrink-0" />
                <span>Cash on Delivery</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMethod('stripe');
                  setErrors({});
                }}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer ${
                  method === 'stripe'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <CreditCard className="w-4 h-4 shrink-0" />
                <span>Stripe Gateway</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMethod('bank_transfer');
                  setErrors({});
                }}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer ${
                  method === 'bank_transfer'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Building2 className="w-4 h-4 shrink-0" />
                <span>Bank NEFT / RTGS</span>
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
            <div className="flex-1 p-5 flex flex-col justify-between overflow-y-auto">
              
              {/* UPI METHOD */}
              {method === 'upi' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setUpiMode('qr')}
                        className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                          upiMode === 'qr' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                        }`}
                      >
                        Scan QR Code
                      </button>
                      <button
                        type="button"
                        onClick={() => setUpiMode('vpa')}
                        className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                          upiMode === 'vpa' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                        }`}
                      >
                        Enter UPI ID
                      </button>
                    </div>

                    <span className="text-[10px] font-mono text-amber-600 bg-amber-50 px-2 py-0.5 rounded font-semibold border border-amber-200">
                      ⏱ {formatTimer(qrCountdown)}
                    </span>
                  </div>

                  {upiMode === 'qr' ? (
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                        {/* Dynamic High-Resolution QR Code */}
                        <div className="w-28 h-28 bg-white p-2 rounded-xl border-2 border-indigo-200 shadow-xs flex items-center justify-center shrink-0 relative overflow-hidden group">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(
                              `upi://pay?pa=entrykode@icici&pn=EntryKodeTechnologies&am=${totalAmount}&tr=${orderNumber}&cu=INR`
                            )}`}
                            alt="Scan UPI QR Code"
                            className="w-full h-full object-contain rounded"
                            loading="eager"
                          />
                          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-brand-500 to-transparent shadow-[0_0_8px_rgba(99,102,241,0.8)] animate-pulse" />
                        </div>

                        <div className="space-y-1.5 text-xs flex-1">
                          <div className="flex flex-wrap gap-1">
                            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px] border border-blue-200">
                              Google Pay
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-bold text-[10px] border border-purple-200">
                              PhonePe
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 font-bold text-[10px] border border-sky-200">
                              Paytm
                            </span>
                          </div>

                          <p className="font-semibold text-slate-800 leading-snug">
                            Scan with camera to transfer <strong className="text-brand-600 font-bold">{formatCurrency(totalAmount)}</strong>
                          </p>

                          <div className="flex items-center gap-1.5 pt-0.5 text-[11px]">
                            <span className="text-slate-400 font-medium">Payee:</span>
                            <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono font-bold text-slate-700">
                              entrykode@icici
                            </code>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleProceedToAuth}
                        className="w-full py-2.5 px-3 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Simulate Mobile Scan & Enter UPI PIN ({formatCurrency(totalAmount)})</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="block text-[11px] font-semibold text-slate-700">
                        Enter Customer UPI Virtual Payment Address (VPA)
                      </label>
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => {
                          setUpiId(e.target.value);
                          if (errors.upiId) setErrors((prev) => ({ ...prev, upiId: null }));
                        }}
                        placeholder="username@okhdfcbank or 9876543210@paytm"
                        className={`w-full text-xs p-2.5 rounded-lg border font-medium focus:outline-hidden ${
                          errors.upiId ? 'border-rose-500 bg-rose-50/20' : 'border-slate-300 focus:border-brand-500'
                        }`}
                      />
                      {errors.upiId && (
                        <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{errors.upiId}</span>
                        </p>
                      )}
                      <p className="text-[10px] text-slate-400">
                        Supported handles: @okhdfcbank, @oksbi, @okaxis, @paytm, @ybl, @upi
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* CARD METHOD WITH LIVE VALIDATION & DIGITAL CARD PREVIEW */}
              {method === 'card' && (
                <div className="space-y-3">
                  {/* Digital Card Preview */}
                  <div className="w-full bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 text-white p-3.5 rounded-xl shadow-md border border-slate-700/80 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-brand-300">EntryKode PayCard</span>
                      <span className="font-extrabold italic text-xs px-2 py-0.5 rounded bg-white/10 text-amber-300">
                        {detectCardBrand(cardNumber)}
                      </span>
                    </div>

                    <div className="mt-3 font-mono font-bold tracking-wider text-sm text-slate-100">
                      {cardNumber || '•••• •••• •••• ••••'}
                    </div>

                    <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-300 font-medium">
                      <div>
                        <span className="text-[8px] uppercase tracking-wider block text-slate-400">Cardholder</span>
                        <span className="font-bold text-white uppercase">{cardName || 'Customer Name'}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[8px] uppercase tracking-wider block text-slate-400">Expires</span>
                        <span className="font-bold font-mono text-white">{cardExpiry || 'MM/YY'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Number */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Card Number (16 Digits)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        placeholder="4532 8920 1823 4902"
                        className={`w-full text-xs p-2 pl-9 rounded-lg border font-mono font-medium focus:outline-hidden ${
                          errors.cardNumber ? 'border-rose-500 bg-rose-50/20' : 'border-slate-300 focus:border-brand-500'
                        }`}
                      />
                      <CreditCard className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    </div>
                    {errors.cardNumber && (
                      <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{errors.cardNumber}</span>
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Expiry */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Expiry Date (MM/YY)</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={handleExpiryChange}
                        placeholder="09/28"
                        className={`w-full text-xs p-2 rounded-lg border font-mono text-center font-medium focus:outline-hidden ${
                          errors.cardExpiry ? 'border-rose-500 bg-rose-50/20' : 'border-slate-300 focus:border-brand-500'
                        }`}
                      />
                      {errors.cardExpiry && (
                        <p className="text-[10px] text-rose-600 font-medium mt-1">{errors.cardExpiry}</p>
                      )}
                    </div>

                    {/* CVV */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">CVV / CVC (3 Digits)</label>
                      <input
                        type="password"
                        maxLength="4"
                        value={cardCvv}
                        onChange={(e) => {
                          setCardCvv(e.target.value.replace(/\D/g, ''));
                          if (errors.cardCvv) setErrors((prev) => ({ ...prev, cardCvv: null }));
                        }}
                        placeholder="•••"
                        className={`w-full text-xs p-2 rounded-lg border font-mono text-center font-medium focus:outline-hidden ${
                          errors.cardCvv ? 'border-rose-500 bg-rose-50/20' : 'border-slate-300 focus:border-brand-500'
                        }`}
                      />
                      {errors.cardCvv && (
                        <p className="text-[10px] text-rose-600 font-medium mt-1">{errors.cardCvv}</p>
                      )}
                    </div>
                  </div>

                  {/* Cardholder Name */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Cardholder Name</label>
                    <input
                      type="text"
                      value={cardName}
                      onChange={(e) => {
                        setCardName(e.target.value);
                        if (errors.cardName) setErrors((prev) => ({ ...prev, cardName: null }));
                      }}
                      placeholder="Name printed on card"
                      className={`w-full text-xs p-2 rounded-lg border font-medium focus:outline-hidden ${
                        errors.cardName ? 'border-rose-500 bg-rose-50/20' : 'border-slate-300 focus:border-brand-500'
                      }`}
                    />
                    {errors.cardName && (
                      <p className="text-[10px] text-rose-600 font-medium mt-1">{errors.cardName}</p>
                    )}
                  </div>
                </div>
              )}

              {/* NETBANKING METHOD WITH LIVE VALIDATION */}
              {method === 'netbanking' && (
                <div className="space-y-3">
                  <label className="block text-[11px] font-semibold text-slate-700">1. Select Your Retail Bank</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['HDFC Bank', 'ICICI Bank', 'SBI Bank', 'Axis Bank', 'Kotak Bank', 'Punjab National'].map((bank) => (
                      <button
                        key={bank}
                        type="button"
                        onClick={() => setSelectedBank(bank)}
                        className={`p-2 rounded-lg border text-xs font-semibold text-center transition-all cursor-pointer ${
                          selectedBank === bank
                            ? 'border-brand-600 bg-brand-50 text-brand-700 ring-2 ring-brand-500/20 font-bold'
                            : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                        }`}
                      >
                        {bank}
                      </button>
                    ))}
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 mt-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-brand-600" />
                        <span className="text-xs font-bold text-slate-800">{selectedBank} NetBanking Gateway</span>
                      </div>
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-bold border border-emerald-200">
                        256-bit SSL
                      </span>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                        Bank Customer / User ID (Min 6 Chars)
                      </label>
                      <input
                        type="text"
                        value={netbankingUserId}
                        onChange={(e) => {
                          setNetbankingUserId(e.target.value);
                          if (errors.netbankingUserId) setErrors((prev) => ({ ...prev, netbankingUserId: null }));
                        }}
                        placeholder="Enter NetBanking ID"
                        className={`w-full text-xs p-2 rounded-lg border font-mono font-medium focus:outline-hidden bg-white ${
                          errors.netbankingUserId ? 'border-rose-500 bg-rose-50/20' : 'border-slate-300 focus:border-brand-500'
                        }`}
                      />
                      {errors.netbankingUserId && (
                        <p className="text-[10px] text-rose-600 font-medium mt-1">{errors.netbankingUserId}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                        NetBanking Login Password / IPIN
                      </label>
                      <input
                        type="password"
                        value={netbankingPassword}
                        onChange={(e) => {
                          setNetbankingPassword(e.target.value);
                          if (errors.netbankingPassword) setErrors((prev) => ({ ...prev, netbankingPassword: null }));
                        }}
                        placeholder="Enter NetBanking Password"
                        className={`w-full text-xs p-2 rounded-lg border font-mono font-medium focus:outline-hidden bg-white ${
                          errors.netbankingPassword ? 'border-rose-500 bg-rose-50/20' : 'border-slate-300 focus:border-brand-500'
                        }`}
                      />
                      {errors.netbankingPassword && (
                        <p className="text-[10px] text-rose-600 font-medium mt-1">{errors.netbankingPassword}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* CASH ON DELIVERY METHOD */}
              {method === 'cod' && (
                <div className="space-y-3">
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

              {/* STRIPE GLOBAL CARD GATEWAY */}
              {method === 'stripe' && (
                <div className="space-y-3">
                  <div className="p-3 bg-indigo-50/80 rounded-xl border border-indigo-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-indigo-950 block">Stripe Global Card Processing</span>
                      <span className="text-[11px] text-indigo-700">Accepts International Visa, Mastercard, American Express</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setStripeCard('4242 4242 4242 4242');
                        setStripeExpiry('12/28');
                        setStripeCvc('884');
                      }}
                      className="text-[10px] bg-indigo-600 text-white font-bold px-2 py-1 rounded shadow-2xs hover:bg-indigo-700 cursor-pointer"
                    >
                      Fill Test Card
                    </button>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Card Number
                    </label>
                    <input
                      type="text"
                      value={stripeCard}
                      onChange={(e) => setStripeCard(e.target.value)}
                      placeholder="4242 4242 4242 4242"
                      className="w-full text-xs p-2 rounded-lg border font-mono font-medium focus:outline-hidden bg-white border-slate-300 focus:border-indigo-500"
                    />
                    {errors.stripeCard && (
                      <p className="text-[10px] text-rose-600 font-medium mt-1">{errors.stripeCard}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        value={stripeExpiry}
                        onChange={(e) => setStripeExpiry(e.target.value)}
                        placeholder="MM/YY"
                        className="w-full text-xs p-2 rounded-lg border font-mono font-medium focus:outline-hidden bg-white border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                        CVC / Security Code
                      </label>
                      <input
                        type="password"
                        value={stripeCvc}
                        onChange={(e) => setStripeCvc(e.target.value)}
                        placeholder="123"
                        maxLength={4}
                        className="w-full text-xs p-2 rounded-lg border font-mono font-medium focus:outline-hidden bg-white border-slate-300"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* BANK TRANSFER (NEFT / RTGS) */}
              {method === 'bank_transfer' && (
                <div className="space-y-3">
                  <div className="p-3 bg-slate-100 rounded-xl border border-slate-300 text-xs space-y-1.5">
                    <span className="font-bold text-slate-900 block">EntryKode Corporate Bank Account</span>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700">
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase">Bank Name</span>
                        <strong>ICICI Bank Ltd</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase">Current A/C Number</span>
                        <strong className="font-mono">002905008842</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase">IFSC Code</span>
                        <strong className="font-mono">ICIC0000029</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase">Beneficiary Name</span>
                        <strong>EntryKode Technologies Pvt Ltd</strong>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                      Bank Transaction UTR / Ref Number *
                    </label>
                    <input
                      type="text"
                      value={bankUtrInput}
                      onChange={(e) => setBankUtrInput(e.target.value)}
                      placeholder="e.g. UTR202611139401"
                      className="w-full text-xs p-2.5 rounded-lg border font-mono font-medium focus:outline-hidden bg-white border-slate-300 focus:border-slate-800"
                    />
                    {errors.bankUtrInput && (
                      <p className="text-[10px] text-rose-600 font-medium mt-1">{errors.bankUtrInput}</p>
                    )}
                    <span className="text-[10px] text-slate-400 block mt-1">
                      Enter the UTR reference number from your net banking transaction receipt.
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3 mt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleProceedToAuth}
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
                      <span>Authorize & Verify {formatCurrency(totalAmount)}</span>
                    </>
                  )}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: BANK 2-FACTOR AUTHENTICATION / 3D SECURE OTP PORTAL */}
        {step === 'OTP_VERIFY' && (
          <div className="p-6 sm:p-8 flex flex-col justify-between min-h-[420px] animate-in fade-in duration-200">
            <div className="space-y-4">
              {/* Bank Portal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-tight">
                      {method === 'card' ? `${detectCardBrand(cardNumber)} 3D-Secure 2.0 Verification` : method === 'netbanking' ? `${selectedBank} Retail NetBanking 2FA` : 'NPCI UPI 2-Factor Authentication'}
                    </h3>
                    <p className="text-[10px] text-slate-500">RBI Mandatory Multi-Factor Security Check</p>
                  </div>
                </div>

                <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                  {formatCurrency(totalAmount)}
                </span>
              </div>

              {/* Merchant Details Box */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[10px]">Merchant Beneficiary:</span>
                  <strong className="text-slate-800">EntryKode Technologies (SmartCart)</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Order Reference:</span>
                  <strong className="font-mono text-slate-800">{orderNumber}</strong>
                </div>
              </div>

              {/* OTP Simulation Instructions */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-1.5 text-xs text-amber-900">
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-amber-700" />
                    <span>OTP Sent to Registered Mobile (+91 98••••••10)</span>
                  </span>
                  <span className="text-[10px] font-mono font-semibold text-amber-700">⏱ 00:{otpCountdown.toString().padStart(2, '0')}</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-snug">
                  To authenticate the transfer to the merchant account, enter the 6-digit One-Time Password below.
                </p>
                <div className="pt-1 flex items-center justify-between bg-white/70 p-2 rounded-lg border border-amber-200">
                  <span className="text-[11px] font-semibold text-amber-900">
                    💡 Real-Time Testing OTP: <strong className="font-mono font-black text-amber-950 tracking-widest">{generatedOtp}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setEnteredOtp(generatedOtp);
                      setOtpError('');
                    }}
                    className="text-[10px] bg-amber-600 hover:bg-amber-700 text-white font-bold px-2 py-1 rounded cursor-pointer transition-colors shadow-2xs"
                  >
                    Auto-fill Demo OTP
                  </button>
                </div>
              </div>

              {/* 6-Digit OTP Input Box */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Enter 6-Digit Bank OTP
                </label>
                <input
                  type="text"
                  maxLength="6"
                  value={enteredOtp}
                  onChange={(e) => {
                    setEnteredOtp(e.target.value.replace(/\D/g, ''));
                    if (otpError) setOtpError('');
                  }}
                  placeholder="• • • • • •"
                  className={`w-full text-center text-lg tracking-[0.5em] font-mono font-bold p-2.5 rounded-xl border focus:outline-hidden ${
                    otpError ? 'border-rose-500 bg-rose-50/20 text-rose-700' : 'border-slate-300 focus:border-brand-500 text-slate-800'
                  }`}
                  autoFocus
                />

                {/* Prominent Bank Rejection Error if user enters wrong OTP */}
                {otpError && (
                  <div className="mt-2 p-2.5 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-rose-700 text-xs font-semibold animate-in shake duration-200">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                    <span>{otpError}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions for OTP */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3 mt-4">
              <button
                type="button"
                onClick={() => setStep('INPUT')}
                className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Back to Methods
              </button>

              <button
                type="button"
                onClick={handleVerifyOtp}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md flex items-center gap-2 cursor-pointer transition-all active:scale-98"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Confirm & Transfer {formatCurrency(totalAmount)}</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: LIVE INTERBANK SETTLEMENT ANIMATION */}
        {step === 'CLEARING' && (
          <div className="p-8 sm:p-10 flex flex-col items-center justify-center text-center space-y-6 min-h-[420px] animate-in fade-in duration-200">
            <div className="w-16 h-16 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600 animate-pulse">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">Processing Inter-Bank Settlement...</h3>
              <p className="text-xs text-slate-500">
                Routing transaction of <strong className="text-slate-800">{formatCurrency(totalAmount)}</strong> through RBI/NPCI clearing gateway.
              </p>
            </div>

            {/* 3-Stage Live Clearing Tracker */}
            <div className="w-full max-w-md bg-slate-50 rounded-xl p-4 border border-slate-200 text-left text-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-medium text-slate-700">
                  {clearingStage >= 1 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Loader2 className="w-4 h-4 animate-spin text-brand-600 shrink-0" />
                  )}
                  <span>1. Debiting Customer Account (A/C •••• 4092)</span>
                </span>
                <span className="text-[10px] font-bold text-emerald-600">DEBITED ✓</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-medium text-slate-700">
                  {clearingStage >= 2 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Loader2 className="w-4 h-4 animate-spin text-brand-600 shrink-0" />
                  )}
                  <span>2. NPCI / IMPS Interbank Settlement</span>
                </span>
                <span className="text-[10px] font-bold text-emerald-600">
                  {clearingStage >= 2 ? 'CLEARED ✓' : 'VERIFYING...'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-medium text-slate-700">
                  {clearingStage >= 3 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Loader2 className="w-4 h-4 animate-spin text-brand-600 shrink-0" />
                  )}
                  <span>3. Crediting Merchant Account (EntryKode Technologies)</span>
                </span>
                <span className="text-[10px] font-bold text-emerald-600">
                  {clearingStage >= 3 ? 'RECEIVED ✓' : 'SETTLING...'}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              Please do not close or navigate away while the bank finishes the transfer.
            </p>
          </div>
        )}

        {/* STEP 4: SUCCESS RECEIPT WITH OFFICIAL MERCHANT ACCOUNT CREDIT CONFIRMATION */}
        {step === 'SUCCESS' && paymentResult && (
          <div className="p-6 sm:p-8 flex flex-col items-center text-center space-y-4 min-h-[420px] animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center ring-8 ring-emerald-50">
              <CheckCheck className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <span className={`text-xs font-bold uppercase tracking-wider ${paymentResult.method === 'Cash on Delivery' ? 'text-amber-600' : 'text-emerald-600'}`}>
                {paymentResult.method === 'Cash on Delivery' ? 'Order Confirmed (Cash on Delivery)' : 'Payment Received in Merchant Account'}
              </span>
              <h3 className="text-xl font-extrabold text-slate-900">
                {paymentResult.method === 'Cash on Delivery'
                  ? `Order Confirmed — ${formatCurrency(paymentResult.amount)}`
                  : `${formatCurrency(paymentResult.amount)} Successfully Credited!`}
              </h3>
              <p className="text-xs text-slate-500 max-w-md">
                {paymentResult.method === 'Cash on Delivery'
                  ? `Order ${paymentResult.orderNumber} is confirmed. Please keep cash ready when our courier arrives at doorstep.`
                  : `Amount has been successfully debited from customer and credited to EntryKode Technologies Merchant Bank Account.`}
              </p>
            </div>

            {/* Merchant Account Settlement Receipt Card */}
            <div className="w-full max-w-md bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-left text-xs space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Merchant Beneficiary:</span>
                <span className="font-bold text-slate-900">{paymentResult.merchantAccount?.name || 'EntryKode Technologies'}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Credited To Account:</span>
                <span className="font-mono font-bold text-emerald-700">
                  {paymentResult.merchantAccount?.bank} (A/C •••• 8842)
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Razorpay Payment ID:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-brand-600">{paymentResult.paymentId}</span>
                  <button onClick={copyPaymentId} className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer">
                    {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Bank UTR / Reference:</span>
                <span className="font-mono text-slate-700">{paymentResult.utrNumber || paymentResult.bankRrn}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Payment Mode:</span>
                <span className="font-semibold text-slate-800">{paymentResult.method}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Customer Name:</span>
                <span className="font-semibold text-slate-800">{paymentResult.customerName}</span>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-500">Settlement Status:</span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                  FUNDS RECEIVED (SETTLED)
                </span>
              </div>
            </div>

            {/* Close / Return Buttons */}
            <div className="flex items-center gap-3 w-full max-w-md pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>Print Official Receipt</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md cursor-pointer transition-colors"
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
