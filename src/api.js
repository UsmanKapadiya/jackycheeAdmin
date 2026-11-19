const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1').replace(/\/$/, '');
const TOKEN_KEY = 'jc_admin_token';

export class ApiError extends Error {
  constructor(status, body) {
    super(body?.message || `Request failed (${status})`);
    this.status = status;
    this.errors = body?.errors || {};
  }
}

// sessionStorage: the admin token disappears when the browser tab is closed
export const tokenStore = {
  get: () => sessionStorage.getItem(TOKEN_KEY),
  set: (t) => sessionStorage.setItem(TOKEN_KEY, t),
  clear: () => sessionStorage.removeItem(TOKEN_KEY),
};

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

export async function request(path, { method = 'GET', body, auth = false, signal } = {}) {
  const headers = { Accept: 'application/json' };
  const token = tokenStore.get();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let payload = body;
  let httpMethod = method;
  if (body instanceof FormData) {
    // PHP only parses multipart bodies on POST -> use Laravel method spoofing
    if (method !== 'POST') {
      body.append('_method', method);
      httpMethod = 'POST';
    }
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  const res = await fetch(`${BASE}${path}`, {
    method: httpMethod,
    headers,
    body: payload,
    signal,
    credentials: 'omit',
  });

  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    if (res.status === 401 && auth) {
      tokenStore.clear();
      onUnauthorized();
    }
    throw new ApiError(res.status, data);
  }
  return data;
}

const admin = (path, opts = {}) => request(`/admin${path}`, { ...opts, auth: true });

export const adminApi = {
  login: (login, password) => request('/admin/login', { method: 'POST', body: { login, password } }),
  me: () => admin('/me'),
  logout: () => admin('/logout', { method: 'POST' }),
  changePassword: (body) => admin('/password', { method: 'PUT', body }),

  portfolio: (params = {}) => admin(`/portfolio?${new URLSearchParams(params)}`),
  portfolioItem: (id) => admin(`/portfolio/${id}`),
  createPortfolio: (formData) => admin('/portfolio', { method: 'POST', body: formData }),
  updatePortfolio: (id, formData) => admin(`/portfolio/${id}`, { method: 'PUT', body: formData }),
  deletePortfolio: (id) => admin(`/portfolio/${id}`, { method: 'DELETE' }),
  reorderPortfolio: (ids) => admin('/portfolio/reorder', { method: 'POST', body: { ids } }),

  categories: () => admin('/categories'),
  saveCategory: (cat) =>
    cat.id ? admin(`/categories/${cat.id}`, { method: 'PUT', body: cat }) : admin('/categories', { method: 'POST', body: cat }),
  deleteCategory: (id) => admin(`/categories/${id}`, { method: 'DELETE' }),

  pages: () => admin('/pages'),
  page: (id) => admin(`/pages/${id}`),
  savePage: (page) =>
    page.id ? admin(`/pages/${page.id}`, { method: 'PUT', body: page }) : admin('/pages', { method: 'POST', body: page }),
  deletePage: (id) => admin(`/pages/${id}`, { method: 'DELETE' }),

  settings: () => admin('/settings'),
  saveSettings: (body) => admin('/settings', { method: 'PUT', body }),
  uploadLogo: (formData) => admin('/settings/logo', { method: 'POST', body: formData }),
};
