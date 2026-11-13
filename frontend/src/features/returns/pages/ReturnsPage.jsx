import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { mockDb } from '@/services/mock/mockDb';
import { ENDPOINTS } from '@/services/api/endpoints';
import { axiosClient } from '@/services/api/axiosClient';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  History,
  AlertTriangle,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  FileText,
  User,
  ArrowRight,
  Plus,
} from 'lucide-react';

const INITIAL_RETURNS = [
  {
    id: 'ret_1',
    returnNumber: 'RET-2026-041',
    orderNumber: 'ORD-2026-9041',
    customer: 'Ananya Krishnan',
    item: 'Aura Pro Wireless ANC Headphones',
    reason: 'Defective Bluetooth pairing on Left Cup',
    status: 'INSPECTION_PENDING',
    refundAmount: '₹ 14,999.00',
    inspectionNotes: 'Awaiting warehouse inspection of device hardware.',
    verdict: 'RESTOCKED',
    inspectedAt: null,
    inspectedBy: null,
    history: [
      {
        id: 'hist_1a',
        action: 'REQUESTED',
        title: 'Return Request Initiated (RMA Created)',
        notes: 'Customer reported defective Bluetooth pairing on Left Cup. Package received at warehouse dock.',
        actor: 'Customer Self-Service Portal',
        timestamp: new Date(Date.now() - 3600000 * 24).toLocaleString('en-IN', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }),
      },
    ],
  },
  {
    id: 'ret_2',
    returnNumber: 'RET-2026-039',
    orderNumber: 'ORD-2026-8910',
    customer: 'Karthik Rao',
    item: '100W GaN Fast Charger',
    reason: 'Incorrect item ordered by mistake',
    status: 'REFUND_APPROVED',
    refundAmount: '₹ 3,499.00',
    inspectionNotes: 'Sealed box returned in brand new condition. Restocked to warehouse catalog.',
    verdict: 'RESTOCKED',
    inspectedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    inspectedBy: 'Sanjay D (Warehouse Lead)',
    history: [
      {
        id: 'hist_2b',
        action: 'REFUND_APPROVED',
        title: 'Refund Approved & Processed',
        verdict: 'Verified Defect - Approve Full Gateway Refund',
        notes: 'Sealed box returned in brand new condition. Restocked to warehouse catalog. Full refund approved via Razorpay.',
        actor: 'Sanjay D (Warehouse Lead)',
        timestamp: new Date(Date.now() - 3600000 * 5).toLocaleString('en-IN', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }),
      },
      {
        id: 'hist_2a',
        action: 'REQUESTED',
        title: 'Return Request Initiated (RMA Created)',
        notes: 'Customer stated incorrect item ordered by mistake. Outer courier package received.',
        actor: 'Customer Support Desk',
        timestamp: new Date(Date.now() - 3600000 * 48).toLocaleString('en-IN', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }),
      },
    ],
  },
];

export function ReturnsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [filterTab, setFilterTab] = useState('ALL'); // 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'
  const [expandedHistoryId, setExpandedHistoryId] = useState(null);

  const { data: returnsData } = useQuery({
    queryKey: ['returns-list'],
    queryFn: async () => {
      try {
        const res = await axiosClient.get(ENDPOINTS.RETURNS.LIST);
        const list = Array.isArray(res) ? res : res?.returns || res?.data?.returns || [];
        if (list.length > 0) return list.filter((r) => r.status !== 'REJECTED');
      } catch (err) {
        console.warn('API returns fetch fallback to local store:', err);
      }
      const raw = mockDb.get('returns');
      if (raw && raw.length > 0) {
        return raw.filter((r) => r.status !== 'REJECTED');
      }
      return INITIAL_RETURNS.filter((r) => r.status !== 'REJECTED');
    },
    staleTime: 60 * 1000,
  });

  const rawReturns = returnsData || (mockDb.get('returns').length ? mockDb.get('returns') : INITIAL_RETURNS);
  // Auto-filter out all rejected returns from active dashboard
  const returns = Array.isArray(rawReturns) ? rawReturns.filter((r) => r.status !== 'REJECTED') : [];

  const { data: orders = [] } = useQuery({
    queryKey: ['orders-list'],
    queryFn: () => axiosClient.get(ENDPOINTS.ORDERS.LIST).catch(() => mockDb.get('orders') || []),
    staleTime: 60 * 1000,
  });

  const [isCreateRmaOpen, setIsCreateRmaOpen] = useState(false);
  const [newRma, setNewRma] = useState({
    orderNumber: '',
    customer: '',
    item: '',
    reason: 'Defective product hardware issue',
    refundAmount: '₹ 14,999.00',
  });

  const handleSelectOrderForRma = (ordNum) => {
    const list = Array.isArray(orders) ? orders : orders?.orders || [];
    const found = list.find((o) => o.orderNumber === ordNum);
    if (found) {
      const custName =
        found.customer?.name ||
        found.customerSnapshot?.name ||
        (found.customer?.firstName
          ? `${found.customer.firstName} ${found.customer.lastName || ''}`.trim()
          : 'Valued Customer');
      const itemName = found.items?.[0]?.name || 'Ordered Product Unit';
      const total = found.pricing?.total ?? (found.totalAmountPaise ? found.totalAmountPaise / 100 : 2999);
      setNewRma({
        orderNumber: ordNum,
        customer: custName,
        item: itemName,
        reason: 'Defective product - hardware issue reported by customer',
        refundAmount: `₹ ${Number(total).toLocaleString('en-IN')}.00`,
      });
    } else {
      setNewRma((prev) => ({ ...prev, orderNumber: ordNum }));
    }
  };

  const handleCreateRmaSubmit = (e) => {
    e.preventDefault();
    const rmaCode = `RET-2026-${Math.floor(100 + Math.random() * 900)}`;
    const formattedTimestamp = new Date().toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const entry = {
      id: `ret_${Date.now()}`,
      returnNumber: rmaCode,
      orderNumber: newRma.orderNumber || 'ORD-2026-9041',
      customer: newRma.customer || 'Valued Customer',
      item: newRma.item || 'Customer Returned Product',
      reason: newRma.reason,
      status: 'INSPECTION_PENDING',
      refundAmount: newRma.refundAmount || '₹ 2,999.00',
      inspectionNotes: 'Awaiting warehouse inspection of returned package.',
      verdict: 'RESTOCKED',
      history: [
        {
          id: `h_${Date.now()}`,
          action: 'REQUESTED',
          title: 'Return RMA Initiated via Support Desk',
          notes: newRma.reason,
          actor: user?.name || user?.fullName || 'Support Desk',
          timestamp: formattedTimestamp,
        },
      ],
    };

    const current = Array.isArray(returns) ? returns : [];
    const updated = [entry, ...current];
    setReturnsDataFallback(updated);
    setIsCreateRmaOpen(false);
    setSuccessToast(`Return Request ${rmaCode} initiated! Awaiting warehouse inspection.`);
  };

  const [inspectingReturn, setInspectingReturn] = useState(null);
  const [inspectionVerdict, setInspectionVerdict] = useState('RESTOCKED');
  const [inspectionNotes, setInspectionNotes] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Open inspection modal with return's specific saved notes, verdict, and history
  const openInspectModal = (r) => {
    setInspectingReturn(r);
    setInspectionVerdict(r.verdict || (r.status === 'REJECTED' ? 'REJECTED' : 'RESTOCKED'));
    setInspectionNotes(
      r.inspectionNotes ||
        (r.status === 'REJECTED'
          ? 'Customer damaged device. Return rejected.'
          : 'Hardware verified. Device eligible for refund.')
    );
  };

  const setReturnsDataFallback = (updated) => {
    const activeOnly = (Array.isArray(updated) ? updated : []).filter((r) => r.status !== 'REJECTED');
    mockDb.set('returns', activeOnly);
    queryClient.setQueryData(['returns-list'], activeOnly);
    queryClient.invalidateQueries({ queryKey: ['returns-list'] });
  };

  // Synchronize return approval or rejection directly with Orders page and database
  const syncOrderReturnStatus = (orderNumber, returnStatus, note) => {
    try {
      const orders = mockDb.get('orders');
      if (Array.isArray(orders) && orders.length > 0) {
        const updatedOrders = orders.map((o) => {
          if (o.orderNumber === orderNumber) {
            return {
              ...o,
              paymentStatus: returnStatus === 'REFUNDED' ? 'REFUNDED' : o.paymentStatus,
              returnStatus: returnStatus,
              returnNotes: note,
              timeline: [
                {
                  id: `tl_${Date.now()}`,
                  status: returnStatus === 'REFUNDED' ? 'REFUNDED' : 'RETURN_INSPECTED',
                  note: note,
                  timestamp: new Date().toISOString(),
                },
                ...(Array.isArray(o.timeline) ? o.timeline : []),
              ],
            };
          }
          return o;
        });
        mockDb.set('orders', updatedOrders);
        queryClient.setQueryData(['orders-list'], updatedOrders);
      }
    } catch (e) {
      console.warn('Sync order return status notice:', e);
    }
  };

  // Handle Approve Refund (Razorpay)
  const handleApproveRefund = async () => {
    if (!inspectingReturn) return;
    const targetId = inspectingReturn.id || inspectingReturn._id;
    const actorName =
      user?.name ||
      user?.fullName ||
      `${user?.firstName || ''} ${user?.lastName || ''}`.trim() ||
      'Sanjay D (Warehouse Lead)';
    const nowIso = new Date().toISOString();
    const formattedTimestamp = new Date().toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const newHistoryEntry = {
      id: `hist_${Date.now()}`,
      action: 'REFUND_APPROVED',
      title: `Refund Approved (${inspectingReturn.refundAmount || 'Full Amount'})`,
      verdict:
        inspectionVerdict === 'RESTOCKED'
          ? 'Verified Defect - Approve Full Gateway Refund'
          : inspectionVerdict === 'EXCHANGE'
          ? 'Device Operational - Restock to Catalog'
          : 'Approved for Refund',
      notes: inspectionNotes || 'Hardware verified. Device eligible for refund.',
      actor: actorName,
      timestamp: formattedTimestamp,
    };

    const current = Array.isArray(returns) ? returns : [];
    const updated = current.map((r) => {
      if (String(r.id || r._id) === String(targetId)) {
        const existingHistory = Array.isArray(r.history) ? r.history : [];
        return {
          ...r,
          status: 'REFUND_APPROVED',
          verdict: inspectionVerdict,
          inspectionNotes: inspectionNotes,
          inspectedAt: nowIso,
          inspectedBy: actorName,
          history: [newHistoryEntry, ...existingHistory],
        };
      }
      return r;
    });

    setReturnsDataFallback(updated);
    syncOrderReturnStatus(
      inspectingReturn.orderNumber,
      'REFUNDED',
      `Return ${inspectingReturn.returnNumber} refund of ${inspectingReturn.refundAmount} approved via Razorpay`
    );

    setSuccessToast(
      `Refund of ${inspectingReturn?.refundAmount || 'order total'} approved via Razorpay! Details history updated.`
    );
    setInspectingReturn(null);
    setTimeout(() => setSuccessToast(''), 4500);

    // Backend sync
    if (!String(targetId).startsWith('ret_')) {
      try {
        await axiosClient.post(ENDPOINTS.RETURNS.APPROVE(targetId), {
          notes: inspectionNotes,
          verdict: inspectionVerdict,
        });
      } catch (err) {
        console.warn('API approve return fallback:', err);
      }
    }
  };

  // Handle Reject Return: Reject and completely remove from returns list & dashboard
  const handleRejectReturn = async () => {
    if (!inspectingReturn) return;
    const targetId = inspectingReturn.id || inspectingReturn._id;
    const targetNumber = inspectingReturn.returnNumber;
    const targetOrderNumber = inspectingReturn.orderNumber;

    const current = Array.isArray(returns) ? returns : [];
    // Fully remove from returns dashboard and list
    const updated = current.filter((r) => String(r.id || r._id) !== String(targetId));

    setReturnsDataFallback(updated);
    syncOrderReturnStatus(
      targetOrderNumber,
      'REJECTED',
      `Return ${targetNumber} inspection rejected and removed: ${inspectionNotes}`
    );

    setSuccessToast(
      `Return request ${targetNumber} rejected and completely removed from returns dashboard.`
    );
    setInspectingReturn(null);
    setTimeout(() => setSuccessToast(''), 4500);

    // Backend sync
    if (!String(targetId).startsWith('ret_')) {
      try {
        await axiosClient.post(ENDPOINTS.RETURNS.REJECT(targetId), {
          notes: inspectionNotes,
          verdict: 'REJECTED',
        });
      } catch (err) {
        console.warn('API reject return fallback:', err);
      }
    }
  };

  // Direct remove/dismiss from returns dashboard handler
  const handleRemoveReturn = (returnItem, e) => {
    if (e) e.stopPropagation();
    const targetId = returnItem.id || returnItem._id;
    const current = Array.isArray(returns) ? returns : [];
    const updated = current.filter((r) => String(r.id || r._id) !== String(targetId));
    setReturnsDataFallback(updated);
    setSuccessToast(`Return ${returnItem.returnNumber} removed from returns dashboard.`);
    setTimeout(() => setSuccessToast(''), 3500);
  };

  // Handle Reset to Pending Inspection
  const handleResetToPending = () => {
    if (!inspectingReturn) return;
    const targetId = inspectingReturn.id || inspectingReturn._id;
    const actorName =
      user?.name ||
      user?.fullName ||
      `${user?.firstName || ''} ${user?.lastName || ''}`.trim() ||
      'Staff Inspector';
    const formattedTimestamp = new Date().toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const newHistoryEntry = {
      id: `hist_${Date.now()}`,
      action: 'INSPECTION_PENDING',
      title: 'Re-Opened for Inspection',
      notes: 'Status reset to pending inspection for additional warehouse evaluation.',
      actor: actorName,
      timestamp: formattedTimestamp,
    };

    const current = Array.isArray(returns) ? returns : [];
    const updated = current.map((r) => {
      if (String(r.id || r._id) === String(targetId)) {
        const existingHistory = Array.isArray(r.history) ? r.history : [];
        return {
          ...r,
          status: 'INSPECTION_PENDING',
          history: [newHistoryEntry, ...existingHistory],
        };
      }
      return r;
    });

    setReturnsDataFallback(updated);
    setSuccessToast(`Return request ${inspectingReturn.returnNumber} reset to Inspection Pending.`);
    setInspectingReturn(null);
    setTimeout(() => setSuccessToast(''), 4000);
  };

  // Filter returns based on active tab
  const filteredReturns = returns.filter((r) => {
    if (filterTab === 'PENDING') return r.status === 'INSPECTION_PENDING';
    if (filterTab === 'APPROVED') return r.status === 'REFUND_APPROVED';
    if (filterTab === 'REJECTED') return r.status === 'REJECTED';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Returns, Replacements & Refund Gateway
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            After-sales inspection workflow, reverse pickup tracking, and payment gateway refund settlement.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsCreateRmaOpen(true)}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          Create Return Request (RMA)
        </Button>
      </div>

      {/* Success Notification Banner */}
      {successToast && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button
            onClick={() => setSuccessToast('')}
            className="text-emerald-700 hover:text-emerald-900 font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setFilterTab('ALL')}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              filterTab === 'ALL'
                ? 'bg-brand-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Returns ({returns.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('PENDING')}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              filterTab === 'PENDING'
                ? 'bg-amber-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Pending Inspection ({returns.filter((r) => r.status === 'INSPECTION_PENDING').length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('APPROVED')}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              filterTab === 'APPROVED'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Refund Approved ({returns.filter((r) => r.status === 'REFUND_APPROVED').length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('REJECTED')}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              filterTab === 'REJECTED'
                ? 'bg-rose-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Rejected ({returns.filter((r) => r.status === 'REJECTED').length})
          </button>
        </div>

        <span className="hidden sm:inline-block text-[11px] text-slate-400">
          Inspect return button stays always enabled for full audit & status updates
        </span>
      </div>

      {/* Returns List */}
      <div className="space-y-3.5">
        {filteredReturns.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
            No return records found in this category.
          </div>
        ) : (
          filteredReturns.map((r) => {
            const isApproved = r.status === 'REFUND_APPROVED';
            const isRejected = r.status === 'REJECTED';
            const isPending = r.status === 'INSPECTION_PENDING';
            const isExpanded = expandedHistoryId === (r.id || r._id);
            const historyList = Array.isArray(r.history) ? r.history : [];

            return (
              <Card
                key={r.id || r._id}
                className="p-4 sm:p-5 flex flex-col gap-3.5 bg-white border border-slate-200 hover:border-slate-300 transition-all duration-150"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-brand-600 text-xs sm:text-sm">
                        {r.returnNumber}
                      </span>
                      <span className="text-slate-400 text-xs">for {r.orderNumber}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                          isApproved
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : isRejected
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {isApproved && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        {isRejected && <XCircle className="w-3 h-3 text-rose-600" />}
                        {isPending && <Clock className="w-3 h-3 text-amber-600" />}
                        <span>
                          {isApproved
                            ? 'REFUND APPROVED'
                            : isRejected
                            ? 'RETURN REJECTED'
                            : 'INSPECTION PENDING'}
                        </span>
                      </span>
                    </div>

                    <h4 className="font-semibold text-slate-800 text-xs sm:text-sm mt-1.5">
                      {r.item}
                    </h4>

                    <p className="text-xs text-slate-500 mt-0.5">
                      Customer:{' '}
                      <strong>
                        {typeof r.customer === 'object' && r.customer !== null
                          ? `${r.customer.firstName || ''} ${r.customer.lastName || ''}`.trim() ||
                            r.customer.email ||
                            'Valued Customer'
                          : r.customer || 'Valued Customer'}
                      </strong>{' '}
                      | Stated Reason: <span className="text-slate-700 font-medium">{r.reason}</span>
                    </p>
                  </div>

                  <div className="flex items-center sm:flex-col sm:items-end justify-between gap-2 shrink-0">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block sm:text-right">
                        Refund Amount
                      </span>
                      <div className="font-bold text-slate-900 text-sm sm:text-base">{r.refundAmount}</div>
                    </div>

                    {/* Action Buttons: Inspect or Remove */}
                    <div className="flex items-center gap-1.5">
                      {isRejected && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleRemoveReturn(r, e)}
                          className="text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                        >
                          Remove from Dashboard
                        </Button>
                      )}
                      <Button
                        variant={isPending ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => openInspectModal(r)}
                        className="text-xs shrink-0"
                      >
                        {isPending ? 'Inspect Return' : 'Inspect / Change Verdict'}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Current Details & Decision History Banner */}
                <div
                  className={`p-3 rounded-lg text-xs border ${
                    isApproved
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                      : isRejected
                      ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                      : 'bg-amber-50/70 border-amber-200 text-amber-900'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-[11px] sm:text-xs">
                        {isApproved && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                        {isRejected && <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />}
                        {isPending && <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                        <span>
                          {isApproved
                            ? `Refund of ${r.refundAmount} Approved & Settled via Razorpay`
                            : isRejected
                            ? `Return Request Rejected (No Refund Issued)`
                            : `Awaiting Physical Warehouse Device Inspection`}
                        </span>
                      </div>

                      {r.inspectionNotes && (
                        <p className="text-[11px] text-slate-600">
                          <span className="font-semibold text-slate-700">Inspection Note: </span>
                          <span>{r.inspectionNotes}</span>
                        </p>
                      )}

                      {r.inspectedBy && (
                        <p className="text-[10px] text-slate-400">
                          Processed by <strong>{r.inspectedBy}</strong>{' '}
                          {r.inspectedAt && `on ${new Date(r.inspectedAt).toLocaleDateString('en-IN')}`}
                        </p>
                      )}
                    </div>

                    {/* Expand History Toggle */}
                    {historyList.length > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedHistoryId(isExpanded ? null : (r.id || r._id))
                        }
                        className="text-[11px] font-semibold text-brand-600 hover:text-brand-800 flex items-center gap-1 shrink-0 bg-white/80 px-2 py-1 rounded border border-slate-200"
                      >
                        <History className="w-3 h-3" />
                        <span>{isExpanded ? 'Hide History' : `History (${historyList.length})`}</span>
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    )}
                  </div>

                  {/* Expandable Detailed History Audit Trail */}
                  {isExpanded && historyList.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-2">
                      <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                        Inspection & RMA Action History:
                      </div>
                      <div className="space-y-2 pl-2 border-l-2 border-brand-300">
                        {historyList.map((h, idx) => (
                          <div key={h.id || idx} className="text-[11px] space-y-0.5">
                            <div className="flex items-center justify-between text-slate-700 font-semibold">
                              <span>{h.title}</span>
                              <span className="text-[10px] text-slate-400 font-normal">
                                {h.timestamp}
                              </span>
                            </div>
                            {h.notes && <p className="text-slate-600 text-[10px]">{h.notes}</p>}
                            {h.actor && (
                              <p className="text-slate-400 text-[9px]">Action by: {h.actor}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Inspect Return Modal: FULL DETAILS, PRE-POPULATED DATA & REAL-TIME HISTORY */}
      <Modal
        isOpen={!!inspectingReturn}
        onClose={() => setInspectingReturn(null)}
        title={`Inspect Return — ${inspectingReturn?.returnNumber}`}
        description={`Order Reference: ${inspectingReturn?.orderNumber} | Customer: ${
          typeof inspectingReturn?.customer === 'object' && inspectingReturn?.customer !== null
            ? `${inspectingReturn.customer.firstName || ''} ${inspectingReturn.customer.lastName || ''}`.trim() ||
              inspectingReturn.customer.email
            : inspectingReturn?.customer || 'Valued Customer'
        }`}
      >
        {inspectingReturn && (
          <div className="space-y-4 text-xs">
            {/* Stated Details Box */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
              <p>
                <span className="text-slate-500 font-medium">Returned Item: </span>
                <span className="font-bold text-slate-800">{inspectingReturn.item}</span>
              </p>
              <p>
                <span className="text-slate-500 font-medium">Customer Stated Reason: </span>
                <span className="text-slate-700 font-medium">{inspectingReturn.reason}</span>
              </p>
              <p>
                <span className="text-slate-500 font-medium">Refund Amount: </span>
                <span className="font-bold text-brand-600">{inspectingReturn.refundAmount}</span>
              </p>
              <p>
                <span className="text-slate-500 font-medium">Current Status: </span>
                <span
                  className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                    inspectingReturn.status === 'REFUND_APPROVED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : inspectingReturn.status === 'REJECTED'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {inspectingReturn.status.replace(/_/g, ' ')}
                </span>
              </p>
            </div>

            {/* Inspection Verdict Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Physical Inspection Verdict
              </label>
              <select
                value={inspectionVerdict}
                onChange={(e) => setInspectionVerdict(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white font-medium focus:ring-brand-500 focus:border-brand-500"
              >
                <option value="RESTOCKED">Verified Defect - Approve Full Gateway Refund</option>
                <option value="EXCHANGE">Device Operational - Restock to Catalog</option>
                <option value="REJECTED">Customer Damaged - Reject Return</option>
              </select>
            </div>

            {/* Inspection & Warehouse Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Inspection & Warehouse Audit Notes
              </label>
              <textarea
                rows={3}
                value={inspectionNotes}
                onChange={(e) => setInspectionNotes(e.target.value)}
                placeholder="Details of package condition, physical inspection, and gateway approval..."
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white font-sans focus:ring-brand-500 focus:border-brand-500"
              />
            </div>

            {/* Details History in Modal */}
            {Array.isArray(inspectingReturn.history) && inspectingReturn.history.length > 0 && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                  <History className="w-3.5 h-3.5 text-brand-600" />
                  <span>Recorded Details History:</span>
                </div>
                <div className="space-y-1.5 max-h-32 overflow-y-auto pl-2 border-l-2 border-brand-400">
                  {inspectingReturn.history.map((h, i) => (
                    <div key={h.id || i} className="text-[11px]">
                      <div className="font-semibold text-slate-800 flex justify-between">
                        <span>{h.title}</span>
                        <span className="text-[10px] text-slate-400 font-normal">{h.timestamp}</span>
                      </div>
                      {h.notes && <p className="text-slate-600 text-[10px]">{h.notes}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-4 border-t border-slate-100">
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleRejectReturn}
                  className="w-full sm:w-auto"
                >
                  Reject Request
                </Button>

                {inspectingReturn.status !== 'INSPECTION_PENDING' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetToPending}
                    title="Re-open for inspection"
                    className="w-full sm:w-auto text-amber-700 border-amber-200 hover:bg-amber-50"
                  >
                    Reset Pending
                  </Button>
                )}
              </div>

              <div className="flex gap-2 w-full sm:w-auto justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInspectingReturn(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="success"
                  size="sm"
                  onClick={handleApproveRefund}
                  leftIcon={<ShieldCheck className="w-3.5 h-3.5" />}
                >
                  Approve Refund (Razorpay)
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Return Request (RMA) Modal */}
      <Modal
        isOpen={isCreateRmaOpen}
        onClose={() => setIsCreateRmaOpen(false)}
        title="Initiate Customer Return (RMA)"
        description="Create an after-sales return merchandise authorization for warehouse physical inspection"
      >
        <form onSubmit={handleCreateRmaSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Select Customer Order Reference
            </label>
            <select
              value={newRma.orderNumber}
              onChange={(e) => handleSelectOrderForRma(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white font-medium"
              required
            >
              <option value="">-- Choose an order to return --</option>
              {(Array.isArray(orders) ? orders : orders?.orders || []).slice(0, 15).map((o) => (
                <option key={o.id || o._id || o.orderNumber} value={o.orderNumber}>
                  {o.orderNumber} — {o.customer?.name || o.customerSnapshot?.name || 'Customer'} (
                  {o.pricing?.total ? `₹${o.pricing.total}` : 'Paid'})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Customer Name"
              value={newRma.customer}
              onChange={(e) => setNewRma({ ...newRma, customer: e.target.value })}
              placeholder="e.g. Ananya Krishnan"
              required
            />
            <Input
              label="Refund Amount"
              value={newRma.refundAmount}
              onChange={(e) => setNewRma({ ...newRma, refundAmount: e.target.value })}
              placeholder="e.g. ₹ 14,999.00"
              required
            />
          </div>

          <Input
            label="Product Item to Return"
            value={newRma.item}
            onChange={(e) => setNewRma({ ...newRma, item: e.target.value })}
            placeholder="e.g. Aura Pro Wireless ANC Headphones"
            required
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Stated Return / Defect Reason
            </label>
            <textarea
              rows={2}
              value={newRma.reason}
              onChange={(e) => setNewRma({ ...newRma, reason: e.target.value })}
              placeholder="e.g. Customer reported defective Bluetooth pairing on Left Cup..."
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white font-sans"
              required
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setIsCreateRmaOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Initiate Return Request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
