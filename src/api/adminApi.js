const BASE = import.meta.env.VITE_API_URL || 'https://web-production-fefcd.up.railway.app'

function headers() {
  const token = localStorage.getItem('valorix_token')
  const authHeaders = {}
  if (token) {
    authHeaders['Authorization'] = `Bearer ${token}`
  }
  return { 'Content-Type': 'application/json', ...authHeaders }
}

export async function getStats() {
  const r = await fetch(`${BASE}/admin/stats`, { headers: headers() })
  if (!r.ok) throw new Error('Forbidden')
  return r.json()
}

export async function getUsers(search = '', page = 1) {
  const r = await fetch(`${BASE}/admin/users?search=${encodeURIComponent(search)}&page=${page}`, { headers: headers() })
  return r.json()
}

export async function getTransactions(page = 1) {
  const r = await fetch(`${BASE}/admin/transactions?page=${page}`, { headers: headers() })
  return r.json()
}

export async function addCoins(email, amount, reason) {
  const r = await fetch(`${BASE}/admin/add-coins`, {
    method: 'POST', headers: headers(),
    body: JSON.stringify({ email, amount, reason }),
  })
  return r.json()
}

export async function setAdmin(email, value) {
  const r = await fetch(`${BASE}/admin/set-admin`, {
    method: 'POST', headers: headers(),
    body: JSON.stringify({ email, value }),
  })
  return r.json()
}

export async function getTrafficStats() {
  const r = await fetch(`${BASE}/admin/traffic`, { headers: headers() })
  if (!r.ok) throw new Error('Forbidden')
  return r.json()
}

export async function setBlocked(email, value) {
  const r = await fetch(`${BASE}/admin/set-blocked`, {
    method: 'POST', headers: headers(),
    body: JSON.stringify({ email, value }),
  })
  return r.json()
}
