import { mockDb, initMockDb } from './mockDb';

initMockDb();

const sleep = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Handles simulated mock API responses for REST endpoints
 */
export async function handleMockRequest(config) {
  const { url, method, data, params } = config;
  const cleanUrl = url.replace(/^\/api\/v1/, '').split('?')[0];

  // Add realistic network round-trip latency
  await sleep(250 + Math.random() * 150);

  // AUTH
  if (cleanUrl === '/auth/login' && method.toLowerCase() === 'post') {
    const payload = typeof data === 'string' ? JSON.parse(data) : data;
    const users = mockDb.get('users');
    const user = users.find(u => u.email.toLowerCase() === payload.email.toLowerCase()) || users[0];
    
    return {
      status: 200,
      data: {
        success: true,
        message: 'Login successful',
        data: {
          user,
          accessToken: user.token,
          refreshToken: 'refresh_mock_token_abc123',
        }
      }
    };
  }

  if (cleanUrl === '/auth/me') {
    const users = mockDb.get('users');
    return {
      status: 200,
      data: {
        success: true,
        data: users[0]
      }
    };
  }

  // DASHBOARD
  if (cleanUrl === '/dashboard/metrics') {
    const orders = mockDb.get('orders');
    const customers = mockDb.get('customers');
    const leads = mockDb.get('leads');

    const totalRevenue = orders.reduce((sum, o) => sum + (o.pricing?.total || 0), 0);
    const avgOrderValue = orders.length ? Math.round(totalRevenue / orders.length) : 0;

    return {
      status: 200,
      data: {
        success: true,
        data: {
          revenue: { value: totalRevenue, delta: '+14.2%', deltaType: 'increase' },
          orders: { value: orders.length, delta: '+8.1%', deltaType: 'increase' },
          customers: { value: customers.length, delta: '+12.5%', deltaType: 'increase' },
          averageOrderValue: { value: avgOrderValue, delta: '+3.4%', deltaType: 'increase' },
          activeLeads: { value: leads.length, delta: '+5', deltaType: 'increase' },
        }
      }
    };
  }

  if (cleanUrl === '/dashboard/sales-trend') {
    return {
      status: 200,
      data: {
        success: true,
        data: [
          { month: 'Oct', revenue: 284000, orders: 42 },
          { month: 'Nov', revenue: 345000, orders: 58 },
          { month: 'Dec', revenue: 512000, orders: 94 },
          { month: 'Jan', revenue: 418000, orders: 67 },
          { month: 'Feb', revenue: 462000, orders: 79 },
          { month: 'Mar', revenue: 538000, orders: 88 },
        ]
      }
    };
  }

  if (cleanUrl === '/dashboard/order-status') {
    return {
      status: 200,
      data: {
        success: true,
        data: [
          { name: 'Delivered', value: 142, color: '#10b981' },
          { name: 'Shipped', value: 38, color: '#6366f1' },
          { name: 'Processing', value: 24, color: '#f59e0b' },
          { name: 'Cancelled', value: 8, color: '#ef4444' },
        ]
      }
    };
  }

  // CUSTOMERS
  if (cleanUrl === '/customers') {
    const customers = mockDb.get('customers');
    return {
      status: 200,
      data: {
        success: true,
        data: customers,
        meta: { total: customers.length, page: 1, limit: 10 }
      }
    };
  }

  // ORDERS
  if (cleanUrl === '/orders') {
    const orders = mockDb.get('orders');
    return {
      status: 200,
      data: {
        success: true,
        data: orders,
        meta: { total: orders.length, page: 1, limit: 10 }
      }
    };
  }

  // PRODUCTS
  if (cleanUrl === '/products') {
    const products = mockDb.get('products');
    return {
      status: 200,
      data: {
        success: true,
        data: products,
        meta: { total: products.length, page: 1, limit: 10 }
      }
    };
  }

  // LEADS
  if (cleanUrl === '/leads') {
    const leads = mockDb.get('leads');
    return {
      status: 200,
      data: {
        success: true,
        data: leads,
        meta: { total: leads.length, page: 1, limit: 10 }
      }
    };
  }

  // TICKETS
  if (cleanUrl === '/tickets') {
    const tickets = mockDb.get('tickets');
    return {
      status: 200,
      data: {
        success: true,
        data: tickets,
        meta: { total: tickets.length, page: 1, limit: 10 }
      }
    };
  }

  // Generic fallback
  return {
    status: 200,
    data: {
      success: true,
      data: [],
      message: 'Mock response OK'
    }
  };
}
