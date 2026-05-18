import { useState, useEffect, useRef } from 'react'
import { Search, ArrowLeft, Zap, AlertCircle, Loader, Lock } from 'lucide-react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import AnalysisResult from '../components/AnalysisResult'
import AuthModal from '../components/AuthModal'
import { searchMatches, analyzeMatch, getUpcomingMatches } from '../api/sportsApi'
import { coinsApi } from '../api/authApi'
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

  useEffect(() => {
    getUpcomingMatches(20)
      .then(setMatches)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

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
      pendingResult.current = result   // НЕ в state — не попадает в DOM
      setLocked(true)
    } catch (err) {
      setError(`Ошибка: ${err.message}`)
    } finally {
      setAnalysisLoading(false)
    }
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
        sport: 'football',
        result: pendingResult.current,
      })
      updateCoins(data.coins)
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
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
          <button
            onClick={() => { setSelectedMatch(null); setLocked(false); setRevealed(false); pendingResult.current = null }}
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
            <AnalysisResult match={selectedMatch} analysis={revealedAnalysis} />
          )}
        </div>
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Navbar />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
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

        {loading ? (
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
        )}
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
        <div style={{
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

function MatchRow({ match, onClick }) {
  const [hovered, setHovered] = useState(false)
  const odds = match.odds1x2
  const isLive = match.status === 'LIVE' || match.minute
  const confidence = getConfidence(odds)

  return (
    <div
      className="card match-row"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '16px 20px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        transition: 'all 0.15s',
        transform: hovered ? 'translateX(4px)' : 'none',
        border: isLive ? '1.5px solid rgba(239,68,68,0.3)' : hovered ? '1.5px solid #2563eb' : '1.5px solid transparent',
        background: isLive ? 'rgba(254,242,242,0.5)' : undefined,
      }}
    >
      <div className="match-row-teams" style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
        <TeamLogo name={match.home} img={match.homeImg} size={32} />
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span className="match-row-name" style={{ fontWeight: 700, fontSize: 14, color: '#1a1a2e' }}>{match.home}</span>
            <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>vs</span>
            <span className="match-row-name" style={{ fontWeight: 700, fontSize: 14, color: '#1a1a2e' }}>{match.away}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
            {match.league && <span style={{ fontSize: 11, color: '#94a3b8' }}>{match.league}</span>}
            {confidence && (
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 7px',
                borderRadius: 10, background: confidence.bg,
                color: confidence.color, border: `1px solid ${confidence.border}`,
                whiteSpace: 'nowrap',
              }}>
                {confidence.label}
              </span>
            )}
          </div>
        </div>
        <div style={{ textAlign: 'center', flexShrink: 0, padding: '0 4px', marginLeft: 'auto' }}>
          {isLive ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', animation: 'pulse-ring 1.2s ease-out infinite' }} />
                <span style={{ fontSize: 10, fontWeight: 800, color: '#ef4444' }}>LIVE</span>
              </div>
              {match.score && <div style={{ fontSize: 14, fontWeight: 900, color: '#1a1a2e' }}>{match.score}</div>}
            </div>
          ) : null}
        </div>
        <TeamLogo name={match.away} img={match.awayImg} size={32} />
      </div>

      {odds && (
        <div className="match-row-odds" style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
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
        transition: 'all 0.15s', flexShrink: 0,
      }}>
        <Zap size={13} /> Анализ
      </div>
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

function LoadingAnalysis({ match }) {
  return (
    <div className="card" style={{ padding: 48, textAlign: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 24 }}>
        <TeamLogo name={match.home} img={match.homeImg} />
        <span style={{ fontSize: 20, fontWeight: 800, color: '#1a1a2e' }}>VS</span>
        <TeamLogo name={match.away} img={match.awayImg} />
      </div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a2e', marginBottom: 8 }}>
        AI анализирует матч...
      </h2>
      <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>
        Изучаем форму команд, травмы, статистику и новости
      </p>
      <div className="thinking-dots" style={{ fontSize: 24 }}>
        <span>●</span><span> ●</span><span> ●</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 400, margin: '24px auto 0' }}>
        {['Анализ формы команд', 'Проверка травм и дисквалификаций', 'Сравнение коэффициентов', 'Формирование вердикта'].map((step, i) => (
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
