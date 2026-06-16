import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { TrendingUp, Info, AlertTriangle, Shield, Zap } from 'lucide-react'

const BASE = import.meta.env.VITE_API_URL || 'https://web-production-fefcd.up.railway.app'

export default function SharePage() {
  const { token } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${BASE}/share/${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); return }
        setData(d)
      })
      .catch(() => setError('Не удалось загрузить анализ'))
      .finally(() => setLoading(false))
  }, [token])

  const match = data ? {
    home: data.match_home,
    away: data.match_away,
    league: data.league || '',
    date: new Date(data.created_at).toLocaleDateString('ru-RU'),
  } : null
  const analysis = data ? (data.result?.matches?.[0] || data.result) : null

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#64748b', fontSize: 16 }}>Загрузка анализа...</div>
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#1e1e2e', border: '1px solid #ef4444', borderRadius: 16, padding: '32px 40px', textAlign: 'center', maxWidth: 400 }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🔗</div>
        <div style={{ color: '#ef4444', fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Ссылка недействительна</div>
        <div style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>{error}</div>
        <Link to="/analyze" style={{ display: 'inline-block', background: 'linear-gradient(90deg, #00cfff, #7b5ea7)', color: '#030b18', borderRadius: 10, padding: '10px 24px', fontWeight: 700, textDecoration: 'none', fontSize: 14 }}>
          Создать свой анализ
        </Link>
      </div>
    </div>
  )

  if (!match || !analysis) return null

  const confidence = analysis.confidence || 68
  const circumference = 2 * Math.PI * 36
  const dash = (confidence / 100) * circumference
  const confidenceColor = confidence >= 70 ? '#22c55e' : confidence >= 50 ? '#f59e0b' : '#ef4444'
  const riskColor = { low: '#22c55e', medium: '#f59e0b', high: '#ef4444' }[analysis.risk?.toLowerCase()] || '#f59e0b'
  const riskLabel = { low: 'Низкий', medium: 'Средний', high: 'Высокий' }[analysis.risk?.toLowerCase()] || analysis.risk

  const teamColor = (name) => {
    const colors = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316']
    return colors[(name || '').charCodeAt(0) % colors.length]
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a', fontFamily: 'Outfit, sans-serif' }}>

      {/* ── HEADER ────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(160deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '14px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg, #7b5ea7, #00cfff)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={14} color="white" fill="white" />
          </div>
          <span style={{ color: 'white', fontWeight: 800, fontSize: 16, letterSpacing: '-0.3px' }}>Valorix AI</span>
        </div>
        <Link to="/analyze" style={{
          background: 'linear-gradient(135deg, #00cfff, #7b5ea7)',
          color: '#030b18', borderRadius: 20, padding: '7px 18px',
          fontWeight: 700, textDecoration: 'none', fontSize: 13,
        }}>
          Попробовать →
        </Link>
      </div>

      <div className="share-page-body" style={{ maxWidth: 680, margin: '0 auto', padding: '32px 20px 60px' }}>

        {/* ── MATCH CARD ───────────────────────────────────────── */}
        <div style={{
          background: 'linear-gradient(160deg, #1e1e32 0%, #16213e 100%)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 24, overflow: 'hidden', marginBottom: 16,
        }}>
          {/* League badge */}
          {match.league && (
            <div style={{ padding: '12px 24px 0', display: 'flex', justifyContent: 'center' }}>
              <span style={{
                background: 'rgba(124,58,237,0.2)', color: '#a78bfa',
                border: '1px solid rgba(124,58,237,0.4)',
                borderRadius: 20, padding: '4px 14px', fontSize: 12, fontWeight: 600,
              }}>
                {match.league}
              </span>
            </div>
          )}

          {/* Teams */}
          <div className="share-teams-row" style={{ padding: '28px 32px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Home */}
            <div style={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
              <div className="share-team-avatar" style={{
                width: 64, height: 64, borderRadius: '50%',
                background: `linear-gradient(135deg, ${teamColor(match.home)}, ${teamColor(match.home)}aa)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, fontWeight: 900, color: 'white',
                margin: '0 auto 12px', flexShrink: 0,
                boxShadow: `0 4px 20px ${teamColor(match.home)}44`,
              }}>
                {match.home[0]}
              </div>
              <div className="share-team-name" style={{ color: 'white', fontWeight: 800, fontSize: 17, lineHeight: 1.2, wordBreak: 'break-word' }}>{match.home}</div>
              <div style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>Хозяева</div>
            </div>

            {/* VS */}
            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              <div className="share-vs-circle" style={{
                width: 52, height: 52, borderRadius: '50%',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#94a3b8', fontWeight: 900, fontSize: 14,
                margin: '0 auto 8px',
              }}>VS</div>
              <div style={{ color: '#475569', fontSize: 11 }}>{match.date}</div>
            </div>

            {/* Away */}
            <div style={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
              <div className="share-team-avatar" style={{
                width: 64, height: 64, borderRadius: '50%',
                background: `linear-gradient(135deg, ${teamColor(match.away)}, ${teamColor(match.away)}aa)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, fontWeight: 900, color: 'white',
                margin: '0 auto 12px', flexShrink: 0,
                boxShadow: `0 4px 20px ${teamColor(match.away)}44`,
              }}>
                {match.away[0]}
              </div>
              <div className="share-team-name" style={{ color: 'white', fontWeight: 800, fontSize: 17, lineHeight: 1.2, wordBreak: 'break-word' }}>{match.away}</div>
              <div style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>Гости</div>
            </div>
          </div>

          {/* Verdict banner */}
          <div className="share-verdict-banner" style={{
            margin: '0 20px 20px',
            background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.05))',
            border: '1px solid rgba(34,197,94,0.3)',
            borderRadius: 16, padding: '16px 20px',
          }}>
            <div style={{ color: '#86efac', fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>ВЕРДИКТ AI</div>
            <div style={{ color: '#22c55e', fontWeight: 900, fontSize: 22, marginBottom: 8 }}>{analysis.verdict}</div>
            <div style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.6 }}>{analysis.summary}</div>
          </div>
        </div>

        {/* ── EXTRA BETS ───────────────────────────────────────── */}
        {analysis.extraBets && analysis.extraBets.length > 0 && (
          <div style={{
            background: '#1e1e32', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 20, padding: '24px', marginBottom: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <TrendingUp size={18} color="#a78bfa" />
              <span style={{ color: 'white', fontWeight: 700, fontSize: 16 }}>Дополнительные ставки</span>
              <span style={{
                background: 'rgba(124,58,237,0.2)', color: '#a78bfa',
                border: '1px solid rgba(124,58,237,0.3)',
                borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700,
              }}>{analysis.extraBets.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {analysis.extraBets.map((bet, i) => {
                const isGreen = bet.confidence >= 70
                const isYellow = bet.confidence >= 55 && bet.confidence < 70
                const color = isGreen ? '#22c55e' : isYellow ? '#f59e0b' : '#94a3b8'
                const bg = isGreen ? 'rgba(34,197,94,0.08)' : isYellow ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.03)'
                const border = isGreen ? 'rgba(34,197,94,0.25)' : isYellow ? 'rgba(245,158,11,0.25)' : 'rgba(255,255,255,0.08)'
                const leftBorder = isGreen ? '#22c55e' : isYellow ? '#f59e0b' : '#334155'
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 14,
                    padding: '14px 16px',
                    background: bg,
                    border: `1px solid ${border}`,
                    borderLeft: `3px solid ${leftBorder}`,
                    borderRadius: 12,
                  }}>
                    <div style={{ flexShrink: 0, textAlign: 'center', minWidth: 52 }}>
                      <div style={{ fontSize: 18, fontWeight: 900, color }}>{bet.confidence}%</div>
                      <div style={{ fontSize: 9, color: '#475569', fontWeight: 600, marginTop: 1 }}>уверен.</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'white', marginBottom: 4 }}>{bet.type}</div>
                      <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>{bet.reason}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── STATS ROW ─────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
          {/* Confidence */}
          <div style={{
            background: '#1e1e32', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16, padding: '18px 12px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 12, letterSpacing: 0.5 }}>ДОВЕРИЕ</div>
            <svg width="80" height="80" viewBox="0 0 80 80" style={{ display: 'block', margin: '0 auto' }}>
              <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
              <circle cx="40" cy="40" r="36" fill="none"
                stroke={confidenceColor} strokeWidth="7"
                strokeDasharray={`${dash} ${circumference}`}
                strokeLinecap="round" transform="rotate(-90 40 40)"
              />
              <text x="40" y="44" textAnchor="middle" fontSize="18" fontWeight="900" fill="white">{confidence}</text>
            </svg>
            <div style={{ fontSize: 11, color: '#475569', marginTop: 8 }}>из 100</div>
          </div>

          {/* Risk */}
          <div style={{
            background: '#1e1e32', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16, padding: '18px 12px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 12, letterSpacing: 0.5 }}>РИСК</div>
            <div style={{ fontSize: 36, margin: '8px 0' }}>
              {analysis.risk?.toLowerCase() === 'low' ? '🟢' : analysis.risk?.toLowerCase() === 'high' ? '🔴' : '🟡'}
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: riskColor }}>{riskLabel}</div>
            <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>уровень риска</div>
          </div>

          {/* Value */}
          <div style={{
            background: '#1e1e32', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16, padding: '18px 12px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 12, letterSpacing: 0.5 }}>VALUE</div>
            <div style={{ fontSize: 34, fontWeight: 900, color: (analysis.value || 0) > 0 ? '#22c55e' : '#ef4444', margin: '12px 0 8px' }}>
              {(analysis.value || 0) > 0 ? '+' : ''}{analysis.value || 0}%
            </div>
            <div style={{ fontSize: 11, color: '#475569' }}>
              {(analysis.value || 0) > 5 ? 'Рекомендуем' : (analysis.value || 0) > 0 ? 'Умеренно' : 'Не рекомендуем'}
            </div>
          </div>
        </div>

        {/* ── REASONS ──────────────────────────────────────────── */}
        {analysis.reasons && analysis.reasons.length > 0 && (
          <div style={{
            background: '#1e1e32', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 20, padding: '24px', marginBottom: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <Info size={18} color="#60a5fa" />
              <span style={{ color: 'white', fontWeight: 700, fontSize: 16 }}>Причины прогноза</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {analysis.reasons.map((reason, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '12px 14px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: 10,
                }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: '50%', background: '#3b82f6',
                    marginTop: 6, flexShrink: 0,
                  }} />
                  <span style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.6 }}>{reason}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── FAIR ODDS ────────────────────────────────────────── */}
        {analysis.fairOdds && (
          <div style={{
            background: '#1e1e32', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 20, padding: '20px 24px', marginBottom: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>FAIR ODDS (AI)</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: 'white' }}>{analysis.fairOdds}</div>
            </div>
            {analysis.bookOdds && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>БУКМЕКЕР</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#94a3b8' }}>{analysis.bookOdds}</div>
              </div>
            )}
          </div>
        )}

        {/* ── WARNING ──────────────────────────────────────────── */}
        <div style={{
          background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)',
          borderRadius: 12, padding: '12px 16px',
          display: 'flex', gap: 10, alignItems: 'center', marginBottom: 24,
        }}>
          <AlertTriangle size={15} color="#f59e0b" />
          <span style={{ fontSize: 12, color: '#78716c' }}>
            Анализ носит информационный характер. Играйте ответственно. 18+
          </span>
        </div>

        {/* ── CTA ──────────────────────────────────────────────── */}
        <div className="share-cta" style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(37,99,235,0.2))',
          border: '1px solid rgba(124,58,237,0.3)',
          borderRadius: 20, padding: '28px 32px', textAlign: 'center',
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <Shield size={32} color="#a78bfa" />
          </div>
          <div style={{ color: 'white', fontWeight: 800, fontSize: 20, marginBottom: 8 }}>
            Получи свой AI-анализ
          </div>
          <div style={{ color: '#94a3b8', fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
            Загрузи скриншот матча или выбери из списка — и получи детальный разбор с реальными данными за секунды.
          </div>
          <Link to="/analyze" style={{
            display: 'inline-block',
            background: 'linear-gradient(135deg, #00cfff, #7b5ea7)',
            color: '#030b18', borderRadius: 12,
            padding: '12px 32px', fontWeight: 800, textDecoration: 'none',
            fontSize: 15, boxShadow: '0 4px 20px rgba(0,207,255,0.4)',
          }}>
            Попробовать бесплатно
          </Link>
        </div>
      </div>
    </div>
  )
}
