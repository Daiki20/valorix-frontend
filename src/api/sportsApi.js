const SSTATS_KEY = import.meta.env.VITE_SSTATS_API_KEY
const API_BASE = import.meta.env.VITE_API_URL || ''
const BASE = 'https://api.sstats.net'

import { translateTeam } from './teamNames.js'

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

// Resolve image URL: relative paths get API_BASE prepended, absolute URLs pass through
function resolveImg(url) {
  if (!url) return null
  if (url.startsWith('http')) return url          // absolute (NHL CDN etc.)
  return `${API_BASE}${url}`                       // relative → proxy via backend
}

// Get upcoming hockey matches (NHL free API + ИИХФ/КХЛ via AllSportsApi2)
export async function getUpcomingHockeyMatches() {
  try {
    const res = await fetch(`${API_BASE}/matches/hockey`)
    if (!res.ok) return []
    const { data } = await res.json()
    return (data || [])
      .map(g => ({
        ...g,
        homeImg: resolveImg(g.homeImg),
        awayImg: resolveImg(g.awayImg),
      }))
      .sort((a, b) => new Date(a.rawDate || 0) - new Date(b.rawDate || 0))
  } catch { return [] }
}

// Get upcoming hockey matches from Fonbet (КХЛ, НХЛ, ВХЛ, МХЛ — with odds)
export async function getUpcomingHockeyMatchesFonbet(limit = 100) {
  try {
    const res = await fetch(`${API_BASE}/matches/hockey-fonbet`)
    if (!res.ok) return []
    const { data } = await res.json()
    return data || []
  } catch { return [] }
}

// Get upcoming football matches from Fonbet (replaces sstats.net)
export async function getUpcomingFootballMatchesFonbet(limit = 100) {
  try {
    const res = await fetch(`${API_BASE}/matches/football`)
    if (!res.ok) return MOCK_MATCHES
    const { data } = await res.json()
    return (data || []).slice(0, limit)
  } catch { return MOCK_MATCHES }
}

// Get upcoming basketball matches from Fonbet
export async function getUpcomingBasketballMatches(limit = 60) {
  try {
    const res = await fetch(`${API_BASE}/matches/basketball-fonbet`)
    if (!res.ok) return []
    const { data } = await res.json()
    return data || []
  } catch { return [] }
}

// Get upcoming esports matches from Fonbet
export async function getUpcomingEsportsMatches(limit = 80) {
  try {
    const res = await fetch(`${API_BASE}/matches/esports`)
    if (!res.ok) return []
    const { data } = await res.json()
    return data || []
  } catch { return [] }
}

// Get upcoming tennis matches from Fonbet
export async function getUpcomingTennisMatches(limit = 60) {
  try {
    const res = await fetch(`${API_BASE}/matches/tennis`)
    if (!res.ok) return []
    const { data } = await res.json()
    return data || []
  } catch { return [] }
}

// Get ALL live matches from Fonbet (football, hockey, basketball, esports, tennis)
export async function getAllLiveMatches() {
  try {
    const res = await fetch(`${API_BASE}/matches/live-all`)
    if (!res.ok) return []
    const { data } = await res.json()
    return data || []
  } catch { return [] }
}

// Team logo lookup via backend proxy (TheSportsDB, cached per session)
const _logoCache = new Map()
export async function fetchTeamLogo(name) {
  if (!name) return null
  const key = name.toLowerCase().trim()
  if (_logoCache.has(key)) {
    const v = _logoCache.get(key)
    // if promise is still pending, return it; if resolved value, return it
    return v
  }
  const promise = fetch(`${API_BASE}/matches/team-logo?name=${encodeURIComponent(name)}`)
    .then(r => r.ok ? r.json() : { url: null })
    .then(d => {
      const url = d?.url || null
      _logoCache.set(key, url)
      return url
    })
    .catch(() => { _logoCache.set(key, null); return null })
  _logoCache.set(key, promise)
  return promise
}

// Analyze basketball match (Fonbet match → enrichBasketball)
export async function analyzeBasketballMatch(match) {
  const matchInfo = {
    home: match.home,
    away: match.away,
    league: match.league || 'Баскетбол',
    score: match.score || null,
    minute: match.minute || null,
    odds1: match.odds1x2?.home || null,
    oddsX: match.odds1x2?.draw || null,
    odds2: match.odds1x2?.away || null,
  }
  return enrichBasketball(matchInfo)
}

// Analyze esports match (Fonbet match → enrichWithBDL)
export async function analyzeEsportsMatch(match) {
  const game = match.sport || 'cs2'
  const matchInfo = {
    home: match.home,
    away: match.away,
    league: match.league || game,
    score: match.score || null,
    minute: match.minute || null,
    odds1: match.odds1x2?.home || null,
    oddsX: match.odds1x2?.draw || null,
    odds2: match.odds1x2?.away || null,
  }
  return enrichWithBDL(matchInfo, game)
}

// Analyze tennis match (Fonbet match → enrichWithBDL)
export async function analyzeTennisMatch(match) {
  const matchInfo = {
    home: match.home,
    away: match.away,
    league: match.league || 'Теннис',
    score: match.score || null,
    minute: match.minute || null,
    odds1: match.odds1x2?.home || null,
    oddsX: null,
    odds2: match.odds1x2?.away || null,
  }
  return enrichWithBDL(matchInfo, 'tennis')
}

// Get live matches — via backend proxy (avoids browser rate-limiting sstats)
export async function getLiveMatches() {
  try {
    const res = await fetch(`${API_BASE}/matches/live`)
    if (!res.ok) return []
    const { data } = await res.json()
    const raw = data || []
    if (raw.length > 0) console.log('[sstats live rawData sample]', JSON.stringify(raw[0], null, 2))
    return raw.map(g => ({ ...normalizeGame(g), isLive: true }))
  } catch { return [] }
}

// Get upcoming matches — via backend proxy (cached 15 min, avoids 35 parallel browser requests)
export async function getUpcomingMatches(limit = 50) {
  try {
    const res = await fetch(`${API_BASE}/matches/upcoming`)
    if (!res.ok) return MOCK_MATCHES
    const { data } = await res.json()
    const allGames = data || []

    return allGames
      .map(normalizeGame)
      .filter(m => m.odds1x2)
      .sort((a, b) => new Date(a.rawData?.date || 0) - new Date(b.rawData?.date || 0))
      .slice(0, limit)
  } catch { return MOCK_MATCHES }
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
  let h2h = []

  if (SSTATS_KEY && match.id) {
    const apiCalls = [
      sstatsGet('/Games/last-games-stats', { gameId: match.id }),
      sstatsGet(`/Games/glicko/${match.id}`),
      sstatsGet(`/Odds/${match.id}`),
      getPariOdds(match),
    ]
    // h2h — fetch last 5 meetings between the two teams
    if (match.homeId && match.awayId) {
      apiCalls.push(
        sstatsGet('/Games/list', { ended: true, bothTeams: `${match.homeId},${match.awayId}`, limit: 5 })
          .catch(() => null)
      )
    }
    // For live matches — also fetch current score + in-game stats
    if (isLive) {
      apiCalls.push(fetchLiveScore(match.id))
      apiCalls.push(fetchLiveStats(match.id))
    }

    const results = await Promise.allSettled(apiCalls)
    const [statsRes, glickoRes, oddsRes, pariRes, ...rest] = results

    if (statsRes.status === 'fulfilled') stats = statsRes.value
    if (glickoRes.status === 'fulfilled') glicko = glickoRes.value?.data?.glicko
    if (oddsRes.status === 'fulfilled') realOdds = extractBookmakerOdds(oddsRes.value?.data || [])

    // h2h is 5th result (index 4) when homeId/awayId present
    const h2hIdx = (match.homeId && match.awayId) ? 0 : -1
    if (h2hIdx >= 0 && rest[h2hIdx]?.status === 'fulfilled' && rest[h2hIdx]?.value?.data) {
      h2h = rest[h2hIdx].value.data.slice(0, 5)
    }

    // Live stats/score come after h2h
    if (isLive) {
      const liveOffset = (match.homeId && match.awayId) ? 1 : 0
      const liveScoreRes = rest[liveOffset]
      const liveStatsRes = rest[liveOffset + 1]
      if (liveStatsRes?.status === 'fulfilled' && liveStatsRes.value) liveStats = liveStatsRes.value
      if (liveScoreRes?.status === 'fulfilled' && liveScoreRes.value) {
        const ls = liveScoreRes.value
        if (ls.score) match = { ...match, score: ls.score, minute: ls.minute ?? match.minute }
      }
    }

    const pariOdds = pariRes.status === 'fulfilled' ? pariRes.value : null
    if (pariOdds) realOdds = [pariOdds, ...realOdds]
  }

  const context = await getMatchContext(match.home, match.away, match.leagueId).catch(() => ({}))
  const prompt = buildPrompt(match, stats, glicko, context, liveStats, h2h)

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
- "football" — футбол (soccer, любые футбольные лиги)
- "basketball" — баскетбол (NBA, EuroLeague, NCAAB, WNBA и т.д.)
- "hockey" — хоккей (НХЛ, КХЛ, ИИХФ и т.д.)
- "cs2" — Counter-Strike 2 / CS:GO
- "dota2" — Dota 2
- "valorant" — Valorant
- "lol" — League of Legends
- "tennis" — теннис (ATP, WTA, Grand Slam, US Open и т.д.)
- "mma" — MMA/UFC/Bellator и другие единоборства, бокс
- "nfl" — американский футбол (NFL, NCAA Football)
- "baseball" — бейсбол (MLB и т.д.)
- "other" — другое (формула 1, гольф, крикет и т.д.)

Для каждого матча:
1. Прочитай названия команд ТОЧНО как написано
2. Укажи английское название команды (homeEn, awayEn)
3. Для киберспорта — перечисли игроков каждой команды если они видны на скрине
4. Если лайв — запиши счёт
5. Если предматч — запиши коэффициенты

Ответь строго в JSON:
{
  "screenType": "live | prematch | mixed",
  "game": "football | basketball | hockey | cs2 | dota2 | valorant | lol | tennis | mma | nfl | baseball | other",
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
  const raw = data.choices?.[0]?.message?.content || ''
  return JSON.parse(raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim())
}

// Step 2: find teams in sstats, get stats, run full analysis
async function enrichAndAnalyze(matchInfo, game = 'football') {
  // ── Basketball: separate path with BallDontLie NBA API ──
  if (game === 'basketball') return enrichBasketball(matchInfo)

  // ── All other BDL sports: NHL, NFL, MLB, CS2, Dota2, LoL, Valorant, Tennis, MMA ──
  const BDL_SPORTS = ['hockey', 'cs2', 'dota2', 'lol', 'valorant', 'tennis', 'mma', 'nfl', 'baseball']
  if (BDL_SPORTS.includes(game)) return enrichWithBDL(matchInfo, game)

  let homeId = null, awayId = null
  let formData = { homeForm: null, awayForm: null, h2h: [] }
  let glicko = null, realOdds = []

  if (SSTATS_KEY) {
    // Step 1: find team IDs (English name first, fallback to original)
    const [homeTeams, awayTeams] = await Promise.all([
      sstatsGet('/Teams/list', { name: matchInfo.homeEn || matchInfo.home, limit: 3 }).catch(() => ({ data: [] })),
      sstatsGet('/Teams/list', { name: matchInfo.awayEn || matchInfo.away, limit: 3 }).catch(() => ({ data: [] })),
    ])
    homeId = homeTeams.data?.[0]?.id
    awayId = awayTeams.data?.[0]?.id

    if (homeId && awayId) {
      // Step 2: fetch real form + H2H from backend (SQLite cache, 6h TTL)
      try {
        const token = localStorage.getItem('valorix_token')
        const fRes = await fetch(`${API_BASE}/analyze/team-form`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ homeId, awayId }),
        })
        if (fRes.ok) formData = await fRes.json()
      } catch { /* form data is optional — analysis still runs */ }

      // Step 3: try upcoming game for glicko probabilities + bookmaker odds
      try {
        const upcomingRes = await sstatsGet('/Games/list', { upcoming: true, team: homeId, limit: 10 })
        const matchingGame = (upcomingRes?.data || []).find(g =>
          g.homeTeam?.id === awayId || g.awayTeam?.id === awayId
        )
        if (matchingGame) {
          const [glickoRes, oddsRes] = await Promise.allSettled([
            sstatsGet(`/Games/glicko/${matchingGame.id}`),
            sstatsGet(`/Odds/${matchingGame.id}`),
          ])
          if (glickoRes.status === 'fulfilled') glicko = glickoRes.value?.data?.glicko
          if (oddsRes.status === 'fulfilled') realOdds = extractBookmakerOdds(oddsRes.value?.data || [])
        }
      } catch { /* glicko/odds are optional */ }
    }
  }

  const match = {
    home: matchInfo.home,
    away: matchInfo.away,
    league: matchInfo.league || '',
    date: matchInfo.score ? `Лайв · ${matchInfo.minute}'` : 'Предстоящий матч',
    score: matchInfo.score,
    minute: matchInfo.minute,
    odds1x2: matchInfo.odds1 ? { home: matchInfo.odds1, draw: matchInfo.oddsX, away: matchInfo.odds2 } : null,
  }

  const prompt = buildFullScreenPrompt(match, formData, glicko)
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

// ── Basketball enrichment (BallDontLie API) ───────────────────────────────────

async function enrichBasketball(matchInfo) {
  let formData = {}

  try {
    const token = localStorage.getItem('valorix_token')
    const res = await fetch(`${API_BASE}/analyze/basketball-form`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        homeTeam: matchInfo.homeEn || matchInfo.home,
        awayTeam: matchInfo.awayEn || matchInfo.away,
      }),
    })
    if (res.ok) formData = await res.json()
  } catch { /* optional */ }

  const match = {
    home: matchInfo.home,
    away: matchInfo.away,
    league: matchInfo.league || 'НБА',
    date: matchInfo.score ? `Лайв · ${matchInfo.minute}'` : 'Предстоящий матч',
    score: matchInfo.score,
    minute: matchInfo.minute,
    odds1x2: matchInfo.odds1 ? { home: matchInfo.odds1, away: matchInfo.odds2 } : null,
  }

  const cacheKey = `bball_${(matchInfo.home||'').toLowerCase().replace(/\s/g,'')}_${(matchInfo.away||'').toLowerCase().replace(/\s/g,'')}`
  const jsonStr = await callOpenAI(buildBasketballPrompt(match, formData), cacheKey)
  const analysis = parseAnalysis(jsonStr, match)

  return { home: matchInfo.home, away: matchInfo.away, league: matchInfo.league, score: matchInfo.score, minute: matchInfo.minute, ...analysis }
}

// ── Universal BDL sport enrichment (NHL, NFL, MLB, CS2, Dota2, LoL, Valorant, Tennis, MMA) ──

async function enrichWithBDL(matchInfo, game) {
  let formData = {}

  try {
    const token = localStorage.getItem('valorix_token')
    const res = await fetch(`${API_BASE}/analyze/sport-form`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        sport: game,
        homeTeam: matchInfo.homeEn || matchInfo.home,
        awayTeam: matchInfo.awayEn || matchInfo.away,
      }),
    })
    if (res.ok) formData = await res.json()
  } catch { /* optional */ }

  const match = {
    home: matchInfo.home,
    away: matchInfo.away,
    league: matchInfo.league || '',
    date: matchInfo.score ? `Лайв · ${matchInfo.minute}'` : 'Предстоящий матч',
    score: matchInfo.score,
    minute: matchInfo.minute,
    odds1x2: matchInfo.odds1 ? { home: matchInfo.odds1, draw: matchInfo.oddsX, away: matchInfo.odds2 } : null,
  }

  const cacheKey = `bdl_${game}_${(matchInfo.home || '').toLowerCase().replace(/\s/g, '')}_${(matchInfo.away || '').toLowerCase().replace(/\s/g, '')}`
  const prompt = buildSportPrompt(game, match, formData)
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

function buildSportPrompt(sport, match, formData = {}) {
  const isLive = !!match.score
  const isIndividual = ['tennis', 'mma'].includes(sport)
  const hasRealData = !!(
    formData.homeForm || formData.awayForm ||
    formData.player1Form || formData.player2Form ||
    (formData.h2h && formData.h2h.length > 0)
  )

  // Sport metadata: display name + terminology block
  const SPORT_META = {
    hockey:   {
      name: 'хоккей (НХЛ)',
      terms: '• Единица счёта: ГОЛЫ (не очки)\n• Периоды: 1-й, 2-й, 3-й + ОТ + буллиты\n• Тотал: обычно 5.5–6.5 голов\n• В НХЛ нет ничьих (ОТ/буллиты)\n• Форы: -0.5/+0.5, -1.5/+1.5',
      bets: '- Победа в матче (учитывай ОТ/буллиты)\n- Тотал голов (больше/меньше 5.5 или 6.5)\n- Фора по голам (-1.5/+1.5)\n- Обе команды забьют 2+',
    },
    cs2:      {
      name: 'Counter-Strike 2',
      terms: '• Единица: КАРТЫ (не очки)\n• Формат: Best of 3 → тотал карт под/над 2.5\n• Нет ничьих\n• На каждой карте 30 раундов (16 для победы)',
      bets: '- Победа в матче\n- Тотал карт (под/над 2.5)\n- Фора по картам (-1.5/+1.5)\n- Победа на первой карте',
    },
    dota2:    {
      name: 'Dota 2',
      terms: '• Единица: КАРТЫ (не очки)\n• Формат: Best of 3 или Best of 5 → тотал карт\n• Нет ничьих\n• Средняя длина карты: 35–45 минут',
      bets: '- Победа в матче\n- Тотал карт (под/над 2.5)\n- Фора по картам (-1.5/+1.5)\n- Победа на первой карте',
    },
    lol:      {
      name: 'League of Legends',
      terms: '• Единица: КАРТЫ (не очки)\n• Формат: Best of 3 → тотал карт под/над 2.5\n• Нет ничьих\n• Победитель: кто уничтожит Нексус больше раз',
      bets: '- Победа в матче\n- Тотал карт (под/над 2.5)\n- Фора по картам (-1.5/+1.5)\n- Победа на первой карте',
    },
    valorant: {
      name: 'Valorant',
      terms: '• Единица: КАРТЫ (не очки)\n• Формат: Best of 3 → тотал карт под/над 2.5\n• На каждой карте 25 раундов (13 для победы)\n• Нет ничьих',
      bets: '- Победа в матче\n- Тотал карт (под/над 2.5)\n- Фора по картам (-1.5/+1.5)\n- Победа на первой карте',
    },
    tennis:   {
      name: 'теннис (ATP/WTA)',
      terms: '• Единицы: СЕТЫ, ГЕЙМЫ (не очки)\n• Нет ничьих — только П1 или П2\n• Форы по сетам: -1.5/+1.5\n• Тотал геймов: обычно 19.5–24.5\n• Учитывай покрытие (хард/грунт/трава)',
      bets: '- Победа в матче\n- Тотал геймов (под/над 21.5 или 22.5)\n- Фора по сетам (-1.5/+1.5)\n- Победа в 1-м сете',
    },
    mma:      {
      name: 'MMA/UFC',
      terms: '• Нет ничьих\n• Способы победы: KO/TKO, сабмишн, решение судей\n• Тотал раундов: под/над 1.5, 2.5, 3.5\n• Основной бой: 3 раунда × 5 мин\n• Чемпионский/главный: 5 раундов',
      bets: '- Победа в бою\n- Тотал раундов (под/над 1.5 или 2.5)\n- Метод победы (KO/TKO, сабмишн, решение)\n- Бой дойдёт до конца (да/нет)',
    },
    nfl:      {
      name: 'американский футбол (NFL)',
      terms: '• Единица счёта: ОЧКИ\n• Тачдаун: 6 очков + конверсия\n• Тотал: обычно 42–52 очка за матч\n• Форы: -3, -3.5, -6.5, -7, -10 и т.д.\n• 4 четверти по 15 минут',
      bets: '- Победа в матче\n- Тотал очков (под/над 47.5)\n- Фора по очкам (-3.5 / -6.5)\n- Победа в 1-й четверти',
    },
    baseball: {
      name: 'бейсбол (MLB)',
      terms: '• Единица счёта: РАННЫ (runs)\n• 9 иннингов\n• Тотал: обычно 7.5–9.5 рандов\n• Runline (фора): -1.5/+1.5\n• Очень важен стартовый питчер',
      bets: '- Победа в матче\n- Тотал рандов (под/над 8.5)\n- Runline -1.5/+1.5\n- F5 (первые 5 иннингов) победитель',
    },
  }

  const meta = SPORT_META[sport] || { name: sport, terms: '• Нет ничьих в большинстве случаев', bets: '- Победа\n- Тотал\n- Фора' }

  // ── Stats block ──
  let statsBlock = ''
  if (isIndividual) {
    const { player1Form, player2Form, player1Name, player2Name } = formData
    if (player1Form || player2Form) {
      statsBlock = `
── СТАТИСТИКА (BallDontLie ${new Date().getFullYear()}) ──
${player1Name || match.home} — последние ${player1Form?.gamesCount || '?'} матчей:
  Результат: ${player1Form?.wins ?? '?'}П / ${player1Form?.losses ?? '?'}П

${player2Name || match.away} — последние ${player2Form?.gamesCount || '?'} матчей:
  Результат: ${player2Form?.wins ?? '?'}П / ${player2Form?.losses ?? '?'}П`
    }
  } else {
    const { homeForm, awayForm, homeStanding, awayStanding, season } = formData
    if (homeForm || awayForm) {
      statsBlock = `
── СТАТИСТИКА (BallDontLie, сезон ${season || new Date().getFullYear()}) ──
${match.home} — ${homeForm?.gamesCount || '?'} матчей ДОМА:
  Форма: ${homeForm?.wins ?? '?'}П / ${homeForm?.losses ?? '?'}П
  Счёт: ${homeForm?.avgScore ?? '?'} забито / ${homeForm?.avgConceded ?? '?'} пропущено за матч

${match.away} — ${awayForm?.gamesCount || '?'} матчей В ГОСТЯХ:
  Форма: ${awayForm?.wins ?? '?'}П / ${awayForm?.losses ?? '?'}П
  Счёт: ${awayForm?.avgScore ?? '?'} забито / ${awayForm?.avgConceded ?? '?'} пропущено за матч`
    }
    if (homeStanding || awayStanding) {
      statsBlock += `\n\n── ТУРНИРНАЯ ТАБЛИЦА (сезон ${formData.season}) ──
${match.home}: ${homeStanding?.wins ?? '?'}П / ${homeStanding?.losses ?? '?'}П${homeStanding?.rank ? ` · ${homeStanding.rank} место в конференции` : ''}
${match.away}: ${awayStanding?.wins ?? '?'}П / ${awayStanding?.losses ?? '?'}П${awayStanding?.rank ? ` · ${awayStanding.rank} место в конференции` : ''}`
    }
  }

  // ── H2H block ──
  const h2h = formData.h2h || []
  let h2hBlock = ''
  if (h2h.length > 0) {
    const lines = isIndividual
      ? h2h.map(m => `  ${m.date || ''}: Победа ${m.winnerName || '?'}${m.result ? ` (${m.result})` : ''}`).join('\n')
      : h2h.map(g => `  ${g.date || ''}: ${g.homeTeam} ${g.homeScore}:${g.awayScore} ${g.awayTeam}`).join('\n')
    h2hBlock = `\n── ИСТОРИЯ ВСТРЕЧ (реальные данные) ──\n${lines}`
  }

  const oddsBlock = match.odds1x2
    ? `\n── КОЭФФИЦИЕНТЫ ──\n  П1 ${match.odds1x2.home}${match.odds1x2.draw ? ` | Х ${match.odds1x2.draw}` : ''} | П2 ${match.odds1x2.away}`
    : ''
  const liveBlock = isLive
    ? `\n🔴 ЛАЙВ — ТЕКУЩИЙ СЧЁТ: ${match.score}${match.minute ? ` (${match.minute} мин)` : ''}`
    : ''

  return `Ты профессиональный аналитик (${meta.name}). Отвечай СТРОГО по-русски.

МАТЧ: ${match.home} vs ${match.away}
ТУРНИР: ${match.league || meta.name}
${liveBlock}
${statsBlock}
${h2hBlock}
${oddsBlock}

ТЕРМИНОЛОГИЯ (СТРОГО СОБЛЮДАЙ):
${meta.terms}

══ ПРАВИЛА РАБОТЫ С ДАННЫМИ ══
${hasRealData
  ? `• ИСПОЛЬЗУЙ цифры из блоков выше — они из реальной базы данных
• ЗАПРЕЩЕНО придумывать статистику которой нет в блоках
• Ссылайся конкретно: "выиграл X из Y", "забивает X за матч"
• Своими знаниями дополняй контекст (состав, стиль), но НЕ выдумывай цифры`
  : `• Данных из базы нет — опирайся на свои знания об этих командах/игроках
• НЕ выдумывай конкретные цифры — пиши "по общим данным"
• В reasons укажи что оценка без свежей статистики`}

${isLive
  ? `Задача: лайв-анализ. Счёт ${match.score}. Кто доминирует?`
  : `Задача: предматчевый анализ.
1. Форма: кто на подъёме по данным выше?
2. H2H: история очных встреч
3. Таблица/рейтинг: позиции команд
4. Ставки — ОБЯЗАТЕЛЬНО 3-4 штуки:
${meta.bets}`}

Ответь строго в JSON:
{
  "verdict": "чёткий вердикт кто победит",
  "summary": "3-4 предложения с конкретными фактами и цифрами",
  "confidence": число 0-100,
  "risk": "low | medium | high",
  "fairOdds": "справедливый коэффициент",
  "bookOdds": "коэф букмекера если есть",
  "value": число,
  "reasons": ["факт с цифрой 1", "факт 2", "факт 3", "факт 4"],
  "extraBets": [{"type": "Название ставки", "confidence": число, "reason": "обоснование цифрами"}],
  "bestOdds": []
}`
}

function buildBasketballPrompt(match, formData = {}) {
  const isLive = !!match.score
  const { homeForm, awayForm, homeStanding, awayStanding, h2h = [], season, source } = formData
  const hasRealData = !!(homeForm || awayForm || homeStanding || h2h.length)
  const dataSource = source === 'allsports' ? 'AllSports' : 'BallDontLie'

  let statsBlock = ''
  if (homeForm || awayForm) {
    statsBlock = `
── СТАТИСТИКА (реальные данные${season ? `, сезон НБА ${season}` : ''}, источник: ${dataSource}) ──
${match.home} — последние ${homeForm?.gamesCount || '?'} матчей ДОМА:
  Форма: ${homeForm?.wins ?? '?'}П / ${homeForm?.losses ?? '?'}П
  Среднее: ${homeForm?.avgPts ?? '?'} очков забито / ${homeForm?.avgPtsAllowed ?? '?'} пропущено за матч

${match.away} — последние ${awayForm?.gamesCount || '?'} матчей В ГОСТЯХ:
  Форма: ${awayForm?.wins ?? '?'}П / ${awayForm?.losses ?? '?'}П
  Среднее: ${awayForm?.avgPts ?? '?'} очков забито / ${awayForm?.avgPtsAllowed ?? '?'} пропущено за матч`
  }

  let standingsBlock = ''
  if (homeStanding || awayStanding) {
    standingsBlock = `
── ТУРНИРНАЯ ТАБЛИЦА сезона ${season} ──
${match.home}: ${homeStanding?.wins ?? '?'}П / ${homeStanding?.losses ?? '?'}П${homeStanding?.rank ? ` · ${homeStanding.rank} место в конференции` : ''}
${match.away}: ${awayStanding?.wins ?? '?'}П / ${awayStanding?.losses ?? '?'}П${awayStanding?.rank ? ` · ${awayStanding.rank} место в конференции` : ''}`
  }

  let h2hBlock = ''
  if (h2h.length) {
    const lines = h2h.slice(0, 5).map(g =>
      `  ${g.date || ''}: ${g.homeTeam} ${g.homeScore}:${g.awayScore} ${g.awayTeam}`
    ).join('\n')
    h2hBlock = `\n── ИСТОРИЯ ВСТРЕЧ (реальные данные) ──\n${lines}`
  }

  const oddsBlock = match.odds1x2
    ? `\n── КОЭФФИЦИЕНТЫ ──\n  П1 ${match.odds1x2.home} | П2 ${match.odds1x2.away}`
    : ''
  const liveBlock = isLive
    ? `\n🔴 ЛАЙВ — ТЕКУЩИЙ СЧЁТ: ${match.score}${match.minute ? ` (${match.minute} мин)` : ''}`
    : ''

  return `Ты профессиональный аналитик баскетбола. Отвечай СТРОГО по-русски.

МАТЧ: ${match.home} vs ${match.away}
ТУРНИР: ${match.league}
${liveBlock}
${statsBlock}
${standingsBlock}
${h2hBlock}
${oddsBlock}

ТЕРМИНОЛОГИЯ (обязательно):
• Используй "очки" (НЕ "голы"), "четверть", "овертайм"
• Тотал НБА обычно 210–230 очков (больше/меньше X.5)
• Нет ничьих — только П1 или П2
• Форы: -5.5, -7.5, -10.5 и т.д.

══ ПРАВИЛА РАБОТЫ С ДАННЫМИ ══
${hasRealData
  ? `• ИСПОЛЬЗУЙ цифры из блоков выше — они из реальной базы данных
• ЗАПРЕЩЕНО придумывать статистику которой нет в блоках
• Ссылайся конкретно: "набирает X очков дома", "выиграл X из Y выездных"
• Знаниями о ключевых игроках дополняй (если знаешь актуальный состав), но НЕ статистику`
  : `• Данных из базы нет — опирайся на свои знания об этих командах
• НЕ выдумывай конкретные цифры — пиши "по общим данным"
• В reasons укажи что это оценка без свежей статистики`}

${isLive
  ? `Задача: лайв-анализ. Счёт ${match.score}. Кто доминирует? Ожидаемый итоговый тотал?`
  : `Задача: предматчевый анализ.
1. Форма: кто на подъёме по данным выше?
2. Таблица: позиции, регулярный сезон или плей-офф?
3. H2H: кто выигрывал в последних встречах?
4. Ключевые игроки: только если знаешь реальный состав этого сезона
5. Тотал: сколько очков будет по форме команд?`}

Ставки — ОБЯЗАТЕЛЬНО 3-4 штуки:
- Победитель матча
- Тотал очков (больше/меньше X.5)
- Фора (-X.5 на фаворита)
- Победа в 1-й четверти

Ответь строго в JSON:
{
  "verdict": "Победа [команда] (с форой или без)",
  "summary": "3-4 предложения с цифрами из данных выше",
  "confidence": число 0-100,
  "risk": "low | medium | high",
  "fairOdds": "справедливый коэффициент",
  "bookOdds": "коэф букмекера если есть",
  "value": число,
  "reasons": ["факт с цифрой 1", "факт 2", "факт 3", "факт 4"],
  "extraBets": [{"type": "Название ставки", "confidence": число, "reason": "обоснование цифрами"}],
  "bestOdds": []
}`
}

function buildFullScreenPrompt(match, formData = {}, glicko = null) {
  const isLive = !!match.score
  const { homeForm, awayForm, h2h = [] } = formData
  const hasRealData = !!(homeForm && awayForm) || h2h.length > 0

  // ── Form stats block ──────────────────────────────────────────────────────
  let statsBlock = ''
  if (homeForm && awayForm) {
    statsBlock = `
── СТАТИСТИКА (реальные данные из базы) ──
${match.home} — последние ${homeForm.gamesCount} матчей ДОМА:
  Форма: ${homeForm.wins}П / ${homeForm.draws}Н / ${homeForm.loses}П
  Голы: ${homeForm.avgScore.toFixed(2)} забито / ${homeForm.avgConceded.toFixed(2)} пропущено за матч

${match.away} — последние ${awayForm.gamesCount} матчей В ГОСТЯХ:
  Форма: ${awayForm.wins}П / ${awayForm.draws}Н / ${awayForm.loses}П
  Голы: ${awayForm.avgScore.toFixed(2)} забито / ${awayForm.avgConceded.toFixed(2)} пропущено за матч`
  }

  // ── H2H block ─────────────────────────────────────────────────────────────
  let h2hBlock = ''
  if (h2h.length > 0) {
    const lines = h2h.slice(0, 6).map(g =>
      `  ${g.date ? g.date + ': ' : ''}${g.homeTeam} ${g.homeScore}:${g.awayScore} ${g.awayTeam}`
    ).join('\n')
    h2hBlock = `\n── ИСТОРИЯ ВСТРЕЧ (последние ${Math.min(h2h.length, 6)}, реальные данные) ──\n${lines}`
  }

  // ── Glicko block ──────────────────────────────────────────────────────────
  let glickoBlock = ''
  if (glicko) {
    const homePct = (glicko.homeWinProbability * 100).toFixed(1)
    const awayPct = (glicko.awayWinProbability * 100).toFixed(1)
    const drawPct = Math.max(0, 100 - glicko.homeWinProbability * 100 - glicko.awayWinProbability * 100).toFixed(1)
    glickoBlock = `
── МАТЕМАТИЧЕСКАЯ МОДЕЛЬ Glicko-2 ──
  Рейтинг ${match.home}: ${glicko.homeRating?.toFixed(0)}${glicko.homeXg ? ` | xG: ${glicko.homeXg.toFixed(2)}` : ''}
  Рейтинг ${match.away}: ${glicko.awayRating?.toFixed(0)}${glicko.awayXg ? ` | xG: ${glicko.awayXg.toFixed(2)}` : ''}
  Вероятности: П1 ${homePct}% | X ${drawPct}% | П2 ${awayPct}%`
  }

  const liveBlock = isLive ? `\nТЕКУЩИЙ СЧЁТ: ${match.score} (${match.minute} мин)` : ''
  const oddsBlock = match.odds1x2
    ? `\n── КОЭФФИЦИЕНТЫ С ЭКРАНА ──\n  П1 ${match.odds1x2.home} | Х ${match.odds1x2.draw ?? '—'} | П2 ${match.odds1x2.away}`
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
${hasRealData
  ? `• ИСПОЛЬЗУЙ цифры из блоков выше — они из реальной базы данных
• ЗАПРЕЩЕНО придумывать статистику которой нет в блоках выше
• Ссылайся на конкретные цифры: "выиграл X из Y домашних", "забивает X.XX голов/игру", "H2H: X из Y в пользу..."
• Своими знаниями о командах дополняй контекст (состав, тренер, стиль), но НЕ выдумывай цифры`
  : `• Данных из базы нет — опирайся на свои знания об этих командах
• НЕ выдумывай конкретные цифры — пиши "по общим данным" или "предположительно"
• В reasons явно укажи что оценка на основе общих знаний, не свежей статистики`}

${isLive
  ? `Матч ИДЁТ. Счёт ${match.score} на ${match.minute} минуте.
Задача: оцени ход матча. Кто доминирует? Вероятность смены счёта?`
  : `Задача: предматчевый анализ.
Определи фаворита по данным выше. Рассчитай Fair Odds. Найди Value если есть коэффициенты.`}

Дополнительные ставки — ОБЯЗАТЕЛЬНО 3-4 штуки:
- Целевой диапазон коэфа: 1.80 — 3.00
- Ищи: форы, обе забьют, тотал, угловые, карточки
- ЗАПРЕЩЕНО: ставки с коэфом < 1.75
- Обоснование ДОЛЖНО содержать цифру из данных выше (если они есть)

Ответь строго в JSON:
{
  "verdict": "чёткий вердикт кто победит или какой исход",
  "summary": "3-4 предложения анализа с конкретными цифрами из данных выше",
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
      "reason": "цифра из данных: например '${match.home} забивает 1.82 гола/игру → тотал 1.5 проходной'"
    }
  ],
  "bestOdds": []
}`
}

// ── Hockey analysis ─────────────────────────────────────────────────────────

export async function analyzeHockeyMatch(matchInput) {
  const match = { ...matchInput }

  // Fetch real stats from backend (form, h2h, standings) if we have team IDs
  let realStats = {}
  if (match.homeTeamId && match.awayTeamId) {
    try {
      const params = new URLSearchParams({
        homeId: match.homeTeamId,
        awayId: match.awayTeamId,
        ...(match.tournamentId ? { tournamentId: match.tournamentId } : {}),
        ...(match.seasonId    ? { seasonId:    match.seasonId    } : {}),
      })
      const res = await fetch(`${API_BASE}/matches/hockey-stats?${params}`)
      if (res.ok) realStats = await res.json()
    } catch { /* real stats are optional, fall back to GPT knowledge */ }
  }

  const prompt = buildHockeyPrompt(match, realStats)
  // Live matches: no cache (score changes every minute)
  const isLiveMatch = !!(match.isLive || match.score)
  const cacheKey = isLiveMatch ? null :
    `hk_${(match.home || '').toLowerCase().replace(/\s/g, '')}_${(match.away || '').toLowerCase().replace(/\s/g, '')}`
  const jsonStr = await callOpenAI(prompt, cacheKey)
  return parseAnalysis(jsonStr, match)
}

function buildHockeyPrompt(match, realStats = {}) {
  const { homeForm = [], awayForm = [], standings = [], homeSeasonStats = null, awaySeasonStats = null } = realStats
  const hasRealData = homeForm.length > 0 || awayForm.length > 0 || standings.length > 0 || !!homeSeasonStats || !!awaySeasonStats

  const isKHL  = match.league?.toLowerCase().includes('кхл') || match.league?.toLowerCase().includes('khl')
  const isNHL  = match.league?.toLowerCase().includes('нхл') || match.league?.toLowerCase().includes('nhl')
  const isIIHF = match.league?.toLowerCase().includes('iihf') || match.league?.toLowerCase().includes('чемпионат мира')
  const leagueContext = isNHL  ? 'НХЛ (shootout, без ничьих, тотал 5.5-6.5)' :
                        isKHL  ? 'КХЛ (возможна ничья + ОТ + буллиты, тотал 4.5-5.5)' :
                        isIIHF ? 'IIHF Чемпионат мира (формат сборных, без ничьих в плей-офф)' :
                        match.league || 'хоккейный турнир'

  // ── Format team recent form ───────────────────────────────────────────────
  const formatForm = (events, teamId) => {
    if (!events?.length) return '  нет данных'
    // Take last 7 finished matches
    const last7 = events.filter(e => e.status?.type === 'finished').slice(-7)
    if (!last7.length) return '  нет данных'
    return last7.map(e => {
      const hs  = e.homeScore?.normaltime ?? e.homeScore?.current ?? '?'
      const as_ = e.awayScore?.normaltime ?? e.awayScore?.current ?? '?'
      const h = e.homeTeam?.name, a = e.awayTeam?.name
      const won = teamId === e.homeTeam?.id ? Number(hs) > Number(as_) : Number(as_) > Number(hs)
      const lost= teamId === e.homeTeam?.id ? Number(hs) < Number(as_) : Number(as_) < Number(hs)
      const mark = won ? '✓' : lost ? '✗' : '='
      return `  ${mark} ${h} ${hs}:${as_} ${a}`
    }).join('\n')
  }

  const formBlock = hasRealData && (homeForm.length || awayForm.length) ? `
РЕАЛЬНАЯ ФОРМА (из базы данных):
${match.home} — последние матчи:
${formatForm(homeForm, match.homeTeamId)}

${match.away} — последние матчи:
${formatForm(awayForm, match.awayTeamId)}` : ''

  // ── H2H from home team's history (filter matches vs opponent) ────────────
  const h2hMatches = homeForm.length && match.awayTeamId
    ? homeForm.filter(e => e.homeTeam?.id === match.awayTeamId || e.awayTeam?.id === match.awayTeamId)
              .filter(e => e.status?.type === 'finished').slice(-6)
    : []

  const h2hBlock = h2hMatches.length ? `
ОЧНЫЕ ВСТРЕЧИ (последние ${h2hMatches.length}, реальные данные):
${h2hMatches.map(e => {
    const hs = e.homeScore?.normaltime ?? e.homeScore?.current ?? '?'
    const as_ = e.awayScore?.normaltime ?? e.awayScore?.current ?? '?'
    return `  ${e.homeTeam?.name} ${hs}:${as_} ${e.awayTeam?.name}`
  }).join('\n')}` : ''

  // ── Standings block ───────────────────────────────────────────────────────
  let standingsBlock = ''
  if (standings.length > 0) {
    const findRow = (teamId) => {
      for (const g of standings) {
        const row = (g.rows || []).find(r => r.team?.id === teamId)
        if (row) return row
      }
      return null
    }
    const hRow = findRow(match.homeTeamId)
    const aRow = findRow(match.awayTeamId)
    const fmt = (name, r) => r
      ? `${name}: ${r.matches}и ${r.wins}П ${r.losses}П ${r.points}оч ГЗ/ГП=${r.scoresFor}/${r.scoresAgainst}`
      : null
    const lines = [fmt(match.home, hRow), fmt(match.away, aRow)].filter(Boolean)
    if (lines.length) standingsBlock = `\nТУРНИРНАЯ ТАБЛИЦА (реальные данные):\n${lines.join('\n')}`
  }

  // ── Season statistics from IceHockeyApi (PP%, PK%, goals/game, shots) ───────
  const formatSeasonStats = (stats, teamName) => {
    if (!stats) return null
    const lines = []
    if (stats.goalsPerGame != null) lines.push(`  Голов за матч: ${Number(stats.goalsPerGame).toFixed(2)}`)
    if (stats.goalsAgainstPerGame != null) lines.push(`  Пропускает за матч: ${Number(stats.goalsAgainstPerGame).toFixed(2)}`)
    if (stats.powerPlayPercentage != null) lines.push(`  Большинство: ${Number(stats.powerPlayPercentage).toFixed(1)}%`)
    if (stats.penaltyKillPercentage != null) lines.push(`  Меньшинство (нейтр.): ${Number(stats.penaltyKillPercentage).toFixed(1)}%`)
    if (stats.shotsPerGame != null) lines.push(`  Бросков за матч: ${Number(stats.shotsPerGame).toFixed(1)}`)
    const svp = stats.savePctg ?? stats.savePercentage
    if (svp != null) lines.push(`  % сейвов вратаря: ${(Number(svp) * (Number(svp) > 1 ? 1 : 100)).toFixed(1)}%`)
    if (stats.wins != null && stats.losses != null) lines.push(`  Победы/Поражения: ${stats.wins}П / ${stats.losses}П`)
    return lines.length ? `${teamName}:\n${lines.join('\n')}` : null
  }

  const homeSeasonFmt = formatSeasonStats(homeSeasonStats, match.home)
  const awaySeasonFmt = formatSeasonStats(awaySeasonStats, match.away)
  const seasonStatsBlock = (homeSeasonFmt || awaySeasonFmt) ? `
СТАТИСТИКА СЕЗОНА (реальные данные):
${[homeSeasonFmt, awaySeasonFmt].filter(Boolean).join('\n\n')}` : ''

  // ── Rules block ──────────────────────────────────────────────────────────
  const dataRules = hasRealData
    ? `══ ПРАВИЛА РАБОТЫ С ДАННЫМИ ══
• ИСПОЛЬЗУЙ цифры из блоков выше — они из реальной базы данных
• ЗАПРЕЩЕНО придумывать статистику которой нет в блоках выше
• Про вратарей, PP%, PK% — пиши только если знаешь точно (это текущий сезон), иначе НЕ упоминай
• В reasons ОБЯЗАТЕЛЬНО ссылайся на конкретные матчи из данных выше (счёт, серия побед/поражений)
• Своими знаниями о командах дополняй контекст (стиль игры, ключевые игроки), но НЕ статистику`
    : `══ ПРАВИЛА ══
• Реальных данных из базы нет — опирайся на свои знания об этих командах
• В dataWarning ОБЯЗАТЕЛЬНО укажи что это оценка на основе общих знаний, не свежей статистики
• НЕ выдумывай конкретные цифры — пиши "по общим данным" или "предположительно"`

  const isLive = !!(match.isLive || match.score)

  const oddsBlock = (!isLive && match.odds1x2)
    ? `КОЭФФИЦИЕНТЫ: П1 ${match.odds1x2.home}${match.odds1x2.draw ? ` | Ничья ${match.odds1x2.draw}` : ''} | П2 ${match.odds1x2.away}`
    : ''

  // Hockey uses periods, not minutes — show period if available
  const liveTimeStr = match.period
    ? `${match.period} период`
    : match.minute
      ? `${match.minute} мин`
      : ''
  const scoreBlock = match.score
    ? `🔴 ЛАЙВ — ТЕКУЩИЙ СЧЁТ: ${match.score}${liveTimeStr ? ` (${liveTimeStr})` : ''}`
    : ''

  const taskBlock = isLive ? `
ЗАДАЧА: ЛАЙВ-АНАЛИЗ (матч идёт).
Счёт ${match.score}${liveTimeStr ? `, ${liveTimeStr}` : ''}. Сделай выводы:
1. КТО ВЕДЁТ ИГРУ: по форме и статистике сезона выше — счёт закономерен или случаен?
2. ДАВЛЕНИЕ: кто создаёт больше моментов судя по голам за матч и стилю игры команд?
3. ВЕРОЯТНОСТЬ СМЕНЫ СЧЁТА: насколько реально отыграться отстающей команде?
4. ТОТАЛ: сколько ещё голов ожидается до конца матча исходя из темпа?

СТАВКИ ЛАЙВ (3-4 штуки, только реалистичные для текущего момента):
- Итоговый тотал матча (голов больше/меньше X)
- Победитель матча по текущей ситуации
- Следующий гол забьёт та же команда / другая
- Любая другая обоснованная лайв-ставка` : `
ЗАДАЧА: предматчевый анализ.
1. ФОРМА: кто на волне по данным выше? Сколько побед/поражений подряд?
2. ОЧНЫЕ: как складывались последние встречи? Кто выигрывал чаще?
3. СПЕЦБРИГАДЫ: если есть данные PP%/PK% выше — обязательно сравни большинство/меньшинство команд
4. ВРАТАРИ: только если знаешь реальное имя и % сейвов за ЭТОТ сезон (или если данные в блоке выше)
5. СТИЛЬ: что знаешь об игровом стиле этих команд?
6. ТОТАЛ: оцени сколько голов ожидается по форме и голам за матч из статистики сезона

СТАВКИ (ОБЯЗАТЕЛЬНО 3-4 штуки, коэф ≥ 1.75, используй данные выше):
- Тотал голов (больше/меньше 4.5 или 5.5) — обоснуй цифрами из истории встреч
- Победа в основное время
- Фора по голам
- Обе команды забьют 2+`

  return `Ты профессиональный хоккейный аналитик. Отвечай СТРОГО по-русски.

МАТЧ: ${match.home} vs ${match.away}
ТУРНИР: ${leagueContext}
${scoreBlock}
${oddsBlock}
${formBlock}
${h2hBlock}
${standingsBlock}
${seasonStatsBlock}

${dataRules}
${taskBlock}

Ответь строго в JSON (без markdown):
{
  "verdict": "${isLive ? 'оценка текущего хода матча и вероятный итог' : 'кто победит и как (основное/ОТ/буллиты)'}",
  "summary": "3-4 предложения анализа — ТОЛЬКО факты из данных выше + известные факты о командах",
  "confidence": число 0-100,
  "risk": "low | medium | high",
  "fairOdds": "справедливый коэф на фаворита",
  "bookOdds": "коэф букмекера если есть",
  "value": число,
  "dataWarning": "предупреждение если каких-то данных не хватает, или null",
  "reasons": ["факт с КОНКРЕТНОЙ цифрой/матчем из данных 1", "факт 2", "факт 3", "факт 4"],
  "extraBets": [
    {
      "type": "Название ставки по-русски",
      "confidence": число 50-95,
      "reason": "цифра из данных: например 'из 6 очных Лока выиграла 4, тотал под 5.5 в 5 из 6'"
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

function buildPrompt(match, stats, glicko, ctx = {}, liveStats = null, h2h = []) {
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

  // H2H — last meetings between teams
  let h2hBlock = ''
  if (h2h.length > 0) {
    const lines = h2h.map(g => {
      const hScore = g.homeFTResult ?? g.homeScore ?? '?'
      const aScore = g.awayFTResult ?? g.awayScore ?? '?'
      const date = (g.date || '').slice(0, 10)
      return `  ${date}: ${g.homeTeam?.name} ${hScore}:${aScore} ${g.awayTeam?.name}`
    })
    h2hBlock = `── ЛИЧНЫЕ ВСТРЕЧИ (последние ${h2h.length}) ──\n${lines.join('\n')}`
  }

  // Detect high-stakes / derby match for extra context instruction
  const isDerby = (() => {
    const name = `${match.home} ${match.away}`.toLowerCase()
    const derbies = [
      ['real madrid','barcelona'], ['atletico','real madrid'], ['atletico','barcelona'],
      ['milan','inter'], ['juventus','inter'], ['juventus','roma'], ['napoli','juventus'],
      ['liverpool','manchester united'], ['liverpool','everton'], ['manchester city','manchester united'],
      ['arsenal','tottenham'], ['chelsea','arsenal'], ['chelsea','tottenham'],
      ['psg','marseille'], ['psg','lyon'], ['marseille','lyon'],
      ['dortmund','schalke'], ['dortmund','bayern'], ['bayern','schalke'],
      ['ajax','psv'], ['ajax','feyenoord'],
      ['benfica','porto'], ['benfica','sporting'], ['porto','sporting'],
      ['celtic','rangers'],
      ['spartak','cska'], ['spartak','zenit'], ['cska','zenit'], ['zenit','spartak'],
      ['river plate','boca'], ['boca','river'],
      ['galatasaray','fenerbahce'], ['galatasaray','besiktas'],
    ]
    return derbies.some(([a, b]) => name.includes(a) && name.includes(b))
  })()

  const isChampionsLeague = [2, 3, 848].includes(match.leagueId)

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
ЛИГА: ${match.league} | ДАТА: ${match.date}${isDerby ? ' 🔥 ДЕРБИ' : ''}${isChampionsLeague ? ' 🏆 ЕВРОКУБОК' : ''}
${liveBlock}
${statsBlock}
${h2hBlock}
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
    : `• Статистика из базы недоступна — делай анализ на основе своих знаний об этих командах
• КРИТИЧЕСКИ ВАЖНО: НЕ ОГРАНИЧИВАЙСЯ только пересчётом коэффициентов — это примитивно и бесполезно
• ОБЯЗАТЕЛЬНО анализируй: форму команд в последних 5-10 матчах, очные встречи (h2h), состав и потери, стиль игры, тренер и тактика, турнирная мотивация, домашнее/гостевое преимущество
• В reasons давай КОНКРЕТНЫЕ факты: например "Arsenal не проигрывал дома 8 матчей подряд", "City без Холанда забивает на 40% меньше", "h2h: 3 победы из 5 за хозяев"
• Коэффициенты используй ТОЛЬКО как ориентир — не выдавай их пересчёт за анализ`}

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
1. Определи фаворита — аргументируй конкретными фактами о командах (форма, состав, h2h, мотивация)
   ЗАПРЕЩЕНО: писать "является фаворитом с коэффициентом X" как главный аргумент — это не анализ
${h2h.length > 0 ? `   ИСПОЛЬЗУЙ h2h блок выше: упомяни реальный счёт последних встреч и кто доминировал исторически` : ''}
${isDerby ? `   ЭТО ДЕРБИ: особое внимание на психологический фактор, историю встреч, мотивацию. В дерби статистика формы менее предсказуема — учти это в confidence` : ''}
${isChampionsLeague ? `   ЕВРОКУБОК: учти важность выездного гола, тактику на два матча, опыт команд в еврокубках` : ''}
2. Fair Odds: рассчитай справедливый коэффициент на основе реальных вероятностей, НЕ просто инверсия букмекерских коэфов
3. Value: сравни свою оценку вероятности с букмекерской — есть ли расхождение?
4. Дай 4-5 конкретных причин прогноза с реальными фактами о командах${h2h.length > 0 ? ' и h2h статистикой' : ''}
5. Найди 2-3 дополнительные ставки с РЕАЛЬНОЙ ЦЕННОСТЬЮ:
   ОБЯЗАТЕЛЬНЫЕ ТРЕБОВАНИЯ к каждой ставке:
   - Минимальный коэффициент: 1.75 (ставки с коэфом ниже 1.75 НЕ интересны — слишком очевидны)
   - Целевой диапазон коэфа: 1.80 — 3.00
   - ЗАПРЕЩЕНО рекомендовать: тотал меньше 4.5 если среднее голов < 2, победа фаворита с коэфом < 1.5
   - Ищи: форы, точный счёт, обе забьют/не забьют, угловые, карточки — там коэфы интереснее
   - Обосновывай фактами об игре команд, НЕ просто ссылкой на коэффициент
   - Если нет ставок с коэфом ≥ 1.75 которые реально обоснованы — верни пустой массив []`}

Ответь строго в JSON (без markdown):
{
  "verdict": "краткий вердикт: например 'Победа Arsenal' или 'Ничья вероятна'",
  "summary": "2-3 предложения глубокого анализа — форма, состав, тактика, мотивация. НЕ пересказывай коэффициенты",
  "confidence": число от 0 до 100,
  "risk": "low или medium или high",
  "fairOdds": "число — справедливый коэффициент на основе твоей оценки вероятности",
  "bookOdds": "число — коэф букмекера если есть",
  "value": число — процент value,
  "reasons": [
    "конкретный факт о команде или матче (форма, h2h, состав, тактика) 1",
    "конкретный факт о команде или матче 2",
    "конкретный факт о команде или матче 3",
    "конкретный факт о команде или матче 4"
  ],
  "extraBets": [
    {
      "type": "Название ставки по-русски",
      "confidence": число 50-95,
      "reason": "Конкретное обоснование на основе игры команд, а не просто коэффициент"
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
  const token = localStorage.getItem('valorix_token')
  const res = await fetch(`${API_BASE}/analyze/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      messages: [{ role: 'user', content: prompt }],
      cacheKey,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `AI error ${res.status}`)
  }
  const data = await res.json()
  return data.content
}

function parseAnalysis(jsonStr, match) {
  try {
    const cleaned = (jsonStr || '').replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
    const p = JSON.parse(cleaned)
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
    home: translateTeam(g.homeTeam?.name) || '?',
    away: translateTeam(g.awayTeam?.name) || '?',
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
