import axios from 'axios';
import { API_CONFIG } from '@/config/api.config';
import { storage } from '@/utils/storage';
import { handleMockRequest } from '@/services/mock/mockAdapter';

export const axiosClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request Interceptor: Attach JWT Bearer Token
axiosClient.interceptors.request.use(
  async (config) => {
    // If mock mode is active, handle via Mock Adapter
    if (API_CONFIG.USE_MOCK) {
      const mockResponse = await handleMockRequest(config);
      // Short-circuit Axios and return mock response
      config.adapter = () => Promise.resolve(mockResponse);
      return config;
    }

    const token = storage.get('crm_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Standardize data extraction & handle 401s
axiosClient.interceptors.response.use(
  (response) => {
    // Return standard payload envelope
    return response.data?.data !== undefined ? response.data.data : response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized (Token Expiry)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      storage.remove('crm_access_token');
      storage.remove('crm_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login?expired=true';
      }
    }

    const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);
