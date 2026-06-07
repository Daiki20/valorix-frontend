/**
 * Генерирует и публикует SEO-статью с примерами Valorix AI
 * Запуск: OPENAI_API_KEY=sk-... ADMIN_EMAIL=... ADMIN_PASS=... node --input-type=module < scripts/publish-article.js
 */

import https from 'https'

const KEY      = process.env.OPENAI_API_KEY
const EMAIL    = process.env.ADMIN_EMAIL
const PASS     = process.env.ADMIN_PASS
const API      = 'web-production-fefcd.up.railway.app'

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null
    const req = https.request({
      hostname: API, path, method,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    }, res => {
      let d = ''
      res.on('data', c => d += c)
      res.on('end', () => { try { resolve(JSON.parse(d)) } catch { resolve(d) } })
    })
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')) })
    if (payload) req.write(payload)
    req.end()
  })
}

function callGPT(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'Ты профессиональный спортивный SEO-журналист. Пиши живо, по-русски, уникально. Отвечай только текстом статьи.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 2500,
      temperature: 0.7,
    })
    const req = https.request({
      hostname: 'api.openai.com', path: '/v1/chat/completions',
      method: 'POST', timeout: 60000,
      headers: {
        'Authorization': `Bearer ${KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }, res => {
      let d = ''
      res.on('data', c => d += c)
      res.on('end', () => {
        try { resolve(JSON.parse(d).choices[0].message.content) }
        catch(e) { reject(e) }
      })
    })
    req.on('error', reject)
    req.write(body); req.end()
  })
}

// Логинимся
console.log('🔐 Авторизация...')
const auth = await request('POST', '/auth/login', { email: EMAIL, password: PASS })
if (!auth.token) { console.error('❌ Не удалось войти:', auth); process.exit(1) }
const token = auth.token
console.log('✅ Авторизован как', auth.user?.email)

// Генерируем статью
console.log('\n✍️  Генерирую статью...')

const prompt = `Напиши SEO-статью для сайта valorix.ru (AI-аналитика матчей).

ТЕМА: "Кто станет чемпионом мира по футболу в 2026 году: прогноз Valorix AI"
ГЛАВНЫЙ КЛЮЧ: "прогноз чемпион мира 2026"
ДЛИНА: 700-900 слов

СТРУКТУРА (используй ## для заголовков):
## Кто главные фавориты ЧМ 2026
## Что показывает AI-анализ Valorix
## Прогноз Valorix AI
## Тёмные лошадки турнира
## Итог

ВАЖНО — в разделе "Что показывает AI-анализ Valorix" добавь РЕАЛЬНЫЙ пример анализа:
Напиши как будто Valorix проанализировал матч группового этапа ЧМ 2026, например Франция — Германия.
Покажи конкретные данные в таком формате:

---
**Пример анализа: Франция — Германия (ЧМ 2026, групповой этап)**

**Форма команд (последние 5 матчей):**
- Франция: В В В Н В (4 победы, 1 ничья)
- Германия: В В Н П В (3 победы, 1 ничья, 1 поражение)

**Ключевые факторы:**
- Мбаппе забил 6 голов в квалификации — лучший показатель
- Германия пропускает в среднем 0.8 гола за матч
- Личные встречи: 8 побед Франции, 5 Германии за последние 10 лет

🤖 **Valorix AI прогнозирует:**
✅ Исход: Победа Франции
🔒 Тотал больше 2.5
🔒 Обе забьют: Да
🔒 Фора Франции (-0.5)
---

В разделе "Прогноз Valorix AI" напиши общий прогноз на весь турнир в том же стиле блока прогноза.

ТРЕБОВАНИЯ:
- Живой журналистский стиль, не сухой
- Конкретные имена игроков и команд (реальные данные 2025-2026)
- В конце CTA: > 🔍 Анализируй любой матч ЧМ 2026 бесплатно → [Valorix AI](https://valorix.ru/analyze)
- НЕ используй emoji в заголовках
- Статья должна быть полезна читателю даже без ставок`

const content = await callGPT(prompt)

// Извлекаем заголовок
const lines = content.trim().split('\n')
const titleLine = lines[0].replace(/^#+\s*/, '').trim()
const articleContent = lines.slice(1).join('\n').trim()

console.log(`\n📰 Заголовок: "${titleLine}"`)
console.log(`📝 Длина: ${articleContent.length} символов`)

// Публикуем
console.log('\n📤 Публикую в блог...')
const result = await request('POST', '/blog', {
  title: titleLine,
  content: articleContent,
  excerpt: 'Valorix AI проанализировал всех фаворитов ЧМ 2026 по футболу. Разбираем шансы Франции, Бразилии, Англии и тёмных лошадок турнира с реальными данными.',
  meta_title: titleLine,
  meta_desc: 'Кто выиграет ЧМ 2026 по футболу? AI-прогноз Valorix с анализом формы команд, статистики и ключевых факторов. Бесплатный анализ любого матча.',
  sport: 'football',
  published: 1,
}, token)

if (result.id) {
  console.log(`\n✅ Статья опубликована!`)
  console.log(`🔗 https://valorix.ru/blog/${result.slug}`)
} else {
  console.error('❌ Ошибка публикации:', result)
}
