import https from 'https'
const API = 'web-production-fefcd.up.railway.app'

function apiReq(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null
    const r = https.request({
      hostname: API, path, method, timeout: 60000,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}) }
    }, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => { try { resolve(JSON.parse(d)) } catch { resolve(d) } }) })
    r.on('error', reject)
    r.on('timeout', () => { r.destroy(); reject(new Error('timeout')) })
    if (payload) r.write(payload)
    r.end()
  })
}

const auth = await apiReq('POST', '/auth/login', { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASS })
const token = auth.token
console.log('✅ Авторизован\n')

const tomorrow = new Date()
tomorrow.setDate(tomorrow.getDate() + 1)
const date = tomorrow.toISOString().slice(0, 10)
console.log(`📅 Дата: ${date}\n`)

const tasks = [
  { sport: 'cs2',   type: 'standard', label: '🔫 CS2 Lite'   },
  { sport: 'cs2',   type: 'high',     label: '🔫 CS2 Hard'   },
  { sport: 'dota2', type: 'standard', label: '🎮 Dota2 Lite'  },
  { sport: 'dota2', type: 'high',     label: '🎮 Dota2 Hard'  },
]

for (const t of tasks) {
  process.stdout.write(`${t.label}... `)
  try {
    const result = await apiReq('POST', '/express/admin/regen-sport', {
      date, sport: t.sport, type: t.type
    }, token)
    if (result.picks) {
      console.log(`✅ ${result.picks.length} событий, коэф x${result.total_odds}`)
    } else if (result.error) {
      console.log(`❌ ${result.error}`)
    } else {
      console.log(`✅ готово`)
    }
  } catch(e) {
    console.log(`❌ ${e.message}`)
  }
}
