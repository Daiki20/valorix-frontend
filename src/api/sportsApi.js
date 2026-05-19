const SSTATS_KEY = import.meta.env.VITE_SSTATS_API_KEY
const API_BASE = import.meta.env.VITE_API_URL || ''
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

// Get live matches
export async function getLiveMatches() {
  if (!SSTATS_KEY) return []
  try {
    const results = await Promise.all([
      sstatsGet('/Games/list', { live: true, limit: 20 }).catch(() => ({ data: [] })),
    ])
    const raw = results.flatMap(r => r.data || [])
    if (raw.length > 0) console.log('[sstats live rawData sample]', JSON.stringify(raw[0], null, 2))
    // Force isLive: true for all live-tab matches so cache is always skipped
    return raw.map(g => ({ ...normalizeGame(g), isLive: true }))
  } catch { return [] }
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

// Fetch live in-game statistics (shots, possession, corners, cards)
async function fetchLiveStats(gameId) {
  try {
    const res = await sstatsGet('/Games/statistics', { gameId })
    return res?.data || res?.statistics || null
  } catch { return null }
}

// Fetch single game data — returns live score/minute for ongoing matches
async function fetchLiveScore(gameId) {
  try {
    const res = await sstatsGet(`/Games/${gameId}`)
    const g = res?.data || res
    if (!g) return null
    console.log('[sstats single game]', JSON.stringify(g, null, 2))
    const homeScore = g.homeFTResult ?? g.homeScore ?? g.score?.home ?? g.result?.home
      ?? g.liveData?.homeScore ?? g.homeGoals ?? g.home_score ?? g.scoreHome ?? null
    const awayScore = g.awayFTResult ?? g.awayScore ?? g.score?.away ?? g.result?.away
      ?? g.liveData?.awayScore ?? g.awayGoals ?? g.away_score ?? g.scoreAway ?? null
    const minute = g.minute ?? g.elapsed ?? g.status?.minute ?? g.liveData?.minute
      ?? g.matchMinute ?? g.currentMinute ?? null
    if (homeScore != null && awayScore != null) {
      return { score: `${homeScore}:${awayScore}`, minute }
    }
    return null
  } catch { return null }
}

// Format live stats object/array into readable block for AI prompt
function formatLiveStats(liveStats, home, away) {
  if (!liveStats) return null
  let lines = []

  // Handle array format: [{type, home, away}, ...]
  if (Array.isArray(liveStats)) {
    for (const s of liveStats) {
      const label = s.type || s.name || s.stat
      if (label) lines.push(`  ${label}: ${home} ${s.home ?? s.homeValue ?? '?'} — ${away} ${s.away ?? s.awayValue ?? '?'}`)
    }
  // Handle object format: {homeStats: {...}, awayStats: {...}}
  } else if (liveStats.homeStats || liveStats.home) {
    const h = liveStats.homeStats || liveStats.home || {}
    const a = liveStats.awayStats || liveStats.away || {}
    const fmt = (label, key) => {
      if (h[key] != null || a[key] != null) lines.push(`  ${label}: ${home} ${h[key] ?? '?'} — ${away} ${a[key] ?? '?'}`)
    }
    fmt('Удары', 'shots'); fmt('Удары в створ', 'shotsOnTarget')
    fmt('Владение мячом', 'possession'); fmt('Угловые', 'corners')
    fmt('Фолы', 'fouls'); fmt('Офсайды', 'offsides')
    fmt('Жёлтые карточки', 'yellowCards'); fmt('Красные карточки', 'redCards')
  }

  return lines.length ? lines.join('\n') : null
}

// Main AI analysis for a match
export async function analyzeMatch(matchInput) {
  let match = { ...matchInput }
  const isLive = !!(match.isLive || match.score)
  let stats = null
  let glicko = null
  let realOdds = []
  let liveStats = null

  if (SSTATS_KEY && match.id) {
    const apiCalls = [
      sstatsGet('/Games/last-games-stats', { gameId: match.id }),
      sstatsGet(`/Games/glicko/${match.id}`),
      sstatsGet(`/Odds/${match.id}`),
      getPariOdds(match),
    ]
    // For live matches — also fetch current score + in-game stats
    if (isLive) {
      apiCalls.push(fetchLiveScore(match.id))
      apiCalls.push(fetchLiveStats(match.id))
    }

    const [statsRes, glickoRes, oddsRes, pariRes, liveScoreRes, liveStatsRes] = await Promise.allSettled(apiCalls)
    if (statsRes.status === 'fulfilled') stats = statsRes.value
    if (glickoRes.status === 'fulfilled') glicko = glickoRes.value?.data?.glicko
    if (oddsRes.status === 'fulfilled') realOdds = extractBookmakerOdds(oddsRes.value?.data || [])
    if (liveStatsRes?.status === 'fulfilled' && liveStatsRes.value) liveStats = liveStatsRes.value

    // Override score/minute from single-game fetch if we got it
    if (liveScoreRes?.status === 'fulfilled' && liveScoreRes.value) {
      const ls = liveScoreRes.value
      if (ls.score) match = { ...match, score: ls.score, minute: ls.minute ?? match.minute }
    }

    const pariOdds = pariRes.status === 'fulfilled' ? pariRes.value : null
    if (pariOdds) realOdds = [pariOdds, ...realOdds]
  }

  const context = await getMatchContext(match.home, match.away, match.leagueId).catch(() => ({}))
  const prompt = buildPrompt(match, stats, glicko, context, liveStats)

  // Live matches — no cache (stats change every minute)
  const cacheKey = isLive ? null :
    `m_${(match.home||'').toLowerCase().replace(/\s/g,'')}_${(match.away||'').toLowerCase().replace(/\s/g,'')}`

  const jsonStr = await callOpenAI(prompt, cacheKey)
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
  const game = extracted.game || 'football'
  const analyzed = await Promise.all(
    extracted.matches.map(m => enrichAndAnalyze(m, game))
  )

  return {
    screenType: extracted.screenType,
    matches: analyzed,
    summary: analyzed.length === 1
      ? analyzed[0].verdict
      : `Проанализировано ${analyzed.length} матчей`,
  }
}

const WORKER_URL = 'https://valorix-ai-proxy.andrey-pishev2020.workers.dev'
const WORKER_SECRET = 'valorix_proxy_2024'

async function workerFetch(body) {
  const res = await fetch(WORKER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Valorix-Token': WORKER_SECRET,
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `AI error ${res.status}`)
  }
  return res.json()
}

// Step 1: GPT-4o reads the screenshot
async function extractFromScreenshot(base64Image) {
  const res = await fetch(WORKER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Valorix-Token': WORKER_SECRET,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
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

Определи игру/спорт:
- "football" — футбол
- "cs2" — Counter-Strike 2
- "dota2" — Dota 2
- "valorant" — Valorant
- "lol" — League of Legends
- "other" — другое

Для каждого матча:
1. Прочитай названия команд ТОЧНО как написано
2. Укажи английское название команды (homeEn, awayEn)
3. Для киберспорта — перечисли игроков каждой команды если они видны на скрине
4. Если лайв — запиши счёт
5. Если предматч — запиши коэффициенты

Ответь строго в JSON:
{
  "screenType": "live | prematch | mixed",
  "game": "football | cs2 | dota2 | valorant | lol | other",
  "matches": [
    {
      "home": "название с экрана",
      "away": "название с экрана",
      "homeEn": "English team name",
      "awayEn": "English team name",
      "league": "турнир если виден",
      "score": "0:0 если лайв, иначе null",
      "minute": число или null,
      "odds1": число или null,
      "oddsX": число или null,
      "odds2": число или null,
      "homePlayers": ["игрок1", "игрок2"] или [],
      "awayPlayers": ["игрок1", "игрок2"] или []
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
  return JSON.parse(data.choices[0].message.content)
}

// Fetch esports team context from backend (Esports Data API by mrcupcake)
async function getEsportsContext(game, home, away, homePlayers = [], awayPlayers = []) {
  const token = localStorage.getItem('valorix_token')
  try {
    const res = await fetch(`${API_BASE}/analyze/esports-context`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ game, home, away, homePlayers, awayPlayers }),
    })
    if (!res.ok) return {}
    return res.json()
  } catch {
    return {}
  }
}

// Fetch current Dota 2 hero meta from OpenDota (free, no key)
async function fetchDotaMeta() {
  try {
    const res = await fetch('https://api.opendota.com/api/heroStats')
    if (!res.ok) return null
    const heroes = await res.json()
    return heroes
      .filter(h => h.pro_pick > 20)
      .sort((a, b) => (b.pro_win / b.pro_pick) - (a.pro_win / a.pro_pick))
      .slice(0, 30)
      .map(h => ({
        name: h.localized_name,
        winRate: h.pro_pick > 0 ? ((h.pro_win / h.pro_pick) * 100).toFixed(1) : null,
        pickRate: h.pro_pick,
      }))
  } catch {
    return null
  }
}

function buildEsportsPrompt(match, game, ctx = {}) {
  const isLive = !!match.score
  const gameNames = { cs2: 'CS2', dota2: 'Dota 2', valorant: 'Valorant', lol: 'League of Legends' }
  const gameName = gameNames[game] || game

  // Roster: API data first, OCR fallback
  const apiHomeRoster = ctx.homeRoster?.length
    ? ctx.homeRoster.map(p => p.role ? `${p.name} (${p.role})` : p.name).join(', ')
    : null
  const apiAwayRoster = ctx.awayRoster?.length
    ? ctx.awayRoster.map(p => p.role ? `${p.name} (${p.role})` : p.name).join(', ')
    : null
  const homeRoster = apiHomeRoster || (match.homePlayers?.length ? match.homePlayers.join(', ') : null)
  const awayRoster = apiAwayRoster || (match.awayPlayers?.length ? match.awayPlayers.join(', ') : null)
  const hasRealRoster = !!(apiHomeRoster || apiAwayRoster)

  const rosterBlock = (homeRoster || awayRoster)
    ? `ТЕКУЩИЙ СОСТАВ${hasRealRoster ? ' (реальные данные)' : ' (с экрана)'}:
${homeRoster ? `${match.home}: ${homeRoster}` : `${match.home}: состав неизвестен`}
${awayRoster ? `${match.away}: ${awayRoster}` : `${match.away}: состав неизвестен`}`
    : `СОСТАВЫ: данные не получены — используй свои знания о командах`

  const rankBlock = (ctx.homeRank || ctx.awayRank)
    ? `МИРОВОЙ РЕЙТИНГ: ${match.home} #${ctx.homeRank || '?'} | ${match.away} #${ctx.awayRank || '?'}`
    : ''

  const resultsBlock = (ctx.homeResults || ctx.awayResults)
    ? `ПОСЛЕДНИЕ РЕЗУЛЬТАТЫ:
${ctx.homeResults ? `${match.home}: ${ctx.homeResults}` : ''}
${ctx.awayResults ? `${match.away}: ${ctx.awayResults}` : ''}`.trim()
    : ''

  const oddsBlock = match.odds1x2
    ? `КОЭФФИЦИЕНТЫ: ${match.home} ${match.odds1x2.home} | ${match.away} ${match.odds1x2.away}${match.odds1x2.draw ? ` | Ничья ${match.odds1x2.draw}` : ''}`
    : ''

  const scoreBlock = isLive ? `ТЕКУЩИЙ СЧЁТ: ${match.score}` : ''

  const dataQuality = hasRealRoster && (ctx.homeResults || ctx.awayResults)
    ? '✓ Реальные данные получены — используй их как основу, они актуальнее твоих знаний.'
    : '⚠ Реальных данных из API нет — используй свои знания, но честно укажи это в dataWarning.'

  // ── Game-specific analysis block ──────────────────────────────────────────
  let gameSpecificBlock = ''
  let extraBetsInstruction = ''

  if (game === 'cs2') {
    gameSpecificBlock = `
СПЕЦИФИКА CS2 — ОБЯЗАТЕЛЬНО проанализируй:
1. КАРТЫ: у каждой команды есть пул карт. Какие карты фавориты ${match.home}? Какие у ${match.away}? Кто выиграет вето?
2. СТОРОНЫ: кто сильнее за CT, кто за T? Это влияет на тотал раундов (CT-сильные команды = меньше раундов на своей половине)
3. ПИСТОЛЕТНЫЕ РАУНДЫ: кто статистически выигрывает пистолет? Победа пистолета = экономическое преимущество на 2-3 раунда
4. AWP-ДУЭЛЬ: сравни снайперов обеих команд — это ключевое противостояние в CS2
5. КЛЮЧЕВЫЕ ИГРОКИ: кто главный fragmaker? Кто IGL (капитан, раздаёт тактику)? Кто clutch-игрок?
6. ЭКОНОМИКА: если команда проигрывает — как управляет форс-байами и эко-раундами?
7. ФОРМА: серия результатов из блока выше — идёт ли кто-то на волне побед?`

    extraBetsInstruction = `ДОПОЛНИТЕЛЬНЫЕ СТАВКИ для CS2 (выбери 3-4 самые обоснованные):
- Тотал карт в серии (больше/меньше 2.5) — на основе формы команд
- Победитель первой карты — на основе пула карт и вето
- Тотал раундов на карте (больше/меньше 26.5) — CT-сильные команды = меньше раундов
- Победа на пистолетном раунде — если одна команда статистически доминирует
- Овертайм на карте — если команды примерно равны
- Handicap по картам — если одна команда явный фаворит`

  } else if (game === 'dota2') {
    const metaBlock = match.dotaMeta?.length
      ? `ТЕКУЩАЯ МЕТА (топ герои по про-винрейту):\n${match.dotaMeta.map(h => `${h.name}: ${h.winRate}% WR (${h.pickRate} пиков)`).join('\n')}`
      : ''

    gameSpecificBlock = `
${metaBlock}

СПЕЦИФИКА DOTA 2 — ОБЯЗАТЕЛЬНО проанализируй:
1. СИГНАТУРНЫЕ ГЕРОИ: кто на чём играет? Какие герои у каждого игрока — топ пики?
2. МЕТА-СООТВЕТСТВИЕ: соотносятся ли сигнатурки с текущей метой выше? Кому мета помогает?
3. ДРАФТ-СТИЛЬ: кто предпочитает агрессивный ранний драфт, кто лейт?
4. КЛЮЧЕВЫЕ ИГРОКИ: кто carry, кто поддержка? Кто "несёт" команду?
5. СЕРИЯ МАТЧЕЙ: сколько карт? Кто лучше держит длинные серии?`

    extraBetsInstruction = `ДОПОЛНИТЕЛЬНЫЕ СТАВКИ для Dota 2:
- Тотал карт в серии (больше/меньше 2.5)
- Первая кровь — какая команда агрессивнее в начале?
- Тотал убийств за матч (больше/меньше X)
- Взятие первого Рошана
- Тотал башен за матч`

  } else if (game === 'valorant') {
    gameSpecificBlock = `
СПЕЦИФИКА VALORANT — ОБЯЗАТЕЛЬНО проанализируй:
1. АГЕНТЫ: сигнатурные агенты каждого игрока — Duelists, Controllers, Initiators, Sentinels
2. КАРТЫ: пул карт и вето — кто на каких картах доминирует?
3. СТОРОНЫ: атака vs защита — кто сильнее на атаке, кто на защите?
4. КЛЮЧЕВЫЕ ИГРОКИ: кто топ-фраггер, кто IGL?`

    extraBetsInstruction = `ДОПОЛНИТЕЛЬНЫЕ СТАВКИ для Valorant:
- Тотал карт (больше/меньше 2.5)
- Победитель первой карты
- Тотал раундов на карте
- Первая кровь`

  } else if (game === 'lol') {
    gameSpecificBlock = `
СПЕЦИФИКА LoL — ОБЯЗАТЕЛЬНО проанализируй:
1. РОЛИ И ЧЕМПИОНЫ: сигнатурные чемпионы по ролям (Top, Jungle, Mid, ADC, Support)
2. МЕТА: какие чемпионы сильны в текущем патче? Кому это выгодно?
3. СТИЛЬ: ранняя агрессия vs поздняя игра — кто выиграет при затяжной партии?
4. КЛЮЧЕВЫЕ ДУЭЛИ: Mid vs Mid, Jungle vs Jungle — это определяет игру`

    extraBetsInstruction = `ДОПОЛНИТЕЛЬНЫЕ СТАВКИ для LoL:
- Тотал карт (больше/меньше 2.5)
- Первая кровь
- Тотал убийств за матч
- Победитель первого дракона/барона`
  }

  return `Ты профессиональный аналитик киберспорта, эксперт по ${gameName}. Отвечай СТРОГО по-русски.

МАТЧ: ${match.home} vs ${match.away}
ТУРНИР: ${match.league || 'неизвестно'}
${scoreBlock}
${rankBlock}

${rosterBlock}

${resultsBlock}

${oddsBlock}

${dataQuality}
${gameSpecificBlock}

НЕ пиши общие фразы — только конкретика с именами игроков и реальными фактами.
ЕСЛИ данных по игроку нет — не выдумывай, укажи в dataWarning.

ТРЕБОВАНИЯ к extraBets: минимальный коэфициент ставки ≥ 1.75. Ставки с коэфом 1.1-1.5 не интересны — ищи более высокие коэфы (форы, точный счёт карт, конкретные исходы). Целевой диапазон: 1.80 — 3.00.

${extraBetsInstruction}

Ответь строго в JSON:
{
  "verdict": "чёткий вердикт кто победит",
  "summary": "3-4 предложения глубокого анализа с именами игроков по-русски",
  "confidence": число 0-100,
  "risk": "low | medium | high",
  "fairOdds": "справедливый коэф на фаворита",
  "bookOdds": "коэф букмекера если известен",
  "value": число,
  "dataWarning": "предупреждение если каких-то данных не хватает, или null",
  "reasons": ["факт с именами/цифрами 1", "факт 2", "факт 3", "факт 4"],
  "extraBets": [
    {
      "type": "название ставки СТРОГО по-русски (Тотал карт больше 2.5 / Первая кровь NaVi / Тотал убийств больше 45.5)",
      "confidence": число 50-95,
      "reason": "конкретное обоснование с цифрами и именами по-русски"
    }
  ],
  "bestOdds": []
}`
}

// Step 2: find teams in sstats, get stats, run full analysis
async function enrichAndAnalyze(matchInfo, game = 'football') {
  // Esports route — real API data + Dota meta + GPT analysis
  const esportsGames = ['cs2', 'dota2', 'valorant', 'lol']
  if (esportsGames.includes(game)) {
    // Fetch real esports data and Dota meta in parallel
    const [esportsCtx, dotaMeta] = await Promise.all([
      getEsportsContext(game, matchInfo.home, matchInfo.away, matchInfo.homePlayers, matchInfo.awayPlayers),
      game === 'dota2' ? fetchDotaMeta().catch(() => null) : Promise.resolve(null),
    ])

    const match = {
      home: matchInfo.home,
      away: matchInfo.away,
      league: matchInfo.league || '',
      score: matchInfo.score,
      minute: matchInfo.minute,
      odds1x2: matchInfo.odds1 ? { home: matchInfo.odds1, draw: matchInfo.oddsX, away: matchInfo.odds2 } : null,
      homePlayers: matchInfo.homePlayers || [],
      awayPlayers: matchInfo.awayPlayers || [],
      dotaMeta,
    }
    const prompt = buildEsportsPrompt(match, game, esportsCtx)
    const cacheKey = `e_${game}_${(matchInfo.home||'').toLowerCase().replace(/\s/g,'')}_${(matchInfo.away||'').toLowerCase().replace(/\s/g,'')}`
    const jsonStr = await callOpenAI(prompt, cacheKey)
    const analysis = parseAnalysis(jsonStr, match)
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
    home: matchInfo.home,
    away: matchInfo.away,
    homeOriginal: matchInfo.home,
    awayOriginal: matchInfo.away,
    league: matchInfo.league || '',
    date: matchInfo.score ? `Лайв · ${matchInfo.minute}'` : 'Предстоящий матч',
    score: matchInfo.score,
    minute: matchInfo.minute,
    odds1x2: matchInfo.odds1 ? { home: matchInfo.odds1, draw: matchInfo.oddsX, away: matchInfo.odds2 } : null,
  }

  const prompt = buildFullScreenPrompt(match, stats, glicko, h2h)
  const cacheKey = `f_${(matchInfo.home||'').toLowerCase().replace(/\s/g,'')}_${(matchInfo.away||'').toLowerCase().replace(/\s/g,'')}`
  const jsonStr = await callOpenAI(prompt, cacheKey)
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

  return `Ты профессиональный спортивный аналитик. Отвечай СТРОГО по-русски.

МАТЧ: ${match.home} vs ${match.away}
ЛИГА: ${match.league}
${liveBlock}

${statsBlock}
${glickoBlock}
${h2hBlock}
${oddsBlock}

══ ПРАВИЛА РАБОТЫ С ДАННЫМИ ══
${(statsBlock || glickoBlock || h2hBlock)
    ? `• ИСПОЛЬЗУЙ цифры из блоков выше — они из реальной базы данных
• ЗАПРЕЩЕНО придумывать статистику которой нет выше
• Если данных нет — пиши "данных нет", не выдумывай цифры
• Своими знаниями о командах дополняй контекст, но НЕ статистику`
    : `• Данных из базы нет — опирайся на свои знания об этих командах
• В reasons пиши что это оценка на основе общих знаний, не свежей статистики`}

${isLive
    ? `Матч ИДЁТ. Счёт ${match.score} на ${match.minute} минуте.
Задача: оцени ход матча по статистике выше. Кто доминирует по xG и ударам? Какова вероятность смены счёта?`
    : `Задача: предматчевый анализ.
Определи фаворита. Рассчитай Fair Odds. Найди Value если есть коэффициенты.`}

Дополнительные ставки — ТОЛЬКО с коэфом ≥ 1.75 (ниже неинтересно):
- Целевой диапазон коэфа: 1.80 — 3.00
- Ищи: форы, угловые, карточки, обе забьют/не забьют — там коэфы выше
- ЗАПРЕЩЕНО: ставки с коэфом < 1.75, тотал меньше где коэф 1.1-1.3
- Если нет подходящих — верни пустой массив []

Ответь строго в JSON:
{
  "verdict": "чёткий вердикт кто победит или какой исход",
  "summary": "3-4 предложения анализа с конкретными цифрами из данных",
  "confidence": число 0-100,
  "risk": "low | medium | high",
  "fairOdds": "справедливый коэффициент на фаворита",
  "bookOdds": "коэффициент букмекера если есть",
  "value": число или 0,
  "reasons": ["факт с цифрой 1", "факт с цифрой 2", "факт с цифрой 3", "факт с цифрой 4"],
  "extraBets": [
    {
      "type": "Название ставки по-русски",
      "confidence": число 50-95,
      "reason": "Цифра из данных выше: например 'avgCorners=7.8 → линия на 7.5 проходная'"
    }
  ],
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

function buildPrompt(match, stats, glicko, ctx = {}, liveStats = null) {
  const homeStats = stats?.home
  const awayStats = stats?.away
  const hasStats = !!(homeStats && awayStats)

  // Full stats block — ALL available numbers
  let statsBlock = ''
  if (hasStats) {
    const hCorners = homeStats.avgCorners != null ? homeStats.avgCorners.toFixed(1) : null
    const aCorners = awayStats.avgCorners != null ? awayStats.avgCorners.toFixed(1) : null
    statsBlock = `
── СТАТИСТИКА ИЗ БАЗЫ ДАННЫХ (реальные цифры) ──
${match.home} — последние ${homeStats.gamesCount} матчей ДОМА:
  Форма: ${homeStats.wins}П / ${homeStats.draws}Н / ${homeStats.loses}П
  Голы: ${homeStats.avgScore?.toFixed(2)} забито / ${homeStats.avgConceded?.toFixed(2)} пропущено за матч
  Удары: ${homeStats.avgShots?.toFixed(1)} нанесено / ${homeStats.avgOppShots?.toFixed(1)} допущено за матч${hCorners ? `\n  Угловые: ${hCorners} в среднем за матч` : ''}

${match.away} — последние ${awayStats.gamesCount} матчей В ГОСТЯХ:
  Форма: ${awayStats.wins}П / ${awayStats.draws}Н / ${awayStats.loses}П
  Голы: ${awayStats.avgScore?.toFixed(2)} забито / ${awayStats.avgConceded?.toFixed(2)} пропущено за матч
  Удары: ${awayStats.avgShots?.toFixed(1)} нанесено / ${awayStats.avgOppShots?.toFixed(1)} допущено за матч${aCorners ? `\n  Угловые: ${aCorners} в среднем за матч` : ''}`
  }

  // xG + Glicko probabilities
  let glickoBlock = ''
  if (glicko) {
    const homePct = (glicko.homeWinProbability * 100).toFixed(1)
    const awayPct = (glicko.awayWinProbability * 100).toFixed(1)
    const drawPct = Math.max(0, 100 - glicko.homeWinProbability * 100 - glicko.awayWinProbability * 100).toFixed(1)
    const hXg = glicko.homeXg?.toFixed(2)
    const aXg = glicko.awayXg?.toFixed(2)
    glickoBlock = `
── МАТЕМАТИЧЕСКАЯ МОДЕЛЬ GLICKO-2 ──
  Рейтинг ${match.home}: ${glicko.homeRating?.toFixed(0)}${hXg ? ` | xG за матч: ${hXg}` : ''}
  Рейтинг ${match.away}: ${glicko.awayRating?.toFixed(0)}${aXg ? ` | xG за матч: ${aXg}` : ''}
  Вероятности: П1 ${homePct}% | X ${drawPct}% | П2 ${awayPct}%${
  hXg && aXg ? `\n  xG говорит: ${match.home} создаёт на ${(glicko.homeXg - glicko.awayXg).toFixed(2)} xG ${glicko.homeXg > glicko.awayXg ? 'больше' : 'меньше'} соперника` : ''}`
  }

  // Live stats block — what's happening RIGHT NOW in the match
  const isLive = !!(match.isLive || match.score)

  const odds = match.odds1x2
  const oddsBlock = odds
    ? isLive
      ? `── КОЭФФИЦИЕНТЫ (ПРЕДМАТЧЕВЫЕ — устарели, в лайве коэфы другие) ──\nП1 ${odds.home} | X ${odds.draw} | П2 ${odds.away}\n⚠ НЕ используй эти коэфы для Value-расчёта — они установлены до матча`
      : `── КОЭФФИЦИЕНТЫ БУКМЕКЕРОВ ──\nП1 ${odds.home} | X ${odds.draw} | П2 ${odds.away}`
    : ''
  const liveStatsFormatted = liveStats ? formatLiveStats(liveStats, match.home, match.away) : null
  const liveBlock = isLive ? `
── ТЕКУЩИЙ МАТЧ (ЛАЙВ) ──
  Счёт: ${match.score} | Минута: ${match.minute != null ? match.minute + "'" : '?'}
${liveStatsFormatted ? `  Статистика матча прямо сейчас:\n${liveStatsFormatted}` : '  Детальная статистика матча недоступна — используй счёт и исторические данные'}` : ''

  // Lineups (from RapidAPI)
  const homeLineup = ctx.homeLineup || []
  const awayLineup = ctx.awayLineup || []
  const lineupsBlock = (homeLineup.length || awayLineup.length)
    ? `── СТАРТОВЫЕ СОСТАВЫ ──
${homeLineup.length ? `${match.home}${ctx.formation?.home ? ` [${ctx.formation.home}]` : ''}: ${homeLineup.join(', ')}` : `${match.home}: состав неизвестен`}
${awayLineup.length ? `${match.away}${ctx.formation?.away ? ` [${ctx.formation.away}]` : ''}: ${awayLineup.join(', ')}` : `${match.away}: состав неизвестен`}`
    : ''

  // Standings
  const hs = ctx.homeStanding
  const as_ = ctx.awayStanding
  const standingsBlock = (hs || as_)
    ? `── ТАБЛИЦА ЛИГИ ──
${hs ? `${match.home}: ${hs.rank || hs.position} место | ${hs.points} очков | ГР ${hs.goalsDiff ?? hs.goalDifference ?? '?'}` : ''}
${as_ ? `${match.away}: ${as_.rank || as_.position} место | ${as_.points} очков | ГР ${as_.goalsDiff ?? as_.goalDifference ?? '?'}` : ''}`.trim()
    : ''

  // Value calculation hint — skip for live (pre-match odds are outdated)
  let valueHint = ''
  if (glicko && odds && !isLive) {
    const modelFav = glicko.homeWinProbability > glicko.awayWinProbability ? 'home' : 'away'
    const modelProb = modelFav === 'home' ? glicko.homeWinProbability : glicko.awayWinProbability
    const bookOdds = modelFav === 'home' ? odds.home : odds.away
    const impliedProb = bookOdds ? 1 / bookOdds : null
    if (impliedProb) {
      const value = ((modelProb - impliedProb) / impliedProb * 100).toFixed(1)
      valueHint = `\n── VALUE РАСЧЁТ ──\nМодель даёт вероятность фаворита ${(modelProb * 100).toFixed(1)}%, букмекер закладывает ${(impliedProb * 100).toFixed(1)}% → Value: ${value}%`
    }
  }

  const dataAvailable = hasStats || !!glicko || !!ctx.homeLineup?.length

  return `Ты профессиональный спортивный аналитик. Отвечай СТРОГО по-русски.

МАТЧ: ${match.home} vs ${match.away}
ЛИГА: ${match.league} | ДАТА: ${match.date}
${liveBlock}
${statsBlock}
${glickoBlock}
${standingsBlock}
${lineupsBlock}
${oddsBlock}
${valueHint}

══ ПРАВИЛА РАБОТЫ С ДАННЫМИ ══
${dataAvailable
    ? `• Используй ТОЛЬКО цифры из блоков выше — они реальные, из базы данных
• ЗАПРЕЩЕНО придумывать статистику которой нет в данных выше
• Если какой-то статистики нет — пиши "данных нет", не выдумывай
• Своими знаниями о командах дополняй контекст (стиль, тренер, история), но НЕ факты и цифры`
    : `• Данных из базы нет — используй только свои знания об этих командах
• Чётко отмечай в reasons что данные основаны на общих знаниях, не на свежей статистике`}

${isLive ? (() => {
    const minute = match.minute != null ? Number(match.minute) : null
    const remaining = minute != null ? Math.max(0, 90 - minute) : null
    const scoreParts = (match.score || '0:0').split(':').map(Number)
    const totalSoFar = (scoreParts[0] || 0) + (scoreParts[1] || 0)
    return `ЗАДАЧА (ЛАЙВ-АНАЛИЗ):
Матч идёт — счёт ${match.score} на ${minute != null ? minute + "'" : '?'} минуте.
Осталось примерно ${remaining != null ? remaining : '?'} минут.
Голов забито: ${totalSoFar}.

КРИТИЧЕСКИ ВАЖНО для тоталов:
- Чтобы прошёл тотал БОЛЬШЕ 2.5 нужно ещё ${Math.max(0, 3 - totalSoFar)} гол(а)
- Чтобы прошёл тотал БОЛЬШЕ 1.5 нужно ещё ${Math.max(0, 2 - totalSoFar)} гол(а)
- Чтобы прошёл тотал БОЛЬШЕ 0.5 нужно ещё ${Math.max(0, 1 - totalSoFar)} гол(а)
- За ${remaining != null ? remaining : '?'} минут вероятность ${remaining != null && remaining < 30 ? 'забить 3+ голов ОЧЕНЬ НИЗКАЯ — не рекомендуй тотал 2.5' : 'забить голов снижается с каждой минутой'}
- ЗАПРЕЩЕНО рекомендовать тотал, для которого нужно больше голов чем реалистично за оставшееся время

1. Кто сейчас доминирует? (удары, владение, угловые из блока выше)
2. Вероятность гола в оставшееся время — кто давит?
3. Лайв-ставки с коэфом ≥ 1.75: следующий гол, фора по ходу, точный счёт. Только то что реально за ${remaining != null ? remaining : '?'} минут.
   ЗАПРЕЩЕНО рекомендовать ставки с очевидным коэфом < 1.75 — они не интересны игроку.
4. Verdict — чем закончится матч`
  })() :
`ЗАДАЧИ:
1. Определи фаворита — аргументируй ЦИФРАМИ из данных выше
2. Fair Odds: рассчитай справедливый коэффициент на основе вероятностей модели
3. Value: если коэффициенты букмекера выше fair odds — есть value
4. Дай 4-5 конкретных причин с цифрами
5. Найди 2-3 дополнительные ставки с РЕАЛЬНОЙ ЦЕННОСТЬЮ:
   ОБЯЗАТЕЛЬНЫЕ ТРЕБОВАНИЯ к каждой ставке:
   - Минимальный коэффициент: 1.75 (ставки с коэфом ниже 1.75 НЕ интересны — слишком очевидны)
   - Целевой диапазон коэфа: 1.80 — 3.00
   - ЗАПРЕЩЕНО рекомендовать: тотал меньше 4.5 если среднее голов < 2, победа фаворита с коэфом < 1.5
   - Ищи: форы, точный счёт, обе забьют/не забьют, угловые, карточки — там коэфы интереснее
   - ОБОСНОВЫВАЙ только реальными цифрами из данных выше
   - Если нет ставок с коэфом ≥ 1.75 которые реально обоснованы — верни пустой массив []`}

Ответь строго в JSON (без markdown):
{
  "verdict": "краткий вердикт: например 'Победа Arsenal' или 'Ничья вероятна'",
  "summary": "2-3 предложения анализа с конкретными цифрами из данных",
  "confidence": число от 0 до 100,
  "risk": "low или medium или high",
  "fairOdds": "число — справедливый коэффициент",
  "bookOdds": "число — коэф букмекера если есть",
  "value": число — процент value,
  "reasons": [
    "факт с цифрой из данных 1",
    "факт с цифрой из данных 2",
    "факт с цифрой из данных 3",
    "факт с цифрой из данных 4"
  ],
  "extraBets": [
    {
      "type": "Название ставки по-русски",
      "confidence": число 50-95,
      "reason": "КОНКРЕТНАЯ цифра из данных: например '${match.home} берёт X угловых в среднем, линия на X.5'"
    }
  ],
  "bestOdds": []
}`
}

async function getMatchContext(home, away, leagueId) {
  const token = localStorage.getItem('valorix_token')
  try {
    const res = await fetch(`${API_BASE}/analyze/context`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ home, away, leagueId }),
    })
    if (!res.ok) return {}
    return res.json()
  } catch {
    return {}
  }
}

async function callOpenAI(prompt, cacheKey = null) {
  const data = await workerFetch({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
  })
  return data.choices[0].message.content
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
      dataWarning: p.dataWarning || null,
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

  // Extract live score — homeFTResult/awayFTResult is what sstats uses (seen in h2h code)
  const homeScore = g.homeFTResult ?? g.homeScore ?? g.score?.home ?? g.result?.home ?? g.liveData?.homeScore ?? g.homeGoals ?? null
  const awayScore = g.awayFTResult ?? g.awayScore ?? g.score?.away ?? g.result?.away ?? g.liveData?.awayScore ?? g.awayGoals ?? null
  const scoreStr = homeScore != null && awayScore != null ? `${homeScore}:${awayScore}` : null
  const minute = g.minute ?? g.elapsed ?? g.status?.minute ?? g.liveData?.minute ?? null
  const isLive = scoreStr != null || g.status === 'live' || g.isLive === true

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
    score: scoreStr,
    minute,
    isLive,
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
