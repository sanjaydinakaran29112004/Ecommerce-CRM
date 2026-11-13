import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ROLES, ROLE_LABELS } from '@/config/permissions.config';
import { axiosClient } from '@/services/api/axiosClient';
import { ENDPOINTS } from '@/services/api/endpoints';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import {
  Menu,
  Search,
  Bell,
  LogOut,
  Shield,
  CheckCheck,
  ShoppingBag,
  AlertTriangle,
  LifeBuoy,
  Users,
  Package,
  X,
  ExternalLink,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function Header({ onMenuClick }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef(null);

  // Persistent dismissed notification IDs stored in localStorage
  const [dismissedIds, setDismissedIds] = useState(() => {
    try {
      const saved = localStorage.getItem('crm_dismissed_notifs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const persistDismissed = (newDismissed) => {
    setDismissedIds(newDismissed);
    try {
      localStorage.setItem('crm_dismissed_notifs', JSON.stringify(newDismissed));
    } catch {}
  };

  // Live queries for real system data (Single Source of Truth)
  const { data: products = [] } = useQuery({
    queryKey: ['products-list'],
    queryFn: () => axiosClient.get(ENDPOINTS.PRODUCTS.LIST),
    staleTime: 30 * 1000,
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['orders-list'],
    queryFn: () => axiosClient.get(ENDPOINTS.ORDERS.LIST),
    staleTime: 30 * 1000,
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers-list'],
    queryFn: () => axiosClient.get(ENDPOINTS.CUSTOMERS.LIST),
    staleTime: 60 * 1000,
  });

  const { data: tickets = [] } = useQuery({
    queryKey: ['tickets-list'],
    queryFn: () => axiosClient.get(ENDPOINTS.TICKETS.LIST).catch(() => []),
    staleTime: 60 * 1000,
  });

  const normalizedProducts = useMemo(
    () => (Array.isArray(products) ? products : products?.products || []),
    [products]
  );
  const normalizedOrders = useMemo(
    () => (Array.isArray(orders) ? orders : orders?.orders || []),
    [orders]
  );
  const normalizedCustomers = useMemo(
    () => (Array.isArray(customers) ? customers : customers?.customers || []),
    [customers]
  );
  const normalizedTickets = useMemo(
    () => (Array.isArray(tickets) ? tickets : tickets?.tickets || []),
    [tickets]
  );

  // Dynamic system notifications computed from live product stock, new orders, and tickets
  const dynamicNotifications = useMemo(() => {
    const list = [];

    // 1. Low stock alerts (Triggered when stock is low, e.g. < 10)
    normalizedProducts.forEach((p) => {
      const stock = p.stock ?? p.availableStock ?? 0;
      if (stock <= 10) {
        list.push({
          id: `low_stock_${p._id || p.id || p.sku}`,
          title: 'Low Stock Alert',
          message: `${p.name} (SKU: ${p.sku}) has only ${stock} units remaining in inventory.`,
          time: 'Action Required',
          icon: AlertTriangle,
          color: 'text-amber-600 bg-amber-50',
          link: '/products',
        });
      }
    });

    // 2. Recent live orders
    normalizedOrders.slice(0, 4).forEach((o) => {
      const custName = o.customer?.name || o.customerSnapshot?.name || 'Customer';
      const total = o.pricing?.total ?? (o.totalAmountPaise ? o.totalAmountPaise / 100 : 0);
      list.push({
        id: `order_${o.orderNumber || o.id || o._id}`,
        title: `Order ${o.orderNumber || ''}`,
        message: `Placed by ${custName} (${formatCurrency(total)}) • Status: ${o.orderStatus || 'PLACED'}`,
        time: formatDate(o.placedAt || o.createdAt, 'hh:mm a'),
        icon: ShoppingBag,
        color: 'text-brand-600 bg-brand-50',
        link: '/orders',
      });
    });

    // 3. High priority support tickets
    normalizedTickets
      .filter((t) => t.priority === 'HIGH' || t.status === 'OPEN')
      .slice(0, 2)
      .forEach((t) => {
        list.push({
          id: `ticket_${t.ticketNumber || t._id || t.id}`,
          title: `Support Ticket ${t.ticketNumber || ''}`,
          message: `${t.subject || 'Customer Enquiry'} (${t.priority || 'HIGH'} Priority)`,
          time: 'Active Queue',
          icon: LifeBuoy,
          color: 'text-purple-600 bg-purple-50',
          link: '/support',
        });
      });

    // Filter out dismissed notifications
    return list.filter((n) => !dismissedIds.includes(n.id));
  }, [normalizedProducts, normalizedOrders, normalizedTickets, dismissedIds]);

  const unreadCount = dynamicNotifications.length;

  // Clear a single notification when viewed/clicked
  const handleNotificationClick = (item) => {
    const updated = [...dismissedIds, item.id];
    persistDismissed(updated);
    if (item.link) {
      navigate(item.link);
    }
    setIsNotifOpen(false);
  };

  // Clear all notifications at once
  const handleClearAllNotifications = () => {
    const allCurrentIds = dynamicNotifications.map((n) => n.id);
    const updated = [...new Set([...dismissedIds, ...allCurrentIds])];
    persistDismissed(updated);
  };

  // Real-time Global Search multi-entity filter
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return null;

    const matchedCustomers = normalizedCustomers.filter((c) => {
      const name = (c.name || `${c.firstName || ''} ${c.lastName || ''}`).toLowerCase();
      const email = (c.email || '').toLowerCase();
      const phone = (c.phone || '').toLowerCase();
      const code = (c.customerCode || '').toLowerCase();
      return name.includes(q) || email.includes(q) || phone.includes(q) || code.includes(q);
    }).slice(0, 4);

    const matchedOrders = normalizedOrders.filter((o) => {
      const num = (o.orderNumber || '').toLowerCase();
      const cust = (o.customer?.name || o.customerSnapshot?.name || '').toLowerCase();
      return num.includes(q) || cust.includes(q);
    }).slice(0, 4);

    const matchedProducts = normalizedProducts.filter((p) => {
      const name = (p.name || '').toLowerCase();
      const sku = (p.sku || '').toLowerCase();
      const category = (p.category || '').toLowerCase();
      return name.includes(q) || sku.includes(q) || category.includes(q);
    }).slice(0, 4);

    const matchedTickets = normalizedTickets.filter((t) => {
      const num = (t.ticketNumber || '').toLowerCase();
      const subj = (t.subject || '').toLowerCase();
      return num.includes(q) || subj.includes(q);
    }).slice(0, 3);

    const totalMatches =
      matchedCustomers.length + matchedOrders.length + matchedProducts.length + matchedTickets.length;

    return {
      customers: matchedCustomers,
      orders: matchedOrders,
      products: matchedProducts,
      tickets: matchedTickets,
      totalMatches,
    };
  }, [searchQuery, normalizedCustomers, normalizedOrders, normalizedProducts, normalizedTickets]);

  // Click outside listener for search popover
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    if (searchResults && searchResults.customers.length > 0) {
      navigate(`/customers?search=${encodeURIComponent(searchQuery.trim())}`);
    } else if (searchResults && searchResults.orders.length > 0) {
      navigate(`/orders`);
    } else if (searchResults && searchResults.products.length > 0) {
      navigate(`/products`);
    } else {
      navigate(`/customers?search=${encodeURIComponent(searchQuery.trim())}`);
    }
    setIsSearchOpen(false);
  };

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case ROLES.SUPER_ADMIN:
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case ROLES.ADMIN:
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case ROLES.SALES_EMPLOYEE:
      case 'SALES_MANAGER':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case ROLES.SUPPORT_EMPLOYEE:
      case 'SUPPORT_MANAGER':
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
          className="p-2 text-slate-500 hover:text-slate-700 lg:hidden rounded-lg hover:bg-slate-100 cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Interactive Global Search Bar */}
        <div ref={searchContainerRef} className="relative hidden md:block w-72 lg:w-96">
          <form onSubmit={handleSearchSubmit}>
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              placeholder="Search customers, orders, SKU, tickets..."
              className="w-full pl-9 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-hidden focus:border-brand-500 focus:bg-white transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchOpen(false);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          {/* Live Search Interactive Results Dropdown */}
          {isSearchOpen && searchResults && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden divide-y divide-slate-100 max-h-96 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
              <div className="p-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500">
                <span>Search Results for "{searchQuery}"</span>
                <span className="text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                  {searchResults.totalMatches} Matches
                </span>
              </div>

              {searchResults.totalMatches === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No records matching "{searchQuery}". Try searching by customer name, order #, or SKU.
                </div>
              ) : (
                <>
                  {/* Customers Category */}
                  {searchResults.customers.length > 0 && (
                    <div className="p-2">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1 flex items-center gap-1.5">
                        <Users className="w-3 h-3 text-brand-600" />
                        <span>Customers ({searchResults.customers.length})</span>
                      </div>
                      {searchResults.customers.map((c) => (
                        <div
                          key={c._id || c.id}
                          onClick={() => {
                            navigate(`/customers?search=${encodeURIComponent(c.name || c.firstName)}`);
                            setIsSearchOpen(false);
                          }}
                          className="p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors flex items-center justify-between"
                        >
                          <div>
                            <div className="font-semibold text-xs text-slate-800">
                              {c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim()}
                            </div>
                            <div className="text-[10px] text-slate-400">{c.email} • {c.phone}</div>
                          </div>
                          <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded border border-brand-200">
                            {c.customerCode || 'CUSTOMER'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Orders Category */}
                  {searchResults.orders.length > 0 && (
                    <div className="p-2">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1 flex items-center gap-1.5">
                        <ShoppingBag className="w-3 h-3 text-emerald-600" />
                        <span>Orders ({searchResults.orders.length})</span>
                      </div>
                      {searchResults.orders.map((o) => (
                        <div
                          key={o._id || o.id}
                          onClick={() => {
                            navigate(`/orders`);
                            setIsSearchOpen(false);
                          }}
                          className="p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors flex items-center justify-between"
                        >
                          <div>
                            <div className="font-mono font-bold text-xs text-brand-600">
                              {o.orderNumber}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {o.customer?.name || o.customerSnapshot?.name || 'Customer'} • {o.orderStatus}
                            </div>
                          </div>
                          <span className="text-xs font-bold text-slate-800">
                            {formatCurrency(o.pricing?.total ?? (o.totalAmountPaise ? o.totalAmountPaise / 100 : 0))}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Products / SKU Category */}
                  {searchResults.products.length > 0 && (
                    <div className="p-2">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1 flex items-center gap-1.5">
                        <Package className="w-3 h-3 text-indigo-600" />
                        <span>Products & SKUs ({searchResults.products.length})</span>
                      </div>
                      {searchResults.products.map((p) => (
                        <div
                          key={p._id || p.id}
                          onClick={() => {
                            navigate(`/products`);
                            setIsSearchOpen(false);
                          }}
                          className="p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors flex items-center justify-between"
                        >
                          <div>
                            <div className="font-semibold text-xs text-slate-800">{p.name}</div>
                            <div className="text-[10px] font-mono text-slate-400">SKU: {p.sku}</div>
                          </div>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                            (p.stock ?? p.availableStock ?? 0) <= 10
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            {p.stock ?? p.availableStock ?? 0} in stock
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Support Tickets Category */}
                  {searchResults.tickets.length > 0 && (
                    <div className="p-2">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1 flex items-center gap-1.5">
                        <LifeBuoy className="w-3 h-3 text-purple-600" />
                        <span>Support Tickets ({searchResults.tickets.length})</span>
                      </div>
                      {searchResults.tickets.map((t) => (
                        <div
                          key={t._id || t.id}
                          onClick={() => {
                            navigate(`/support`);
                            setIsSearchOpen(false);
                          }}
                          className="p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors flex items-center justify-between"
                        >
                          <div>
                            <div className="font-mono font-bold text-xs text-slate-800">
                              {t.ticketNumber}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate max-w-[200px]">
                              {t.subject}
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                            {t.priority || 'HIGH'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Authenticated Person Info & Role Badge */}
        <div className="flex items-center gap-2.5">
          <img
            src={
              user?.avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                user?.name || user?.firstName || 'Staff'
              )}&background=4f46e5&color=fff`
            }
            alt={user?.name || 'User Avatar'}
            className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-2xs"
          />
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-slate-900 leading-tight">
              {user?.name ||
                user?.fullName ||
                `${user?.firstName || ''} ${user?.lastName || ''}`.trim() ||
                user?.email ||
                'Staff Member'}
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {user?.email || 'authenticated'}
            </div>
          </div>

          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${getRoleBadgeStyle(
              user?.role
            )}`}
          >
            <Shield className="w-3 h-3" />
            <span>{(ROLE_LABELS && ROLE_LABELS[user?.role]) || user?.role?.replace(/_/g, ' ') || 'Employee'}</span>
          </span>
        </div>

        {/* Dynamic Notifications Bell Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)} />
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-800">System Notifications</span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-brand-50 text-brand-700 border border-brand-200">
                        {unreadCount} active
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleClearAllNotifications}
                      className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 cursor-pointer"
                      title="Clear all notifications"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Mark all read</span>
                    </button>
                  )}
                </div>

                <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                  {dynamicNotifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 space-y-2">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                      <p className="text-xs font-semibold text-slate-700">All caught up!</p>
                      <p className="text-[11px] text-slate-400">
                        No active low-stock alerts or unread notifications.
                      </p>
                    </div>
                  ) : (
                    dynamicNotifications.map((item) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleNotificationClick(item)}
                          className="p-3.5 flex items-start gap-3 hover:bg-slate-50 transition-colors cursor-pointer group"
                        >
                          <div className={`p-2 rounded-lg shrink-0 ${item.color}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-semibold text-slate-900 group-hover:text-brand-600 transition-colors">
                                {item.title}
                              </p>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleNotificationClick(item);
                                }}
                                title="Dismiss notification"
                                className="text-slate-300 hover:text-rose-500 p-0.5"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                              {item.message}
                            </p>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              {item.time}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Real Working Logout Button */}
        <div className="flex items-center pl-2 border-l border-slate-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            leftIcon={<LogOut className="w-4 h-4 text-slate-500" />}
            className="text-xs text-slate-700 hover:text-rose-600 font-semibold cursor-pointer"
            title="Sign out of your session"
          >
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
