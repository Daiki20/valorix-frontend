import { useState, useEffect } from 'react'
import { TrendingUp, RefreshCw, Clock, AlertCircle, CheckCircle } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || 'https://web-production-fefcd.up.railway.app'

const SPORT_NAMES = {
  soccer_epl: 'Футбол · АПЛ',
  soccer_spain_la_liga: 'Футбол · Ла Лига',
  soccer_germany_bundesliga: 'Футбол · Бундеслига',
  soccer_italy_serie_a: 'Футбол · Серия А',
  soccer_france_ligue_one: 'Футбол · Лига 1',
  soccer_uefa_champs_league: 'Футбол · Лига Чемпионов',
  soccer_uefa_europa_league: 'Футбол · Лига Европы',
  soccer_netherlands_eredivisie: 'Футбол · Эредивизи',
  soccer_turkey_super_league: 'Футбол · Суперлига Турции',
  soccer_portugal_primeira_liga: 'Футбол · Примейра',
  basketball_nba: 'Баскетбол · NBA',
  basketball_euroleague: 'Баскетбол · Евролига',
  icehockey_nhl: 'Хоккей · NHL',
  tennis_atp_french_open: 'Теннис · ATP',
  tennis_wta_french_open: 'Теннис · WTA',
  mma_mixed_martial_arts: 'MMA',
  americanfootball_nfl: 'Американский футбол · NFL',
  baseball_mlb: 'Бейсбол · MLB',
}

export default function Vilki() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [bank, setBank] = useState(10000)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/vilki`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setData(json)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const updatedTime = data?.updatedAt
    ? new Date(data.updatedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div style={{ minHeight: '100vh', background: '#07090f', color: '#dde4ee', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ background: 'rgba(0,15,40,0.8)', borderBottom: '1px solid rgba(0,180,255,0.1)', padding: '16px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <TrendingUp size={22} color="#00cfff" />
            <span style={{ fontWeight: 800, fontSize: 18 }}>Valorix · Вилки</span>
            <span style={{ fontSize: 12, background: 'rgba(0,207,255,0.1)', color: '#00cfff', border: '1px solid rgba(0,207,255,0.3)', borderRadius: 6, padding: '2px 8px' }}>BETA</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            {data && (
              <span style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Clock size={13} />
                Обновлено в {updatedTime} · след. через {data.nextUpdateIn} мин
              </span>
            )}
            {data?.requestsRemaining && (
              <span style={{ fontSize: 12, color: '#64748b' }}>
                Запросов осталось: <b style={{ color: '#dde4ee' }}>{data.requestsRemaining}</b>
              </span>
            )}
            <button
              onClick={load}
              disabled={loading}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(0,207,255,0.1)', border: '1px solid rgba(0,207,255,0.3)',
                color: '#00cfff', borderRadius: 8, padding: '7px 14px',
                fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
              }}
            >
              <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              Обновить
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
        {/* Bank input */}
        <div style={{ background: 'rgba(0,15,40,0.5)', border: '1px solid rgba(0,180,255,0.1)', borderRadius: 12, padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14, color: '#94a3b8', fontWeight: 600 }}>Ваш банк:</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="number"
              value={bank}
              onChange={e => setBank(Number(e.target.value))}
              style={{
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(0,180,255,0.2)',
                borderRadius: 8, padding: '8px 12px', color: '#dde4ee', fontSize: 15,
                fontWeight: 700, width: 120, outline: 'none',
              }}
            />
            <span style={{ color: '#64748b', fontSize: 14 }}>₽</span>
          </div>
          <span style={{ fontSize: 13, color: '#64748b' }}>— суммы ставок рассчитываются автоматически</span>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
            <div>Ищем вилки...</div>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: 12, padding: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
            <AlertCircle size={20} color="#ef4444" />
            <span style={{ color: '#ef4444' }}>Ошибка: {error}</span>
          </div>
        )}

        {/* Results */}
        {!loading && data && (
          <>
            {data.arbs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Вилок не найдено</div>
                <div style={{ fontSize: 14, color: '#64748b' }}>
                  Рынок сейчас сбалансирован. Проверьте снова через {data.nextUpdateIn} мин.
                </div>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <CheckCircle size={18} color="#22c55e" />
                  <span style={{ fontWeight: 700, fontSize: 16 }}>Найдено вилок: {data.arbs.length}</span>
                  {data.fromCache && <span style={{ fontSize: 12, color: '#64748b' }}>(из кэша)</span>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {data.arbs.map((arb, i) => (
                    <ArbCard key={arb.id || i} arb={arb} bank={bank} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none }
      `}</style>
    </div>
  )
}

function ArbCard({ arb, bank }) {
  const profit = arb.profit
  const profitAmount = Math.round(bank * profit / 100)
  const commenceDate = arb.commenceTime
    ? new Date(arb.commenceTime).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    : ''

  return (
    <div style={{
      background: 'rgba(0,15,40,0.5)', border: '1px solid rgba(0,207,255,0.15)',
      borderRadius: 14, overflow: 'hidden',
    }}>
      {/* Match header */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(0,180,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16 }}>{arb.home} — {arb.away}</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>
            {SPORT_NAMES[arb.sport] || arb.sport}{commenceDate ? ` · ${commenceDate}` : ''}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontSize: 22, fontWeight: 900,
            color: profit >= 2 ? '#22c55e' : profit >= 1 ? '#86efac' : '#facc15',
          }}>
            +{profit}%
          </div>
          <div style={{ fontSize: 12, color: '#64748b' }}>≈ +{profitAmount.toLocaleString('ru-RU')} ₽</div>
        </div>
      </div>

      {/* Stakes */}
      <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {arb.stakes.map((s, i) => {
          const stakeAmount = Math.round(bank * s.stake / 100)
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '10px 16px',
              flexWrap: 'wrap', gap: 8,
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{s.name}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{s.bookmaker}</div>
              </div>
              <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#64748b' }}>Коэф.</div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: '#00cfff' }}>{s.price}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#64748b' }}>Ставка</div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{stakeAmount.toLocaleString('ru-RU')} ₽</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{s.stake}%</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
