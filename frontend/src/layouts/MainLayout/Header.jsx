import React from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ROLES, ROLE_LABELS } from '@/config/permissions.config';
import { Menu, Search, Bell, LogOut, UserCheck, Shield } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function Header({ onMenuClick }) {
  const { user, logout, switchRole } = useAuth();

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

        {/* Global Search Bar */}
        <div className="relative hidden md:block w-72 lg:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search customers, orders, SKU, tickets..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-hidden focus:border-brand-500 focus:bg-white transition-colors"
          />
        </div>
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

        {/* Notifications Icon */}
        <button className="relative p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
        </button>

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
