import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ROLE_MODULES, ROLES, ROLE_LABELS } from '@/config/permissions.config';
import {
  LayoutDashboard,
  Users,
  Target,
  Package,
  ShoppingBag,
  LifeBuoy,
  Megaphone,
  CheckSquare,
  RotateCcw,
  BarChart3,
  UserCog,
  Settings,
  ShieldCheck,
  Shield,
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Customers', path: '/customers', icon: Users },
  { label: 'Leads & Sales', path: '/leads', icon: Target },
  { label: 'Products & Stock', path: '/products', icon: Package },
  { label: 'Orders & Payments', path: '/orders', icon: ShoppingBag },
  { label: 'Support Tickets', path: '/support', icon: LifeBuoy },
  { label: 'Campaigns', path: '/campaigns', icon: Megaphone },
  { label: 'Tasks & Activities', path: '/tasks', icon: CheckSquare },
  { label: 'Returns & Refunds', path: '/returns', icon: RotateCcw },
  { label: 'Reports & Analytics', path: '/reports', icon: BarChart3 },
  { label: 'Employees & Roles', path: '/employees', icon: UserCog },
  { label: 'Settings & Audit', path: '/settings', icon: Settings },
];

export function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();

  // Normalize any role aliases (e.g. SUPPORT_MANAGER -> SUPPORT_EMPLOYEE)
  let currentRole = user?.role || ROLES.SALES_EMPLOYEE;
  if (currentRole === 'SUPPORT_MANAGER') currentRole = ROLES.SUPPORT_EMPLOYEE;
  if (currentRole === 'SALES_MANAGER') currentRole = ROLES.SALES_EMPLOYEE;

  // Filter modules permitted strictly for the logged-in person's role
  const permittedPaths = ROLE_MODULES[currentRole] || ROLE_MODULES[ROLES.SALES_EMPLOYEE];
  const visibleNavItems = NAV_ITEMS.filter((item) => permittedPaths.includes(item.path));

  // Role Badge Styling
  const getRoleBadge = (role) => {
    switch (role) {
      case ROLES.SUPER_ADMIN:
        return { label: 'Super Admin', color: 'text-purple-400 bg-purple-950/60 border-purple-800' };
      case ROLES.ADMIN:
        return { label: 'Admin', color: 'text-indigo-400 bg-indigo-950/60 border-indigo-800' };
      case ROLES.SALES_EMPLOYEE:
      case 'SALES_MANAGER':
        return { label: 'Sales Employee', color: 'text-emerald-400 bg-emerald-950/60 border-emerald-800' };
      case ROLES.SUPPORT_EMPLOYEE:
      case 'SUPPORT_MANAGER':
        return { label: 'Support Employee', color: 'text-amber-400 bg-amber-950/60 border-amber-800' };
      default:
        return { label: 'Staff Member', color: 'text-slate-400 bg-slate-800 border-slate-700' };
    }
  };

  const roleInfo = getRoleBadge(currentRole);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-800/80">
          <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-white text-base tracking-tight leading-none">EntryKode CRM</h1>
            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">
              E-Commerce Suite
            </p>
          </div>
        </div>

        {/* Navigation Items (Tailored strictly to logged-in person) */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Assigned Scope ({visibleNavItems.length} Modules)
          </div>

          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all duration-150',
                    isActive
                      ? 'bg-brand-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  )
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Logged in User Profile in Sidebar Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={user?.name}
              className="w-9 h-9 rounded-full object-cover border border-slate-700 shrink-0"
            />
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-semibold text-white truncate">{user?.name || 'Authorized User'}</p>
              <div className="mt-0.5">
                <span
                  className={cn(
                    'inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold border',
                    roleInfo.color
                  )}
                >
                  {roleInfo.label}
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
