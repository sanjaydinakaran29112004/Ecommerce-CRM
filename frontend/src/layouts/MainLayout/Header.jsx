import React from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ROLES } from '@/config/permissions.config';
import { Menu, Search, Bell, LogOut, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function Header({ onMenuClick }) {
  const { user, logout, switchRole } = useAuth();

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
        {/* Role Switcher Demo Control (Essential for testing permissions) */}
        <div className="hidden sm:flex items-center gap-2 bg-slate-100/80 px-2.5 py-1 rounded-lg border border-slate-200">
          <UserCheck className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="text-[11px] text-slate-500 font-medium">Role:</span>
          <select
            value={user?.role}
            onChange={(e) => switchRole(e.target.value)}
            className="text-xs bg-transparent font-medium text-slate-800 focus:outline-hidden cursor-pointer"
          >
            <option value={ROLES.SUPER_ADMIN}>Super Admin (Sanjay D)</option>
            <option value={ROLES.ADMIN}>Admin (Ishwarya R)</option>
            <option value={ROLES.SALES_MANAGER}>Sales Manager (Karthik)</option>
            <option value={ROLES.SUPPORT_MANAGER}>Support Manager (Priya)</option>
          </select>
        </div>

        {/* Notifications Icon */}
        <button className="relative p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
        </button>

        {/* User Profile & Logout */}
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
