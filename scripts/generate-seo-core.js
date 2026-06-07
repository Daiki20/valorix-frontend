/**
 * Valorix SEO Semantic Core Generator
 * Запуск: OPENAI_API_KEY=sk-... node scripts/generate-seo-core.js
 */

import https from 'https'
import fs   from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR   = path.join(__dirname, 'seo-output')

const OPENAI_KEY = process.env.OPENAI_API_KEY
if (!OPENAI_KEY) { console.error('❌ Нужен OPENAI_API_KEY'); process.exit(1) }

const TOPICS = [
  {
    id: 'football',
    name: '⚽ Футбол',
    context: 'AI-аналитика футбольных матчей, прогнозы на Премьер-лигу, Лигу чемпионов, РПЛ, ставки на футбол',
  },
  {
    id: 'hockey',
    name: '🏒 Хоккей',
    context: 'AI-аналитика хоккейных матчей, прогнозы на НХЛ, КХЛ, ставки на хоккей',
  },
  {
    id: 'cs2',
    name: '🔫 CS2',
    context: 'AI-аналитика матчей CS2 (Counter-Strike 2), прогнозы на ESL, BLAST, Major турниры',
  },
  {
    id: 'dota2',
    name: '🎮 Dota 2',
    context: 'AI-аналитика матчей Dota 2, прогнозы на The International, Majors, BLAST Slam',
  },
  {
    id: 'betting',
    name: '💰 Ставки (общее)',
    context: 'AI-сервис для анализа ставок на спорт, value bet, анализ матча по скриншоту, прогнозы',
  },
]

// ── GPT вызов ─────────────────────────────────────────────────────────────────
function callGPT(prompt, max_tokens = 2000) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'Ты SEO-эксперт. Отвечай ТОЛЬКО валидным JSON без markdown-блоков.' },
        { role: 'user', content: prompt },
      ],
      max_tokens,
      temperature: 0.3,
    })
    const req = https.request({
      hostname: 'api.openai.com',
      path: '/v1/chat/completions',
      method: 'POST',
      timeout: 60000,
      headers: {
        'Authorization': `Bearer ${OPENAI_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }, res => {
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => {
        try {
          const p = JSON.parse(data)
          if (res.statusCode >= 400) return reject(new Error(p.error?.message || `HTTP ${res.statusCode}`))
          const content = p.choices[0].message.content.trim()
          // Убираем markdown-блоки если GPT всё же добавил
          const clean = content.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
          resolve(JSON.parse(clean))
        } catch (e) { reject(new Error('JSON parse error: ' + e.message)) }
      })
    })
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')) })
    req.write(body)
    req.end()
  })
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

// ── Один тир ключей ───────────────────────────────────────────────────────────
async function generateTier(topic, tier, count, freqDesc) {
  const prompt = `Сгенерируй ${count} ключевых запросов для SEO.

Тематика сайта: ${topic.context}
Частотность: ${freqDesc}

Верни JSON массив (без обёртки, просто массив):
[
  {
    "keyword": "точный поисковый запрос на русском",
    "intent": "informational",
    "difficulty": "low",
    "title": "Заголовок статьи под этот запрос"
  }
]

intent: informational (узнать) | commercial (выбрать) | transactional (сделать)
difficulty: low (топ за 1-3 мес) | medium (3-6 мес) | high (6+ мес)

Требования:
- Только реальные запросы которые люди ищут в Яндексе
- Только русский язык
- НЕ включай: казино, слоты, рулетку, скачать, взлом
- title — конкретный заголовок статьи которую можно написать`

  try {
    const result = await callGPT(prompt, 1800)
    const items = Array.isArray(result) ? result : (result.keywords || result.items || [])
    return items.slice(0, count)
  } catch (e) {
    console.error(`    ⚠️  ${tier} ошибка: ${e.message.slice(0, 80)}`)
    return []
  }
}

// ── Тема целиком ──────────────────────────────────────────────────────────────
async function generateTopic(topic) {
  console.log(`\n${topic.name}`)

  const [hf, mf, lf] = await Promise.all([
    generateTier(topic, 'ВЧ', 15, 'высокая (10k+ запросов/мес), широкие популярные запросы'),
    generateTier(topic, 'СЧ', 20, 'средняя (1k-10k запросов/мес), среднеконкурентные'),
    generateTier(topic, 'НЧ', 30, 'низкая (100-1k запросов/мес), длинный хвост, легко ранжировать'),
  ])

  console.log(`  ВЧ: ${hf.length} | СЧ: ${mf.length} | НЧ: ${lf.length} | Итого: ${hf.length+mf.length+lf.length}`)
  return { high: hf, medium: mf, low: lf }
}

// ── Контент-план ──────────────────────────────────────────────────────────────
async function generateContentPlan(allData) {
  console.log('\n📅 Контент-план...')

  // Лучшие НЧ+СЧ запросы с низкой сложностью
  const targets = []
  for (const [id, data] of Object.entries(allData)) {
    const topic = TOPICS.find(t => t.id === id)
    const good = [...data.low, ...data.medium]
      .filter(k => k.difficulty === 'low' && k.intent === 'informational')
      .slice(0, 8)
      .map(k => ({ ...k, topicName: topic.name }))
    targets.push(...good)
  }

  const prompt = `Составь контент-план на 4 недели для спортивного блога.
Сайт: valorix.ru — AI-аналитика матчей и ставок.

Доступные запросы:
${targets.slice(0, 30).map(k => `"${k.keyword}" → "${k.title}" (${k.topicName})`).join('\n')}

Верни JSON:
{
  "weeks": [
    {
      "week": 1,
      "theme": "тема недели",
      "articles": [
        {"day": 1, "keyword": "запрос", "title": "заголовок", "type": "прогноз|гайд|обзор|аналитика", "priority": "high|medium"}
      ]
    }
  ],
  "quick_wins": ["запрос 1 — статья которую легко написать и быстро получить трафик"]
}`

  try {
    const result = await callGPT(prompt, 2000)
    console.log(`  ✅ ${result.weeks?.length || 0} недель, ${result.quick_wins?.length || 0} quick wins`)
    return result
  } catch (e) {
    console.error('  ⚠️  Ошибка контент-плана:', e.message.slice(0, 80))
    return { weeks: [], quick_wins: [] }
  }
}

// ── CSV ───────────────────────────────────────────────────────────────────────
const esc = v => `"${String(v || '').replace(/"/g, '""')}"`

function keywordsToCSV(allData) {
  const headers = ['Тема', 'Частотность', 'Ключевой запрос', 'Интент', 'Сложность', 'Заголовок статьи']
  const rows = [headers.join(';')]

  const TIER_LABELS = { high: 'ВЧ (высокая)', medium: 'СЧ (средняя)', low: 'НЧ (низкая)' }
  const INTENT = { informational: 'Информационный', commercial: 'Коммерческий', transactional: 'Транзакционный' }
  const DIFF   = { low: '🟢 Низкая', medium: '🟡 Средняя', high: '🔴 Высокая' }

  for (const [id, data] of Object.entries(allData)) {
    const topic = TOPICS.find(t => t.id === id)
    for (const [tier, items] of [['high', data.high], ['medium', data.medium], ['low', data.low]]) {
      for (const kw of items) {
        rows.push([
          esc(topic?.name),
          esc(TIER_LABELS[tier]),
          esc(kw.keyword),
          esc(INTENT[kw.intent] || kw.intent),
          esc(DIFF[kw.difficulty] || kw.difficulty),
          esc(kw.title),
        ].join(';'))
      }
    }
  }
  return rows.join('\n')
}

function planToCSV(plan) {
  const headers = ['Неделя', 'День', 'Тип', 'Приоритет', 'Ключевой запрос', 'Заголовок статьи']
  const rows = [headers.join(';')]
  for (const week of plan.weeks || []) {
    for (const a of week.articles || []) {
      rows.push([
        esc(`Неделя ${week.week}: ${week.theme}`),
        esc(a.day),
        esc(a.type),
        esc(a.priority === 'high' ? '🔴 Высокий' : '🟡 Средний'),
        esc(a.keyword),
        esc(a.title),
      ].join(';'))
    }
  }
  return rows.join('\n')
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 Valorix SEO Core Generator\n')
  fs.mkdirSync(OUT_DIR, { recursive: true })

  const allData = {}
  for (const topic of TOPICS) {
    allData[topic.id] = await generateTopic(topic)
    await sleep(800)
  }

  const plan = await generateContentPlan(allData)

  // Считаем итого
  let total = 0
  const summary = []
  for (const [id, data] of Object.entries(allData)) {
    const topic = TOPICS.find(t => t.id === id)
    const n = data.high.length + data.medium.length + data.low.length
    total += n
    summary.push(`  ${topic.name}: ${n} ключей`)
  }

  // Сохраняем
  fs.writeFileSync(path.join(OUT_DIR, 'keywords.csv'),     keywordsToCSV(allData), 'utf8')
  fs.writeFileSync(path.join(OUT_DIR, 'content-plan.csv'), planToCSV(plan),        'utf8')
  fs.writeFileSync(path.join(OUT_DIR, 'raw.json'), JSON.stringify({ allData, plan }, null, 2), 'utf8')

  console.log(`\n✅ Готово! Всего ключей: ${total}`)
  summary.forEach(s => console.log(s))
  if (plan.quick_wins?.length) {
    console.log('\n⚡ Quick wins (пиши эти статьи первыми):')
    plan.quick_wins.forEach((qw, i) => console.log(`  ${i+1}. ${qw}`))
  }
  console.log(`\n📁 Файлы: scripts/seo-output/`)
  console.log('   📊 keywords.csv     — все ключи (открой в Excel)')
  console.log('   📅 content-plan.csv — план на 4 недели')
}

main().catch(e => { console.error('❌', e.message); process.exit(1) })
