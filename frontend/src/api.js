/**
 * src/api.js
 * Centralised Axios-free API client for the FastAPI backend.
 * Base URL: http://localhost:8000
 */

// Runtime environment detection — no env vars, no proxy, no restart needed
// Local dev → calls backend directly on port 8001
// Netlify production → uses relative /api path (handled by _redirects proxy)
const BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:8001/api'
  : '/api';

// ── Helpers ──────────────────────────────────────────────────────────────────

function getToken() {
  return localStorage.getItem('token');
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(method, path, body) {
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE}${path}`, opts);
  let data;
  try {
    data = await res.json();
  } catch (e) {
    data = res.ok ? {} : { detail: 'Invalid JSON response from server' };
  }

  if (!res.ok) {
    throw new Error(data.detail || `HTTP ${res.status}`);
  }
  return data;
}

const get  = (path)        => request('GET', path);
const post = (path, body)  => request('POST', path, body);


// ── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  register: (name, email, password) =>
    post('/auth/register', { name, email, password }),

  login: (email, password) =>
    post('/auth/login', { email, password }),
};

/** Persist auth state into localStorage */
export function saveAuth(tokenResponse) {
  localStorage.setItem('token',   tokenResponse.access_token);
  localStorage.setItem('user_id', String(tokenResponse.user_id));
  localStorage.setItem('name',    tokenResponse.name);
  localStorage.setItem('email',   tokenResponse.email);
  // Dashboard reads a JSON 'user' object — keep it in sync
  localStorage.setItem('user', JSON.stringify({
    name: tokenResponse.name,
    email: tokenResponse.email,
    user_id: tokenResponse.user_id,
  }));
}

export function clearAuth() {
  ['token', 'user_id', 'name', 'email', 'user'].forEach(k => localStorage.removeItem(k));
}

export function getUser() {
  const raw = localStorage.getItem('user');
  if (raw) {
    try { return JSON.parse(raw); } catch { /* fall through */ }
  }
  const name  = localStorage.getItem('name');
  const email = localStorage.getItem('email');
  if (!name) return null;
  return { name, email };
}

export function isLoggedIn() {
  return !!getToken();
}


// ── Predict ──────────────────────────────────────────────────────────────────

/**
 * Coerce all form values from strings to the proper numeric types
 * expected by the PredictRequest Pydantic schema on the backend.
 */
function coercePredictParams(raw) {
  const intKeys   = ['season', 'hr', 'holiday', 'workingday', 'weathersit', 'mnth', 'weekday', 'yr'];
  const floatKeys = ['temp', 'atemp', 'hum', 'windspeed'];
  const out = {};
  for (const k of intKeys)   if (raw[k] !== undefined && raw[k] !== '') out[k] = parseInt(raw[k], 10);
  for (const k of floatKeys) if (raw[k] !== undefined && raw[k] !== '') out[k] = parseFloat(raw[k]);
  return out;
}

export const predictApi = {
  predict: (params) => post('/predict', coercePredictParams(params)),

  history: () => get('/predict/history'),

  stats: () => get('/predict/stats'),
};


// ── Training runs ─────────────────────────────────────────────────────────────

export const runsApi = {
  list:   ()        => get('/runs'),
  detail: (id)      => get(`/runs/${id}`),
  
  train: (file, features) => {
    const formData = new FormData();
    formData.append('file', file);
    if (features) {
      formData.append('features', JSON.stringify(features));
    }
    
    return fetch(`${BASE}/train`, {
      method: 'POST',
      headers: authHeaders(),
      body: formData,
    }).then(res => {
      if (!res.ok) throw new Error('Training failed');
      return res.json();
    });
  }
};


// ── Health ────────────────────────────────────────────────────────────────────

export const healthCheck = () => get('/health');
