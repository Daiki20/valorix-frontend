import { useState, useEffect } from 'react'
import { Zap, Lock, Star, TrendingUp, ChevronRight, Flame } from 'lucide-react'
import { expressApi } from '../api/authApi'
import { useAuth } from '../context/AuthContext'

const CONFIG = {
  standard: {
    cost: 36,
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
    cost: 46,
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

function SingleExpressCard({ data, type, onAuthRequired, onUpdate }) {
  const { user, updateCoins } = useAuth()
  const [buying, setBuying] = useState(false)
  const cfg = CONFIG[type]

  if (!data) return (
    <div className="card" style={{ padding: '20px 24px', flex: 1 }}>
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
      padding: '20px 24px', flex: 1,
      border: `1.5px solid ${cfg.border}`,
      background: cfg.bg,
      position: 'relative', overflow: 'hidden',
    }}>
      {/* accent line */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: cfg.accentLine }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: cfg.gradient,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {cfg.icon}
          </div>
          <div>
            <span style={{ fontWeight: 900, fontSize: 14, color: '#1a1a2e', letterSpacing: -0.3 }}>
              {cfg.label}
            </span>
            <div style={{ fontSize: 11, color: cfg.numberColor, fontWeight: 700 }}>{cfg.sublabel}</div>
          </div>
          {data.date && (
            <span style={{
              background: '#f0fdf4', color: '#16a34a', fontSize: 11,
              fontWeight: 700, padding: '2px 8px', borderRadius: 20, border: '1px solid #bbf7d0',
            }}>
              {data.date}
            </span>
          )}
        </div>
        {isPurchased && (
          <div style={{
            background: '#f0fdf4', color: '#16a34a', fontSize: 12,
            fontWeight: 700, padding: '3px 10px', borderRadius: 20, border: '1px solid #bbf7d0',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <TrendingUp size={11} /> Открыт
          </div>
        )}
      </div>

      {/* Picks */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
        {data.picks?.map((pick, i) => (
          <div key={i} style={{
            background: 'white', borderRadius: 10, padding: '10px 14px',
            border: '1px solid #e2e8f0',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
              background: cfg.numberBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 800, color: cfg.numberColor,
            }}>
              {i + 1}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#1a1a2e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {pick.home} — {pick.away}
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{pick.league}</div>
            </div>
            <div style={{ flexShrink: 0, textAlign: 'right' }}>
              {isPurchased ? (
                <>
                  <div style={{ fontWeight: 800, fontSize: 13, color: cfg.oddsColor }}>{pick.prediction}</div>
                  <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 700 }}>× {pick.odds}</div>
                </>
              ) : (
                <div style={{
                  filter: 'blur(5px)', userSelect: 'none',
                  fontWeight: 800, fontSize: 13, color: cfg.oddsColor,
                  background: type === 'high' ? '#fde68a' : '#e0e7ff',
                  borderRadius: 6, padding: '2px 8px',
                }}>
                  П1 × 1.55
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      {isPurchased ? (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: type === 'high' ? 'linear-gradient(135deg, #fef3c7, #fde68a)' : 'linear-gradient(135deg, #eff6ff, #e0e7ff)',
          borderRadius: 10, padding: '10px 14px',
        }}>
          <div>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Итоговый коэф.</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: cfg.oddsColor }}>× {data.total_odds?.toFixed(2)}</div>
          </div>
          {data.summary && (
            <div style={{ fontSize: 12, color: '#64748b', maxWidth: 180, textAlign: 'right' }}>
              {data.summary}
            </div>
          )}
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
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'opacity 0.15s',
          }}
        >
          {buying ? 'Открываем...' : (
            <>
              <Lock size={14} />
              Открыть экспресс
              <span style={{ opacity: 0.85, display: 'flex', alignItems: 'center', gap: 4 }}>
                — <Zap size={13} fill="white" /> {cfg.cost} монет
              </span>
              <ChevronRight size={14} style={{ marginLeft: 2 }} />
            </>
          )}
        </button>
      )}

      {!isPurchased && (
        <div style={{ textAlign: 'center', fontSize: 11, color: '#64748b', marginTop: 8, fontWeight: 600 }}>
          Итоговый коэф: × <span style={{ color: cfg.oddsColor, fontWeight: 800 }}>{data.total_odds?.toFixed(2) || '—'}</span>
        </div>
      )}
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
    <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
      {[1, 2].map(i => (
        <div key={i} className="card" style={{ padding: '20px 24px', flex: 1 }}>
          <div className="skeleton" style={{ height: 18, width: 160, marginBottom: 16 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1, 2].map(j => <div key={j} className="skeleton" style={{ height: 52, borderRadius: 10 }} />)}
          </div>
        </div>
      ))}
    </div>
  )

  if (error || (!standard && !high)) return null

  return (
    <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
      <SingleExpressCard data={standard} type="standard" onAuthRequired={onAuthRequired} onUpdate={handleUpdate} />
      <SingleExpressCard data={high} type="high" onAuthRequired={onAuthRequired} onUpdate={handleUpdate} />
    </div>
  )
}
