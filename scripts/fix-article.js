import https from 'https'
const API = 'web-production-fefcd.up.railway.app'

function apiReq(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null
    const r = https.request({
      hostname: API, path, method, timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
      }
    }, res => {
      let d = ''
      res.on('data', c => d += c)
      res.on('end', () => { try { resolve(JSON.parse(d)) } catch { resolve(d) } })
    })
    r.on('error', reject)
    if (payload) r.write(payload)
    r.end()
  })
}

const auth = await apiReq('POST', '/auth/login', { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASS })
const token = auth.token
console.log('✅ Авторизован')

const list = await apiReq('GET', '/blog/admin/list', null, token)
const article = list.items?.find(a => a.slug === 'kto-glavnye-favority-chm-2026')
console.log('Статья ID:', article?.id)

const updated = await apiReq('PUT', `/blog/${article.id}`, {
  title: 'Кто станет чемпионом мира по футболу в 2026 году: прогноз Valorix AI',
  meta_title: 'Кто станет чемпионом мира 2026: AI-прогноз Valorix',
  meta_desc: 'Кто выиграет ЧМ 2026 по футболу? AI-прогноз Valorix с анализом формы команд, статистики и ключевых факторов.',
  slug: 'chempion-mira-2026-futbol-prognoz-valorix-ai',
  published: 1,
}, token)

console.log('✅ Заголовок обновлён:', updated.title)
console.log('🔗 https://valorix.ru/blog/' + updated.slug)
