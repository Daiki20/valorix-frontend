const SSTATS_KEY = import.meta.env.VITE_SSTATS_API_KEY
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const BASE = 'https://api.sstats.net'

function sstatsUrl(path, params = {}) {
  const q = new URLSearchParams({ ...params, apikey: SSTATS_KEY })
  return `${BASE}${path}?${q}`
}

async function sstatsGet(path, params = {}) {
  const res = await fetch(sstatsUrl(path, params))
  if (!res.ok) throw new Error(`sstats ${path} error: ${res.status}`)
  return res.json()
}

// Pari.ru outcome IDs for 1X2 FullTime
const PARI_HOME = 8250
const PARI_DRAW = 8256
const PARI_AWAY = 8253

// sstats leagueId → Pari leagueId mapping
const SSTATS_TO_PARI_LEAGUE = {
  39:  11918, // English Premier League
  140: 11922, // La Liga
  78:  11916, // Bundesliga
  61:  11920, // Ligue 1
  135: 11924, // Serie A
  235: 11935, // Russian Premier League
  61:  11920, // Ligue 1
  94:  11939, // Primeira Liga (Portugal)
}

// Fetch Pari.ru 1X2 odds for a match by searching the league
async function getPariOdds(match) {
  const pariLeagueId = SSTATS_TO_PARI_LEAGUE[match.leagueId]
  if (!pariLeagueId || !SSTATS_KEY) return null

  try {
    const data = await sstatsGet('/Pari/matches', { leagueId: pariLeagueId, includeOdds: true })
    const matches = data.data || []

    // Find the matching match by team name similarity
    const found = matches.find(m => {
      const h = normalize(m.matchInfo?.homeTeam?.name || '')
      const a = normalize(m.matchInfo?.awayTeam?.name || '')
      return fuzzyMatch(h, normalize(match.home)) && fuzzyMatch(a, normalize(match.away))
    })

    if (!found) return null

    const odds = found.currentOdds || []
    const home = odds.find(o => o.id === PARI_HOME)?.value
    const draw = odds.find(o => o.id === PARI_DRAW)?.value
    const away = odds.find(o => o.id === PARI_AWAY)?.value

    if (!home) return null
    return { name: 'Pari', odds: String(home), draw: String(draw || '—'), away: String(away || '—'), real: true }
  } catch {
    return null
  }
}

function normalize(s) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function fuzzyMatch(a, b) {
  if (a === b) return true
  if (a.includes(b) || b.includes(a)) return true
  // Levenshtein-light: allow 2 char difference for short strings
  if (Math.abs(a.length - b.length) > 4) return false
  let diff = 0
  const shorter = a.length < b.length ? a : b
  const longer = a.length < b.length ? b : a
  for (let i = 0; i < shorter.length; i++) {
    if (shorter[i] !== longer[i]) diff++
  }
  return diff <= 2
}

// Search teams by name, return upcoming matches
export async function searchMatches(query) {
  if (!SSTATS_KEY) return null

  // Step 1: find team IDs
  const teamsData = await sstatsGet('/Teams/list', { name: query, limit: 5 })
  const teams = teamsData.data || []

  if (teams.length === 0) return []

  // Step 2: get upcoming matches for the first matched team
  const primaryTeam = teams[0]
  const gamesData = await sstatsGet('/Games/list', {
    upcoming: true,
    team: primaryTeam.id,
    limit: 20,
  })

  return (gamesData.data || []).map(g => normalizeGame(g))
}

// Priority: higher = shown first
const LEAGUE_PRIORITY = {
  2: 1000, 3: 1000, 848: 1000,           // UCL / UEL / UECL
  39: 900, 140: 900, 135: 900,            // PL / La Liga / Serie A
  78: 900, 61: 900,                       // Bundesliga / Ligue 1
  94: 800, 88: 800, 144: 800,             // Portugal / Netherlands / Belgium
  203: 800, 179: 800, 207: 750,           // Turkey / Scotland / Switzerland
  197: 750, 210: 750, 333: 750,           // Greece / Ukraine
  235: 700, 236: 650,                     // РПЛ / ФНЛ
  71: 600, 128: 600, 131: 600,            // Brazil / Argentina / Libertadores
  253: 550, 262: 550, 13: 550,            // MLS / Liga MX / Copa Sudamericana
  98: 500, 292: 500, 480: 500,            // J-League / K League / Saudi
  169: 450, 113: 450, 119: 450,           // Sweden / Norway / Denmark
  40: 400, 79: 400, 62: 400,              // Championship / Bundesliga 2 / Ligue 2
  106: 350, 383: 350, 218: 350,           // Poland / Czech / Slovakia
}

// Get upcoming matches (default list, sorted by priority then date)
export async function getUpcomingMatches(limit = 50) {
  if (!SSTATS_KEY) return MOCK_MATCHES

  const leagueIds = [
    2, 3, 848,           // UCL, UEL, UECL
    39, 140, 135, 78, 61, // Big 5
    94, 88, 144, 203, 179, 207, 197, 210, // Top Europe
    235, 236,            // Russia
    71, 128, 131, 13,    // South America
    253, 262,            // North America
    98, 292, 480,        // Asia
    169, 113, 119,       // Scandinavia
    40, 79, 62,          // Second tiers
    106, 383, 218,       // Eastern Europe
  ]

  const promises = leagueIds.map(id =>
    sstatsGet('/Games/list', { upcoming: true, leagueid: id, limit: 5 }).catch(() => ({ data: [] }))
  )
  const results = await Promise.all(promises)
  const allGames = results.flatMap(r => r.data || [])

  return allGames
    .map(normalizeGame)
    .filter(m => m.odds1x2)
    .sort((a, b) => {
      const pa = LEAGUE_PRIORITY[a.leagueId] || 0
      const pb = LEAGUE_PRIORITY[b.leagueId] || 0
      if (pb !== pa) return pb - pa
      return new Date(a.date) - new Date(b.date)
    })
    .slice(0, limit)
}

// Main AI analysis for a match
export async function analyzeMatch(match) {

  let stats = null
  let glicko = null
  let realOdds = []

  if (SSTATS_KEY && match.id) {
    const [statsRes, glickoRes, oddsRes, pariRes] = await Promise.allSettled([
      sstatsGet('/Games/last-games-stats', { gameId: match.id }),
      sstatsGet(`/Games/glicko/${match.id}`),
      sstatsGet(`/Odds/${match.id}`),
      getPariOdds(match),
    ])
    if (statsRes.status === 'fulfilled') stats = statsRes.value
    if (glickoRes.status === 'fulfilled') glicko = glickoRes.value?.data?.glicko
    if (oddsRes.status === 'fulfilled') realOdds = extractBookmakerOdds(oddsRes.value?.data || [])

    // Add Pari.ru to the list
    const pariOdds = pariRes.status === 'fulfilled' ? pariRes.value : null
    if (pariOdds) realOdds = [pariOdds, ...realOdds]
  }

  const prompt = buildPrompt(match, stats, glicko)
  const jsonStr = await callOpenAI(prompt)
  const analysis = parseAnalysis(jsonStr, match)

  if (realOdds.length > 0) analysis.bestOdds = realOdds

  return analysis
}

// Analyze screenshot — full 2-step pipeline
export async function analyzeScreenshot(base64Image) {

  // Step 1: extract match info from screenshot
  const extracted = await extractFromScreenshot(base64Image)
  if (!extracted?.matches?.length) throw new Error('Не удалось распознать матч на скриншоте')

  // Step 2: for each match, enrich with sstats data then do full AI analysis
  const analyzed = await Promise.all(
    extracted.matches.map(m => enrichAndAnalyze(m))
  )

  return {
    screenType: extracted.screenType,
    matches: analyzed,
    summary: analyzed.length === 1
      ? analyzed[0].verdict
      : `Проанализировано ${analyzed.length} матчей`,
  }
}

// Step 1: GPT-4o reads the screenshot
async function extractFromScreenshot(base64Image) {
  const token = localStorage.getItem('valorix_token')
  const res = await fetch(`${API_BASE}/analyze/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      max_tokens: 800,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Ты читаешь скриншот из приложения букмекера или трансляции матча.

Твоя задача — ТОЛЬКО распознать данные с экрана. Никакого анализа.

Определи тип скрина:
- "live" — идёт матч (есть счёт и минута)
- "prematch" — линия с коэффициентами до матча
- "mixed" — несколько матчей

Для каждого матча:
1. Прочитай названия команд ТОЧНО как написано (может быть по-русски, на другом языке)
2. Укажи английское название команды (homeEn, awayEn) — нужно для поиска в базе
3. Если лайв — запиши счёт и минуту
4. Если предматч — запиши коэффициенты

Ответь строго в JSON:
{
  "screenType": "live | prematch | mixed",
  "matches": [
    {
      "home": "название с экрана",
      "away": "название с экрана",
      "homeEn": "English team name",
      "awayEn": "English team name",
      "league": "лига если видна",
      "score": "0:0 если лайв, иначе null",
      "minute": число или null,
      "odds1": число или null,
      "oddsX": число или null,
      "odds2": число или null
    }
  ]
}`,
          },
          { type: 'image_url', image_url: { url: base64Image, detail: 'high' } },
        ],
      }],
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Server error ${res.status}`)
  }
  const data = await res.json()
  return JSON.parse(data.content)
}

// Step 2: find teams in sstats, get stats, run full analysis
async function enrichAndAnalyze(matchInfo) {
  let homeId = null, awayId = null
  let stats = null, glicko = null, h2h = null, realOdds = []

  if (SSTATS_KEY) {
    // Find team IDs (try English name first, fallback to original)
    const [homeTeams, awayTeams] = await Promise.all([
      sstatsGet('/Teams/list', { name: matchInfo.homeEn || matchInfo.home, limit: 3 }).catch(() => ({ data: [] })),
      sstatsGet('/Teams/list', { name: matchInfo.awayEn || matchInfo.away, limit: 3 }).catch(() => ({ data: [] })),
    ])

    homeId = homeTeams.data?.[0]?.id
    awayId = awayTeams.data?.[0]?.id

    if (homeId && awayId) {
      const [h2hRes, homeGamesRes] = await Promise.allSettled([
        sstatsGet('/Games/list', { ended: true, bothTeams: `${homeId},${awayId}`, limit: 10 }),
        sstatsGet('/Games/list', { upcoming: true, team: homeId, limit: 10 }),
      ])

      if (h2hRes.status === 'fulfilled') h2h = h2hRes.value?.data || []

      const homeGames = homeGamesRes.status === 'fulfilled' ? homeGamesRes.value?.data || [] : []
      const matchingGame = homeGames.find(g =>
        g.homeTeam?.id === awayId || g.awayTeam?.id === awayId
      )

      if (matchingGame) {
        const [statsRes, glickoRes, oddsRes] = await Promise.allSettled([
          sstatsGet('/Games/last-games-stats', { gameId: matchingGame.id }),
          sstatsGet(`/Games/glicko/${matchingGame.id}`),
          sstatsGet(`/Odds/${matchingGame.id}`),
        ])
        if (statsRes.status === 'fulfilled') stats = statsRes.value
        if (glickoRes.status === 'fulfilled') glicko = glickoRes.value?.data?.glicko
        if (oddsRes.status === 'fulfilled') realOdds = extractBookmakerOdds(oddsRes.value?.data || [])
      }
    }
  }

  // Build match object compatible with analyzeMatch format
  const match = {
    home: matchInfo.homeEn || matchInfo.home,
    away: matchInfo.awayEn || matchInfo.away,
    homeOriginal: matchInfo.home,
    awayOriginal: matchInfo.away,
    league: matchInfo.league || '',
    date: matchInfo.score ? `Лайв · ${matchInfo.minute}'` : 'Предстоящий матч',
    score: matchInfo.score,
    minute: matchInfo.minute,
    odds1x2: matchInfo.odds1 ? { home: matchInfo.odds1, draw: matchInfo.oddsX, away: matchInfo.odds2 } : null,
  }

  const prompt = buildFullScreenPrompt(match, stats, glicko, h2h)
  const jsonStr = await callOpenAI(prompt)
  const analysis = parseAnalysis(jsonStr, match)

  if (realOdds.length > 0) analysis.bestOdds = realOdds

  return {
    home: matchInfo.home,
    away: matchInfo.away,
    league: matchInfo.league,
    score: matchInfo.score,
    minute: matchInfo.minute,
    odds: matchInfo.odds1,
    oddsX: matchInfo.oddsX,
    odds2: matchInfo.odds2,
    ...analysis,
  }
}

function buildFullScreenPrompt(match, stats, glicko, h2h) {
  const isLive = !!match.score
  const homeStats = stats?.home
  const awayStats = stats?.away

  let statsBlock = ''
  if (homeStats && awayStats) {
    statsBlock = `
СТАТИСТИКА из базы данных:
${match.home} (хозяева, последние ${homeStats.gamesCount} матчей дома):
- Побед: ${homeStats.wins} | Ничьих: ${homeStats.draws} | Поражений: ${homeStats.loses}
- Среднее голов: ${homeStats.avgScore?.toFixed(2)} забито / ${homeStats.avgConceded?.toFixed(2)} пропущено
- Удары: ${homeStats.avgShots?.toFixed(1)} / Удары соперника: ${homeStats.avgOppShots?.toFixed(1)}

${match.away} (гости, последние ${awayStats.gamesCount} матчей в гостях):
- Побед: ${awayStats.wins} | Ничьих: ${awayStats.draws} | Поражений: ${awayStats.loses}
- Среднее голов: ${awayStats.avgScore?.toFixed(2)} забито / ${awayStats.avgConceded?.toFixed(2)} пропущено`
  }

  let glickoBlock = ''
  if (glicko) {
    glickoBlock = `
МАТЕМАТИЧЕСКАЯ МОДЕЛЬ (Glicko-2):
- Рейтинг ${match.home}: ${glicko.homeRating?.toFixed(0)}, xG: ${glicko.homeXg?.toFixed(2)}
- Рейтинг ${match.away}: ${glicko.awayRating?.toFixed(0)}, xG: ${glicko.awayXg?.toFixed(2)}
- Вероятность победы хозяев: ${(glicko.homeWinProbability * 100).toFixed(1)}%
- Вероятность победы гостей: ${(glicko.awayWinProbability * 100).toFixed(1)}%`
  }

  let h2hBlock = ''
  if (h2h?.length) {
    const results = h2h.slice(0, 5).map(g => {
      const hScore = g.homeFTResult ?? '?'
      const aScore = g.awayFTResult ?? '?'
      return `${g.homeTeam?.name} ${hScore}:${aScore} ${g.awayTeam?.name}`
    }).join('\n')
    h2hBlock = `\nИСТОРИЯ ВСТРЕЧ (последние ${Math.min(h2h.length, 5)}):\n${results}`
  }

  const liveBlock = isLive
    ? `\nТЕКУЩИЙ СЧЁТ: ${match.score} (${match.minute} минута)`
    : ''

  const oddsBlock = match.odds1x2
    ? `\nКОЭФФИЦИЕНТЫ: хозяева ${match.odds1x2.home}, ничья ${match.odds1x2.draw}, гости ${match.odds1x2.away}`
    : ''

  return `Ты профессиональный спортивный аналитик. Сделай ПОЛНЫЙ анализ матча как эксперт.

МАТЧ: ${match.home} vs ${match.away}
ЛИГА: ${match.league}
${liveBlock}
${statsBlock}
${glickoBlock}
${h2hBlock}
${oddsBlock}

${isLive
    ? `Матч идёт. Счёт ${match.score} на ${match.minute} минуте.
Задача: оцени ход матча, кто доминирует по статистике, какова вероятность что изменится счёт, какой исход наиболее вероятен.
Используй ВСЕ свои знания об этих командах: их стиль игры, ключевых игроков, тренеров, текущую форму.`
    : `Задача: дай полный предматчевый анализ.
Используй ВСЕ свои знания об этих командах: история, ключевые игроки, тренеры, форма, травмы.
Если есть статистика — используй её. Найди Value если есть коэффициенты.`}

Ответь строго в JSON:
{
  "verdict": "чёткий вердикт: кто победит или какой исход",
  "summary": "3-4 предложения глубокого анализа",
  "confidence": число 0-100,
  "risk": "low | medium | high",
  "fairOdds": "справедливый коэффициент на фаворита",
  "bookOdds": "коэффициент букмекера если известен",
  "value": число или 0,
  "reasons": ["факт 1 о командах/игроках", "факт 2", "факт 3", "факт 4", "факт 5"],
  "bestOdds": []
}`
}

// --- Internal helpers ---

// Extract 1X2 home win odds per bookmaker, sorted best first
function extractBookmakerOdds(bookmakers) {
  const result = []
  for (const bk of bookmakers) {
    const market1x2 = bk.odds?.find(o => o.marketId === 1)
    if (!market1x2) continue
    const homeOdds = market1x2.odds?.find(o => o.name === 'Home')?.value
    const drawOdds = market1x2.odds?.find(o => o.name === 'Draw')?.value
    const awayOdds = market1x2.odds?.find(o => o.name === 'Away')?.value
    if (homeOdds) {
      result.push({
        name: bk.bookmakerName,
        odds: String(homeOdds),
        draw: String(drawOdds || ''),
        away: String(awayOdds || ''),
        real: true,
      })
    }
  }
  // Sort by highest home odds (best value for bettor)
  return result.sort((a, b) => Number(b.odds) - Number(a.odds)).slice(0, 5)
}

function buildPrompt(match, stats, glicko) {
  const homeStats = stats?.home
  const awayStats = stats?.away

  let statsBlock = ''
  if (homeStats && awayStats) {
    statsBlock = `
СТАТИСТИКА ХОЗЯЕВ (${match.home}) за последние ${homeStats.gamesCount} матчей дома:
- Побед: ${homeStats.wins}, Ничьих: ${homeStats.draws}, Поражений: ${homeStats.loses}
- Среднее голов забито: ${homeStats.avgScore?.toFixed(2)}, пропущено: ${homeStats.avgConceded?.toFixed(2)}
- Средние удары по воротам: ${homeStats.avgShots?.toFixed(1)}, удары соперника: ${homeStats.avgOppShots?.toFixed(1)}
- Средние угловые: ${homeStats.avgCorners?.toFixed(1)}

СТАТИСТИКА ГОСТЕЙ (${match.away}) за последние ${awayStats.gamesCount} матчей в гостях:
- Побед: ${awayStats.wins}, Ничьих: ${awayStats.draws}, Поражений: ${awayStats.loses}
- Среднее голов забито: ${awayStats.avgScore?.toFixed(2)}, пропущено: ${awayStats.avgConceded?.toFixed(2)}
- Средние удары: ${awayStats.avgShots?.toFixed(1)}, удары соперника: ${awayStats.avgOppShots?.toFixed(1)}`
  }

  let glickoBlock = ''
  if (glicko) {
    const homePct = (glicko.homeWinProbability * 100).toFixed(1)
    const awayPct = (glicko.awayWinProbability * 100).toFixed(1)
    const drawPct = (100 - glicko.homeWinProbability * 100 - glicko.awayWinProbability * 100).toFixed(1)
    glickoBlock = `
МОДЕЛЬ GLICKO-2 (математическая вероятность):
- Рейтинг ${match.home}: ${glicko.homeRating?.toFixed(0)} (xG: ${glicko.homeXg?.toFixed(2)})
- Рейтинг ${match.away}: ${glicko.awayRating?.toFixed(0)} (xG: ${glicko.awayXg?.toFixed(2)})
- Вероятность победы хозяев: ${homePct}%
- Вероятность победы гостей: ${awayPct}%
- Вероятность ничьей: ${drawPct}%`
  }

  const odds = match.odds1x2
  const oddsBlock = odds
    ? `КОЭФФИЦИЕНТЫ БУКМЕКЕРОВ (1X2): хозяева ${odds.home}, ничья ${odds.draw}, гости ${odds.away}`
    : ''

  return `Ты профессиональный спортивный аналитик и эксперт по букмекерским ставкам. Проанализируй матч.

МАТЧ: ${match.home} vs ${match.away}
ЛИГА: ${match.league}
ДАТА: ${match.date}

${statsBlock}
${glickoBlock}
${oddsBlock}

Задача:
1. Определи фаворита с учётом всех данных
2. Оцени риски и неопределённость
3. Рассчитай справедливый коэффициент (Fair Odds) на победу фаворита
4. Если есть данные о коэффициентах — найди Value
5. Дай 4-5 конкретных причин прогноза
6. Найди 2-3 НЕСТАНДАРТНЫЕ ставки — не просто "тотал больше 2.5" или "обе забьют", а конкретные паттерны которые ты видишь в статистике этих команд. Анализируй:
   - Угловые (если команда стабильно берёт 7+ угловых)
   - Жёлтые карточки (агрессивные команды)
   - Фора (если разница классов большая)
   - Тотал голов первого тайма
   - Победа с нулём (чистый лист)
   - Конкретный счёт если есть явный паттерн
   - Тотал угловых, ударов и т.д.
   Каждая ставка должна быть обоснована КОНКРЕТНЫМИ цифрами из статистики (например: "Манчестер получал 8+ угловых в 7 из последних 9 домашних матчей")

Ответь строго в JSON (без markdown):
{
  "verdict": "краткий вердикт: например 'Победа Arsenal' или 'Ничья вероятна'",
  "summary": "2-3 предложения итогового анализа по-русски",
  "confidence": число от 0 до 100,
  "risk": "low или medium или high",
  "fairOdds": "число — справедливый коэффициент",
  "bookOdds": "число — средний у букмекеров (если известен)",
  "value": число — процент value (может быть отрицательным),
  "reasons": ["причина 1", "причина 2", "причина 3", "причина 4"],
  "extraBets": [
    {
      "type": "Точное название ставки (например: Угловые хозяев больше 5.5)",
      "confidence": число 50-95,
      "reason": "КОНКРЕТНАЯ статистика: например 'Арсенал подавал 7+ угловых в 8 из последних 10 домашних матчей'"
    }
  ],
  "bestOdds": [
    {"name": "Fonbet", "odds": "X.XX"},
    {"name": "Winline", "odds": "X.XX"},
    {"name": "1xbet", "odds": "X.XX"}
  ]
}`
}

async function callOpenAI(prompt) {
  const token = localStorage.getItem('valorix_token')
  const res = await fetch(`${API_BASE}/analyze/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Server error ${res.status}`)
  }
  const data = await res.json()
  return data.content
}

function parseAnalysis(jsonStr, match) {
  try {
    const p = JSON.parse(jsonStr)
    return {
      verdict: p.verdict || `Победа ${match.home}`,
      summary: p.summary || '',
      confidence: Math.min(100, Math.max(0, Number(p.confidence) || 65)),
      risk: p.risk || 'medium',
      fairOdds: p.fairOdds || '—',
      bookOdds: p.bookOdds || null,
      value: Number(p.value) || 0,
      reasons: Array.isArray(p.reasons) ? p.reasons : [],
      extraBets: Array.isArray(p.extraBets) ? p.extraBets : [],
      bestOdds: Array.isArray(p.bestOdds) ? p.bestOdds : [],
    }
  } catch {
    return getMockAnalysis(match)
  }
}

function normalizeGame(g) {
  const odds1x2 = g.odds?.find(o => o.marketId === 1)
  const homeOdds = odds1x2?.odds?.find(o => o.name === 'Home')?.value
  const awayOdds = odds1x2?.odds?.find(o => o.name === 'Away')?.value
  const drawOdds = odds1x2?.odds?.find(o => o.name === 'Draw')?.value

  return {
    id: g.id,
    flashId: g.flashId,
    home: g.homeTeam?.name || '?',
    away: g.awayTeam?.name || '?',
    homeId: g.homeTeam?.id,
    awayId: g.awayTeam?.id,
    league: g.season?.league?.name || '',
    leagueId: g.season?.league?.id || null,
    date: formatDate(g.date),
    homeImg: g.homeTeam?.id ? `https://sstats.net/assets/logos/${g.homeTeam.id}.png` : null,
    awayImg: g.awayTeam?.id ? `https://sstats.net/assets/logos/${g.awayTeam.id}.png` : null,
    odds1x2: homeOdds ? { home: homeOdds, draw: drawOdds, away: awayOdds } : null,
    rawData: g,
  }
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', timeZone: 'Europe/Moscow' }) +
      ' · ' + d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Moscow' })
  } catch { return dateStr }
}

// --- Mock fallbacks ---

const MOCK_MATCHES = [
  { id: 1, home: 'Arsenal', away: 'Manchester City', league: 'Premier League', date: '17 мая · 20:00', homeImg: null, awayImg: null },
  { id: 2, home: 'Barcelona', away: 'Real Madrid', league: 'La Liga', date: '18 мая · 22:00', homeImg: null, awayImg: null },
  { id: 3, home: 'Bayern Munich', away: 'Borussia Dortmund', league: 'Bundesliga', date: '18 мая · 17:30', homeImg: null, awayImg: null },
  { id: 4, home: 'PSG', away: 'Lyon', league: 'Ligue 1', date: '19 мая · 19:00', homeImg: null, awayImg: null },
  { id: 5, home: 'Juventus', away: 'Inter Milan', league: 'Serie A', date: '19 мая · 21:45', homeImg: null, awayImg: null },
]

function getMockAnalysis(match) {
  return {
    verdict: `Победа ${match.home}`,
    summary: `${match.home} показывает уверенную форму. Хозяева имеют преимущество на своём поле и мотивацию в текущем турнирном положении.`,
    confidence: 68,
    risk: 'medium',
    fairOdds: '1.91',
    bookOdds: '2.08',
    value: 8.9,
    reasons: [
      `${match.home} выиграл 4 из последних 5 домашних матчей`,
      `${match.away} без побед в последних 3 выездных играх`,
      'Статистика личных встреч: 60% в пользу хозяев',
      'Высокая мотивация хозяев в борьбе за место в таблице',
    ],
    bestOdds: [
      { name: 'Fonbet', odds: '2.5' },
      { name: 'Winline', odds: '2.3' },
      { name: '1xbet', odds: '2.1' },
    ],
  }
}

function getMockScreenshotResult() {
  return {
    matches: [
      {
        home: 'Arsenal', away: 'Tottenham',
        odds: '2.1', impliedProb: '47.6%', value: 12,
        recommendation: 'Есть Value — реальная вероятность победы Arsenal выше предложенной',
      },
    ],
    summary: 'Найдена 1 Value ставка. Рекомендуем рассмотреть Arsenal.',
  }
}
