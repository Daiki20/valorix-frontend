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

const list = await apiReq('GET', '/blog/admin/list', null, token)
const all = list.items || []

const drafts = all.filter(a => !a.published)
const published = all.filter(a => a.published)

console.log(`Всего статей: ${all.length}`)
console.log(`Опубликовано: ${published.length}`)
console.log(`Черновики: ${drafts.length}\n`)

if (drafts.length > 0) {
  console.log('📝 ЧЕРНОВИКИ (не видны в поиске):')
  drafts.forEach(a => console.log(`  ID:${a.id} | ${a.slug}`))

  // Публикуем все черновики
  console.log('\n🚀 Публикую все черновики...')
  for (const d of drafts) {
    const r = await apiReq('PUT', `/blog/${d.id}`, { published: 1 }, token)
    console.log(`  ✅ ${r.slug}`)
  }
  console.log('\nГотово! Все статьи опубликованы.')
}
