import { useState, useEffect, useRef } from 'react'
import { Helmet } from 'react-helmet-async'
import { Search, ArrowLeft, Zap, AlertCircle, Loader, Lock } from 'lucide-react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import AnalysisResult from '../components/AnalysisResult'
import AuthModal from '../components/AuthModal'
import { searchMatches, analyzeMatch, analyzeHockeyMatch, getUpcomingMatches, getLiveMatches, getUpcomingHockeyMatches, getUpcomingCS2Matches, getUpcomingDota2Matches } from '../api/sportsApi'
import { coinsApi } from '../api/authApi'
import ExpressCard from '../components/ExpressCard'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const ANALYSIS_COST = 28

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
  const [cs2Matches, setCs2Matches] = useState([])
  const [cs2Loading, setCs2Loading] = useState(false)
  const [dota2Matches, setDota2Matches] = useState([])
  const [dota2Loading, setDota2Loading] = useState(false)
  const [showHockeyForm, setShowHockeyForm] = useState(false)
  const [hockeyHome, setHockeyHome] = useState('')
  const [hockeyAway, setHockeyAway] = useState('')
  const [hockeyLeague, setHockeyLeague] = useState('КХЛ')

  const [liveFilter, setLiveFilter] = useState('football')

  useEffect(() => {
    getUpcomingMatches(20)
      .then(setMatches)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (activeTab !== 'live') return
    let cancelled = false
    const fetch_ = () => getLiveMatches().then(m => { if (!cancelled) setLiveMatches(m) }).catch(() => {})
    fetch_()
    const interval = setInterval(fetch_, 2 * 60 * 1000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [activeTab])

  useEffect(() => {
    if (activeTab !== 'hockey' || hockeyMatches.length > 0) return
    setHockeyLoading(true)
    getUpcomingHockeyMatches()
      .then(m => { setHockeyMatches(m); if (m.length === 0) setShowHockeyForm(true) })
      .catch(() => setShowHockeyForm(true))
      .finally(() => setHockeyLoading(false))
  }, [activeTab])

  useEffect(() => {
    if (activeTab !== 'cs2' || cs2Matches.length > 0) return
    setCs2Loading(true)
    getUpcomingCS2Matches()
      .then(setCs2Matches)
      .catch(() => {})
      .finally(() => setCs2Loading(false))
  }, [activeTab])

  useEffect(() => {
    if (activeTab !== 'dota2' || dota2Matches.length > 0) return
    setDota2Loading(true)
    getUpcomingDota2Matches()
      .then(setDota2Matches)
      .catch(() => {})
      .finally(() => setDota2Loading(false))
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
      const result = await analyzeMatch(match)
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
      <Helmet>
        <title>AI анализ матча — Valorix AI</title>
        <meta name="description" content="Выбери матч и получи AI-прогноз за 15 секунд. Футбол, хоккей, CS2, Dota 2. Анализ формы команд, травм, коэффициентов и value-ставок." />
        <link rel="canonical" href="https://valorix.ru/analyze" />
      </Helmet>
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
            { id: 'hockey',   label: '🏒 Хоккей' },
            { id: 'cs2',      label: '🔫 CS2' },
            { id: 'dota2',    label: '🎮 Dota 2' },
            { id: 'live',     label: '🔴 Лайв' },
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                  {hockeyMatches.map(match => (
                    <HockeyMatchRow key={match.id} match={match} onClick={() => handleSelectMatch(match)} />
                  ))}
                </div>
                <button
                  onClick={() => setShowHockeyForm(f => !f)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: 'none', border: '1.5px dashed rgba(0,180,255,0.2)',
                    borderRadius: 10, padding: '10px 16px', cursor: 'pointer',
                    fontSize: 13, fontWeight: 600, color: '#4a6a8a',
                    marginBottom: 16, width: '100%',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#00cfff'; e.currentTarget.style.color = '#00cfff' }}
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

        {(activeTab === 'cs2' || activeTab === 'dota2') && (() => {
          const esportsMatches = activeTab === 'cs2' ? cs2Matches : dota2Matches
          const esportsLoading = activeTab === 'cs2' ? cs2Loading : dota2Loading
          const label = activeTab === 'cs2' ? 'CS2' : 'Dota 2'
          return esportsLoading ? (
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
          ) : esportsMatches.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {esportsMatches.map(match => (
                <MatchRow key={match.id} match={match} onClick={() => handleSelectMatch(match)} />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>{activeTab === 'cs2' ? '🔫' : '🎮'}</div>
              <p>Нет доступных матчей {label}. Попробуйте позже.</p>
            </div>
          )
        })()}

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
          const SPORT_META = {
            football: { label: '⚽ Футбол', emoji: '⚽' },
            hockey:   { label: '🏒 Хоккей', emoji: '🏒' },
            cs2:      { label: '🔫 CS2',     emoji: '🔫' },
            dota2:    { label: '🎮 Dota 2',  emoji: '🎮' },
          }
          const ALLOWED = new Set(['football', 'hockey', 'cs2', 'dota2'])

          const allLive = liveMatches.filter(m => ALLOWED.has(m.sport))
          const countFor = id => id === 'all' ? allLive.length : allLive.filter(m => m.sport === id).length
          const filtered_ = liveFilter === 'all' ? allLive : allLive.filter(m => m.sport === liveFilter)
          const sportsInLive = ['all', ...Object.keys(SPORT_META).filter(s => allLive.some(m => m.sport === s))]

          return (
            <>
              <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
                {sportsInLive.map(id => {
                  const cnt = countFor(id)
                  const label = id === 'all' ? `🌐 Все` : (SPORT_META[id]?.label || id)
                  const isActive = liveFilter === id
                  return (
                    <button key={id} onClick={() => setLiveFilter(id)} style={{
                      padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                      border: `1.5px solid ${isActive ? '#ef4444' : 'rgba(0,180,255,0.15)'}`,
                      background: isActive ? 'rgba(239,68,68,0.12)' : 'rgba(0,25,60,0.4)',
                      color: isActive ? '#ef4444' : '#4a6a8a',
                      cursor: 'pointer', transition: 'all 0.15s',
                      display: 'flex', alignItems: 'center', gap: 5,
                    }}>
                      {label}
                      <span style={{
                        background: isActive ? '#ef4444' : 'rgba(0,180,255,0.15)',
                        color: isActive ? '#fff' : '#4a6a8a',
                        borderRadius: 10, padding: '1px 6px', fontSize: 10, fontWeight: 800,
                      }}>{cnt}</span>
                    </button>
                  )
                })}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filtered_.length > 0
                  ? filtered_.map(match => (
                      <MatchRow
                        key={match.id}
                        match={{ ...match, home: `${SPORT_META[match.sport]?.emoji || '🔴'} ${match.home}`.trim() }}
                        onClick={() => handleSelectMatch(match)}
                        isLiveTab
                      />
                    ))
                  : (
                    <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8' }}>
                      <div style={{ fontSize: 40, marginBottom: 12 }}>🔴</div>
                      <p>Нет лайв матчей</p>
                    </div>
                  )
                }
              </div>
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

// Country name → ISO 2-letter code for flagcdn.com
const COUNTRY_FLAGS = {
  // Европа
  'россия':'ru','германия':'de','франция':'fr','испания':'es','англия':'gb-eng',
  'италия':'it','португалия':'pt','нидерланды':'nl','бельгия':'be','хорватия':'hr',
  'дания':'dk','швеция':'se','норвегия':'no','швейцария':'ch','австрия':'at',
  'польша':'pl','чехия':'cz','сербия':'rs','греция':'gr','турция':'tr',
  'украина':'ua','румыния':'ro','венгрия':'hu','словакия':'sk','финляндия':'fi',
  'шотландия':'gb-sct','уэльс':'gb-wls','ирландия':'ie','северная ирландия':'gb-nir',
  'словения':'si','кипр':'cy','андорра':'ad','лихтенштейн':'li','мальта':'mt',
  'беларусь':'by','молдова':'md','болгария':'bg','черногория':'me','босния':'ba',
  'босния и герцеговина':'ba','северная македония':'mk','македония':'mk',
  'косово':'xk','латвия':'lv','литва':'lt','эстония':'ee','исландия':'is',
  'фарерские острова':'fo','люксембург':'lu','армения':'am','азербайджан':'az',
  'грузия':'ge','гибралтар':'gi','сан-марино':'sm',
  // Америка
  'бразилия':'br','аргентина':'ar','уругвай':'uy','чили':'cl','колумбия':'co',
  'мексика':'mx','сша':'us','канада':'ca','венесуэла':'ve','эквадор':'ec',
  'перу':'pe','боливия':'bo','парагвай':'py','коста-рика':'cr','сальвадор':'sv',
  'гондурас':'hn','куба':'cu','ямайка':'jm','гаити':'ht','панама':'pa',
  'доминиканская республика':'do','гватемала':'gt','никарагуа':'ni',
  'тринидад и тобаго':'tt','тринидад':'tt','барбадос':'bb','белиз':'bz',
  // Азия
  'япония':'jp','южная корея':'kr','китай':'cn','австралия':'au','иран':'ir',
  'саудовская аравия':'sa','катар':'qa','израиль':'il','индия':'in','таиланд':'th',
  'индонезия':'id','вьетнам':'vn','малайзия':'my','сингапур':'sg','мьянма':'mm',
  'камбоджа':'kh','лаос':'la','филиппины':'ph','бруней':'bn','тимор-лесте':'tl',
  'пакистан':'pk','бангладеш':'bd','шри-ланка':'lk','непал':'np','мальдивы':'mv',
  'бутан':'bt','монголия':'mn','кыргызстан':'kg','узбекистан':'uz','туркменистан':'tm',
  'таджикистан':'tj','казахстан':'kz','афганистан':'af','ирак':'iq','сирия':'sy',
  'иордания':'jo','ливан':'lb','кувейт':'kw','оман':'om','йемен':'ye','бахрейн':'bh',
  'ОАЭ':'ae','оаэ':'ae','объединённые арабские эмираты':'ae',
  'гуам':'gu','северные марианские острова':'mp',
  // Африка
  'египет':'eg','марокко':'ma','сенегал':'sn','нигерия':'ng','камерун':'cm',
  'гана':'gh','алжир':'dz','тунис':'tn','кот-д\'ивуар':'ci','конго':'cg',
  'др конго':'cd','кения':'ke','эфиопия':'et','танзания':'tz','уганда':'ug',
  'мали':'ml','буркина-фасо':'bf','гвинея':'gn','экваториальная гвинея':'gq',
  'южная африка':'za','зимбабве':'zw','замбия':'zm','мозамбик':'mz',
  'ангола':'ao','руанда':'rw','бурунди':'bi','лесото':'ls','свазиленд':'sz',
  'мадагаскар':'mg','намибия':'na','ботсвана':'bw','мавритания':'mr',
  'нигер':'ne','чад':'td','судан':'sd','ливия':'ly','сомали':'so',
  'либерия':'lr','сьерра-леоне':'sl','гамбия':'gm','гвинея-бисау':'gw',
  'кабо-верде':'cv','сан-томе и принсипи':'st','джибути':'dj','эритрея':'er',
  'бенин':'bj','того':'tg','габон':'ga','коморы':'km','маврикий':'mu',
}

function getFlagUrl(name, size) {
  // Strip age group suffixes: U21, U19, U17, etc. and trim
  const clean = (name || '').replace(/\s+u\d{2}$/i, '').toLowerCase().trim()
  const code = COUNTRY_FLAGS[clean]
  if (!code) return null
  return `https://flagcdn.com/w${size * 2}/${code}.png`
}

function TeamLogo({ name, img, size = 44 }) {
  const [imgError, setImgError] = useState(false)
  const [flagError, setFlagError] = useState(false)
  const colors = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899']
  const color = colors[(name || '').charCodeAt(0) % colors.length]
  const flagUrl = getFlagUrl(name, size)

  if (img && !imgError) {
    return (
      <img src={img} alt={name} onError={() => setImgError(true)}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'contain', background: 'rgba(255,255,255,0.04)' }} />
    )
  }
  if (flagUrl && !flagError) {
    return (
      <img src={flagUrl} alt={name} onError={() => setFlagError(true)}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', background: 'rgba(255,255,255,0.04)' }} />
    )
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: color, color: 'white', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.36, fontWeight: 800,
    }}>
      {name[0]}
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

        {match.odds1x2 && !isLive && (
          <div className="match-row-odds" style={{ display: 'flex', gap: 4 }}>
            {[{ label: '1', val: match.odds1x2.home }, { label: 'X', val: match.odds1x2.draw }, { label: '2', val: match.odds1x2.away }].map(o => (
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

function LoadingAnalysis({ match }) {
  return (
    <div className="card" style={{ padding: 48, textAlign: 'center' }}>
      <div className="loading-teams" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 24 }}>
        {match.sport === 'hockey'
          ? <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontWeight: 800, fontSize: 18, color: '#dde4ee' }}>{match.home}</div>
              <span style={{ fontSize: 20, fontWeight: 800, color: '#dde4ee' }}>🏒 VS</span>
              <div style={{ fontWeight: 800, fontSize: 18, color: '#dde4ee' }}>{match.away}</div>
            </div>
          : <>
              <TeamLogo name={match.home} img={match.homeImg} />
              <span style={{ fontSize: 20, fontWeight: 800, color: '#dde4ee' }}>VS</span>
              <TeamLogo name={match.away} img={match.awayImg} />
            </>
        }
      </div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#dde4ee', marginBottom: 8 }}>
        {match.sport === 'hockey' ? '🏒 AI анализирует матч...' : 'AI анализирует матч...'}
      </h2>
      <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>
        {match.sport === 'hockey'
          ? 'Анализируем вратарей, форму, статистику голов и большинство'
          : 'Изучаем форму команд, травмы, статистику и новости'}
      </p>
      <div className="thinking-dots" style={{ fontSize: 24 }}>
        <span>●</span><span> ●</span><span> ●</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 400, margin: '24px auto 0' }}>
        {(match.sport === 'hockey'
          ? ['Форма команд и серии', 'Анализ вратарей и голевой статистики', 'Игра в большинстве и меньшинстве', 'Формирование вердикта']
          : ['Анализ формы команд', 'Проверка травм и дисквалификаций', 'Сравнение коэффициентов', 'Формирование вердикта']
        ).map((step, i) => (
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
