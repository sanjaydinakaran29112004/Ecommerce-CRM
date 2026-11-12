import { storage } from '@/utils/storage';
import { SEED_USERS } from './data/seedUsers';
import { SEED_CUSTOMERS } from './data/seedCustomers';
import { SEED_PRODUCTS } from './data/seedProducts';
import { SEED_ORDERS } from './data/seedOrders';
import { SEED_LEADS } from './data/seedLeads';
import { SEED_TICKETS } from './data/seedTickets';

const DB_KEYS = {
  USERS: 'crm_mock_users',
  CUSTOMERS: 'crm_mock_customers',
  PRODUCTS: 'crm_mock_products',
  ORDERS: 'crm_mock_orders',
  LEADS: 'crm_mock_leads',
  TICKETS: 'crm_mock_tickets',
};

/**
 * Initializes the mock database with seed data and verifies password integrity
 */
export function initMockDb() {
  const existingUsers = storage.get(DB_KEYS.USERS);
  if (!existingUsers || existingUsers.length === 0 || !existingUsers[0].password) {
    storage.set(DB_KEYS.USERS, SEED_USERS);
  } else {
    // Ensure all 4 seed users have their active credentials and normalized roles
    const mergedUsers = SEED_USERS.map((su) => {
      const found = existingUsers.find((eu) => eu.email.toLowerCase() === su.email.toLowerCase());
      return found ? { ...found, password: su.password, role: su.role, permissions: su.permissions } : su;
    });
    storage.set(DB_KEYS.USERS, mergedUsers);
  }

  if (!storage.get(DB_KEYS.CUSTOMERS)) storage.set(DB_KEYS.CUSTOMERS, SEED_CUSTOMERS);
  if (!storage.get(DB_KEYS.PRODUCTS)) storage.set(DB_KEYS.PRODUCTS, SEED_PRODUCTS);
  if (!storage.get(DB_KEYS.ORDERS)) storage.set(DB_KEYS.ORDERS, SEED_ORDERS);
  if (!storage.get(DB_KEYS.LEADS)) storage.set(DB_KEYS.LEADS, SEED_LEADS);
  if (!storage.get(DB_KEYS.TICKETS)) storage.set(DB_KEYS.TICKETS, SEED_TICKETS);
}

export const mockDb = {
  get: (collection) => storage.get(DB_KEYS[collection.toUpperCase()] || collection, []),
  set: (collection, items) => storage.set(DB_KEYS[collection.toUpperCase()] || collection, items),
  reset: () => {
    storage.set(DB_KEYS.USERS, SEED_USERS);
    storage.set(DB_KEYS.CUSTOMERS, SEED_CUSTOMERS);
    storage.set(DB_KEYS.PRODUCTS, SEED_PRODUCTS);
    storage.set(DB_KEYS.ORDERS, SEED_ORDERS);
    storage.set(DB_KEYS.LEADS, SEED_LEADS);
    storage.set(DB_KEYS.TICKETS, SEED_TICKETS);
  }
};
