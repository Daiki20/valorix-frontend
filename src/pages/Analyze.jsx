import { useState, useEffect, useRef } from 'react'
import { Search, ArrowLeft, Zap, AlertCircle, Loader, Lock } from 'lucide-react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import AnalysisResult from '../components/AnalysisResult'
import AuthModal from '../components/AuthModal'
import { searchMatches, analyzeMatch, analyzeHockeyMatch, getUpcomingMatches, getLiveMatches, getUpcomingHockeyMatches } from '../api/sportsApi'
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
      const isHockey = match.sport === 'hockey'
      const result = isHockey ? await analyzeHockeyMatch(match) : await analyzeMatch(match)
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
      <div style={{ minHeight: '100vh', background: '#f0f2f5' }}>
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
              background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12,
              padding: '16px 20px', display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 16,
            }}>
              <AlertCircle size={20} color="#ef4444" />
              <div>
                <div style={{ fontWeight: 600, color: '#dc2626', marginBottom: 4 }}>Ошибка</div>
                <div style={{ fontSize: 13, color: '#64748b' }}>{error}</div>
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
    <div style={{ minHeight: '100vh', background: '#f0f2f5' }}>
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
          <h1 style={{ fontSize: 32, fontWeight: 900, color: '#1a1a2e', letterSpacing: -0.5, marginBottom: 8 }}>
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
            { id: 'live', label: '🔴 Лайв' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              padding: '8px 20px', borderRadius: 10, fontWeight: 700, fontSize: 14,
              border: 'none', cursor: 'pointer',
              background: activeTab === tab.id ? '#2563eb' : 'white',
              color: activeTab === tab.id ? 'white' : '#64748b',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
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
                borderRadius: 12, border: '1.5px solid #e2e8f0',
                fontSize: 15, background: 'white', outline: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
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
                    background: 'none', border: '1.5px dashed #cbd5e1',
                    borderRadius: 10, padding: '10px 16px', cursor: 'pointer',
                    fontSize: 13, fontWeight: 600, color: '#64748b',
                    marginBottom: 16, width: '100%',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.color = '#2563eb' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#64748b' }}
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
          const LIVE_TABS = [
            { id: 'football', label: '⚽ Футбол' },
            { id: 'hockey',   label: '🏒 Хоккей' },
          ]
          const liveHockey = hockeyMatches.filter(m => m.isLive)

          const countFor = id => {
            if (id === 'football') return liveMatches.length
            if (id === 'hockey')   return liveHockey.length
            return 0
          }

          const currentMatches = liveFilter === 'hockey' ? liveHockey : liveMatches

          return (
            <>
              {/* Live sport sub-tabs */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
                {LIVE_TABS.map(t => {
                  const cnt = countFor(t.id)
                  const isActive = liveFilter === t.id
                  const accentColor = t.id === 'hockey' ? '#0ea5e9' : '#ef4444'
                  return (
                    <button key={t.id} onClick={() => setLiveFilter(t.id)} style={{
                      padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                      border: `1.5px solid ${isActive ? accentColor : '#e2e8f0'}`,
                      background: isActive ? (t.id === 'hockey' ? '#f0f9ff' : '#fff1f2') : 'white',
                      color: isActive ? accentColor : '#64748b',
                      cursor: 'pointer', transition: 'all 0.15s',
                      display: 'flex', alignItems: 'center', gap: 5,
                    }}>
                      {t.label}
                      {cnt > 0 && (
                        <span style={{
                          background: isActive ? accentColor : '#e2e8f0',
                          color: isActive ? 'white' : '#64748b',
                          borderRadius: 10, padding: '1px 6px', fontSize: 10, fontWeight: 800,
                        }}>{cnt}</span>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Live match list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {currentMatches.length > 0
                  ? currentMatches.map(match =>
                      liveFilter === 'hockey'
                        ? <HockeyMatchRow key={match.id} match={match} onClick={() => handleSelectMatch(match)} />
                        : <MatchRow key={match.id} match={match} onClick={() => handleSelectMatch(match)} isLiveTab />
                    )
                  : (
                    <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8' }}>
                      <div style={{ fontSize: 40, marginBottom: 12 }}>🔴</div>
                      <p>Нет лайв матчей{liveFilter !== 'football' ? ` по ${LIVE_TABS.find(t => t.id === liveFilter)?.label || liveFilter}` : ''}</p>
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
              <div style={{ height: 20, width: 160, background: '#e2e8f0', borderRadius: 6, marginBottom: 8 }} />
              <div style={{ height: 14, width: 100, background: '#f1f5f9', borderRadius: 6 }} />
            </div>
            <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'conic-gradient(#2563eb 0% 72%, #e2e8f0 72%)' }} />
          </div>
          {[1,2,3].map(i => (
            <div key={i} style={{ height: 16, background: '#f1f5f9', borderRadius: 6, marginBottom: 10, width: `${70 + i * 8}%` }} />
          ))}
        </div>
        <div className="card" style={{ padding: 24 }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <div style={{ height: 14, flex: 1, background: '#f1f5f9', borderRadius: 6 }} />
              <div style={{ height: 14, width: 60, background: '#e2e8f0', borderRadius: 6 }} />
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
          background: 'white', borderRadius: 20,
          padding: '36px 40px', maxWidth: 380, width: '100%',
          textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: '#eff6ff', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <Lock size={28} color="#2563eb" />
          </div>

          <div style={{ fontWeight: 800, fontSize: 18, color: '#1a1a2e', marginBottom: 6 }}>
            Анализ готов
          </div>
          <div style={{ fontSize: 14, color: '#64748b', marginBottom: 24 }}>
            {match.home} — {match.away}
          </div>

          <div style={{
            background: '#f8fafc', borderRadius: 12, padding: '12px 16px',
            marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>Стоимость</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: 16, color: '#1a1a2e' }}>
              <Zap size={16} color="#2563eb" fill="#2563eb" />
              {cost} монет
            </div>
          </div>

          {notEnough && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: 10, padding: '10px 14px',
              fontSize: 13, color: '#dc2626', marginBottom: 16,
            }}>
              Недостаточно монет. У вас {userCoins}, нужно {cost}.
            </div>
          )}

          <button
            onClick={onConfirm}
            disabled={loading || notEnough}
            style={{
              width: '100%', padding: '14px',
              background: loading || notEnough ? '#94a3b8' : '#2563eb',
              color: 'white', border: 'none', borderRadius: 12,
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
  if (favOdds <= 1.45) return { label: '🔥 Явный фаворит', bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' }
  if (favOdds <= 1.75) return { label: '⚡ Есть перевес', bg: '#fefce8', color: '#a16207', border: '#fde68a' }
  if (homeDiff < 0.3) return { label: '⚖️ Равная игра', bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' }
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
        border: isLive ? '1.5px solid rgba(239,68,68,0.3)' : hovered ? '1.5px solid #2563eb' : '1.5px solid transparent',
        background: isLive ? 'rgba(254,242,242,0.5)' : undefined,
      }}
    >
      {/* ЛЕВАЯ ГРУППА: логотипы + имена — компактная, не растягивается */}
      <div className="match-row-teams" style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '0 1 auto', minWidth: 0 }}>
        <TeamLogo name={match.home} img={match.homeImg} size={32} />
        <div style={{ minWidth: 0, overflow: 'hidden' }}>
          <div style={{
            fontWeight: 700, fontSize: 13, color: '#1a1a2e',
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
            {match.score && <div style={{ fontSize: 14, fontWeight: 900, color: '#1a1a2e', marginTop: 2 }}>{match.score}</div>}
          </div>
        )}

        {odds && !isLive && (
          <div className="match-row-odds" style={{ display: 'flex', gap: 4 }}>
            {[{ label: '1', val: odds.home }, { label: 'X', val: odds.draw }, { label: '2', val: odds.away }].map(o => (
              <div key={o.label} style={{
                textAlign: 'center', background: '#f8fafc',
                border: '1px solid #e2e8f0', borderRadius: 8, padding: '4px 7px', minWidth: 40,
              }}>
                <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>{o.label}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a2e' }}>{o.val}</div>
              </div>
            ))}
          </div>
        )}

        <div className="match-row-btn" style={{
          background: hovered ? '#1a1a2e' : '#f1f5f9',
          color: hovered ? 'white' : '#64748b',
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

function TeamLogo({ name, img, size = 44 }) {
  const [imgError, setImgError] = useState(false)
  const colors = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899']
  const color = colors[name.charCodeAt(0) % colors.length]
  if (img && !imgError) {
    return (
      <img src={img} alt={name} onError={() => setImgError(true)}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'contain', background: '#f8fafc' }} />
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
  const odds = match.odds1x2
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
        border: isLive ? '1.5px solid rgba(239,68,68,0.3)' : hovered ? '1.5px solid #0ea5e9' : '1.5px solid transparent',
        background: isLive ? 'rgba(254,242,242,0.5)' : undefined,
      }}
    >
      {/* Левая группа: логотипы + имена */}
      <div className="match-row-teams" style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '0 1 auto', minWidth: 0 }}>
        <TeamLogo name={match.home} img={match.homeImg} size={32} />
        <div style={{ minWidth: 0, overflow: 'hidden' }}>
          <div style={{
            fontWeight: 700, fontSize: 13, color: '#1a1a2e',
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
            {match.score && <div style={{ fontSize: 14, fontWeight: 900, color: '#1a1a2e', marginTop: 2 }}>{match.score}</div>}
          </div>
        )}

        {odds && !isLive && (
          <div className="match-row-odds" style={{ display: 'flex', gap: 4 }}>
            {[{ label: '1', val: odds.home }, { label: '2', val: odds.away }].map(o => (
              <div key={o.label} style={{
                textAlign: 'center', background: '#f0f9ff',
                border: '1px solid #bae6fd', borderRadius: 8, padding: '4px 7px', minWidth: 40,
              }}>
                <div style={{ fontSize: 10, color: '#0369a1', fontWeight: 600 }}>{o.label}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a2e' }}>{o.val ?? '—'}</div>
              </div>
            ))}
          </div>
        )}

        <div className="match-row-btn" style={{
          background: hovered ? '#0ea5e9' : '#f0f9ff',
          color: hovered ? 'white' : '#0369a1',
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
      background: 'white', borderRadius: 16, padding: '28px 28px 24px',
      border: '1.5px solid #bfdbfe', marginBottom: 24,
      boxShadow: '0 4px 16px rgba(37,99,235,0.08)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'linear-gradient(135deg, #0ea5e9, #2563eb)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 18 }}>🏒</span>
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16, color: '#1a1a2e' }}>Анализ хоккейного матча</div>
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
              border: `1.5px solid ${league === l ? '#2563eb' : '#e2e8f0'}`,
              background: league === l ? '#eff6ff' : 'white',
              color: league === l ? '#2563eb' : '#64748b',
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
              border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => e.target.style.borderColor = '#2563eb'}
            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
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
              border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => e.target.style.borderColor = '#2563eb'}
            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
          />
        </div>
      </div>

      <button
        onClick={onAnalyze}
        disabled={!canAnalyze}
        style={{
          marginTop: 16, width: '100%', padding: '12px',
          background: canAnalyze ? 'linear-gradient(135deg, #0ea5e9, #2563eb)' : '#e2e8f0',
          color: canAnalyze ? 'white' : '#94a3b8',
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
        marginTop: 14, padding: '10px 14px', background: '#f0f9ff',
        borderRadius: 10, border: '1px solid #bae6fd',
        fontSize: 12, color: '#0369a1', lineHeight: 1.5,
      }}>
        💡 AI использует свои знания о командах: форма, статистика голов, вратари, игра в большинстве — без автоматической загрузки данных.
      </div>
    </div>
  )
}

function LoadingAnalysis({ match }) {
  return (
    <div className="card" style={{ padding: 48, textAlign: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 24 }}>
        {match.sport === 'hockey'
          ? <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontWeight: 800, fontSize: 18, color: '#1a1a2e' }}>{match.home}</div>
              <span style={{ fontSize: 20, fontWeight: 800, color: '#1a1a2e' }}>🏒 VS</span>
              <div style={{ fontWeight: 800, fontSize: 18, color: '#1a1a2e' }}>{match.away}</div>
            </div>
          : <>
              <TeamLogo name={match.home} img={match.homeImg} />
              <span style={{ fontSize: 20, fontWeight: 800, color: '#1a1a2e' }}>VS</span>
              <TeamLogo name={match.away} img={match.awayImg} />
            </>
        }
      </div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a2e', marginBottom: 8 }}>
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
            padding: '8px 14px', background: '#f8fafc', borderRadius: 8,
            fontSize: 13, color: '#64748b',
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563eb', flexShrink: 0, marginTop: 4, animation: `blink 1.4s infinite ${i * 0.3}s` }} />
            <span style={{ textAlign: 'left' }}>{step}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
