/**
 * Exactly 4 Primary Roles & Granular Permission Matrix
 * Tailored for E-Commerce CRM
 */

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  SALES_EMPLOYEE: 'SALES_EMPLOYEE',
  SUPPORT_EMPLOYEE: 'SUPPORT_EMPLOYEE',
};

export const ROLE_LABELS = {
  [ROLES.SUPER_ADMIN]: 'Super Admin',
  [ROLES.ADMIN]: 'Admin',
  [ROLES.SALES_EMPLOYEE]: 'Sales Employee',
  [ROLES.SUPPORT_EMPLOYEE]: 'Support Employee',
};

export const PERMISSIONS = {
  // Customers
  CUSTOMERS_READ: 'customers.read',
  CUSTOMERS_CREATE: 'customers.create',
  CUSTOMERS_UPDATE: 'customers.update',
  CUSTOMERS_DELETE: 'customers.delete',
  CUSTOMERS_EXPORT: 'customers.export',

  // Leads & Sales
  LEADS_READ: 'leads.read',
  LEADS_CREATE: 'leads.create',
  LEADS_UPDATE: 'leads.update',
  LEADS_CONVERT: 'leads.convert',

  // Products & Inventory
  PRODUCTS_READ: 'products.read',
  PRODUCTS_CREATE: 'products.create',
  PRODUCTS_UPDATE: 'products.update',
  INVENTORY_ADJUST: 'inventory.adjust',

  // Orders & Payments
  ORDERS_READ: 'orders.read',
  ORDERS_CREATE: 'orders.create',
  ORDERS_UPDATE_STATUS: 'orders.update_status',
  ORDERS_CANCEL: 'orders.cancel',
  REFUNDS_APPROVE: 'refunds.approve',

  // Support Tickets
  TICKETS_READ: 'tickets.read',
  TICKETS_CREATE: 'tickets.create',
  TICKETS_ASSIGN: 'tickets.assign',
  TICKETS_REPLY: 'tickets.reply',
  TICKETS_CLOSE: 'tickets.close',

  // Marketing & Campaigns
  CAMPAIGNS_READ: 'campaigns.read',
  CAMPAIGNS_MANAGE: 'campaigns.manage',

  // Reports
  REPORTS_VIEW: 'reports.view',
  REPORTS_EXPORT: 'reports.export',

  // Settings & Employees
  EMPLOYEES_MANAGE: 'employees.manage',
  SETTINGS_MANAGE: 'settings.manage',
  AUDIT_LOGS_VIEW: 'audit_logs.view',
};

export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),
  [ROLES.ADMIN]: Object.values(PERMISSIONS).filter(p => p !== PERMISSIONS.SETTINGS_MANAGE),
  [ROLES.SALES_EMPLOYEE]: [
    PERMISSIONS.CUSTOMERS_READ,
    PERMISSIONS.CUSTOMERS_CREATE,
    PERMISSIONS.CUSTOMERS_UPDATE,
    PERMISSIONS.LEADS_READ,
    PERMISSIONS.LEADS_CREATE,
    PERMISSIONS.LEADS_UPDATE,
    PERMISSIONS.LEADS_CONVERT,
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.ORDERS_CREATE,
    PERMISSIONS.ORDERS_UPDATE_STATUS,
    PERMISSIONS.ORDERS_CANCEL,
    PERMISSIONS.REFUNDS_APPROVE,
    PERMISSIONS.REPORTS_VIEW,
  ],
  [ROLES.SUPPORT_EMPLOYEE]: [
    PERMISSIONS.CUSTOMERS_READ,
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.ORDERS_CREATE,
    PERMISSIONS.ORDERS_UPDATE_STATUS,
    PERMISSIONS.ORDERS_CANCEL,
    PERMISSIONS.TICKETS_READ,
    PERMISSIONS.TICKETS_CREATE,
    PERMISSIONS.TICKETS_REPLY,
    PERMISSIONS.TICKETS_CLOSE,
    PERMISSIONS.REFUNDS_APPROVE,
    PERMISSIONS.REPORTS_VIEW,
  ],
};

/**
 * Permitted Sidebar Modules per Role
 * Directly controls what each person can see based on whether they are Admin or Employee
 */
export const ROLE_MODULES = {
  [ROLES.SUPER_ADMIN]: [
    '/dashboard',
    '/customers',
    '/leads',
    '/products',
    '/orders',
    '/support',
    '/campaigns',
    '/tasks',
    '/returns',
    '/reports',
    '/employees',
    '/settings',
  ],
  [ROLES.ADMIN]: [
    '/dashboard',
    '/customers',
    '/leads',
    '/products',
    '/orders',
    '/support',
    '/campaigns',
    '/tasks',
    '/returns',
    '/reports',
    '/employees',
  ],
  [ROLES.SALES_EMPLOYEE]: [
    '/dashboard',
    '/customers',
    '/leads',
    '/orders',
    '/tasks',
    '/reports',
  ],
  [ROLES.SUPPORT_EMPLOYEE]: [
    '/dashboard',
    '/customers',
    '/orders',
    '/support',
    '/returns',
    '/tasks',
  ],
};
