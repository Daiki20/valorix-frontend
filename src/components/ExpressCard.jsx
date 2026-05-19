import { useState, useEffect } from 'react'
import { Zap, Lock, Star, TrendingUp, ChevronRight, Flame, Sparkles, X, Brain } from 'lucide-react'
import { expressApi } from '../api/authApi'
import { useAuth } from '../context/AuthContext'

const CONFIG = {
  standard: {
    cost: 39,
    label: 'Экспресс дня',
    sublabel: 'Надёжный',
    icon: <Star size={14} color="white" fill="white" />,
    gradient: 'linear-gradient(135deg, #2563eb, #7c3aed)',
    accentLine: 'linear-gradient(90deg, #2563eb, #7c3aed)',
    border: '#e0e7ff',
    bg: 'linear-gradient(135deg, #fafbff 0%, #f0f4ff 100%)',
    numberBg: 'linear-gradient(135deg, #eff6ff, #e0e7ff)',
    numberColor: '#2563eb',
    oddsColor: '#2563eb',
  },
  high: {
    cost: 49,
    label: 'Экспресс дня',
    sublabel: 'Высокодоходный',
    icon: <Flame size={14} color="white" fill="white" />,
    gradient: 'linear-gradient(135deg, #d97706, #dc2626)',
    accentLine: 'linear-gradient(90deg, #f59e0b, #dc2626)',
    border: '#fde68a',
    bg: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
    numberBg: 'linear-gradient(135deg, #fef3c7, #fde68a)',
    numberColor: '#d97706',
    oddsColor: '#d97706',
  },
}

const RESPONSIVE_STYLES = `
  .express-grid {
    display: flex;
    flex-direction: row;
    gap: 16px;
    margin-bottom: 24px;
  }
  .express-col {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .express-pick-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .express-pick-right {
    flex-shrink: 0;
    text-align: right;
    max-width: 90px;
    word-break: break-word;
  }
  .express-team-name {
    font-weight: 700;
    font-size: 13px;
    color: #1a1a2e;
    line-height: 1.3;
    word-break: break-word;
  }
  .express-league {
    font-size: 11px;
    color: #94a3b8;
    margin-top: 2px;
    word-break: break-word;
  }
  .express-footer {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }
  .express-summary {
    font-size: 12px;
    color: #64748b;
    max-width: 180px;
    text-align: right;
    word-break: break-word;
  }
  @media (max-width: 640px) {
    .express-grid {
      flex-direction: column;
      gap: 24px;
    }
    .express-col {
      width: 100%;
    }
    .express-summary {
      max-width: 100%;
      text-align: left;
    }
    .express-footer {
      flex-direction: column;
      gap: 6px;
    }
    .express-pick-right {
      max-width: 80px;
    }
    .express-team-name {
      font-size: 12px;
    }
  }
`

function ExpressLabel({ text, color1, color2, border, bg }) {
  const id = text.replace(/[\s·]/g, '')
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${border})` }} />
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: bg, border: `1.5px dashed ${border}`,
        borderRadius: 20, padding: '5px 14px',
        fontSize: 11, fontWeight: 700, letterSpacing: 0.8,
        animation: `labelPulse_${id} 2s ease-in-out infinite`,
        whiteSpace: 'nowrap',
      }}>
        <style>{`
          @keyframes labelPulse_${id} {
            0%, 100% { color: ${color1}; border-color: ${border}; }
            50% { color: ${color2}; border-color: ${color2}40; }
          }
        `}</style>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block', flexShrink: 0 }} />
        {text}
      </div>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${border}, transparent)` }} />
    </div>
  )
}

function SummaryModal({ summary, cfg, onClose }) {
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(10,12,30,0.65)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, animation: 'fadeInUp 0.2s ease',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'white', borderRadius: 24, maxWidth: 480, width: '100%',
        boxShadow: '0 32px 80px rgba(0,0,0,0.25)',
        overflow: 'hidden', position: 'relative',
      }}>
        {/* Top gradient bar */}
        <div style={{ height: 4, background: cfg.accentLine }} />

        <div style={{ padding: '28px 28px 24px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 14,
                background: cfg.gradient,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Brain size={22} color="white" />
              </div>
              <div>
                <div style={{ fontWeight: 900, fontSize: 16, color: '#1a1a2e' }}>Логика AI</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Почему выбраны эти ставки</div>
              </div>
            </div>
            <button onClick={onClose} style={{
              background: '#f1f5f9', border: 'none', borderRadius: 10,
              width: 32, height: 32, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <X size={16} color="#64748b" />
            </button>
          </div>

          {/* Content */}
          <div style={{
            background: 'linear-gradient(135deg, #f8faff, #f0f4ff)',
            border: '1px solid #e0e7ff',
            borderRadius: 14, padding: '18px 20px',
          }}>
            <div style={{ fontSize: 14, color: '#1e293b', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
              {summary}
            </div>
          </div>

          <div style={{
            marginTop: 16, display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 12, color: '#94a3b8',
          }}>
            <Sparkles size={13} color="#94a3b8" />
            Анализ сгенерирован AI на основе статистики
          </div>
        </div>
      </div>
    </div>
  )
}

function SingleExpressCard({ data, type, onAuthRequired, onUpdate }) {
  const { user, updateCoins } = useAuth()
  const [buying, setBuying] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const cfg = CONFIG[type]

  if (!data) return (
    <div className="card" style={{ padding: '20px 24px' }}>
      <div className="skeleton" style={{ height: 18, width: 160, marginBottom: 16 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[1, 2].map(i => <div key={i} className="skeleton" style={{ height: 52, borderRadius: 10 }} />)}
      </div>
    </div>
  )

  const isPurchased = data.purchased

  async function handleBuy() {
    if (!user) { onAuthRequired?.(); return }
    setBuying(true)
    try {
      const res = await expressApi.purchase(type)
      if (res.error) { alert(res.error); return }
      onUpdate(type, res)
      if (res.coins !== undefined) updateCoins(res.coins)
    } catch (err) {
      alert(err.message)
    } finally {
      setBuying(false)
    }
  }

  return (
    <div className="card" style={{
      padding: '20px 20px', flex: 1, minWidth: 0,
      border: `1.5px solid ${cfg.border}`,
      background: cfg.bg,
      position: 'relative', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      boxSizing: 'border-box',
    }}>
      {/* accent line */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: cfg.accentLine }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
            background: cfg.gradient,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {cfg.icon}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 900, fontSize: 14, color: '#1a1a2e', letterSpacing: -0.3 }}>
              {cfg.label}
            </div>
            <div style={{ fontSize: 11, color: cfg.numberColor, fontWeight: 700 }}>{cfg.sublabel}</div>
          </div>
        </div>
        {isPurchased ? (
          <div style={{
            background: '#f0fdf4', color: '#16a34a', fontSize: 12,
            fontWeight: 700, padding: '3px 10px', borderRadius: 20, border: '1px solid #bbf7d0',
            display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
          }}>
            <TrendingUp size={11} /> Открыт
          </div>
        ) : (
          <div style={{ fontWeight: 900, fontSize: 26, color: cfg.oddsColor, letterSpacing: -1, flexShrink: 0 }}>
            ×{data.total_odds?.toFixed(2) || '—'}
          </div>
        )}
      </div>

      {/* Picks */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
        {data.picks?.map((pick, i) => (
          <div key={i} style={{
            background: 'white', borderRadius: 10, padding: '10px 12px',
            border: '1px solid #e2e8f0',
            boxSizing: 'border-box',
          }}>
            <div className="express-pick-row">
              <div style={{
                width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                background: cfg.numberBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 800, color: cfg.numberColor,
              }}>
                {i + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                <div className="express-team-name" style={isPurchased ? {} : { filter: 'blur(4px)', userSelect: 'none' }}>
                  {pick.home} — {pick.away}
                </div>
                <div className="express-league" style={isPurchased ? {} : { filter: 'blur(3px)', userSelect: 'none' }}>
                  {pick.league}
                </div>
              </div>
              <div className="express-pick-right">
                {isPurchased ? (
                  <>
                    <div style={{ fontWeight: 800, fontSize: 12, color: cfg.oddsColor, wordBreak: 'break-word' }}>{pick.prediction}</div>
                    <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 700 }}>× {pick.odds}</div>
                  </>
                ) : (
                  <div style={{
                    filter: 'blur(5px)', userSelect: 'none',
                    fontWeight: 800, fontSize: 12, color: cfg.oddsColor,
                    background: type === 'high' ? '#fde68a' : '#e0e7ff',
                    borderRadius: 6, padding: '2px 6px',
                  }}>
                    П1 × 1.55
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ marginTop: 'auto' }}>
        {isPurchased ? (
          <div style={{
            background: type === 'high' ? 'linear-gradient(135deg, #fef3c7, #fde68a)' : 'linear-gradient(135deg, #eff6ff, #e0e7ff)',
            borderRadius: 10, padding: '10px 14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Итоговый коэф.</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: cfg.oddsColor }}>× {data.total_odds?.toFixed(2)}</div>
              </div>
              {data.summary && (
                <button onClick={() => setShowSummary(true)} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'white', border: `1.5px solid ${type === 'high' ? '#fcd34d' : '#c7d2fe'}`,
                  borderRadius: 20, padding: '7px 14px',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  color: cfg.oddsColor, whiteSpace: 'nowrap',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  transition: 'box-shadow 0.18s',
                }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = `0 4px 16px ${cfg.oddsColor}33`}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'}
                >
                  <Brain size={13} />
                  Логика AI
                </button>
              )}
            </div>
          </div>
        ) : (
          <button
            onClick={handleBuy}
            disabled={buying}
            style={{
              width: '100%', padding: '11px',
              background: buying ? '#94a3b8' : cfg.gradient,
              color: 'white', border: 'none', borderRadius: 10,
              fontWeight: 700, fontSize: 14, cursor: buying ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              flexWrap: 'wrap',
              boxSizing: 'border-box',
            }}
          >
            {buying ? 'Открываем...' : (
              <>
                <Lock size={14} />
                Открыть экспресс
                <span style={{ opacity: 0.85, display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                  — <Zap size={13} fill="white" /> {cfg.cost} монет
                </span>
                <ChevronRight size={14} />
              </>
            )}
          </button>
        )}
      </div>

      {showSummary && <SummaryModal summary={data.summary} cfg={cfg} onClose={() => setShowSummary(false)} />}
    </div>
  )
}

export default function ExpressCard({ onAuthRequired }) {
  const { user } = useAuth()
  const [standard, setStandard] = useState(null)
  const [high, setHigh] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    expressApi.today()
      .then(data => {
        if (data.error) { setError(data.error); return }
        setStandard(data.standard || null)
        setHigh(data.high || null)
      })
      .catch(() => setError('Не удалось загрузить экспресс'))
      .finally(() => setLoading(false))
  }, [user?.id])

  function handleUpdate(type, newData) {
    if (type === 'standard') setStandard(newData)
    else setHigh(newData)
  }

  if (loading) return (
    <>
      <style>{RESPONSIVE_STYLES}</style>
      <div className="express-grid">
        {[1, 2].map(i => (
          <div key={i} className="express-col">
            <div className="card" style={{ padding: '20px 24px' }}>
              <div className="skeleton" style={{ height: 18, width: 160, marginBottom: 16 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[1, 2].map(j => <div key={j} className="skeleton" style={{ height: 52, borderRadius: 10 }} />)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )

  if (error || (!standard && !high)) return null

  return (
    <>
      <style>{RESPONSIVE_STYLES}</style>
      <div className="express-grid">
        <div className="express-col">
          <ExpressLabel text="AI ЭКСПРЕСС · LITE" color1="#2563eb" color2="#7c3aed" border="#93c5fd" bg="#eff6ff" />
          <SingleExpressCard data={standard} type="standard" onAuthRequired={onAuthRequired} onUpdate={handleUpdate} />
        </div>
        <div className="express-col">
          <ExpressLabel text="AI ЭКСПРЕСС · HARD" color1="#d97706" color2="#dc2626" border="#fcd34d" bg="#fffbeb" />
          <SingleExpressCard data={high} type="high" onAuthRequired={onAuthRequired} onUpdate={handleUpdate} />
        </div>
      </div>
    </>
  )
}
