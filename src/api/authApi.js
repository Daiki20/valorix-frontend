const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

function getToken() {
  return localStorage.getItem('valorix_token')
}

function authHeaders() {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Ошибка сервера')
  return data
}

export const authApi = {
  register: (email, password, username) => request('POST', '/auth/register', { email, password, username }),
  login: (email, password) => request('POST', '/auth/login', { email, password }),
  me: () => request('GET', '/auth/me'),
  history: () => request('GET', '/auth/history'),
  forgotPassword: (email) => request('POST', '/auth/forgot-password', { email }),
  resetPassword: (token, password) => request('POST', '/auth/reset-password', { token, password }),
}

export const coinsApi = {
  balance: () => request('GET', '/coins/balance'),
  packages: () => request('GET', '/coins/packages'),
  createPayment: (packageId, paymentMethod) => request('POST', '/coins/create-payment', { packageId, paymentMethod }),
  verifyPayment: (paymentId) => request('GET', `/coins/verify-payment/${paymentId}`),
  spend: (data) => request('POST', '/coins/spend', data),
  transactions: () => request('GET', '/coins/transactions'),
  getShare: (token) => fetch(`${BASE}/share/${token}`).then(r => r.json()),
}

export const expressApi = {
  today: () => fetch(`${BASE}/express/today`, { headers: authHeaders() }).then(r => r.json()),
  purchase: () => request('POST', '/express/purchase'),
  generate: () => request('POST', '/express/generate'),
}

export { getToken }
