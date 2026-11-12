import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ROLES, ROLE_LABELS } from '@/config/permissions.config';
import { Menu, Search, Bell, LogOut, UserCheck, Shield, CheckCheck, ShoppingBag, AlertTriangle, LifeBuoy, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif_1',
    title: 'New B2B Bulk Order',
    message: 'ORD-2026-9044 placed by Deepak Chandrasekar (₹ 4,227.00)',
    time: '5 mins ago',
    unread: true,
    icon: ShoppingBag,
    color: 'text-brand-600 bg-brand-50',
  },
  {
    id: 'notif_2',
    title: 'Return Request Pending',
    message: 'RET-2026-041 for ANC Headphones requires warehouse inspection',
    time: '24 mins ago',
    unread: true,
    icon: RotateCcw,
    color: 'text-amber-600 bg-amber-50',
  },
  {
    id: 'notif_3',
    title: 'Low Stock Alert',
    message: 'Mechanical Keyboard (SKU: EK-PERI-004) reached 0 units',
    time: '1 hour ago',
    unread: true,
    icon: AlertTriangle,
    color: 'text-rose-600 bg-rose-50',
  },
  {
    id: 'notif_4',
    title: 'Support Escalation',
    message: 'Ticket TKT-2026-1045 priority set to HIGH (Anniversary Gift)',
    time: '2 hours ago',
    unread: true,
    icon: LifeBuoy,
    color: 'text-purple-600 bg-purple-50',
  },
];

export function Header({ onMenuClick }) {
  const navigate = useNavigate();
  const { user, logout, switchRole } = useAuth();
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, unread: false })));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/customers?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case ROLES.SUPER_ADMIN:
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case ROLES.ADMIN:
        return 'bg-brand-50 text-brand-700 border-brand-200';
      case ROLES.SALES_EMPLOYEE:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case ROLES.SUPPORT_EMPLOYEE:
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-2 text-slate-500 hover:text-slate-700 lg:hidden rounded-lg hover:bg-slate-100"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar with working Enter navigation */}
        <form onSubmit={handleSearchSubmit} className="relative hidden md:block w-72 lg:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customers, orders, SKU, tickets (Press Enter)..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-hidden focus:border-brand-500 focus:bg-white transition-colors"
          />
        </form>
      </div>

      <div className="flex items-center gap-3">
        {/* Active Role Indicator Badge */}
        <div className="hidden lg:flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Logged in as:</span>
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeColor(
              user?.role
            )}`}
          >
            <Shield className="w-3 h-3" />
            <span>{ROLE_LABELS[user?.role] || 'Employee'}</span>
          </span>
        </div>

        {/* Quick Role Switcher (Strictly 4 Roles) */}
        <div className="flex items-center gap-1.5 bg-slate-100/90 px-2.5 py-1 rounded-lg border border-slate-200">
          <UserCheck className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">Role:</span>
          <select
            value={user?.role}
            onChange={(e) => switchRole(e.target.value)}
            className="text-xs bg-transparent font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
          >
            <option value={ROLES.SUPER_ADMIN}>Super Admin (Sanjay D)</option>
            <option value={ROLES.ADMIN}>Admin (Ishwarya R)</option>
            <option value={ROLES.SALES_EMPLOYEE}>Sales Employee (Karthik)</option>
            <option value={ROLES.SUPPORT_EMPLOYEE}>Support Employee (Priya)</option>
          </select>
        </div>

        {/* Working Notifications Bell Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Popover */}
          {isNotifOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsNotifOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-800">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-brand-50 text-brand-700 border border-brand-200">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Mark all read</span>
                    </button>
                  )}
                </div>

                <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                  {notifications.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.id}
                        className={`p-3.5 flex items-start gap-3 hover:bg-slate-50 transition-colors ${
                          item.unread ? 'bg-brand-50/20' : ''
                        }`}
                      >
                        <div className={`p-2 rounded-lg shrink-0 ${item.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className="text-xs font-semibold text-slate-900 leading-tight">
                            {item.title}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                            {item.message}
                          </p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {item.time}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Logout Button */}
        <div className="flex items-center pl-2 border-l border-slate-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            leftIcon={<LogOut className="w-4 h-4 text-slate-500" />}
            className="text-xs text-slate-600 hover:text-rose-600"
          >
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
