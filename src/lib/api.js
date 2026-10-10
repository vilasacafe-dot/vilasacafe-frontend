import { supabase } from './supabase.js';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/+$/, '');
const BASE = `${API_URL}/api`;

export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function authHeader() {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, { method = 'GET', body, auth = false, isForm = false } = {}) {
  const headers = {};
  if (!isForm) headers['Content-Type'] = 'application/json';
  if (auth) Object.assign(headers, await authHeader());

  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: isForm ? body : body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Network error. Check your connection and try again.', 0);
  }

  let payload = null;
  const text = await res.text();
  if (text) {
    try { payload = JSON.parse(text); } catch { payload = null; }
  }

  if (!res.ok) {
    const msg = payload?.error?.message || 'Request failed. Please try again.';
    throw new ApiError(msg, res.status, payload?.error?.code);
  }
  return payload;
}

export const api = {
  // Public
  getStatus: () => request('/restaurant/status'),
  getCategories: () => request('/categories'),
  getProducts: (categoryId) =>
    request(`/products${categoryId ? `?category_id=${categoryId}` : ''}`),
  getBanners: () => request('/banners'),

  // Customer
  getMe: () => request('/me', { auth: true }),
  updateProfile: (data) => request('/me/profile', { method: 'PUT', body: data, auth: true }),
  previewCoupon: (code, items) =>
    request('/coupons/preview', { method: 'POST', body: { code, items }, auth: true }),
  placeOrder: (payload) => request('/orders', { method: 'POST', body: payload, auth: true }),
  myOrders: () => request('/orders/mine', { auth: true }),
  getOrder: (id) => request(`/orders/${id}`, { auth: true }),

  // Admin
  admin: {
    updateSettings: (data) =>
      request('/admin/restaurant/settings', { method: 'PUT', body: data, auth: true }),
    listCategories: () => request('/admin/categories', { auth: true }),
    createCategory: (d) => request('/admin/categories', { method: 'POST', body: d, auth: true }),
    updateCategory: (id, d) => request(`/admin/categories/${id}`, { method: 'PUT', body: d, auth: true }),
    deleteCategory: (id) => request(`/admin/categories/${id}`, { method: 'DELETE', auth: true }),
    reorderCategories: (order) =>
      request('/admin/categories/reorder', { method: 'PUT', body: { order }, auth: true }),

    createProduct: (d) => request('/admin/products', { method: 'POST', body: d, auth: true }),
    updateProduct: (id, d) => request(`/admin/products/${id}`, { method: 'PUT', body: d, auth: true }),
    deleteProduct: (id) => request(`/admin/products/${id}`, { method: 'DELETE', auth: true }),

    listCoupons: () => request('/admin/coupons', { auth: true }),
    createCoupon: (d) => request('/admin/coupons', { method: 'POST', body: d, auth: true }),
    updateCoupon: (id, d) => request(`/admin/coupons/${id}`, { method: 'PUT', body: d, auth: true }),
    deleteCoupon: (id) => request(`/admin/coupons/${id}`, { method: 'DELETE', auth: true }),

    listBanners: () => request('/admin/banners', { auth: true }),
    createBanner: (d) => request('/admin/banners', { method: 'POST', body: d, auth: true }),
    updateBanner: (id, d) => request(`/admin/banners/${id}`, { method: 'PUT', body: d, auth: true }),
    deleteBanner: (id) => request(`/admin/banners/${id}`, { method: 'DELETE', auth: true }),

    listOrders: (status) =>
      request(`/admin/orders${status ? `?status=${status}` : ''}`, { auth: true }),
    changeStatus: (id, status) =>
      request(`/admin/orders/${id}/status`, { method: 'PUT', body: { status }, auth: true }),
    dashboard: () => request('/admin/dashboard/summary', { auth: true }),

    async uploadImage(file, kind = 'product') {
      const form = new FormData();
      form.append('image', file);
      return request(`/admin/uploads?kind=${kind}`, {
        method: 'POST',
        body: form,
        auth: true,
        isForm: true,
      });
    },
  },
};
