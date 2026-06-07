import https from 'https'

const KEY = process.env.OPENAI_API_KEY

const SPORTS = [
  { id: 'football', label: '⚽ ФУТБОЛ', context: 'футбол: Лига чемпионов, РПЛ, Премьер-лига, ЧМ 2026, ставки на футбол, AI прогнозы' },
  { id: 'hockey',   label: '🏒 ХОККЕЙ', context: 'хоккей: НХЛ плей-офф, КХЛ, сборные, ставки на хоккей, AI аналитика' },
  { id: 'cs2',      label: '🔫 CS2',    context: 'CS2 киберспорт: Major 2026, ESL Pro League, BLAST, топ команды, ставки на CS2' },
  { id: 'dota2',    label: '🎮 DOTA 2', context: 'Dota 2: The International 2026, Majors, BLAST Slam, Team Spirit, ставки на Dota' },
]

function ask(sport) {
  const body = JSON.stringify({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: 'Ты топовый SEO-эксперт. Отвечай только валидным JSON.' },
      { role: 'user', content: `Для сайта valorix.ru (AI анализ матчей и прогнозы) найди 12 лучших тем статей для блога по теме: ${sport.context}

КРИТЕРИИ отбора:
1. Реально популярные запросы в Яндексе в 2026 году
2. Конкуренты (Sports.ru, Чемпионат) эти темы плохо закрывают
3. У Valorix есть уникальный AI-угол — это преимущество
4. Можно написать статью 500-800 слов с реальной пользой
5. Информационный интент (люди хотят узнать что-то)

Верни JSON массив без обёртки:
[
  {
    "title": "готовый SEO-заголовок статьи",
    "keyword": "главный ключевой запрос",
    "why_popular": "почему люди ищут это прямо сейчас",
    "ai_angle": "как Valorix даёт уникальную ценность для этой темы",
    "difficulty": "low или medium",
    "traffic_potential": "high или medium"
  }
]` }
    ],
    max_tokens: 2500,
    temperature: 0.4,
  })

  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'api.openai.com',
      path: '/v1/chat/completions',
      method: 'POST',
      timeout: 45000,
      headers: {
        'Authorization': `Bearer ${KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }, res => {
      let d = ''
      res.on('data', c => d += c)
      res.on('end', () => {
        try {
          const p = JSON.parse(d)
          const raw = p.choices[0].message.content
          const clean = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
          resolve({ sport, topics: JSON.parse(clean) })
        } catch (e) {
          resolve({ sport, topics: [], error: e.message })
        }
      })
    })
    req.on('error', () => resolve({ sport, topics: [] }))
    req.on('timeout', () => { req.destroy(); resolve({ sport, topics: [] }) })
    req.write(body)
    req.end()
  })
}

const results = await Promise.all(SPORTS.map(ask))

for (const { sport, topics, error } of results) {
  console.log(`\n${'═'.repeat(60)}`)
  console.log(`${sport.label}`)
  console.log('═'.repeat(60))

  if (error) { console.log('❌ Ошибка:', error); continue }

  const high = topics.filter(t => t.traffic_potential === 'high')
  const med  = topics.filter(t => t.traffic_potential !== 'high')

  if (high.length) {
    console.log('\n🔥 ВЫСОКИЙ трафик:')
    for (const t of high) {
      console.log(`\n  📌 ${t.title}`)
      console.log(`     Ключ:     "${t.keyword}"`)
      console.log(`     Почему:   ${t.why_popular}`)
      console.log(`     AI-угол:  ${t.ai_angle}`)
      console.log(`     Сложность: ${t.difficulty === 'low' ? '🟢 Низкая' : '🟡 Средняя'}`)
    }
  }

  if (med.length) {
    console.log('\n📈 СРЕДНИЙ трафик (но легче занять топ):')
    for (const t of med) {
      console.log(`\n  📌 ${t.title}`)
      console.log(`     Ключ:     "${t.keyword}"`)
      console.log(`     Почему:   ${t.why_popular}`)
      console.log(`     AI-угол:  ${t.ai_angle}`)
    }
  }
}

console.log('\n\n✅ Готово! Это твой контент-план.')
