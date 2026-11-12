/**
 * Central API Endpoint Route Constants
 * Conforming strictly to E-Commerce CRM Blueprint Section 8
 */
export const ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },

  // Dashboard
  DASHBOARD: {
    METRICS: '/dashboard/metrics',
    SALES_TREND: '/dashboard/sales-trend',
    ORDER_STATUS: '/dashboard/order-status',
    TOP_PRODUCTS: '/dashboard/top-products',
    RECENT_ORDERS: '/dashboard/recent-orders',
  },

  // Customers
  CUSTOMERS: {
    LIST: '/customers',
    DETAIL: (id) => `/customers/${id}`,
    CREATE: '/customers',
    UPDATE: (id) => `/customers/${id}`,
    DELETE: (id) => `/customers/${id}`,
    ORDERS: (id) => `/customers/${id}/orders`,
    ACTIVITIES: (id) => `/customers/${id}/activities`,
    IMPORT: '/customers/import',
    EXPORT: '/customers/export',
  },

  // Leads
  LEADS: {
    LIST: '/leads',
    DETAIL: (id) => `/leads/${id}`,
    CREATE: '/leads',
    UPDATE: (id) => `/leads/${id}`,
    UPDATE_STAGE: (id) => `/leads/${id}/stage`,
    FOLLOW_UPS: (id) => `/leads/${id}/follow-ups`,
    CONVERT: (id) => `/leads/${id}/convert`,
  },

  // Products & Inventory
  PRODUCTS: {
    LIST: '/products',
    DETAIL: (id) => `/products/${id}`,
    CREATE: '/products',
    UPDATE: (id) => `/products/${id}`,
    DELETE: (id) => `/products/${id}`,
  },
  INVENTORY: {
    LIST: '/inventory',
    ADJUST: (id) => `/inventory/${id}/adjust`,
    LOW_STOCK: '/inventory/low-stock',
    MOVEMENTS: '/inventory/movements',
  },

  // Orders
  ORDERS: {
    LIST: '/orders',
    DETAIL: (id) => `/orders/${id}`,
    CREATE: '/orders',
    UPDATE_STATUS: (id) => `/orders/${id}/status`,
    CANCEL: (id) => `/orders/${id}/cancel`,
    PAYMENT: (id) => `/orders/${id}/payment`,
    TRACKING: (id) => `/orders/${id}/tracking`,
  },

  // Support
  TICKETS: {
    LIST: '/tickets',
    DETAIL: (id) => `/tickets/${id}`,
    CREATE: '/tickets',
    ASSIGN: (id) => `/tickets/${id}/assign`,
    UPDATE_STATUS: (id) => `/tickets/${id}/status`,
    MESSAGES: (id) => `/tickets/${id}/messages`,
  },

  // Campaigns & Marketing
  CAMPAIGNS: {
    LIST: '/campaigns',
    DETAIL: (id) => `/campaigns/${id}`,
    CREATE: '/campaigns',
    UPDATE: (id) => `/campaigns/${id}`,
    AUDIENCE: (id) => `/campaigns/${id}/audience`,
    SEND: (id) => `/campaigns/${id}/send`,
    ANALYTICS: (id) => `/campaigns/${id}/analytics`,
  },

  // Tasks
  TASKS: {
    LIST: '/tasks',
    DETAIL: (id) => `/tasks/${id}`,
    CREATE: '/tasks',
    UPDATE: (id) => `/tasks/${id}`,
    DELETE: (id) => `/tasks/${id}`,
  },

  // Returns & Refunds
  RETURNS: {
    LIST: '/returns',
    DETAIL: (id) => `/returns/${id}`,
    APPROVE: (id) => `/returns/${id}/approve`,
    INSPECT: (id) => `/returns/${id}/inspect`,
    REFUND: (id) => `/returns/${id}/refund`,
  },

  // Reports
  REPORTS: {
    SALES: '/reports/sales',
    CUSTOMERS: '/reports/customers',
    ORDERS: '/reports/orders',
    PRODUCTS: '/reports/products',
    EMPLOYEES: '/reports/employees',
    SUPPORT: '/reports/support',
  },

  // Settings & Audit
  SETTINGS: {
    COMPANY: '/settings/company',
    ROLES: '/settings/roles',
    AUDIT_LOGS: '/audit-logs',
  },
};
