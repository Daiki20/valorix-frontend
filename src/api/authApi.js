const BASE = import.meta.env.VITE_API_URL || 'https://web-production-fefcd.up.railway.app'

function getToken() {
  return localStorage.getItem('valorix_token')
}

function authHeaders() {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request(method, path, body) {
  let res
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new Error('Нет соединения с сервером. Проверьте интернет и попробуйте снова.')
  }
  const data = await res.json()
  if (!res.ok) {
    const err = new Error(data.error || 'Ошибка сервера')
    err.data = data
    throw err
  }
  return data
}

export const authApi = {
  register: (email, password, username) => request('POST', '/auth/register', { email, password, username }),
  login: (email, password) => request('POST', '/auth/login', { email, password }),
  verifyEmail: (email, code) => request('POST', '/auth/verify-email', { email, code }),
  resendCode: (email) => request('POST', '/auth/resend-code', { email }),
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
  today: (sport = 'football') => fetch(`${BASE}/express/today?sport=${sport}`, { headers: authHeaders() }).then(r => r.json()),
  purchase: (type = 'standard', sport = 'football', date) => request('POST', '/express/purchase', { type, sport, ...(date ? { date } : {}) }),
  generate: () => request('POST', '/express/generate'),
}

export { getToken }
