import https from 'https'
const API = 'web-production-fefcd.up.railway.app'

function apiReq(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null
    const r = https.request({
      hostname: API, path, method, timeout: 15000,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}) }
    }, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => { try { resolve(JSON.parse(d)) } catch { resolve(d) } }) })
    r.on('error', reject)
    if (payload) r.write(payload)
    r.end()
  })
}

const auth = await apiReq('POST', '/auth/login', { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASS })
const token = auth.token

const data = await apiReq('GET', '/admin/users?limit=5&order=newest', null, token)
console.log(JSON.stringify(data, null, 2))
