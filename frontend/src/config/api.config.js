/**
 * API and Network Configuration
 */
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1',
  SOCKET_URL: import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000',
  USE_MOCK: import.meta.env.VITE_USE_MOCK === 'true',
  TIMEOUT: 15000,
};

