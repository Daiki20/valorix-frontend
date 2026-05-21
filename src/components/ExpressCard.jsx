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
    gradient: 'linear-gradient(135deg, #ea580c, #dc2626)',
    accentLine: 'linear-gradient(90deg, #f97316, #dc2626)',
    border: '#fed7aa',
    bg: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
    numberBg: 'linear-gradient(135deg, #ffedd5, #fed7aa)',
    numberColor: '#ea580c',
    oddsColor: '#ea580c',
  },
}

const RESPONSIVE_STYLES = `
  .express-grid {
    display: flex;
    flex-direction: row;
    gap: 16px;
    margin-bottom: 24px;
    align-items: flex-start;
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

function ReasoningPanel({ picks, cfg }) {
  return (
    <div style={{
      marginTop: 12, borderTop: `1px solid ${cfg.border}`,
      paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10,
      animation: 'fadeInUp 0.2s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
        <Brain size={14} color={cfg.oddsColor} />
        <span style={{ fontSize: 12, fontWeight: 700, color: cfg.oddsColor }}>Логика AI</span>
        <span style={{ fontSize: 11, color: '#94a3b8' }}>— почему выбраны эти ставки</span>
      </div>
      {picks.map((pick, i) => (
        <div key={i} style={{
          borderRadius: 12, overflow: 'hidden',
          border: `1px solid ${cfg.border}`,
        }}>
          <div style={{
            background: cfg.bg, padding: '8px 14px',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
              background: cfg.gradient,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 800, color: 'white',
            }}>
              {i + 1}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 12, color: '#1a1a2e' }}>
                {pick.home} — {pick.away}
              </div>
              <div style={{ fontSize: 11, color: cfg.oddsColor, fontWeight: 700 }}>
                {pick.prediction} · ×{pick.odds}
              </div>
            </div>
          </div>
          <div style={{ padding: '10px 14px', background: 'white' }}>
            <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.65 }}>
              {pick.reasoning || 'Обоснование недоступно'}
            </div>
          </div>
        </div>
      ))}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
        <Sparkles size={11} color="#94a3b8" />
        Анализ сгенерирован AI на основе статистики
      </div>
    </div>
  )
}

function SingleExpressCard({ data, type, sport = 'football', onAuthRequired, onUpdate }) {
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
      const res = await expressApi.purchase(type, sport)
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
              <button onClick={() => setShowSummary(s => !s)} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: showSummary ? cfg.oddsColor : 'white',
                border: `1.5px solid ${type === 'high' ? '#fcd34d' : '#c7d2fe'}`,
                borderRadius: 20, padding: '7px 14px',
                fontSize: 12, fontWeight: 700, cursor: 'pointer',
                color: showSummary ? 'white' : cfg.oddsColor, whiteSpace: 'nowrap',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                transition: 'all 0.18s',
              }}>
                <Brain size={13} />
                {showSummary ? 'Свернуть' : 'Логика AI'}
              </button>
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

      {showSummary && isPurchased && <ReasoningPanel picks={data.picks || []} cfg={cfg} />}
    </div>
  )
}

const SPORT_OPTIONS = [
  { id: 'football', label: 'Футбол',  emoji: '⚽', grad: 'linear-gradient(135deg, #2563eb, #7c3aed)', glow: 'rgba(37,99,235,0.35)' },
  { id: 'hockey',   label: 'Хоккей',  emoji: '🏒', grad: 'linear-gradient(135deg, #0ea5e9, #2563eb)', glow: 'rgba(14,165,233,0.35)' },
  { id: 'cs2',      label: 'CS2',     emoji: '🔫', grad: 'linear-gradient(135deg, #f97316, #ef4444)', glow: 'rgba(249,115,22,0.35)' },
  { id: 'dota2',    label: 'Dota 2',  emoji: '🧙', grad: 'linear-gradient(135deg, #dc2626, #7c3aed)', glow: 'rgba(220,38,38,0.35)' },
  { id: 'valorant', label: 'Valorant',emoji: '🎯', grad: 'linear-gradient(135deg, #ec4899, #ef4444)', glow: 'rgba(236,72,153,0.35)' },
  { id: 'lol',      label: 'LoL',     emoji: '⚔️', grad: 'linear-gradient(135deg, #ea580c, #dc2626)', glow: 'rgba(234,88,12,0.35)'  },
]

const SPORT_LABEL_COLORS = {
  football: { color1: '#2563eb', color2: '#7c3aed', border: '#93c5fd', bg: '#eff6ff' },
  hockey:   { color1: '#0ea5e9', color2: '#2563eb', border: '#7dd3fc', bg: '#f0f9ff' },
  cs2:      { color1: '#f97316', color2: '#ef4444', border: '#fdba74', bg: '#fff7ed' },
  dota2:    { color1: '#dc2626', color2: '#7c3aed', border: '#f9a8d4', bg: '#fdf2f8' },
  valorant: { color1: '#ec4899', color2: '#ef4444', border: '#fca5a5', bg: '#fff1f2' },
  lol:      { color1: '#ea580c', color2: '#dc2626', border: '#fdba74', bg: '#fff7ed' },
}

export default function ExpressCard({ onAuthRequired }) {
  const { user } = useAuth()
  const [selectedSport, setSelectedSport] = useState(null)
  const [standard, setStandard] = useState(null)
  const [high, setHigh] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [hoveredSport, setHoveredSport] = useState(null)

  function loadSport(sport) {
    setSelectedSport(sport)
    setLoading(true)
    setError(null)
    setStandard(null)
    setHigh(null)
    expressApi.today(sport)
      .then(data => {
        if (data.error) { setError(data.error); return }
        setStandard(data.standard || null)
        setHigh(data.high || null)
      })
      .catch(() => setError('Не удалось загрузить экспресс'))
      .finally(() => setLoading(false))
  }

  function handleUpdate(type, newData) {
    if (type === 'standard') setStandard(newData)
    else setHigh(newData)
  }

  // ── Sport selector ──────────────────────────────────────────────────────────
  if (!selectedSport) {
    return (
      <div style={{ marginBottom: 24 }}>
        <style>{RESPONSIVE_STYLES}</style>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#1a1a2e', letterSpacing: 0.3, marginBottom: 4 }}>
            ⚡ AI ЭКСПРЕСС
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>Выберите вид спорта — AI составит два экспресса</div>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 10,
        }}>
          {SPORT_OPTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => loadSport(s.id)}
              onMouseEnter={() => setHoveredSport(s.id)}
              onMouseLeave={() => setHoveredSport(null)}
              style={{
                background: s.grad,
                color: 'white',
                border: 'none',
                borderRadius: 14,
                padding: '14px 10px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: 12,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 7,
                boxShadow: hoveredSport === s.id
                  ? `0 6px 20px ${s.glow}`
                  : `0 2px 8px ${s.glow}`,
                transform: hoveredSport === s.id ? 'translateY(-2px)' : 'none',
                transition: 'all 0.18s ease',
                lineHeight: 1.3,
              }}
            >
              <span style={{ fontSize: 22 }}>{s.emoji}</span>
              <span>AI Экспресс</span>
              <span style={{ fontWeight: 900, fontSize: 13 }}>{s.label}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // ── Loading ─────────────────────────────────────────────────────────────────
  const sportInfo = SPORT_OPTIONS.find(s => s.id === selectedSport)

  if (loading) return (
    <>
      <style>{RESPONSIVE_STYLES}</style>
      <div style={{ marginBottom: 8 }}>
        <button onClick={() => setSelectedSport(null)} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 13, color: '#64748b', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 4, padding: '4px 0',
        }}>← Назад к выбору</button>
      </div>
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

  // ── Error / empty ───────────────────────────────────────────────────────────
  if (error || (!standard && !high)) return (
    <>
      <style>{RESPONSIVE_STYLES}</style>
      <div style={{ marginBottom: 8 }}>
        <button onClick={() => setSelectedSport(null)} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 13, color: '#64748b', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 4, padding: '4px 0',
        }}>← Назад к выбору</button>
      </div>
      <div style={{
        textAlign: 'center', padding: '40px 24px',
        background: 'white', borderRadius: 16, border: '1.5px dashed #e2e8f0',
      }}>
        <div style={{ fontSize: 40, marginBottom: 14 }}>{sportInfo?.emoji || '📅'}</div>
        <div style={{ fontWeight: 800, fontSize: 16, color: '#1a1a2e', marginBottom: 8 }}>
          Экспресс генерируется...
        </div>
        <div style={{ fontSize: 13, color: '#94a3b8', maxWidth: 320, margin: '0 auto' }}>
          {error || 'Нет доступных матчей. Попробуйте позже.'}
        </div>
        <button onClick={() => loadSport(selectedSport)} style={{
          marginTop: 16, padding: '8px 20px', borderRadius: 10,
          background: sportInfo?.grad || '#2563eb', color: 'white',
          border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer',
        }}>Попробовать снова</button>
      </div>
    </>
  )

  // ── Express cards ───────────────────────────────────────────────────────────
  const lc = SPORT_LABEL_COLORS[selectedSport] || SPORT_LABEL_COLORS.football
  return (
    <>
      <style>{RESPONSIVE_STYLES}</style>
      <div style={{ marginBottom: 8 }}>
        <button onClick={() => setSelectedSport(null)} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 13, color: '#64748b', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 4, padding: '4px 0',
        }}>← Назад к выбору</button>
      </div>
      <div className="express-grid">
        <div className="express-col">
          <ExpressLabel
            text={`AI ЭКСПРЕСС ${sportInfo?.emoji || ''} · LITE`}
            color1={lc.color1} color2={lc.color2} border={lc.border} bg={lc.bg}
          />
          <SingleExpressCard
            data={standard} type="standard" sport={selectedSport}
            onAuthRequired={onAuthRequired} onUpdate={handleUpdate}
          />
        </div>
        <div className="express-col">
          <ExpressLabel
            text={`AI ЭКСПРЕСС ${sportInfo?.emoji || ''} · HARD`}
            color1="#ea580c" color2="#dc2626" border="#fed7aa" bg="#fff7ed"
          />
          <SingleExpressCard
            data={high} type="high" sport={selectedSport}
            onAuthRequired={onAuthRequired} onUpdate={handleUpdate}
          />
        </div>
      </div>
    </>
  )
}
