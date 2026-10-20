import axios from 'axios';

const rawApiUrl = import.meta.env.VITE_API_URL;
const API_BASE = (rawApiUrl && !rawApiUrl.includes('YOUR-BACKEND-NAME')) ? rawApiUrl : '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

// Attach token for admin requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_info');
      // Only redirect if on admin page
      if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

// ─── Products ─────────────────────────────────────────────────────────────────

export const fetchProducts = (params?: {
  search?: string;
  category?: string;
  available?: boolean;
  page?: number;
  limit?: number;
}) => api.get('/products', { params });

export const fetchProduct = (id: string) => api.get(`/products/${id}`);
export const fetchCategories = () => api.get('/products/categories');

export const createProduct = (formData: FormData) =>
  api.post('/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

export const updateProduct = (id: string, formData: FormData) =>
  api.put(`/products/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });

export const deleteProduct = (id: string) => api.delete(`/products/${id}`);

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const login = (email: string, password: string) => api.post('/auth/login', { email, password });
export const logout = () => api.post('/auth/logout');
export const getMe = () => api.get('/auth/me');

// ─── Orders ───────────────────────────────────────────────────────────────────

export const validateOrder = (items: { productId: string; quantity: number }[]) =>
  api.post('/orders/validate', { items });

// ─── Config ───────────────────────────────────────────────────────────────────

export const fetchConfig = () => api.get('/config');
export const updateConfig = (data: Record<string, unknown>) => api.put('/config', data);

export default api;
