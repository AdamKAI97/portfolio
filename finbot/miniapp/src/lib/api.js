import { initData } from './telegram.js';

const BASE = import.meta.env.VITE_API_URL || '/api/client';

async function request(path, { method = 'GET', body, query } = {}) {
  const url = new URL(`${BASE}${path}`, window.location.origin);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
    });
  }

  const response = await fetch(url.toString(), {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-telegram-init-data': initData
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`${response.status}: ${text || response.statusText}`);
  }

  return response.json();
}

export const api = {
  me: () => request('/me'),
  updateMe: (data) => request('/me', { method: 'PUT', body: data }),

  categories: (type) => request('/categories', { query: { type } }),
  createCategory: (data) => request('/categories', { method: 'POST', body: data }),

  transactions: (query) => request('/transactions', { query }),
  createTransaction: (data) => request('/transactions', { method: 'POST', body: data }),
  updateTransaction: (id, data) => request(`/transactions/${id}`, { method: 'PUT', body: data }),
  deleteTransaction: (id) => request(`/transactions/${id}`, { method: 'DELETE' }),

  overview: (month) => request('/overview', { query: { month } }),
  trend: (months = 6) => request('/trend', { query: { months } }),
  daily: (query) => request('/daily', { query }),
  stories: () => request('/stories'),
  advice: () => request('/advice'),
  achievements: () => request('/achievements'),
  healthScore: () => request('/health-score'),

  goals: () => request('/goals'),
  createGoal: (data) => request('/goals', { method: 'POST', body: data }),
  depositGoal: (id, amount) => request(`/goals/${id}/deposit`, { method: 'POST', body: { amount } }),
  deleteGoal: (id) => request(`/goals/${id}`, { method: 'DELETE' }),

  budgets: (month) => request('/budgets', { query: { month } }),
  setBudget: (data) => request('/budgets', { method: 'PUT', body: data }),
  deleteBudget: (id) => request(`/budgets/${id}`, { method: 'DELETE' }),

  allowance: () => request('/allowance'),

  recurring: () => request('/recurring'),
  createRecurring: (data) => request('/recurring', { method: 'POST', body: data }),
  updateRecurring: (id, data) => request(`/recurring/${id}`, { method: 'PUT', body: data }),
  deleteRecurring: (id) => request(`/recurring/${id}`, { method: 'DELETE' }),

  debts: () => request('/debts'),
  createDebt: (data) => request('/debts', { method: 'POST', body: data }),
  settleDebt: (id) => request(`/debts/${id}/settle`, { method: 'POST' }),

  exportUrl: `${BASE}/export`
};

export default api;
