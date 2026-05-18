import { useState, useEffect } from 'react'
import { Zap, Lock, Star, TrendingUp, ChevronRight } from 'lucide-react'
import { expressApi } from '../api/authApi'
import { useAuth } from '../context/AuthContext'

export default function ExpressCard({ onAuthRequired }) {
  const { user, updateCoins } = useAuth()
  const [express, setExpress] = useState(null)
  const [loading, setLoading] = useState(true)
  const [buying, setBuying] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    expressApi.today()
      .then(data => {
        if (data.error) setError(data.error)
        else setExpress(data)
      })
      .catch(() => setError('Не удалось загрузить экспресс'))
      .finally(() => setLoading(false))
  }, [user?.id])

  async function handleBuy() {
    if (!user) { onAuthRequired?.(); return }
    setBuying(true)
    try {
      const data = await expressApi.purchase()
      if (data.error) { alert(data.error); return }
      setExpress(data)
      if (data.coins !== undefined) updateCoins(data.coins)
    } catch (err) {
      alert(err.message)
    } finally {
      setBuying(false)
    }
  }

  if (loading) return (
    <div className="card" style={{ padding: '20px 24px', marginBottom: 24 }}>
      <div className="skeleton" style={{ height: 18, width: 160, marginBottom: 16 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[1, 2].map(i => <div key={i} className="skeleton" style={{ height: 52, borderRadius: 10 }} />)}
      </div>
    </div>
  )

  if (error || !express) return null

  const isPurchased = express.purchased

  return (
    <div className="card" style={{
      padding: '20px 24px', marginBottom: 24,
      border: '1.5px solid #e0e7ff',
      background: 'linear-gradient(135deg, #fafbff 0%, #f0f4ff 100%)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* accent line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: 'linear-gradient(90deg, #2563eb, #7c3aed)',
      }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Star size={14} color="white" fill="white" />
          </div>
          <span style={{ fontWeight: 900, fontSize: 15, color: '#1a1a2e', letterSpacing: -0.3 }}>
            Экспресс дня
          </span>
          <span style={{
            background: '#eff6ff', color: '#2563eb', fontSize: 11,
            fontWeight: 700, padding: '2px 8px', borderRadius: 20, border: '1px solid #bfdbfe',
          }}>
            {express.picks_count || express.picks?.length || 2}-3 матча
          </span>
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
        {express.picks?.map((pick, i) => (
          <div key={i} style={{
            background: 'white', borderRadius: 10, padding: '10px 14px',
            border: '1px solid #e2e8f0',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #eff6ff, #e0e7ff)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 800, color: '#2563eb',
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
                  <div style={{ fontWeight: 800, fontSize: 13, color: '#2563eb' }}>{pick.prediction}</div>
                  <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 700 }}>× {pick.odds}</div>
                </>
              ) : (
                <div style={{
                  filter: 'blur(5px)', userSelect: 'none',
                  fontWeight: 800, fontSize: 13, color: '#2563eb',
                  background: '#e0e7ff', borderRadius: 6, padding: '2px 8px',
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
          background: 'linear-gradient(135deg, #eff6ff, #e0e7ff)', borderRadius: 10, padding: '10px 14px',
        }}>
          <div>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Итоговый коэф.</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#2563eb' }}>× {express.total_odds?.toFixed(2)}</div>
          </div>
          {express.summary && (
            <div style={{ fontSize: 12, color: '#64748b', maxWidth: 200, textAlign: 'right' }}>
              {express.summary}
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={handleBuy}
          disabled={buying}
          style={{
            width: '100%', padding: '11px',
            background: buying ? '#94a3b8' : 'linear-gradient(135deg, #2563eb, #7c3aed)',
            color: 'white', border: 'none', borderRadius: 10,
            fontWeight: 700, fontSize: 14, cursor: buying ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'opacity 0.15s',
          }}
        >
          {buying ? (
            'Открываем...'
          ) : (
            <>
              <Lock size={14} />
              Открыть экспресс
              <span style={{ opacity: 0.85, display: 'flex', alignItems: 'center', gap: 4 }}>
                — <Zap size={13} fill="white" /> 28 монет
              </span>
              <ChevronRight size={14} style={{ marginLeft: 2 }} />
            </>
          )}
        </button>
      )}

      {!isPurchased && (
        <div style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', marginTop: 8 }}>
          Итоговый коэф: × <span style={{ filter: 'blur(4px)', display: 'inline-block' }}>{express.total_odds?.toFixed(2) || '3.47'}</span>
        </div>
      )}
    </div>
  )
}
