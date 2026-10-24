import axios from 'axios';
import { handleMockRequest } from './mockBackend';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 8000
});

// Request Interceptor: Attach token from localStorage
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 and mock fallback when backend is not yet live
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Only redirect if not already on the login or register page
      if (
        typeof window !== 'undefined' &&
        !window.location.pathname.startsWith('/login') &&
        !window.location.pathname.startsWith('/register')
      ) {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    // Mock fallback when backend server is offline or unreachable
    const isNetworkError = !error.response && (
      error.code === 'ERR_NETWORK' ||
      error.code === 'ECONNREFUSED' ||
      error.message?.includes('Network Error') ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ECONNABORTED'
    );

    if (isNetworkError && !originalRequest._retryMock) {
      originalRequest._retryMock = true;
      try {
        const mockResponse = handleMockRequest(originalRequest);
        if (mockResponse) {
          if (mockResponse.status >= 200 && mockResponse.status < 300) {
            return {
              data: mockResponse.data,
              status: mockResponse.status,
              statusText: 'OK',
              headers: {},
              config: originalRequest
            };
          } else {
            const err = new Error(mockResponse.data?.message || 'Request failed');
            err.response = mockResponse;
            if (mockResponse.status === 401) {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              if (
                typeof window !== 'undefined' &&
                !window.location.pathname.startsWith('/login') &&
                !window.location.pathname.startsWith('/register')
              ) {
                window.location.href = '/login';
              }
            }
            return Promise.reject(err);
          }
        }
      } catch (mockErr) {
        return Promise.reject(mockErr);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
