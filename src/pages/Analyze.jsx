import { useState, useEffect, useRef } from 'react'
import { Search, ArrowLeft, Zap, AlertCircle, Loader, Lock } from 'lucide-react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import AnalysisResult from '../components/AnalysisResult'
import AuthModal from '../components/AuthModal'
import {
  searchMatches, analyzeMatch, analyzeHockeyMatch, analyzeBasketballMatch, analyzeEsportsMatch, analyzeTennisMatch,
  getUpcomingMatches, getLiveMatches, getUpcomingHockeyMatches, getUpcomingHockeyMatchesFonbet, getUpcomingFootballMatchesFonbet,
  getUpcomingBasketballMatches, getUpcomingEsportsMatches, getUpcomingTennisMatches,
  getAllLiveMatches,
} from '../api/sportsApi'
import { coinsApi } from '../api/authApi'
import ExpressCard from '../components/ExpressCard'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const ANALYSIS_COST = 19

export default function Analyze() {
  const { user, updateCoins } = useAuth()
  const toast = useToast()
  const [query, setQuery] = useState('')
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [error, setError] = useState(null)
  const [locked, setLocked] = useState(false)       // результат готов но не оплачен
  const [revealed, setRevealed] = useState(false)   // оплачено, показываем
  const [payLoading, setPayLoading] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const pendingResult = useRef(null)                 // результат хранится здесь до оплаты
  const [revealedAnalysis, setRevealedAnalysis] = useState(null)
  const [shareToken, setShareToken] = useState(null)
  const [activeTab, setActiveTab] = useState('football')
  const [liveMatches, setLiveMatches] = useState([])
  const [hockeyMatches, setHockeyMatches] = useState([])
  const [hockeyLoading, setHockeyLoading] = useState(false)
  const [showHockeyForm, setShowHockeyForm] = useState(false)
  const [hockeyHome, setHockeyHome] = useState('')
  const [hockeyAway, setHockeyAway] = useState('')
  const [hockeyLeague, setHockeyLeague] = useState('КХЛ')

  const [basketballMatches, setBasketballMatches] = useState([])
  const [basketballLoading, setBasketballLoading] = useState(false)
  const [esportsMatches, setEsportsMatches] = useState([])
  const [esportsLoading, setEsportsLoading] = useState(false)
  const [tennisMatches, setTennisMatches] = useState([])
  const [tennisLoading, setTennisLoading] = useState(false)

  const [liveAllMatches, setLiveAllMatches] = useState([])

  const [liveFilter, setLiveFilter] = useState('all')

  useEffect(() => {
    // Football: Fonbet primary (has odds), fallback to sstats
    getUpcomingFootballMatchesFonbet(100)
      .then(m => { if (m.length > 0) setMatches(m); else return getUpcomingMatches(20).then(setMatches) })
      .catch(() => getUpcomingMatches(20).then(setMatches).catch(() => {}))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (activeTab !== 'live') return
    let cancelled = false
    const fetch_ = () => getAllLiveMatches()
      .then(m => { if (!cancelled) setLiveAllMatches(m) })
      .catch(() => {})
    fetch_()
    const interval = setInterval(fetch_, 90 * 1000) // refresh every 90s
    return () => { cancelled = true; clearInterval(interval) }
  }, [activeTab])

  useEffect(() => {
    if (activeTab !== 'hockey' || hockeyMatches.length > 0) return
    setHockeyLoading(true)
    // Hockey: Fonbet primary (has odds for КХЛ/НХЛ/etc), fallback to AllSports (has logos)
    getUpcomingHockeyMatchesFonbet(100)
      .then(fonbetMatches => {
        if (fonbetMatches.length > 0) {
          setHockeyMatches(fonbetMatches)
        } else {
          return getUpcomingHockeyMatches()
            .then(m => { setHockeyMatches(m); if (m.length === 0) setShowHockeyForm(true) })
            .catch(() => setShowHockeyForm(true))
        }
      })
      .catch(() => {
        getUpcomingHockeyMatches()
          .then(m => { setHockeyMatches(m); if (m.length === 0) setShowHockeyForm(true) })
          .catch(() => setShowHockeyForm(true))
      })
      .finally(() => setHockeyLoading(false))
  }, [activeTab])

  useEffect(() => {
    if (activeTab !== 'basketball' || basketballMatches.length > 0) return
    setBasketballLoading(true)
    getUpcomingBasketballMatches()
      .then(setBasketballMatches)
      .catch(() => {})
      .finally(() => setBasketballLoading(false))
  }, [activeTab])

  useEffect(() => {
    if (activeTab !== 'esports' || esportsMatches.length > 0) return
    setEsportsLoading(true)
    getUpcomingEsportsMatches()
      .then(setEsportsMatches)
      .catch(() => {})
      .finally(() => setEsportsLoading(false))
  }, [activeTab])

  useEffect(() => {
    if (activeTab !== 'tennis' || tennisMatches.length > 0) return
    setTennisLoading(true)
    getUpcomingTennisMatches()
      .then(setTennisMatches)
      .catch(() => {})
      .finally(() => setTennisLoading(false))
  }, [activeTab])

  const filtered = matches.filter(m =>
    m.home.toLowerCase().includes(query.toLowerCase()) ||
    m.away.toLowerCase().includes(query.toLowerCase()) ||
    m.league.toLowerCase().includes(query.toLowerCase())
  )

  async function handleSearch(e) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    try {
      const results = await searchMatches(query)
      if (results?.length > 0) setMatches(results)
    } catch {}
    finally { setLoading(false) }
  }

  async function handleSelectMatch(match) {
    if (!user) { setShowAuth(true); return }
    setSelectedMatch(match)
    pendingResult.current = null
    setLocked(false)
    setRevealed(false)
    setRevealedAnalysis(null)
    setAnalysisLoading(true)
    setError(null)
    try {
      const sport = match.sport || 'football'
      let result
      if (sport === 'hockey') result = await analyzeHockeyMatch(match)
      else if (sport === 'basketball') result = await analyzeBasketballMatch(match)
      else if (['cs2','dota2','lol','valorant'].includes(sport)) result = await analyzeEsportsMatch(match)
      else if (sport === 'tennis') result = await analyzeTennisMatch(match)
      else result = await analyzeMatch(match)
      pendingResult.current = result
      setLocked(true)
    } catch (err) {
      setError(`Ошибка: ${err.message}`)
    } finally {
      setAnalysisLoading(false)
    }
  }

  function handleHockeyAnalyze() {
    if (!hockeyHome.trim() || !hockeyAway.trim()) return
    handleSelectMatch({
      id: null,
      home: hockeyHome.trim(),
      away: hockeyAway.trim(),
      league: hockeyLeague,
      sport: 'hockey',
    })
  }

  async function handleConfirmPayment() {
    if (!user) { setShowAuth(true); return }
    if (user.coins < ANALYSIS_COST) {
      setError(`Недостаточно монет. Нужно ${ANALYSIS_COST}, у вас ${user.coins}.`)
      return
    }
    setPayLoading(true)
    setError(null)
    try {
      const data = await coinsApi.spend({
        amount: ANALYSIS_COST,
        matchHome: selectedMatch.home,
        matchAway: selectedMatch.away,
        league: selectedMatch.league,
        sport: selectedMatch.sport || 'football',
        result: pendingResult.current,
      })
      updateCoins(data.coins)
      if (data.shareToken) setShareToken(data.shareToken)
      setRevealedAnalysis(pendingResult.current)
      pendingResult.current = null
      setLocked(false)
      setRevealed(true)
      toast.success(`Списано ${ANALYSIS_COST} монет · Осталось ${data.coins}`)
    } catch (err) {
      setError(err.message)
      toast.error(err.message)
    } finally {
      setPayLoading(false)
    }
  }

  if (selectedMatch) {
    return (
      <div style={{ minHeight: '100vh', background: '#07090f' }}>
        <Navbar />
        <div className="analyze-page-content" style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
          <button
            onClick={() => { setSelectedMatch(null); setLocked(false); setRevealed(false); setShareToken(null); pendingResult.current = null }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#64748b', fontSize: 14, fontWeight: 600, marginBottom: 24,
            }}
          >
            <ArrowLeft size={16} /> Назад к матчам
          </button>

          {analysisLoading && <LoadingAnalysis match={selectedMatch} />}

          {error && (
            <div style={{
              background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)', borderRadius: 12,
              padding: '16px 20px', display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 16,
            }}>
              <AlertCircle size={20} color="#ef4444" />
              <div>
                <div style={{ fontWeight: 600, color: '#ff7070', marginBottom: 4 }}>Ошибка</div>
                <div style={{ fontSize: 13, color: '#4a6a8a' }}>{error}</div>
              </div>
            </div>
          )}

          {locked && !revealed && (
            <LockedResult
              match={selectedMatch}
              cost={ANALYSIS_COST}
              userCoins={user?.coins ?? 0}
              loading={payLoading}
              onConfirm={handleConfirmPayment}
            />
          )}

          {revealed && revealedAnalysis && (
            <AnalysisResult match={selectedMatch} analysis={revealedAnalysis} shareToken={shareToken} isLive={activeTab === 'live'} />
          )}
        </div>
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#07090f' }}>
      <Navbar />
      <div className="analyze-page-content" style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
        <Link to="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          color: '#64748b', fontSize: 14, fontWeight: 600, marginBottom: 24,
          textDecoration: 'none',
        }}>
          <ArrowLeft size={16} /> На главную
        </Link>

        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: '#dde4ee', letterSpacing: -0.5, marginBottom: 8 }}>
            Выбери матч
          </h1>
          <p style={{ color: '#64748b', fontSize: 15 }}>
            Стоимость анализа: <strong>{ANALYSIS_COST} монет</strong> за матч
          </p>
        </div>

        <ExpressCard onAuthRequired={() => setShowAuth(true)} />

        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {[
            { id: 'football', label: '⚽ Футбол' },
            { id: 'hockey', label: '🏒 Хоккей' },
            { id: 'basketball', label: '🏀 Баскет' },
            { id: 'esports', label: '🎮 Киберспорт' },
            { id: 'tennis', label: '🎾 Теннис' },
            { id: 'live', label: '🔴 Лайв' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              padding: '8px 20px', borderRadius: 10, fontWeight: 700, fontSize: 14,
              border: `1.5px solid ${activeTab === tab.id ? 'transparent' : 'rgba(0,180,255,0.15)'}`,
              cursor: 'pointer',
              background: activeTab === tab.id ? 'linear-gradient(135deg, #00cfff, #7b5ea7)' : 'rgba(0,25,60,0.4)',
              color: activeTab === tab.id ? '#030b18' : '#4a6a8a',
              boxShadow: activeTab === tab.id ? '0 4px 16px rgba(0,207,255,0.25)' : 'none',
              transition: 'all 0.15s',
            }}>{tab.label}</button>
          ))}
        </div>

        {activeTab === 'football' && (
          <form onSubmit={handleSearch} style={{ marginBottom: 28, position: 'relative' }}>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Поиск по команде или лиге..."
              style={{
                width: '100%', padding: '14px 20px 14px 48px',
                borderRadius: 12, border: '1.5px solid rgba(0,180,255,0.15)',
                fontSize: 15, background: 'rgba(0,15,40,0.6)',
                color: '#d8eeff', outline: 'none',
              }}
            />
            <Search size={18} color="#94a3b8"
              style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
          </form>
        )}

        {activeTab === 'hockey' && (
          <>
            {hockeyLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[1,2,3,4].map(i => (
                  <div key={i} className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div className="skeleton" style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0 }} />
                    <div className="skeleton" style={{ height: 15, flex: 1, maxWidth: 140 }} />
                    <div className="skeleton" style={{ height: 15, width: 60 }} />
                    <div className="skeleton" style={{ height: 15, flex: 1, maxWidth: 140 }} />
                    <div className="skeleton" style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0 }} />
                  </div>
                ))}
              </div>
            ) : hockeyMatches.length > 0 ? (
              <>
                {/* If matches have league field (Fonbet) — use grouped SportMatchList */}
                {hockeyMatches[0]?.sport === 'hockey' && hockeyMatches[0]?.league ? (
                  <SportMatchList
                    matches={hockeyMatches}
                    loading={false}
                    emptyIcon="🏒"
                    emptyText="Хоккейные матчи не найдены"
                    onSelect={handleSelectMatch}
                    accentColor="#0ea5e9"
                  />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                    {hockeyMatches.map(match => (
                      <HockeyMatchRow key={match.id} match={match} onClick={() => handleSelectMatch(match)} />
                    ))}
                  </div>
                )}
                <button
                  onClick={() => setShowHockeyForm(f => !f)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: 'none', border: '1.5px dashed rgba(0,180,255,0.2)',
                    borderRadius: 10, padding: '10px 16px', cursor: 'pointer',
                    fontSize: 13, fontWeight: 600, color: '#4a6a8a',
                    marginBottom: 16, marginTop: 8, width: '100%',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#0ea5e9'; e.currentTarget.style.color = '#0ea5e9' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,180,255,0.2)'; e.currentTarget.style.color = '#4a6a8a' }}
                >
                  {showHockeyForm ? '✕ Скрыть форму' : '+ Другой матч (ввести вручную)'}
                </button>
              </>
            ) : null}

            {(showHockeyForm || (!hockeyLoading && hockeyMatches.length === 0)) && (
              <HockeyInputForm
                home={hockeyHome} onHome={setHockeyHome}
                away={hockeyAway} onAway={setHockeyAway}
                league={hockeyLeague} onLeague={setHockeyLeague}
                onAnalyze={handleHockeyAnalyze}
                cost={ANALYSIS_COST}
              />
            )}
          </>
        )}

        {activeTab === 'basketball' && (
          <SportMatchList
            matches={basketballMatches}
            loading={basketballLoading}
            emptyIcon="🏀"
            emptyText="Матчи по баскетболу не найдены"
            onSelect={handleSelectMatch}
          />
        )}

        {activeTab === 'esports' && (
          <SportMatchList
            matches={esportsMatches}
            loading={esportsLoading}
            emptyIcon="🎮"
            emptyText="Матчи по киберспорту не найдены"
            onSelect={handleSelectMatch}
          />
        )}

        {activeTab === 'tennis' && (
          <SportMatchList
            matches={tennisMatches}
            loading={tennisLoading}
            emptyIcon="🎾"
            emptyText="Матчи по теннису не найдены"
            onSelect={handleSelectMatch}
          />
        )}

        {activeTab === 'football' && (loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3,4,5].map(i => (
              <div key={i} className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div className="skeleton" style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} />
                <div className="skeleton" style={{ height: 15, flex: 1, maxWidth: 120 }} />
                <div className="skeleton" style={{ height: 15, width: 60 }} />
                <div className="skeleton" style={{ height: 15, flex: 1, maxWidth: 120 }} />
                <div className="skeleton" style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} />
                <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
                  {[1,2,3].map(j => <div key={j} className="skeleton" style={{ width: 44, height: 38, borderRadius: 8 }} />)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(match => (
              <MatchRow key={match.id} match={match} onClick={() => handleSelectMatch(match)} />
            ))}
            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8' }}>
                <Search size={48} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
                <p>Матчи не найдены. Попробуйте другой запрос.</p>
              </div>
            )}
          </div>
        ))}

        {activeTab === 'live' && (() => {
          const LIVE_SPORT_META = {
            all:        { label: '🔴 Все',        color: '#ef4444' },
            football:   { label: '⚽ Футбол',     color: '#22c55e' },
            hockey:     { label: '🏒 Хоккей',     color: '#0ea5e9' },
            basketball: { label: '🏀 Баскет',     color: '#f59e0b' },
            esports:    { label: '🎮 Кибер',      color: '#8b5cf6' },
            tennis:     { label: '🎾 Теннис',     color: '#10b981' },
          }

          // group by sport
          const bySport = {}
          for (const m of liveAllMatches) {
            const s = m.sport || 'other'
            if (!bySport[s]) bySport[s] = []
            bySport[s].push(m)
          }
          // esports sub-sports all roll up to 'esports' for filtering
          const esportSports = ['cs2', 'dota2', 'lol', 'valorant']
          const esportsMatches_ = liveAllMatches.filter(m => esportSports.includes(m.sport))

          const countFor = id => {
            if (id === 'all') return liveAllMatches.length
            if (id === 'esports') return esportsMatches_.length
            return (bySport[id] || []).length
          }

          const currentMatches = (() => {
            if (liveFilter === 'all') return liveAllMatches
            if (liveFilter === 'esports') return esportsMatches_
            return bySport[liveFilter] || []
          })()

          // only show tabs that have matches (+ "all")
          const visibleTabs = Object.keys(LIVE_SPORT_META).filter(id =>
            id === 'all' ? liveAllMatches.length > 0 : countFor(id) > 0
          )

          return (
            <>
              {/* Sport sub-tabs */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
                {visibleTabs.map(id => {
                  const meta = LIVE_SPORT_META[id]
                  const cnt = countFor(id)
                  const isActive = liveFilter === id
                  return (
                    <button key={id} onClick={() => setLiveFilter(id)} style={{
                      padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                      border: `1.5px solid ${isActive ? meta.color : 'rgba(0,180,255,0.15)'}`,
                      background: isActive ? `${meta.color}22` : 'rgba(0,25,60,0.4)',
                      color: isActive ? meta.color : '#4a6a8a',
                      cursor: 'pointer', transition: 'all 0.15s',
                      display: 'flex', alignItems: 'center', gap: 5,
                    }}>
                      {meta.label}
                      {cnt > 0 && (
                        <span style={{
                          background: isActive ? meta.color : 'rgba(0,180,255,0.2)',
                          color: isActive ? '#030b18' : '#64748b',
                          borderRadius: 10, padding: '1px 6px', fontSize: 10, fontWeight: 800,
                        }}>{cnt}</span>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Match list */}
              {currentMatches.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {currentMatches.map(match => {
                    const sportColor = LIVE_SPORT_META[match.sport]?.color || LIVE_SPORT_META[esportSports.includes(match.sport) ? 'esports' : 'all']?.color || '#ef4444'
                    return (
                      <LiveMatchRow
                        key={match.id}
                        match={match}
                        onClick={() => handleSelectMatch(match)}
                        sportColor={sportColor}
                      />
                    )
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🔴</div>
                  <p style={{ fontSize: 15 }}>Нет лайв матчей</p>
                  <p style={{ fontSize: 13, color: '#4a6a8a', marginTop: 6 }}>Fonbet обновляется каждые 90 сек</p>
                </div>
              )}
            </>
          )
        })()}
      </div>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  )
}

function LockedResult({ match, cost, userCoins, loading, onConfirm }) {
  const notEnough = userCoins < cost
  return (
    <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden' }}>
      {/* Blurred fake content */}
      <div style={{ filter: 'blur(8px)', pointerEvents: 'none', userSelect: 'none' }}>
        <div className="card" style={{ padding: 32, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <div style={{ height: 20, width: 160, background: 'rgba(0,207,255,0.1)', borderRadius: 6, marginBottom: 8 }} />
              <div style={{ height: 14, width: 100, background: 'rgba(255,255,255,0.04)', borderRadius: 6 }} />
            </div>
            <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'conic-gradient(#00cfff 0% 72%, rgba(0,180,255,0.08) 72%)' }} />
          </div>
          {[1,2,3].map(i => (
            <div key={i} style={{ height: 16, background: 'rgba(255,255,255,0.04)', borderRadius: 6, marginBottom: 10, width: `${70 + i * 8}%` }} />
          ))}
        </div>
        <div className="card" style={{ padding: 24 }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <div style={{ height: 14, flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 6 }} />
              <div style={{ height: 14, width: 60, background: 'rgba(0,207,255,0.1)', borderRadius: 6 }} />
            </div>
          ))}
        </div>
      </div>

      {/* Overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(15, 20, 40, 0.55)',
        backdropFilter: 'blur(2px)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}>
        <div className="locked-card" style={{
          background: '#0c0f18', borderRadius: 20,
          padding: '36px 40px', maxWidth: 380, width: '100%',
          textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'rgba(0,207,255,0.1)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
            border: '1px solid rgba(0,207,255,0.2)',
          }}>
            <Lock size={28} color="#00cfff" />
          </div>

          <div style={{ fontWeight: 800, fontSize: 18, color: '#dde4ee', marginBottom: 6 }}>
            Анализ готов
          </div>
          <div style={{ fontSize: 14, color: '#64748b', marginBottom: 24 }}>
            {match.home} — {match.away}
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '12px 16px',
            marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 14, color: '#4a6a8a', fontWeight: 500 }}>Стоимость</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: 16, color: '#d8eeff' }}>
              <Zap size={16} color="#00cfff" fill="#00cfff" />
              {cost} монет
            </div>
          </div>

          {notEnough && (
            <div style={{
              background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)',
              borderRadius: 10, padding: '10px 14px',
              fontSize: 13, color: '#ff7070', marginBottom: 16,
            }}>
              Недостаточно монет. У вас {userCoins}, нужно {cost}.
            </div>
          )}

          <button
            onClick={onConfirm}
            disabled={loading || notEnough}
            style={{
              width: '100%', padding: '14px',
              background: loading || notEnough ? 'rgba(0,207,255,0.2)' : 'linear-gradient(90deg, #00cfff, #7b5ea7)',
              color: loading || notEnough ? 'rgba(255,255,255,0.4)' : '#030b18',
              border: 'none', borderRadius: 12,
              boxShadow: loading || notEnough ? 'none' : '0 4px 20px rgba(0,207,255,0.3)',
              fontWeight: 800, fontSize: 15,
              cursor: loading || notEnough ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
              letterSpacing: 0.3,
            }}
          >
            {loading ? 'Обработка...' : `ПОДТВЕРДИТЬ ОПЛАТУ ${cost} МОНЕТ`}
          </button>

          <div style={{ marginTop: 12, fontSize: 12, color: '#94a3b8' }}>
            Баланс: {userCoins} монет
          </div>
        </div>
      </div>
    </div>
  )
}

function getConfidence(odds) {
  if (!odds) return null
  const favOdds = Math.min(Number(odds.home), Number(odds.away))
  const homeDiff = Math.abs(Number(odds.home) - Number(odds.away))
  if (favOdds <= 1.45) return { label: '🔥 Явный фаворит', bg: 'rgba(249,115,22,0.1)', color: '#fb923c', border: 'rgba(249,115,22,0.3)' }
  if (favOdds <= 1.75) return { label: '⚡ Есть перевес', bg: 'rgba(245,158,11,0.1)', color: '#fbbf24', border: 'rgba(245,158,11,0.3)' }
  if (homeDiff < 0.3) return { label: '⚖️ Равная игра', bg: 'rgba(0,207,255,0.07)', color: '#4a6a8a', border: 'rgba(0,180,255,0.2)' }
  return null
}

function MatchRow({ match, onClick, isLiveTab }) {
  const [hovered, setHovered] = useState(false)
  const odds = match.odds1x2
  const isLive = isLiveTab || match.isLive || match.status === 'LIVE' || match.minute
  const confidence = getConfidence(odds)

  return (
    <div
      className="card match-row"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '16px 20px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 12,
        transition: 'all 0.15s',
        transform: hovered ? 'translateX(4px)' : 'none',
        border: isLive ? '1.5px solid rgba(239,68,68,0.3)' : hovered ? '1.5px solid rgba(0,207,255,0.35)' : '1.5px solid transparent',
        background: isLive ? 'rgba(239,68,68,0.05)' : undefined,
      }}
    >
      {/* ЛЕВАЯ ГРУППА: логотипы + имена — компактная, не растягивается */}
      <div className="match-row-teams" style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '0 1 auto', minWidth: 0 }}>
        <TeamLogo name={match.home} img={match.homeImg} size={32} />
        <div style={{ minWidth: 0, overflow: 'hidden' }}>
          <div style={{
            fontWeight: 700, fontSize: 13, color: '#dde4ee',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {match.home}
            <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 400, margin: '0 4px' }}>vs</span>
            {match.away}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3, flexWrap: 'wrap' }}>
            {match.league && <span style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap' }}>{match.league}</span>}
            {confidence && (
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 6px',
                borderRadius: 8, background: confidence.bg,
                color: confidence.color, border: `1px solid ${confidence.border}`,
                whiteSpace: 'nowrap',
              }}>
                {confidence.label}
              </span>
            )}
          </div>
        </div>
        <TeamLogo name={match.away} img={match.awayImg} size={32} />
      </div>

      {/* Распорка — занимает всё свободное пространство между группами */}
      <div style={{ flex: 1 }} />

      {/* ПРАВАЯ ГРУППА: LIVE-счёт, коэфы, кнопка — прижата к правому краю */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {isLive && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'center' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', animation: 'pulse-ring 1.2s ease-out infinite' }} />
              <span style={{ fontSize: 10, fontWeight: 800, color: '#ef4444' }}>LIVE</span>
            </div>
            {match.score && <div style={{ fontSize: 14, fontWeight: 900, color: '#dde4ee', marginTop: 2 }}>{match.score}</div>}
          </div>
        )}

        {odds && !isLive && (
          <div className="match-row-odds" style={{ display: 'flex', gap: 4 }}>
            {[{ label: '1', val: odds.home }, { label: 'X', val: odds.draw }, { label: '2', val: odds.away }].map(o => (
              <div key={o.label} style={{
                textAlign: 'center', background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '4px 7px', minWidth: 40,
              }}>
                <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>{o.label}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#dde4ee' }}>{o.val}</div>
              </div>
            ))}
          </div>
        )}

        <div className="match-row-btn" style={{
          background: hovered ? 'rgba(0,207,255,0.15)' : 'rgba(0,25,60,0.5)',
          color: hovered ? '#00cfff' : '#4a6a8a',
          border: `1px solid ${hovered ? 'rgba(0,207,255,0.3)' : 'rgba(0,180,255,0.1)'}`,
          borderRadius: 20, padding: '6px 12px',
          fontSize: 13, fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 5,
          transition: 'all 0.15s',
        }}>
          <Zap size={13} /> Анализ
        </div>
      </div>{/* end right group */}
    </div>
  )
}

// Deterministic color from team name
function teamColor(name) {
  const palette = ['#ef4444','#3b82f6','#22c55e','#f59e0b','#8b5cf6','#ec4899','#0ea5e9','#14b8a6','#f97316','#6366f1']
  let hash = 0
  for (let i = 0; i < (name || '').length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  return palette[hash % palette.length]
}

function TeamLogo({ name, img, size = 44 }) {
  const [imgError, setImgError] = useState(false)
  const color = teamColor(name)
  const letter = (name || '?').trim()[0].toUpperCase()

  // Use real image only if explicitly provided (NHL/AllSports logos)
  if (img && !imgError) {
    return (
      <img
        src={img}
        alt={name}
        onError={() => setImgError(true)}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'contain', background: 'rgba(255,255,255,0.06)', flexShrink: 0 }}
      />
    )
  }

  // Badge-style letter avatar — looks intentional, not like a fallback
  const radius = size > 36 ? size * 0.22 : size * 0.28
  return (
    <div style={{
      width: size, height: size, borderRadius: radius,
      background: `linear-gradient(135deg, ${color}cc, ${color}88)`,
      border: `1.5px solid ${color}55`,
      color: 'white', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.42, fontWeight: 900,
      letterSpacing: -0.5,
      boxShadow: `0 2px 8px ${color}33`,
    }}>
      {letter}
    </div>
  )
}

function HockeyMatchRow({ match, onClick }) {
  const [hovered, setHovered] = useState(false)
  const isLive = match.isLive

  return (
    <div
      className="card match-row"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '16px 20px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 12,
        transition: 'all 0.15s',
        transform: hovered ? 'translateX(4px)' : 'none',
        border: isLive ? '1.5px solid rgba(239,68,68,0.3)' : hovered ? '1.5px solid rgba(14,165,233,0.4)' : '1.5px solid transparent',
        background: isLive ? 'rgba(239,68,68,0.05)' : undefined,
      }}
    >
      {/* Левая группа: логотипы + имена */}
      <div className="match-row-teams" style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '0 1 auto', minWidth: 0 }}>
        <TeamLogo name={match.home} img={match.homeImg} size={32} />
        <div style={{ minWidth: 0, overflow: 'hidden' }}>
          <div style={{
            fontWeight: 700, fontSize: 13, color: '#dde4ee',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {match.home}
            <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 400, margin: '0 4px' }}>vs</span>
            {match.away}
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
            {match.league}{match.date ? ` · ${match.date}` : ''}
          </div>
        </div>
        <TeamLogo name={match.away} img={match.awayImg} size={32} />
      </div>

      <div style={{ flex: 1 }} />

      {/* Правая группа: live / коэфы / кнопка */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {isLive && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'center' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', animation: 'pulse-ring 1.2s ease-out infinite' }} />
              <span style={{ fontSize: 10, fontWeight: 800, color: '#ef4444' }}>LIVE</span>
            </div>
            {match.score && <div style={{ fontSize: 14, fontWeight: 900, color: '#dde4ee', marginTop: 2 }}>{match.score}</div>}
          </div>
        )}


        <div className="match-row-btn" style={{
          background: hovered ? 'rgba(14,165,233,0.15)' : 'rgba(0,25,60,0.5)',
          color: hovered ? '#0ea5e9' : '#4a6a8a',
          border: `1px solid ${hovered ? 'rgba(14,165,233,0.3)' : 'rgba(0,180,255,0.1)'}`,
          borderRadius: 20, padding: '6px 12px',
          fontSize: 13, fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 5,
          transition: 'all 0.15s',
        }}>
          <Zap size={13} /> Анализ
        </div>
      </div>
    </div>
  )
}

function HockeyInputForm({ home, onHome, away, onAway, league, onLeague, onAnalyze, cost }) {
  const leagues = ['КХЛ', 'НХЛ', 'МХЛ', 'ВХЛ', 'Другое']
  const canAnalyze = home.trim() && away.trim()

  return (
    <div style={{
      background: 'rgba(0,25,60,0.4)', borderRadius: 16, padding: '28px 28px 24px',
      border: '1.5px solid rgba(0,207,255,0.15)', marginBottom: 24,
      boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'linear-gradient(135deg, #0ea5e9, #00cfff)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 18 }}>🏒</span>
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16, color: '#dde4ee' }}>Анализ хоккейного матча</div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>Введите команды — AI проанализирует на основе своих знаний</div>
        </div>
      </div>

      {/* League selector */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 8, letterSpacing: 0.5 }}>ТУРНИР</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {leagues.map(l => (
            <button key={l} onClick={() => onLeague(l)} style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600,
              border: `1.5px solid ${league === l ? '#00cfff' : 'rgba(0,180,255,0.15)'}`,
              background: league === l ? 'rgba(0,207,255,0.12)' : 'rgba(0,25,60,0.4)',
              color: league === l ? '#00cfff' : '#4a6a8a',
              cursor: 'pointer', transition: 'all 0.15s',
            }}>{l}</button>
          ))}
        </div>
      </div>

      {/* Teams input */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 140 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 6, letterSpacing: 0.5 }}>ХОЗЯЕВА</div>
          <input
            value={home}
            onChange={e => onHome(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && canAnalyze && onAnalyze()}
            placeholder="Например: ЦСКА"
            style={{
              width: '100%', padding: '11px 14px', borderRadius: 10,
              border: '1.5px solid rgba(255,255,255,0.07)', fontSize: 14, outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => e.target.style.borderColor = '#00cfff'}
            onBlur={e => e.target.style.borderColor = 'rgba(0,180,255,0.15)'}
          />
        </div>

        <div style={{ fontSize: 18, fontWeight: 800, color: '#94a3b8', paddingTop: 22, flexShrink: 0 }}>vs</div>

        <div style={{ flex: 1, minWidth: 140 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 6, letterSpacing: 0.5 }}>ГОСТИ</div>
          <input
            value={away}
            onChange={e => onAway(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && canAnalyze && onAnalyze()}
            placeholder="Например: Ак Барс"
            style={{
              width: '100%', padding: '11px 14px', borderRadius: 10,
              border: '1.5px solid rgba(255,255,255,0.07)', fontSize: 14, outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => e.target.style.borderColor = '#00cfff'}
            onBlur={e => e.target.style.borderColor = 'rgba(0,180,255,0.15)'}
          />
        </div>
      </div>

      <button
        onClick={onAnalyze}
        disabled={!canAnalyze}
        style={{
          marginTop: 16, width: '100%', padding: '12px',
          background: canAnalyze ? 'linear-gradient(135deg, #0ea5e9, #00cfff)' : 'rgba(0,25,60,0.4)',
          color: canAnalyze ? '#030b18' : '#4a6a8a',
          border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14,
          cursor: canAnalyze ? 'pointer' : 'not-allowed',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          transition: 'all 0.15s',
        }}
      >
        <Zap size={15} fill={canAnalyze ? 'white' : '#94a3b8'} />
        Анализировать матч — {cost} монет
      </button>

      <div style={{
        marginTop: 14, padding: '10px 14px', background: 'rgba(0,207,255,0.06)',
        borderRadius: 10, border: '1px solid rgba(0,207,255,0.18)',
        fontSize: 12, color: '#57c8ff', lineHeight: 1.5,
      }}>
        💡 AI использует свои знания о командах: форма, статистика голов, вратари, игра в большинстве — без автоматической загрузки данных.
      </div>
    </div>
  )
}

const SPORT_LOADING_META = {
  hockey:     { emoji: '🏒', label: '🏒 AI анализирует матч...', hint: 'Анализируем вратарей, форму, статистику голов и большинство', steps: ['Форма команд и серии', 'Анализ вратарей и голевой статистики', 'Игра в большинстве и меньшинстве', 'Формирование вердикта'] },
  basketball: { emoji: '🏀', label: '🏀 AI анализирует матч...', hint: 'Анализируем очки, форму, позицию в турнирной таблице', steps: ['Форма команд дома/в гостях', 'Статистика очков и пропусков', 'Позиция в конференции', 'Формирование вердикта'] },
  cs2:        { emoji: '🎮', label: '🎮 AI анализирует CS2...', hint: 'Анализируем карты, форму, статистику раундов', steps: ['Форма команд по картам', 'Статистика раундов и рейтинг', 'Факторы карт', 'Формирование вердикта'] },
  dota2:      { emoji: '🎮', label: '🎮 AI анализирует Dota 2...', hint: 'Анализируем пики, форму, последние результаты', steps: ['Форма команд в турнире', 'Статистика последних игр', 'Факторы драфта', 'Формирование вердикта'] },
  lol:        { emoji: '🎮', label: '🎮 AI анализирует LoL...', hint: 'Анализируем пики, форму, статистику карт', steps: ['Форма команд', 'История встреч', 'Метагейм анализ', 'Формирование вердикта'] },
  valorant:   { emoji: '🎮', label: '🎮 AI анализирует Valorant...', hint: 'Анализируем карты, форму, статистику раундов', steps: ['Форма команд по картам', 'Статистика раундов', 'Факторы карт', 'Формирование вердикта'] },
  tennis:     { emoji: '🎾', label: '🎾 AI анализирует теннис...', hint: 'Анализируем форму, покрытие, H2H встречи', steps: ['Форма игроков', 'Покрытие и стиль', 'Очные встречи', 'Формирование вердикта'] },
}

function LoadingAnalysis({ match }) {
  const sport = match.sport || 'football'
  const meta = SPORT_LOADING_META[sport] || { emoji: '⚽', label: 'AI анализирует матч...', hint: 'Изучаем форму команд, травмы, статистику и новости', steps: ['Анализ формы команд', 'Проверка травм и дисквалификаций', 'Сравнение коэффициентов', 'Формирование вердикта'] }
  const isTextOnly = ['hockey','basketball','cs2','dota2','lol','valorant','tennis'].includes(sport)

  return (
    <div className="card" style={{ padding: 48, textAlign: 'center' }}>
      <div className="loading-teams" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 24 }}>
        {isTextOnly
          ? <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontWeight: 800, fontSize: 18, color: '#dde4ee' }}>{match.home}</div>
              <span style={{ fontSize: 20, fontWeight: 800, color: '#dde4ee' }}>{meta.emoji} VS</span>
              <div style={{ fontWeight: 800, fontSize: 18, color: '#dde4ee' }}>{match.away}</div>
            </div>
          : <>
              <TeamLogo name={match.home} img={match.homeImg} />
              <span style={{ fontSize: 20, fontWeight: 800, color: '#dde4ee' }}>VS</span>
              <TeamLogo name={match.away} img={match.awayImg} />
            </>
        }
      </div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#dde4ee', marginBottom: 8 }}>{meta.label}</h2>
      <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>{meta.hint}</p>
      <div className="thinking-dots" style={{ fontSize: 24 }}>
        <span>●</span><span> ●</span><span> ●</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 400, margin: '24px auto 0' }}>
        {meta.steps.map((step, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 8,
            padding: '8px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 8,
            fontSize: 13, color: '#64748b',
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00cfff', flexShrink: 0, marginTop: 4, animation: `blink 1.4s infinite ${i * 0.3}s` }} />
            <span style={{ textAlign: 'left' }}>{step}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Generic sport match list (basketball, esports, tennis, hockey — all from Fonbet, no team images)
function SportMatchList({ matches, loading, emptyIcon, emptyText, onSelect, accentColor }) {
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[1,2,3,4].map(i => (
          <div key={i} className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className="skeleton" style={{ height: 15, flex: 1, maxWidth: 140 }} />
            <div className="skeleton" style={{ height: 15, width: 60 }} />
            <div className="skeleton" style={{ height: 15, flex: 1, maxWidth: 140 }} />
            <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
              {[1,2].map(j => <div key={j} className="skeleton" style={{ width: 44, height: 38, borderRadius: 8 }} />)}
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!matches.length) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>{emptyIcon}</div>
        <p>{emptyText}</p>
      </div>
    )
  }

  // Group by league for better readability
  const grouped = matches.reduce((acc, m) => {
    const key = m.league || 'Другие'
    if (!acc[key]) acc[key] = []
    acc[key].push(m)
    return acc
  }, {})

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {Object.entries(grouped).map(([league, leagueMatches]) => (
        <div key={league}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: '#4a6a8a', letterSpacing: 0.8,
            textTransform: 'uppercase', marginBottom: 8, paddingLeft: 4,
          }}>{league}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {leagueMatches.map(match => (
              <SportMatchRow key={match.id} match={match} onClick={() => onSelect(match)} accentColor={accentColor} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function SportMatchRow({ match, onClick, accentColor }) {
  const [hovered, setHovered] = useState(false)
  const odds = match.odds1x2
  const sportColor = accentColor || { basketball: '#f59e0b', cs2: '#ef4444', dota2: '#8b5cf6', lol: '#3b82f6', valorant: '#ef4444', tennis: '#22c55e', hockey: '#0ea5e9' }[match.sport] || '#00cfff'

  return (
    <div
      className="card match-row"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '14px 18px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 12,
        transition: 'all 0.15s',
        transform: hovered ? 'translateX(4px)' : 'none',
        border: hovered ? `1.5px solid ${sportColor}55` : '1.5px solid transparent',
      }}
    >
      {/* Teams with logos */}
      <div className="match-row-teams" style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '0 1 auto', minWidth: 0 }}>
        <TeamLogo name={match.home} img={match.homeImg || null} size={30} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#dde4ee', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {match.home}
            <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 400, margin: '0 5px' }}>vs</span>
            {match.away}
          </div>
          {match.date && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{match.date}</div>}
        </div>
        <TeamLogo name={match.away} img={match.awayImg || null} size={30} />
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {odds && (
          <div className="match-row-odds" style={{ display: 'flex', gap: 4 }}>
            {[{ label: '1', val: odds.home }, ...(odds.draw ? [{ label: 'X', val: odds.draw }] : []), { label: '2', val: odds.away }].map(o => (
              <div key={o.label} style={{
                textAlign: 'center', background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '4px 7px', minWidth: 38,
              }}>
                <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>{o.label}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#dde4ee' }}>{o.val}</div>
              </div>
            ))}
          </div>
        )}

        <div className="match-row-btn" style={{
          background: hovered ? `${sportColor}22` : 'rgba(0,25,60,0.5)',
          color: hovered ? sportColor : '#4a6a8a',
          border: `1px solid ${hovered ? sportColor + '55' : 'rgba(0,180,255,0.1)'}`,
          borderRadius: 20, padding: '6px 12px',
          fontSize: 13, fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 5,
          transition: 'all 0.15s',
        }}>
          <Zap size={13} /> Анализ
        </div>
      </div>
    </div>
  )
}

// Live match row — red pulse badge + sport label + logos + odds
function LiveMatchRow({ match, onClick, sportColor }) {
  const [hovered, setHovered] = useState(false)
  const odds = match.odds1x2
  const color = sportColor || '#ef4444'
  const SPORT_EMOJI = { football: '⚽', hockey: '🏒', basketball: '🏀', cs2: '🎮', dota2: '🎮', lol: '🎮', valorant: '🎮', tennis: '🎾' }
  const emoji = SPORT_EMOJI[match.sport] || '🔴'

  return (
    <div
      className="card match-row"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '14px 18px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 12,
        transition: 'all 0.15s',
        transform: hovered ? 'translateX(4px)' : 'none',
        border: `1.5px solid ${hovered ? color + '66' : 'rgba(239,68,68,0.2)'}`,
        background: 'rgba(239,68,68,0.03)',
      }}
    >
      {/* LIVE badge */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', animation: 'pulse-ring 1.2s ease-out infinite', flexShrink: 0 }} />
          <span style={{ fontSize: 9, fontWeight: 800, color: '#ef4444', letterSpacing: 0.5 }}>LIVE</span>
        </div>
        <span style={{ fontSize: 11 }}>{emoji}</span>
      </div>

      {/* Teams */}
      <div className="match-row-teams" style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '0 1 auto', minWidth: 0 }}>
        <TeamLogo name={match.home} img={match.homeImg || null} size={30} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#dde4ee', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {match.home}
            <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 400, margin: '0 5px' }}>vs</span>
            {match.away}
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{match.league}</div>
        </div>
        <TeamLogo name={match.away} img={match.awayImg || null} size={30} />
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {match.score && (
          <div style={{ fontSize: 16, fontWeight: 900, color: '#dde4ee', minWidth: 44, textAlign: 'center' }}>
            {match.score}
          </div>
        )}

        {odds && (
          <div className="match-row-odds" style={{ display: 'flex', gap: 4 }}>
            {[{ label: '1', val: odds.home }, ...(odds.draw ? [{ label: 'X', val: odds.draw }] : []), { label: '2', val: odds.away }].map(o => (
              <div key={o.label} style={{
                textAlign: 'center', background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '4px 7px', minWidth: 38,
              }}>
                <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>{o.label}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#dde4ee' }}>{o.val}</div>
              </div>
            ))}
          </div>
        )}

        <div className="match-row-btn" style={{
          background: hovered ? '#ef444422' : 'rgba(0,25,60,0.5)',
          color: hovered ? '#ef4444' : '#4a6a8a',
          border: `1px solid ${hovered ? '#ef444455' : 'rgba(239,68,68,0.15)'}`,
          borderRadius: 20, padding: '6px 12px',
          fontSize: 13, fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 5,
          transition: 'all 0.15s',
        }}>
          <Zap size={13} /> Анализ
        </div>
      </div>
    </div>
  )
}
