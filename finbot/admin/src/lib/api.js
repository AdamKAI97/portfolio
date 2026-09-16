const BASE = '/api/admin';

export function getToken() {
  return localStorage.getItem('admin_token') || '';
}

export function setToken(token) {
  localStorage.setItem('admin_token', token);
}

export function clearToken() {
  localStorage.removeItem('admin_token');
}

async function request(path, { method = 'GET', body, query } = {}) {
  const url = new URL(`${BASE}${path}`, window.location.origin);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
    });
  }

  const response = await fetch(url.toString(), {
    method,
    headers: { 'Content-Type': 'application/json', 'x-admin-token': getToken() },
    body: body ? JSON.stringify(body) : undefined
  });

  if (response.status === 401) {
    clearToken();
    throw new Error('unauthorized');
  }
  if (!response.ok) throw new Error(await response.text());

  return response.json();
}

export const api = {
  login: (token) =>
    fetch(`${BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    }).then((r) => (r.ok ? r.json() : Promise.reject(new Error('invalid_token')))),

  dashboard: () => request('/dashboard'),

  users: () => request('/users'),
  user: (id) => request(`/users/${id}`),
  updateUser: (id, data) => request(`/users/${id}`, { method: 'PUT', body: data }),

  transactions: (query) => request('/transactions', { query }),
  updateTransaction: (id, data) => request(`/transactions/${id}`, { method: 'PUT', body: data }),
  deleteTransaction: (id) => request(`/transactions/${id}`, { method: 'DELETE' }),

  categories: () => request('/categories'),
  createCategory: (data) => request('/categories', { method: 'POST', body: data }),
  updateCategory: (id, data) => request(`/categories/${id}`, { method: 'PUT', body: data }),
  deleteCategory: (id) => request(`/categories/${id}`, { method: 'DELETE' }),

  goals: () => request('/goals'),
  broadcast: (text) => request('/broadcast', { method: 'POST', body: { text } }),
  exportUrl: () => `${BASE}/export?token=${encodeURIComponent(getToken())}`
};

export default api;
