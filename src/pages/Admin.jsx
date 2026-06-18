import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import Navbar from '../components/Navbar'
import { getStats, getUsers, getTransactions, addCoins, setAdmin, setBlocked } from '../api/adminApi'
import { Users, Zap, BarChart3, RefreshCw, Shield, Ban, Plus, Minus, Search, ChevronLeft, ChevronRight, Star } from 'lucide-react'
const API_BASE = import.meta.env.PROD ? 'https://web-production-fefcd.up.railway.app' : (import.meta.env.VITE_API_URL || '')

const TABS = ['Дашборд', 'Пользователи', 'Транзакции', 'Блог', 'Рассылка']

export default function Admin() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [tab, setTab] = useState(0)

  useEffect(() => {
    if (user && !user.is_admin) navigate('/')
  }, [user])

  if (!user) return null
  if (!user.is_admin) return null

  return (
    <div style={{ minHeight: '100vh', background: '#07090f' }}>
      <Navbar />
      <div className="admin-wrap" style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <Shield size={22} color="#00cfff" />
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#dde4ee' }}>Панель администратора</h1>
          </div>
          <p style={{ color: '#64748b', fontSize: 14 }}>{user.email}</p>
        </div>

        {/* Tabs */}
        <div className="admin-tabs" style={{ display: 'flex', gap: 4, marginBottom: 28, background: '#0c0f18', borderRadius: 12, padding: 4, border: '1px solid rgba(255,255,255,0.07)', width: 'fit-content' }}>
          {TABS.map((t, i) => (
            <button key={i} onClick={() => setTab(i)} style={{
              padding: '8px 20px', borderRadius: 8, border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              background: tab === i ? 'linear-gradient(135deg,#1a1a2e,#16213e)' : 'transparent',
              color: tab === i ? 'white' : '#64748b',
              transition: 'all 0.2s',
            }}>{t}</button>
          ))}
        </div>

        {tab === 0 && <DashboardTab toast={toast} />}
        {tab === 1 && <UsersTab toast={toast} />}
        {tab === 2 && <TransactionsTab />}
        {tab === 3 && <BlogTab toast={toast} />}
        {tab === 4 && <NewsletterTab toast={toast} />}
      </div>
    </div>
  )
}

/* ─── Dashboard ─── */
function DashboardTab({ toast }) {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [coinForm, setCoinForm] = useState({ email: '', amount: '', reason: '' })
  const [coinLoading, setCoinLoading] = useState(false)
  const [coinMode, setCoinMode] = useState('add') // 'add' | 'remove'
  const [expressLoading, setExpressLoading] = useState({})
  const [expressResults, setExpressResults] = useState({})

  const handleGenerateExpress = async (type, sport = 'football') => {
    const key = `${sport}_${type}`
    setExpressLoading(p => ({ ...p, [key]: true }))
    try {
      const token = localStorage.getItem('valorix_token')
      // CS2/Dota2 — генерируем на сегодня (главная показывает сегодняшний),
      // футбол/хоккей — на завтра (стандартное поведение)
      const isEsport = sport === 'cs2' || sport === 'dota2'
      const today = new Date().toISOString().slice(0, 10)
      const body = isEsport ? { type, sport, date: today } : { type, sport }
      const res = await fetch(`${API_BASE}/express/generate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.error) { toast.error(data.error); return }
      setExpressResults(p => ({ ...p, [key]: data }))
      const sportLabels = { hockey: '🏒 Хоккей', cs2: '🎮 CS2', dota2: '🗡️ Dota 2' }
      toast.success(`${sportLabels[sport] || '⚽ Футбол'} · ${type === 'standard' ? 'Lite' : 'Hard'} сгенерирован!`)
    } catch {
      toast.error('Ошибка генерации')
    } finally {
      setExpressLoading(p => ({ ...p, [key]: false }))
    }
  }

  const load = async () => {
    setLoading(true)
    try { setStats(await getStats()) } catch { toast.error('Нет доступа') }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleAddCoins = async (e) => {
    e.preventDefault()
    if (!coinForm.email || !coinForm.amount) return
    setCoinLoading(true)
    const amount = coinMode === 'add' ? Math.abs(parseInt(coinForm.amount)) : -Math.abs(parseInt(coinForm.amount))
    const res = await addCoins(coinForm.email, amount, coinForm.reason)
    setCoinLoading(false)
    if (res.success) {
      toast.success(`Баланс обновлён: ${res.coins} монет`)
      setCoinForm({ email: '', amount: '', reason: '' })
      load()
    } else {
      toast.error(res.error || 'Ошибка')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
        {[
          { label: 'Всего пользователей', value: stats?.totalUsers, icon: <Users size={18} color="#00cfff" /> },
          { label: 'Всего анализов', value: stats?.totalAnalyses, icon: <BarChart3 size={18} color="#7c3aed" /> },
          { label: 'Монет потрачено', value: stats?.totalCoinsSpent, icon: <Zap size={18} color="#f59e0b" fill="#f59e0b" /> },
          { label: 'Новых сегодня', value: stats?.todayUsers, icon: <Users size={18} color="#10b981" /> },
          { label: 'Анализов сегодня', value: stats?.todayAnalyses, icon: <BarChart3 size={18} color="#10b981" /> },
          { label: 'Выручка (₽)', value: stats?.revenue, icon: <Zap size={18} color="#f97316" /> },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              {s.icon}
              <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{s.label}</span>
            </div>
            {loading
              ? <div className="skeleton" style={{ height: 28, width: 60 }} />
              : <div style={{ fontSize: 28, fontWeight: 800, color: '#dde4ee' }}>{s.value ?? '—'}</div>}
          </div>
        ))}
      </div>

      {/* Add coins form */}
      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ fontWeight: 700, fontSize: 16, color: '#dde4ee', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Zap size={16} color="#00cfff" fill="#00cfff" />
          Управление монетами
        </h3>

        {/* Mode toggle */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
          <button type="button" onClick={() => setCoinMode('add')} style={{
            padding: '7px 18px', borderRadius: 7, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            background: coinMode === 'add' ? '#10b981' : 'transparent',
            color: coinMode === 'add' ? 'white' : '#64748b',
            transition: 'all 0.2s',
          }}>+ Начислить</button>
          <button type="button" onClick={() => setCoinMode('remove')} style={{
            padding: '7px 18px', borderRadius: 7, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            background: coinMode === 'remove' ? '#dc2626' : 'transparent',
            color: coinMode === 'remove' ? 'white' : '#64748b',
            transition: 'all 0.2s',
          }}>− Снять</button>
        </div>

        <form onSubmit={handleAddCoins} className="admin-form" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <input
            placeholder="Email пользователя"
            value={coinForm.email}
            onChange={e => setCoinForm(f => ({ ...f, email: e.target.value }))}
            style={inputStyle}
          />
          <input
            type="number"
            min="1"
            placeholder="Количество монет"
            value={coinForm.amount}
            onChange={e => setCoinForm(f => ({ ...f, amount: e.target.value }))}
            style={{ ...inputStyle, width: 200 }}
          />
          <input
            placeholder="Причина (необязательно)"
            value={coinForm.reason}
            onChange={e => setCoinForm(f => ({ ...f, reason: e.target.value }))}
            style={{ ...inputStyle, flex: 1 }}
          />
          <button type="submit" disabled={coinLoading} style={{
            padding: '10px 22px', fontSize: 14, fontWeight: 700, border: 'none', borderRadius: 10, cursor: 'pointer',
            background: coinMode === 'add' ? '#10b981' : '#dc2626', color: 'white',
            opacity: coinLoading ? 0.7 : 1,
          }}>
            {coinLoading ? '...' : coinMode === 'add' ? '+ Начислить' : '− Снять'}
          </button>
        </form>
      </div>

      {/* Express generator */}
      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ fontWeight: 700, fontSize: 16, color: '#dde4ee', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Star size={16} color="#7c3aed" fill="#7c3aed" />
          Экспресс дня
        </h3>
        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
          Перегенерировать экспресс на завтра (перезапишет текущий)
        </p>

        {/* Sports */}
        {[
          { sport: 'football', label: '⚽ Футбол',  gradL: 'linear-gradient(135deg,#00cfff,#7b5ea7)', gradH: 'linear-gradient(135deg,#f97316,#dc2626)' },
          { sport: 'hockey',   label: '🏒 Хоккей',  gradL: 'linear-gradient(135deg,#0ea5e9,#00cfff)', gradH: 'linear-gradient(135deg,#ea580c,#dc2626)' },
          { sport: 'cs2',      label: '🎮 CS2',      gradL: 'linear-gradient(135deg,#f97316,#eab308)', gradH: 'linear-gradient(135deg,#dc2626,#9f1239)' },
          { sport: 'dota2',    label: '🗡️ Dota 2',  gradL: 'linear-gradient(135deg,#a855f7,#6366f1)', gradH: 'linear-gradient(135deg,#7c3aed,#4f46e5)' },
        ].map(({ sport, label, gradL, gradH }) => {
          const kL = `${sport}_standard`, kH = `${sport}_high`
          const resL = expressResults[kL], resH = expressResults[kH]
          return (
            <div key={sport} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 10 }}>{label}</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button onClick={() => handleGenerateExpress('standard', sport)} disabled={expressLoading[kL]} style={{
                  padding: '10px 22px', fontSize: 14, fontWeight: 700, border: 'none', borderRadius: 10,
                  background: expressLoading[kL] ? '#94a3b8' : gradL,
                  color: 'white', cursor: expressLoading[kL] ? 'not-allowed' : 'pointer',
                }}>
                  {expressLoading[kL] ? 'Генерируем...' : '⚡ Lite (надёжный)'}
                </button>
                <button onClick={() => handleGenerateExpress('high', sport)} disabled={expressLoading[kH]} style={{
                  padding: '10px 22px', fontSize: 14, fontWeight: 700, border: 'none', borderRadius: 10,
                  background: expressLoading[kH] ? '#94a3b8' : gradH,
                  color: 'white', cursor: expressLoading[kH] ? 'not-allowed' : 'pointer',
                }}>
                  {expressLoading[kH] ? 'Генерируем...' : '🔥 Hard (высокодоходный)'}
                </button>
              </div>
              {(resL || resH) && (
                <div style={{ marginTop: 10, background: 'rgba(34,197,94,0.08)', borderRadius: 10, padding: '12px 16px', border: '1px solid #bbf7d0' }}>
                  {[resL, resH].filter(Boolean).map((r, i) => (
                    <div key={i} style={{ marginBottom: i === 0 && resH ? 8 : 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#16a34a', marginBottom: 4 }}>
                        {i === 0 ? 'Lite' : 'Hard'} — {r.date} | Итоговый коэф: × {r.total_odds?.toFixed(2)}
                      </div>
                      {r.picks?.map((p, j) => (
                        <div key={j} style={{ fontSize: 12, color: '#94a3b8', marginBottom: 2 }}>
                          {j + 1}. {p.home} — {p.away} · <b>{p.prediction}</b> × {p.odds}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Football Debug */}
      <FootballDebugPanel toast={toast} />

      {/* Hockey Debug */}
      <HockeyDebugPanel toast={toast} />

      {/* CS2 Debug */}
      <EsportDebugPanel game="cs2" label="CS2" emoji="🎮" accentColor="#f97316" toast={toast} />

      {/* Dota 2 Debug */}
      <EsportDebugPanel game="dota2" label="Dota 2" emoji="🗡️" accentColor="#a855f7" toast={toast} />

      {/* Cache Management */}
      <CachePanel toast={toast} />

      {/* API Status */}
      <ApiStatusPanel />

      {/* Recent users */}
      {stats?.recentUsers?.length > 0 && (
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontWeight: 700, fontSize: 16, color: '#dde4ee', marginBottom: 16 }}>Последние регистрации</h3>
          <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(0,180,255,0.08)' }}>
                {['Email', 'Username', 'Монеты', 'Роль', 'Дата'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '6px 10px', color: '#64748b', fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.recentUsers.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={tdStyle}>{u.email}</td>
                  <td style={tdStyle}>{u.username}</td>
                  <td style={tdStyle}><CoinPill n={u.coins} /></td>
                  <td style={tdStyle}>{u.is_admin ? <span style={pillStyle('#00cfff')}>Admin</span> : <span style={pillStyle('#94a3b8')}>User</span>}</td>
                  <td style={tdStyle}>{new Date(u.created_at).toLocaleDateString('ru-RU')}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>
      )}
    </div>
  )
}

/* ─── Football Debug Panel ─── */
function FootballDebugPanel({ toast }) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)
  const [genLoading, setGenLoading] = useState({})
  const [genResults, setGenResults] = useState({})

  const getDateOffset = (days) => {
    const d = new Date()
    d.setDate(d.getDate() + days)
    return d.toISOString().slice(0, 10)
  }

  const DATE_OPTIONS = [
    { key: 'today',    label: '📅 Сегодня',       days: 0 },
    { key: 'overmorrow', label: '📅 Послезавтра', days: 2 },
  ]

  const run = async () => {
    setLoading(true)
    setData(null)
    try {
      const token = localStorage.getItem('valorix_token')
      const res = await fetch(`${API_BASE}/express/debug-football`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setData(await res.json())
    } catch (err) {
      setData({ error: err.message })
    } finally {
      setLoading(false)
    }
  }

  const generateForDate = async (dateKey, days) => {
    const date = getDateOffset(days)
    setGenLoading(p => ({ ...p, [dateKey]: true }))
    setGenResults(p => ({ ...p, [dateKey]: null }))
    try {
      const token = localStorage.getItem('valorix_token')
      // Генерируем Lite и Hard параллельно
      const [resL, resH] = await Promise.all(
        ['standard', 'high'].map(type =>
          fetch(`${API_BASE}/express/generate`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ sport: 'football', type, date }),
          }).then(r => r.json())
        )
      )
      if (resL.error && resH.error) {
        toast.error(resL.error || resH.error)
        setGenResults(p => ({ ...p, [dateKey]: { error: resL.error } }))
      } else {
        toast.success(`⚽ Экспресс на ${date} создан!`)
        setGenResults(p => ({ ...p, [dateKey]: { date, standard: resL, high: resH } }))
      }
    } catch (err) {
      toast.error(err.message)
      setGenResults(p => ({ ...p, [dateKey]: { error: err.message } }))
    } finally {
      setGenLoading(p => ({ ...p, [dateKey]: false }))
    }
  }

  const LEAGUE_NAMES = {
    2: 'Лига Чемпионов', 3: 'Лига Европы', 39: 'Английская Премьер-лига',
    140: 'Ла Лига', 135: 'Серия А', 78: 'Бундеслига',
    61: 'Лига 1', 235: 'РПЛ',
  }

  return (
    <div className="card" style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <h3 style={{ fontWeight: 700, fontSize: 16, color: '#dde4ee', display: 'flex', alignItems: 'center', gap: 8 }}>
          ⚽ Диагностика футбольного экспресса
        </h3>
        <button onClick={run} disabled={loading} style={{
          padding: '8px 18px', borderRadius: 10, border: 'none', fontWeight: 700, fontSize: 13,
          background: loading ? 'rgba(0,207,255,0.2)' : 'linear-gradient(90deg,#00cfff,#7b5ea7)',
          color: loading ? 'rgba(255,255,255,0.4)' : '#030b18', cursor: loading ? 'not-allowed' : 'pointer',
        }}>
          {loading ? 'Проверяем...' : '🔍 Проверить'}
        </button>
      </div>
      <p style={{ fontSize: 12, color: '#4a6a8a', marginBottom: data ? 16 : 0 }}>
        Проверяет sstats.net — сколько матчей найдено на завтра и есть ли коэффициенты
      </p>

      {data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>

          {/* Ключ + дата */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <span style={{
              padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
              background: data.sstatsKeySet ? 'rgba(34,197,94,0.12)' : 'rgba(220,38,38,0.12)',
              color: data.sstatsKeySet ? '#4ade80' : '#f87171',
              border: `1px solid ${data.sstatsKeySet ? 'rgba(34,197,94,0.3)' : 'rgba(220,38,38,0.3)'}`,
            }}>
              {data.sstatsKeySet ? '✓ SSTATS_API_KEY установлен' : '✗ SSTATS_API_KEY не найден'}
            </span>
            <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: 'rgba(0,207,255,0.1)', color: '#00cfff', border: '1px solid rgba(0,207,255,0.2)' }}>
              📅 Дата: {data.targetDate}
            </span>
            <span style={{
              padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
              background: data.totalMatches >= 2 ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)',
              color: data.totalMatches >= 2 ? '#4ade80' : '#fbbf24',
              border: `1px solid ${data.totalMatches >= 2 ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}`,
            }}>
              ⚽ Матчей найдено: {data.totalMatches} {data.totalMatches < 2 ? '(нужно минимум 2)' : '✓'}
            </span>
            {data.totalMatches > 0 && (
              <span style={{
                padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                background: data.matchesWithOdds > 0 ? 'rgba(34,197,94,0.12)' : 'rgba(220,38,38,0.12)',
                color: data.matchesWithOdds > 0 ? '#4ade80' : '#f87171',
                border: `1px solid ${data.matchesWithOdds > 0 ? 'rgba(34,197,94,0.3)' : 'rgba(220,38,38,0.3)'}`,
              }}>
                📊 С коэф-ами: {data.matchesWithOdds} из {Math.min(3, data.totalMatches)} (из первых 3)
              </span>
            )}
          </div>

          {/* Ошибка */}
          {data.error && (
            <div style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#fca5a5' }}>
              ❌ {data.error}
            </div>
          )}

          {/* По лигам */}
          {data.leagues && Object.keys(data.leagues).length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#4a6a8a', marginBottom: 8, letterSpacing: 1, textTransform: 'uppercase' }}>По лигам на {data.targetDate}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 8 }}>
                {Object.entries(data.leagues).map(([id, info]) => (
                  <div key={id} style={{
                    borderRadius: 8, padding: '8px 12px',
                    background: info.error ? 'rgba(220,38,38,0.06)' : info.onTargetDate > 0 ? 'rgba(34,197,94,0.06)' : 'rgba(0,15,40,0.5)',
                    border: `1px solid ${info.error ? 'rgba(220,38,38,0.2)' : info.onTargetDate > 0 ? 'rgba(34,197,94,0.2)' : 'rgba(0,180,255,0.08)'}`,
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#d8eeff', marginBottom: 2 }}>
                      {LEAGUE_NAMES[id] || `Лига ${id}`}
                    </div>
                    {info.error
                      ? <div style={{ fontSize: 11, color: '#f87171' }}>Ошибка: {info.error}</div>
                      : <div style={{ fontSize: 11, color: info.onTargetDate > 0 ? '#4ade80' : '#4a6a8a' }}>
                          {info.onTargetDate} матчей на дату · всего upcoming: {info.total}
                          {info.sample?.length > 0 && <div style={{ marginTop: 3, color: '#94a3b8' }}>{info.sample.join(', ')}</div>}
                        </div>
                    }
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Список матчей */}
          {data.matchesList?.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#4a6a8a', marginBottom: 8, letterSpacing: 1, textTransform: 'uppercase' }}>Все найденные матчи</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {data.matchesList.map((m, i) => (
                  <div key={i} style={{ fontSize: 12, color: '#d8eeff', padding: '5px 10px', background: 'rgba(0,207,255,0.04)', borderRadius: 6, border: '1px solid rgba(0,180,255,0.08)' }}>
                    <span style={{ color: '#4a6a8a', marginRight: 6 }}>{i + 1}.</span>
                    <b>{m.home}</b> — <b>{m.away}</b>
                    <span style={{ color: '#4a6a8a', marginLeft: 8, fontSize: 11 }}>{m.league}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Сэмпл коэффициентов */}
          {data.oddsSample?.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#4a6a8a', marginBottom: 8, letterSpacing: 1, textTransform: 'uppercase' }}>Коэффициенты (первые 3)</div>
              {data.oddsSample.map((s, i) => (
                <div key={i} style={{ marginBottom: 6, padding: '8px 12px', background: 'rgba(0,15,40,0.5)', borderRadius: 8, border: '1px solid rgba(0,180,255,0.08)' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#d8eeff', marginBottom: 4 }}>
                    {s.match} — {s.hasOdds ? <span style={{ color: '#4ade80' }}>✓ коэф есть</span> : <span style={{ color: '#f87171' }}>✗ нет коэф</span>}
                  </div>
                  {s.oddsPreview && <div style={{ fontSize: 11, color: '#4a6a8a', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>{s.oddsPreview}...</div>}
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* ── Генерация на другие даты ── */}
      <div style={{ marginTop: data ? 20 : 0, paddingTop: data ? 20 : 0, borderTop: data ? '1px solid rgba(0,180,255,0.1)' : 'none' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#4a6a8a', marginBottom: 12, letterSpacing: 1, textTransform: 'uppercase' }}>
          Сгенерировать на другую дату (Lite + Hard)
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {DATE_OPTIONS.map(({ key, label, days }) => (
            <button
              key={key}
              onClick={() => generateForDate(key, days)}
              disabled={genLoading[key]}
              style={{
                padding: '9px 20px', borderRadius: 10, border: 'none', fontWeight: 700, fontSize: 13,
                background: genLoading[key] ? 'rgba(0,207,255,0.15)' : 'linear-gradient(90deg,#00cfff,#7b5ea7)',
                color: genLoading[key] ? 'rgba(255,255,255,0.35)' : '#030b18',
                cursor: genLoading[key] ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              {genLoading[key] ? '⏳ Генерируем...' : `${label} (${getDateOffset(days)})`}
            </button>
          ))}
        </div>

        {/* Результаты генерации */}
        {DATE_OPTIONS.map(({ key }) => {
          const r = genResults[key]
          if (!r) return null
          return (
            <div key={key} style={{ marginTop: 12, borderRadius: 10, overflow: 'hidden', border: r.error ? '1px solid rgba(220,38,38,0.25)' : '1px solid rgba(34,197,94,0.25)' }}>
              {r.error ? (
                <div style={{ padding: '10px 14px', background: 'rgba(220,38,38,0.08)', fontSize: 13, color: '#fca5a5' }}>
                  ❌ {r.error}
                </div>
              ) : (
                <div style={{ padding: '12px 16px', background: 'rgba(34,197,94,0.06)' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#4ade80', marginBottom: 10 }}>
                    ✓ Экспресс на {r.date} создан
                  </div>
                  {[{ label: '⚡ Lite', d: r.standard }, { label: '🔥 Hard', d: r.high }].map(({ label, d }) =>
                    d && !d.error ? (
                      <div key={label} style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>
                          {label} · ×{d.total_odds?.toFixed(2)}
                        </div>
                        {d.picks?.map((p, j) => (
                          <div key={j} style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>
                            {j + 1}. {p.home} — {p.away} · <b style={{ color: '#00cfff' }}>{p.prediction}</b> × {p.odds}
                          </div>
                        ))}
                      </div>
                    ) : d?.error ? (
                      <div key={label} style={{ fontSize: 12, color: '#f87171', marginBottom: 6 }}>{label}: {d.error}</div>
                    ) : null
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Hockey Debug Panel ─── */
function HockeyDebugPanel({ toast }) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)
  const [genLoading, setGenLoading] = useState({})
  const [genResults, setGenResults] = useState({})

  const getDateOffset = (days) => {
    const d = new Date()
    d.setDate(d.getDate() + days)
    return d.toISOString().slice(0, 10)
  }

  const DATE_OPTIONS = [
    { key: 'today',      label: '📅 Сегодня',    days: 0 },
    { key: 'overmorrow', label: '📅 Послезавтра', days: 2 },
  ]

  const run = async () => {
    setLoading(true)
    setData(null)
    try {
      const token = localStorage.getItem('valorix_token')
      const res = await fetch(`${API_BASE}/express/debug-hockey`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setData(await res.json())
    } catch (err) {
      setData({ error: err.message })
    } finally {
      setLoading(false)
    }
  }

  const generateForDate = async (dateKey, days) => {
    const date = getDateOffset(days)
    setGenLoading(p => ({ ...p, [dateKey]: true }))
    setGenResults(p => ({ ...p, [dateKey]: null }))
    try {
      const token = localStorage.getItem('valorix_token')
      const [resL, resH] = await Promise.all(
        ['standard', 'high'].map(type =>
          fetch(`${API_BASE}/express/generate`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ sport: 'hockey', type, date }),
          }).then(r => r.json())
        )
      )
      if (resL.error && resH.error) {
        toast.error(resL.error || resH.error)
        setGenResults(p => ({ ...p, [dateKey]: { error: resL.error } }))
      } else {
        toast.success(`🏒 Хоккей на ${date} создан!`)
        setGenResults(p => ({ ...p, [dateKey]: { date, standard: resL, high: resH } }))
      }
    } catch (err) {
      toast.error(err.message)
      setGenResults(p => ({ ...p, [dateKey]: { error: err.message } }))
    } finally {
      setGenLoading(p => ({ ...p, [dateKey]: false }))
    }
  }

  return (
    <div className="card" style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <h3 style={{ fontWeight: 700, fontSize: 16, color: '#dde4ee', display: 'flex', alignItems: 'center', gap: 8 }}>
          🏒 Диагностика хоккейного экспресса
        </h3>
        <button onClick={run} disabled={loading} style={{
          padding: '8px 18px', borderRadius: 10, border: 'none', fontWeight: 700, fontSize: 13,
          background: loading ? 'rgba(14,165,233,0.2)' : 'linear-gradient(90deg,#0ea5e9,#00cfff)',
          color: loading ? 'rgba(255,255,255,0.4)' : '#030b18', cursor: loading ? 'not-allowed' : 'pointer',
        }}>
          {loading ? 'Проверяем...' : '🔍 Проверить'}
        </button>
      </div>
      <p style={{ fontSize: 12, color: '#4a6a8a', marginBottom: data ? 16 : 0 }}>
        Проверяет NHL API + AllSports/Sofascore — матчи ИИХФ ЧМ, КХЛ, МХЛ, ВХЛ, НХЛ на завтра
      </p>

      {data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>

          {/* Ключи + счётчики */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[
              { label: 'NHL API (free)', ok: true },
              { label: `RAPIDAPI_KEY ${data.rapidApiKeySet ? '✓' : '✗'}`, ok: data.rapidApiKeySet },
              { label: `ODDS_API_KEY ${data.oddsApiKeySet ? '✓' : '✗'}`, ok: data.oddsApiKeySet },
            ].map(({ label, ok }) => (
              <span key={label} style={{
                padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                background: ok ? 'rgba(34,197,94,0.12)' : 'rgba(220,38,38,0.12)',
                color: ok ? '#4ade80' : '#f87171',
                border: `1px solid ${ok ? 'rgba(34,197,94,0.3)' : 'rgba(220,38,38,0.3)'}`,
              }}>{label}</span>
            ))}
            <span style={{
              padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
              background: 'rgba(14,165,233,0.1)', color: '#38bdf8', border: '1px solid rgba(14,165,233,0.2)',
            }}>📅 {data.targetDate}</span>
            <span style={{
              padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
              background: data.totalMatches >= 2 ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)',
              color: data.totalMatches >= 2 ? '#4ade80' : '#fbbf24',
              border: `1px solid ${data.totalMatches >= 2 ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}`,
            }}>🏒 Матчей: {data.totalMatches} {data.totalMatches < 2 ? '(нужно минимум 2)' : '✓'}</span>
            {data.totalMatches > 0 && (
              <span style={{
                padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                background: data.withOdds > 0 ? 'rgba(34,197,94,0.12)' : 'rgba(220,38,38,0.12)',
                color: data.withOdds > 0 ? '#4ade80' : '#f87171',
                border: `1px solid ${data.withOdds > 0 ? 'rgba(34,197,94,0.3)' : 'rgba(220,38,38,0.3)'}`,
              }}>📊 С коэф-ами: {data.withOdds}</span>
            )}
          </div>

          {/* Ошибка */}
          {data.error && (
            <div style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#fca5a5' }}>
              ❌ {data.error}
            </div>
          )}

          {/* По источникам */}
          {data.sources && Object.keys(data.sources).length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#4a6a8a', marginBottom: 8, letterSpacing: 1, textTransform: 'uppercase' }}>По источникам на {data.targetDate}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
                {Object.entries(data.sources).map(([name, info]) => (
                  <div key={name} style={{
                    borderRadius: 8, padding: '8px 12px',
                    background: info.status === 'error' ? 'rgba(220,38,38,0.06)' : info.count > 0 ? 'rgba(34,197,94,0.06)' : 'rgba(0,15,40,0.5)',
                    border: `1px solid ${info.status === 'error' ? 'rgba(220,38,38,0.2)' : info.count > 0 ? 'rgba(34,197,94,0.2)' : 'rgba(0,180,255,0.08)'}`,
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#d8eeff', marginBottom: 2 }}>{name}</div>
                    {info.status === 'error'
                      ? <div style={{ fontSize: 11, color: '#f87171' }}>Ошибка: {info.detail}</div>
                      : info.status === 'no_season'
                      ? <div style={{ fontSize: 11, color: '#fbbf24' }}>Сезон не найден</div>
                      : <div style={{ fontSize: 11, color: info.count > 0 ? '#4ade80' : '#4a6a8a' }}>
                          {info.count} матчей
                          {info.sample?.length > 0 && <div style={{ marginTop: 3, color: '#94a3b8' }}>{info.sample.join(' · ')}</div>}
                        </div>
                    }
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Список матчей */}
          {data.matchesList?.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#4a6a8a', marginBottom: 8, letterSpacing: 1, textTransform: 'uppercase' }}>Все найденные матчи</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {data.matchesList.map((m, i) => (
                  <div key={i} style={{ fontSize: 12, color: '#d8eeff', padding: '5px 10px', background: 'rgba(14,165,233,0.04)', borderRadius: 6, border: '1px solid rgba(14,165,233,0.08)' }}>
                    <span style={{ color: '#4a6a8a', marginRight: 6 }}>{i + 1}.</span>
                    <b>{m.home}</b> — <b>{m.away}</b>
                    <span style={{ color: '#4a6a8a', marginLeft: 8, fontSize: 11 }}>{m.league}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Сэмпл коэффициентов */}
          {data.oddsSample?.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#4a6a8a', marginBottom: 8, letterSpacing: 1, textTransform: 'uppercase' }}>Коэффициенты (первые 3)</div>
              {data.oddsSample.map((s, i) => (
                <div key={i} style={{ marginBottom: 6, padding: '8px 12px', background: 'rgba(0,15,40,0.5)', borderRadius: 8, border: '1px solid rgba(14,165,233,0.08)' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#d8eeff', marginBottom: 2 }}>
                    {s.match} — {s.hasOdds
                      ? <span style={{ color: '#4ade80' }}>✓ П1: {s.odds?.home} · П2: {s.odds?.away}</span>
                      : <span style={{ color: '#f87171' }}>✗ нет коэф</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
          {data.oddsError && (
            <div style={{ fontSize: 12, color: '#f87171' }}>Odds API: {data.oddsError}</div>
          )}

        </div>
      )}

      {/* ── Генерация на другие даты ── */}
      <div style={{ marginTop: data ? 20 : 0, paddingTop: data ? 20 : 0, borderTop: data ? '1px solid rgba(14,165,233,0.1)' : 'none' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#4a6a8a', marginBottom: 12, letterSpacing: 1, textTransform: 'uppercase' }}>
          Сгенерировать на другую дату (Lite + Hard)
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {DATE_OPTIONS.map(({ key, label, days }) => (
            <button key={key} onClick={() => generateForDate(key, days)} disabled={genLoading[key]} style={{
              padding: '9px 20px', borderRadius: 10, border: 'none', fontWeight: 700, fontSize: 13,
              background: genLoading[key] ? 'rgba(14,165,233,0.15)' : 'linear-gradient(90deg,#0ea5e9,#00cfff)',
              color: genLoading[key] ? 'rgba(255,255,255,0.35)' : '#030b18',
              cursor: genLoading[key] ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              {genLoading[key] ? '⏳ Генерируем...' : `${label} (${getDateOffset(days)})`}
            </button>
          ))}
        </div>

        {DATE_OPTIONS.map(({ key }) => {
          const r = genResults[key]
          if (!r) return null
          return (
            <div key={key} style={{ marginTop: 12, borderRadius: 10, overflow: 'hidden', border: r.error ? '1px solid rgba(220,38,38,0.25)' : '1px solid rgba(34,197,94,0.25)' }}>
              {r.error ? (
                <div style={{ padding: '10px 14px', background: 'rgba(220,38,38,0.08)', fontSize: 13, color: '#fca5a5' }}>❌ {r.error}</div>
              ) : (
                <div style={{ padding: '12px 16px', background: 'rgba(34,197,94,0.06)' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#4ade80', marginBottom: 10 }}>✓ Хоккей на {r.date} создан</div>
                  {[{ label: '⚡ Lite', d: r.standard }, { label: '🔥 Hard', d: r.high }].map(({ label, d }) =>
                    d && !d.error ? (
                      <div key={label} style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>{label}</div>
                        {d.picks?.map((p, j) => (
                          <div key={j} style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>
                            {j + 1}. {p.home} — {p.away} · <b style={{ color: '#38bdf8' }}>{p.prediction}</b>
                          </div>
                        ))}
                      </div>
                    ) : d?.error ? (
                      <div key={label} style={{ fontSize: 12, color: '#f87171', marginBottom: 6 }}>{label}: {d.error}</div>
                    ) : null
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Esport Debug Panel (CS2 / Dota2) ─── */
function EsportDebugPanel({ game, label, emoji, accentColor, toast }) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)
  const [genLoading, setGenLoading] = useState({})
  const [genResults, setGenResults] = useState({})

  const getDateOffset = (days) => {
    const d = new Date()
    d.setDate(d.getDate() + days)
    return d.toISOString().slice(0, 10)
  }

  const DATE_OPTIONS = [
    { key: 'today',      label: '📅 Сегодня',    days: 0 },
    { key: 'overmorrow', label: '📅 Послезавтра', days: 2 },
  ]

  const run = async () => {
    setLoading(true)
    setData(null)
    try {
      const token = localStorage.getItem('valorix_token')
      const res = await fetch(`${API_BASE}/express/debug-${game}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setData(await res.json())
    } catch (err) {
      setData({ error: err.message })
    } finally {
      setLoading(false)
    }
  }

  const generateForDate = async (dateKey, days) => {
    const date = getDateOffset(days)
    setGenLoading(p => ({ ...p, [dateKey]: true }))
    setGenResults(p => ({ ...p, [dateKey]: null }))
    try {
      const token = localStorage.getItem('valorix_token')
      const [resL, resH] = await Promise.all(
        ['standard', 'high'].map(type =>
          fetch(`${API_BASE}/express/generate`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ sport: game, type, date }),
          }).then(r => r.json())
        )
      )
      if (resL.error && resH.error) {
        toast.error(resL.error || resH.error)
        setGenResults(p => ({ ...p, [dateKey]: { error: resL.error } }))
      } else {
        toast.success(`${emoji} ${label} на ${date} создан!`)
        setGenResults(p => ({ ...p, [dateKey]: { date, standard: resL, high: resH } }))
      }
    } catch (err) {
      toast.error(err.message)
      setGenResults(p => ({ ...p, [dateKey]: { error: err.message } }))
    } finally {
      setGenLoading(p => ({ ...p, [dateKey]: false }))
    }
  }

  const grad = `linear-gradient(90deg,${accentColor},${accentColor}aa)`

  return (
    <div className="card" style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <h3 style={{ fontWeight: 700, fontSize: 16, color: '#dde4ee', display: 'flex', alignItems: 'center', gap: 8 }}>
          {emoji} Диагностика {label} экспресса
        </h3>
        <button onClick={run} disabled={loading} style={{
          padding: '8px 18px', borderRadius: 10, border: 'none', fontWeight: 700, fontSize: 13,
          background: loading ? `${accentColor}33` : grad,
          color: loading ? 'rgba(255,255,255,0.4)' : '#030b18', cursor: loading ? 'not-allowed' : 'pointer',
        }}>
          {loading ? 'Проверяем...' : '🔍 Проверить'}
        </button>
      </div>
      <p style={{ fontSize: 12, color: '#4a6a8a', marginBottom: data ? 16 : 0 }}>
        Проверяет Fonbet — сколько матчей {label} найдено на завтра
      </p>

      {data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: `${accentColor}1a`, color: accentColor, border: `1px solid ${accentColor}44` }}>
              📅 {data.targetDate}
            </span>
            <span style={{
              padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
              background: data.totalMatches >= 2 ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)',
              color: data.totalMatches >= 2 ? '#4ade80' : '#fbbf24',
              border: `1px solid ${data.totalMatches >= 2 ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}`,
            }}>
              {emoji} Матчей: {data.totalMatches} {data.totalMatches < 2 ? '(нужно минимум 2)' : '✓'}
            </span>
          </div>

          {data.error && (
            <div style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#fca5a5' }}>
              ❌ {data.error}
            </div>
          )}

          {data.matchesList?.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#4a6a8a', marginBottom: 8, letterSpacing: 1, textTransform: 'uppercase' }}>Матчи на {data.targetDate}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {data.matchesList.map((m, i) => (
                  <div key={i} style={{ fontSize: 12, color: '#d8eeff', padding: '6px 10px', background: `${accentColor}08`, borderRadius: 6, border: `1px solid ${accentColor}15` }}>
                    <span style={{ color: '#4a6a8a', marginRight: 6 }}>{i + 1}.</span>
                    <b>{m.home}</b> — <b>{m.away}</b>
                    <span style={{ color: '#4a6a8a', marginLeft: 8, fontSize: 11 }}>{m.league}</span>
                    {m.markets?.home && (
                      <span style={{ color: accentColor, marginLeft: 8, fontSize: 11 }}>
                        П1={m.markets.home} П2={m.markets.away}
                        {m.markets.tb25 ? ` ТБ2.5к=${m.markets.tb25}` : ''}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Генерация на другие даты */}
      <div style={{ marginTop: data ? 20 : 0, paddingTop: data ? 20 : 0, borderTop: data ? `1px solid ${accentColor}1a` : 'none' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#4a6a8a', marginBottom: 12, letterSpacing: 1, textTransform: 'uppercase' }}>
          Сгенерировать на другую дату (Lite + Hard)
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {DATE_OPTIONS.map(({ key, label: dlabel, days }) => (
            <button key={key} onClick={() => generateForDate(key, days)} disabled={genLoading[key]} style={{
              padding: '9px 20px', borderRadius: 10, border: 'none', fontWeight: 700, fontSize: 13,
              background: genLoading[key] ? `${accentColor}26` : grad,
              color: genLoading[key] ? 'rgba(255,255,255,0.35)' : '#030b18',
              cursor: genLoading[key] ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              {genLoading[key] ? '⏳ Генерируем...' : `${dlabel} (${getDateOffset(days)})`}
            </button>
          ))}
        </div>

        {DATE_OPTIONS.map(({ key }) => {
          const r = genResults[key]
          if (!r) return null
          return (
            <div key={key} style={{ marginTop: 12, borderRadius: 10, overflow: 'hidden', border: r.error ? '1px solid rgba(220,38,38,0.25)' : '1px solid rgba(34,197,94,0.25)' }}>
              {r.error ? (
                <div style={{ padding: '10px 14px', background: 'rgba(220,38,38,0.08)', fontSize: 13, color: '#fca5a5' }}>❌ {r.error}</div>
              ) : (
                <div style={{ padding: '12px 16px', background: 'rgba(34,197,94,0.06)' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#4ade80', marginBottom: 10 }}>✓ {label} на {r.date} создан</div>
                  {[{ lbl: '⚡ Lite', d: r.standard }, { lbl: '🔥 Hard', d: r.high }].map(({ lbl, d }) =>
                    d && !d.error ? (
                      <div key={lbl} style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>{lbl} · ×{d.total_odds?.toFixed(2)}</div>
                        {d.picks?.map((p, j) => (
                          <div key={j} style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>
                            {j + 1}. {p.home} — {p.away} · <b style={{ color: accentColor }}>{p.prediction}</b> × {p.odds}
                          </div>
                        ))}
                      </div>
                    ) : d?.error ? (
                      <div key={lbl} style={{ fontSize: 12, color: '#f87171', marginBottom: 6 }}>{lbl}: {d.error}</div>
                    ) : null
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── API Status Panel ─── */
function ApiStatusPanel() {
  const [loading, setLoading] = useState(false)
  const [apis, setApis] = useState(null)

  const check = async () => {
    setLoading(true)
    setApis(null)
    try {
      const token = localStorage.getItem('valorix_token')
      const res = await fetch(`${API_BASE}/admin/api-status`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setApis(await res.json())
    } catch (err) {
      setApis([{ name: 'Ошибка', icon: '❌', status: 'error', detail: err.message, ms: 0 }])
    } finally {
      setLoading(false)
    }
  }

  const STATUS = {
    ok:     { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', label: 'Работает' },
    error:  { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', label: 'Ошибка'   },
    no_key: { color: '#d97706', bg: '#fffbeb', border: '#fde68a', label: 'Нет ключа' },
  }

  return (
    <div className="card" style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <h3 style={{ fontWeight: 700, fontSize: 16, color: '#dde4ee', display: 'flex', alignItems: 'center', gap: 8 }}>
          🔌 Подключённые API
        </h3>
        <button onClick={check} disabled={loading} style={{
          padding: '8px 18px', borderRadius: 10, border: 'none', fontWeight: 700, fontSize: 13,
          background: loading ? 'rgba(0,207,255,0.2)' : 'linear-gradient(90deg,#00cfff,#7b5ea7)', color: loading ? 'rgba(255,255,255,0.4)' : '#030b18', cursor: loading ? 'not-allowed' : 'pointer',
        }}>
          {loading ? 'Проверяем...' : 'Проверить всё'}
        </button>
      </div>
      <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: apis ? 16 : 0 }}>
        Проверяет доступность всех API — ключи остаются на сервере, в браузер не передаются
      </p>

      {apis && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
          {apis.map((api, i) => {
            const s = STATUS[api.status] || STATUS.error
            return (
              <div key={i} style={{
                borderRadius: 10, padding: '12px 16px',
                background: s.bg, border: `1.5px solid ${s.border}`,
                display: 'flex', alignItems: 'flex-start', gap: 12,
              }}>
                <div style={{ fontSize: 22, lineHeight: 1, marginTop: 1 }}>{api.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#dde4ee' }}>{api.name}</div>
                    <span style={{
                      fontSize: 11, fontWeight: 700, color: s.color,
                      background: '#0c0f18', border: `1px solid ${s.border}`,
                      borderRadius: 20, padding: '2px 8px', whiteSpace: 'nowrap',
                    }}>
                      {api.status === 'ok' ? '✓ ' : api.status === 'no_key' ? '⚠ ' : '✗ '}{s.label}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: '#556070', marginTop: 4, wordBreak: 'break-word' }}>
                    {api.detail}
                    {api.ms > 0 && <span style={{ color: '#94a3b8', marginLeft: 6 }}>{api.ms}ms</span>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ─── Users ─── */
function UsersTab({ toast }) {
  const [data, setData] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState({})

  const load = async (s = search, p = page) => {
    setLoading(true)
    setData(await getUsers(s, p))
    setLoading(false)
  }

  useEffect(() => { load() }, [page])

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    load(search, 1)
  }

  const action = async (label, fn) => {
    setActionLoading(a => ({ ...a, [label]: true }))
    const res = await fn()
    setActionLoading(a => ({ ...a, [label]: false }))
    if (res.success) { toast.success('Обновлено'); load() }
    else toast.error(res.error || 'Ошибка')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по email или имени..."
            style={{ ...inputStyle, paddingLeft: 36, width: '100%' }}
          />
        </div>
        <button type="submit" className="btn-primary" style={{ padding: '10px 20px', fontSize: 14 }}>Найти</button>
      </form>

      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 36 }} />)}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid rgba(0,180,255,0.08)', background: '#0a0d14' }}>
                  {['Email', 'Username', 'Монеты', 'Анализов', 'Статус', 'Действия'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 12px', color: '#64748b', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data?.users?.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid rgba(0,180,255,0.06)' }}>
                    <td style={tdStyle}>{u.email}</td>
                    <td style={tdStyle}>{u.username}</td>
                    <td style={tdStyle}><CoinPill n={u.coins} /></td>
                    <td style={tdStyle}>{u.analyses_count}</td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {u.is_admin ? <span style={pillStyle('#00cfff')}>Admin</span> : null}
                        {u.is_blocked ? <span style={pillStyle('#dc2626')}>Заблокирован</span> : <span style={pillStyle('#10b981')}>Активен</span>}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <ActionBtn
                          icon={u.is_admin ? <Minus size={12} /> : <Shield size={12} />}
                          label={u.is_admin ? 'Снять Admin' : 'Сделать Admin'}
                          color={u.is_admin ? '#4a6a8a' : '#00cfff'}
                          loading={actionLoading[`admin_${u.id}`]}
                          onClick={() => action(`admin_${u.id}`, () => setAdmin(u.email, !u.is_admin))}
                        />
                        <ActionBtn
                          icon={u.is_blocked ? <Plus size={12} /> : <Ban size={12} />}
                          label={u.is_blocked ? 'Разблокировать' : 'Заблокировать'}
                          color={u.is_blocked ? '#10b981' : '#dc2626'}
                          loading={actionLoading[`block_${u.id}`]}
                          onClick={() => action(`block_${u.id}`, () => setBlocked(u.email, !u.is_blocked))}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {data && data.pages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={pageBtn}>
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontSize: 14, color: '#64748b' }}>Страница {page} из {data.pages}</span>
          <button onClick={() => setPage(p => Math.min(data.pages, p + 1))} disabled={page === data.pages} style={pageBtn}>
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}

/* ─── Transactions ─── */
function TransactionsTab() {
  const [data, setData] = useState(null)
  const [page, setPage] = useState(1)

  const load = async (p = page) => {
    setData(await getTransactions(p))
  }

  useEffect(() => { load() }, [page])

  const typeLabel = (t) => {
    const map = { purchase: ['Покупка', '#10b981'], admin_add: ['Начислено', '#00cfff'], admin_remove: ['Снято', '#f97316'], spend: ['Трата', '#7b5ea7'] }
    return map[t] || [t, '#94a3b8']
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(0,180,255,0.08)', background: '#0a0d14' }}>
                {['Пользователь', 'Тип', 'Монеты', 'Описание', 'Дата'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 12px', color: '#64748b', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data?.transactions?.map(tx => {
                const [label, color] = typeLabel(tx.type)
                return (
                  <tr key={tx.id} style={{ borderBottom: '1px solid rgba(0,180,255,0.06)' }}>
                    <td style={tdStyle}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{tx.username}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{tx.email}</div>
                    </td>
                    <td style={tdStyle}><span style={pillStyle(color)}>{label}</span></td>
                    <td style={tdStyle}>
                      <span style={{ fontWeight: 700, color: tx.amount > 0 ? '#10b981' : '#dc2626' }}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.description || '—'}</td>
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{new Date(tx.created_at).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {data && data.pages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={pageBtn}>
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontSize: 14, color: '#64748b' }}>Страница {page} из {data.pages}</span>
          <button onClick={() => setPage(p => Math.min(data.pages, p + 1))} disabled={page === data.pages} style={pageBtn}>
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}

/* ─── Cache Panel ─── */
function CachePanel({ toast }) {
  const [entries, setEntries] = useState(null)
  const [loading, setLoading] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [pattern, setPattern] = useState('')

  const token = () => localStorage.getItem('valorix_token')

  const loadCache = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/admin/cache`, { headers: { Authorization: `Bearer ${token()}` } })
      const data = await res.json()
      setEntries(data.entries || [])
    } catch { toast.error('Ошибка загрузки кэша') }
    setLoading(false)
  }

  const clearCache = async (p = '') => {
    setClearing(true)
    try {
      const url = p ? `${API_BASE}/admin/cache?pattern=${encodeURIComponent(p)}` : `${API_BASE}/admin/cache`
      const res = await fetch(url, { method: 'DELETE', headers: { Authorization: `Bearer ${token()}` } })
      const data = await res.json()
      toast.success(`Удалено записей: ${data.deleted}`)
      setEntries(null)
    } catch { toast.error('Ошибка очистки') }
    setClearing(false)
  }

  return (
    <div className="card" style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <h3 style={{ fontWeight: 700, fontSize: 16, color: '#dde4ee', display: 'flex', alignItems: 'center', gap: 8 }}>
          🗄️ Кэш анализов
        </h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={loadCache} disabled={loading} style={{
            padding: '7px 14px', fontSize: 13, borderRadius: 8, border: '1px solid rgba(0,207,255,0.3)',
            background: 'rgba(0,207,255,0.08)', color: '#00cfff', cursor: 'pointer', fontWeight: 600,
          }}>
            {loading ? '...' : '🔍 Посмотреть'}
          </button>
          <button onClick={() => clearCache('f_')} disabled={clearing} style={{
            padding: '7px 14px', fontSize: 13, borderRadius: 8, border: '1px solid rgba(245,158,11,0.3)',
            background: 'rgba(245,158,11,0.08)', color: '#f59e0b', cursor: 'pointer', fontWeight: 600,
          }}>
            {clearing ? '...' : '🧹 Очистить скрин-анализы'}
          </button>
          <button onClick={() => clearCache('')} disabled={clearing} style={{
            padding: '7px 14px', fontSize: 13, borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)',
            background: 'rgba(239,68,68,0.08)', color: '#ef4444', cursor: 'pointer', fontWeight: 600,
          }}>
            {clearing ? '...' : '🗑️ Очистить всё'}
          </button>
        </div>
      </div>

      {/* Очистка по паттерну */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          value={pattern}
          onChange={e => setPattern(e.target.value)}
          placeholder="Паттерн (напр: аякс, f_real, tf_)"
          style={{ ...inputStyle, flex: 1, minWidth: 0 }}
        />
        <button onClick={() => clearCache(pattern)} disabled={clearing || !pattern} style={{
          padding: '7px 14px', fontSize: 13, borderRadius: 8, border: '1px solid rgba(239,68,68,0.25)',
          background: 'rgba(239,68,68,0.08)', color: '#ef4444', cursor: pattern ? 'pointer' : 'not-allowed',
          fontWeight: 600, opacity: pattern ? 1 : 0.5,
        }}>
          Удалить по паттерну
        </button>
      </div>

      {entries !== null && (
        <div>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>
            Записей в кэше: <b style={{ color: '#dde4ee' }}>{entries.length}</b>
          </div>
          {entries.length > 0 && (
            <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {entries.map((e, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '6px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 6,
                  fontSize: 12,
                }}>
                  <span style={{ color: '#94a3b8', fontFamily: 'monospace' }}>{e.key}</span>
                  <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
                    <span style={{ color: e.age_minutes < 60 ? '#22c55e' : '#f59e0b' }}>{e.age_minutes}м назад</span>
                    <span style={{ color: '#64748b' }}>{e.size_kb} KB</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Helpers ─── */
function CoinPill({ n }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: 'rgba(0,207,255,0.08)', borderRadius: 20, padding: '2px 8px', fontSize: 12, fontWeight: 700, color: '#00cfff' }}>
      <Zap size={10} color="#00cfff" fill="#00cfff" />{n}
    </span>
  )
}

function ActionBtn({ icon, label, color, loading, onClick }) {
  return (
    <button onClick={onClick} disabled={loading} style={{
      display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px',
      borderRadius: 8, border: `1px solid ${color}20`, background: `${color}10`,
      color, fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
      opacity: loading ? 0.5 : 1,
    }}>
      {icon}{loading ? '...' : label}
    </button>
  )
}

const inputStyle = {
  border: '1.5px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '10px 14px',
  fontSize: 14, outline: 'none', background: '#0c0f18', color: '#dde4ee',
  fontFamily: 'Outfit, sans-serif', width: 240,
}

const tdStyle = { padding: '10px 12px', verticalAlign: 'middle' }

const pageBtn = {
  background: '#0c0f18', border: '1.5px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '6px 10px',
  cursor: 'pointer', display: 'flex', alignItems: 'center',
}

const pillStyle = (color) => ({
  background: `${color}15`, color, borderRadius: 20, padding: '2px 8px',
  fontSize: 11, fontWeight: 700, display: 'inline-block', whiteSpace: 'nowrap',
})

/* ─── Blog editor preview components ─── */
const previewComponents = {
  h2: ({ children }) => <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', margin: '1.5rem 0 0.7rem', borderBottom: '1px solid rgba(0,207,255,0.15)', paddingBottom: '0.4rem' }}>{children}</h2>,
  h3: ({ children }) => <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#e2e8f0', margin: '1.2rem 0 0.5rem' }}>{children}</h3>,
  p: ({ children }) => <p style={{ color: '#94a3b8', lineHeight: 1.8, marginBottom: '0.85rem', fontSize: '0.93rem' }}>{children}</p>,
  ul: ({ children }) => <ul style={{ color: '#94a3b8', paddingLeft: '1.4rem', marginBottom: '0.9rem', lineHeight: 1.7 }}>{children}</ul>,
  ol: ({ children }) => <ol style={{ color: '#94a3b8', paddingLeft: '1.4rem', marginBottom: '0.9rem', lineHeight: 1.7 }}>{children}</ol>,
  li: ({ children }) => <li style={{ marginBottom: '0.25rem' }}>{children}</li>,
  strong: ({ children }) => <strong style={{ color: '#00cfff', fontWeight: 700 }}>{children}</strong>,
  em: ({ children }) => <em style={{ color: '#a78bfa', fontStyle: 'italic' }}>{children}</em>,
  blockquote: ({ children }) => <blockquote style={{ borderLeft: '3px solid #00cfff', margin: '1rem 0', background: 'rgba(0,207,255,0.05)', borderRadius: '0 8px 8px 0', padding: '0.6rem 1rem', color: '#94a3b8' }}>{children}</blockquote>,
  img: ({ src, alt }) => (
    <figure style={{ margin: '1.5rem 0', textAlign: 'center' }}>
      <img src={src} alt={alt || ''} style={{ maxWidth: '100%', borderRadius: 12, border: '1px solid rgba(0,207,255,0.15)', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }} />
      {alt && <figcaption style={{ fontSize: 12, color: '#475569', marginTop: 8, fontStyle: 'italic' }}>{alt}</figcaption>}
    </figure>
  ),
  a: ({ href, children }) => <a href={href} style={{ color: '#00cfff', textDecoration: 'none' }}>{children}</a>,
  code: ({ children }) => <code style={{ background: 'rgba(0,207,255,0.1)', color: '#00cfff', padding: '1px 6px', borderRadius: 4, fontSize: '0.9em', fontFamily: 'monospace' }}>{children}</code>,
}

/* ─── Blog Tab ─── */
function BlogTab({ toast }) {
  const token = () => localStorage.getItem('valorix_token')
  const [sportTab, setSportTab] = useState('football') // football | hockey | all
  const [articles, setArticles] = useState([])
  const [matches, setMatches] = useState([])
  const [matchKeys, setMatchKeys] = useState(new Set())
  const [generatingKey, setGeneratingKey] = useState(null)
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [sortBy, setSortBy] = useState('date') // 'date' | 'views'
  const [uploading, setUploading] = useState(false)
  const [customTopic, setCustomTopic] = useState('')
  const [generatingCustom, setGeneratingCustom] = useState(false)
  const fileInputRef = useRef(null)

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Файл слишком большой (макс. 5 МБ)'); return }
    setUploading(true)
    const reader = new FileReader()
    reader.onload = async (ev) => {
      try {
        const res = await fetch(`${API_BASE}/upload/image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
          body: JSON.stringify({ data: ev.target.result, filename: file.name }),
        })
        const data = await res.json()
        if (data.url) {
          const fullUrl = `https://web-production-fefcd.up.railway.app${data.url}`
          setEditing(p => ({ ...p, cover_url: fullUrl }))
          toast.success('Картинка загружена!')
        } else {
          toast.error(data.error || 'Ошибка загрузки')
        }
      } catch { toast.error('Ошибка загрузки') }
      finally { setUploading(false); e.target.value = '' }
    }
    reader.readAsDataURL(file)
  }
  const textareaRef = useRef(null)

  const insertAtCursor = (before, after = '', placeholder = 'текст') => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const cur = editing?.content || ''
    const selected = cur.substring(start, end)
    const insertion = (placeholder === '' && !selected) ? '' : (selected || placeholder)
    const newContent = cur.substring(0, start) + before + insertion + after + cur.substring(end)
    setEditing(p => ({ ...p, content: newContent }))
    setTimeout(() => {
      ta.focus()
      const cursor = start + before.length + insertion.length + after.length
      ta.setSelectionRange(cursor, cursor)
    }, 10)
  }

  const load = async (sport) => {
    setLoading(true)
    try {
      const sportParam = sport !== 'all' ? `?sport=${sport}` : ''
      const [artRes, keysRes] = await Promise.all([
        fetch(`${API_BASE}/blog/admin/list${sportParam}`, { headers: { Authorization: `Bearer ${token()}` } }),
        fetch(`${API_BASE}/blog/admin/match-keys`, { headers: { Authorization: `Bearer ${token()}` } }),
      ])
      const artData = await artRes.json()
      const keysData = await keysRes.json()
      setArticles(artData.items || [])
      setMatchKeys(new Set(keysData.keys || []))

      // Load upcoming matches — same sources as Analyze page (Fonbet, pre-match only)
      if (sport === 'football') {
        const mRes = await fetch(`${API_BASE}/matches/football`)
        const mData = await mRes.json()
        setMatches((mData.data || []).filter(m => !m.isLive).slice(0, 20))
      } else if (sport === 'hockey') {
        const mRes = await fetch(`${API_BASE}/matches/hockey-fonbet`)
        const mData = await mRes.json()
        setMatches((mData.data || []).filter(m => !m.isLive).slice(0, 20))
      } else if (sport === 'cs2' || sport === 'dota2') {
        const mRes = await fetch(`${API_BASE}/matches/esports`)
        const mData = await mRes.json()
        setMatches((mData.data || []).filter(m => m.sport === sport && !m.isLive).slice(0, 20))
      } else {
        setMatches([])
      }
    } catch { toast.error('Ошибка загрузки') }
    setLoading(false)
  }

  useEffect(() => { load(sportTab) }, [sportTab])

  // Helper: extract team name whether it's a string or sstats object {id, name}
  const teamName = (t) => typeof t === 'object' && t !== null ? (t.name || '') : (t || '')

  const generateArticle = async (match, autoPub = false) => {
    const home = teamName(match.home || match.homeTeam)
    const away = teamName(match.away || match.awayTeam)
    const league = match.league || match.season?.league?.name || match.tournamentName || ''
    const homeId = match.homeId || match.homeTeam?.id
    const awayId = match.awayId || match.awayTeam?.id
    const date = String(match.rawDate || match.date || '').slice(0, 10)
    const matchKey = `${sportTab}_${home}_${away}_${date}`
    setGeneratingKey(matchKey)
    try {
      const r = await fetch(`${API_BASE}/blog/generate-from-match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({
          home, away, league, date,
          matchId: match.id,
          homeId, awayId,
          sport: sportTab,
          published: autoPub,
        }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      if (d.already) { toast.success('Статья уже написана'); return }
      setMatchKeys(prev => new Set([...prev, matchKey]))
      toast.success(autoPub ? '✅ Статья написана и опубликована!' : '✍️ Статья написана! Можешь отредактировать.')
      load(sportTab)
    } catch(e) { toast.error(e.message) }
    setGeneratingKey(null)
  }

  const generateAllArticles = async () => {
    const pending = matches.filter(m => {
      const home = teamName(m.home || m.homeTeam) || '?'
      const away = teamName(m.away || m.awayTeam) || '?'
      const rawDate = String(m.rawDate || m.date || '').slice(0, 10)
      return !matchKeys.has(`${sportTab}_${home}_${away}_${rawDate}`)
    })
    if (pending.length === 0) { toast.success('Все статьи уже написаны!'); return }
    for (const m of pending) {
      await generateArticle(m, true)
    }
  }

  const generateCustomArticle = async () => {
    if (!customTopic.trim()) return toast.error('Введи тему статьи')
    setGeneratingCustom(true)
    try {
      const sportMap = { football: 'football', hockey: 'hockey', cs2: 'cs2', dota2: 'dota2' }
      const sport = sportMap[sportTab] || 'other'
      const r = await fetch(`${API_BASE}/blog/generate-custom`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ topic: customTopic.trim(), sport }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      setCustomTopic('')
      toast.success('✍️ Статья написана! Открываю редактор...')
      load(sportTab)
      setEditing(d.article)
    } catch (e) { toast.error(e.message) }
    setGeneratingCustom(false)
  }

  const save = async () => {
    if (!editing.title?.trim()) return toast.error('Введи заголовок')
    if (!editing.content?.trim()) return toast.error('Введи текст статьи')
    setSaving(true)
    try {
      const method = editing.id ? 'PUT' : 'POST'
      const url = editing.id ? `${API_BASE}/blog/${editing.id}` : `${API_BASE}/blog`
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify(editing),
      })
      if (!r.ok) throw new Error((await r.json()).error)
      toast.success(editing.id ? 'Статья обновлена' : 'Статья создана')
      setEditing(null)
      load()
    } catch (e) { toast.error(e.message) }
    setSaving(false)
  }

  const del = async (id) => {
    if (!confirm('Удалить статью?')) return
    await fetch(`${API_BASE}/blog/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token()}` } })
    toast.success('Удалено')
    load()
  }

  const togglePublish = async (article) => {
    await fetch(`${API_BASE}/blog/${article.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ published: !article.published }),
    })
    load()
  }

  const inp = { background: '#0c0f18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', color: '#fff', width: '100%', fontSize: 14, outline: 'none', boxSizing: 'border-box' }

  const TOOLBAR = [
    { label: 'H2',       title: 'Заголовок раздела',  action: () => insertAtCursor('\n## ', '\n', 'Заголовок раздела'),   style: { fontWeight: 800 } },
    { label: 'H3',       title: 'Подзаголовок',        action: () => insertAtCursor('\n### ', '\n', 'Подзаголовок'),       style: { fontWeight: 700 } },
    { label: 'Ж',        title: 'Жирный текст',        action: () => insertAtCursor('**', '**', 'жирный текст'),          style: { fontWeight: 900 } },
    { label: 'К',        title: 'Курсив',              action: () => insertAtCursor('*', '*', 'курсив'),                  style: { fontStyle: 'italic' } },
    { label: '— Список', title: 'Пункт списка',        action: () => insertAtCursor('\n- ', '', 'пункт списка'),          style: {} },
    { label: '❝ Цитата', title: 'Цитата / выделение',  action: () => insertAtCursor('\n> ', '', 'текст цитаты'),          style: {} },
    { label: '🔗 Ссылка', title: 'Вставить ссылку',    action: () => insertAtCursor('[', '](https://valorix.ru)', 'текст ссылки'), style: {} },
    { label: '🖼 Valorix AI', title: 'Вставить картинку Valorix AI', action: () => insertAtCursor('\n![Пример AI-анализа от Valorix](/blog-assets/valorix-ai-example.jpg)\n', '', ''), style: { color: '#00cfff', borderColor: 'rgba(0,207,255,0.35)', background: 'rgba(0,207,255,0.08)' }, accent: true },
  ]

  if (editing) return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 180px)', minHeight: 600 }}>

      {/* ── Top bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
        <button onClick={() => setEditing(null)} style={{ ...pageBtn, color: '#94a3b8', fontSize: 13, padding: '6px 14px' }}>← Назад</button>
        <h2 style={{ color: '#fff', fontSize: 17, fontWeight: 700, margin: 0 }}>
          {editing.id ? 'Редактировать статью' : 'Новая статья'}
        </h2>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: '#94a3b8', fontSize: 13, userSelect: 'none' }}>
            <input type="checkbox" checked={!!editing.published} onChange={e => setEditing(p => ({ ...p, published: e.target.checked }))} />
            Опубликовать
          </label>
          {editing.id && editing.slug && (
            <a
              href={`https://search.google.com/search-console/inspect?resource_id=https%3A%2F%2Fvalorix.ru%2F&item_url=https%3A%2F%2Fvalorix.ru%2Fblog%2F${editing.slug}%2F`}
              target="_blank" rel="noreferrer"
              title="Открыть Google Search Console — нажми «Запросить индексирование»"
              style={{ padding: '9px 14px', borderRadius: 10, border: '1px solid rgba(66,133,244,0.4)', background: 'rgba(66,133,244,0.1)', color: '#4285f4', fontWeight: 700, fontSize: 13, textDecoration: 'none', whiteSpace: 'nowrap' }}
            >
              🔍 Google
            </a>
          )}
          <button onClick={save} disabled={saving} style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: 10, padding: '9px 24px', color: '#fff', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, fontSize: 14 }}>
            {saving ? 'Сохраняю...' : (editing.id ? 'Сохранить' : 'Создать')}
          </button>
        </div>
      </div>

      {/* ── Meta fields ── */}
      <div style={{ display: 'flex', gap: 10, padding: '10px 20px', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap' }}>
        <input style={{ ...inp, flex: '2 1 200px' }} placeholder="Заголовок статьи *" value={editing.title || ''} onChange={e => setEditing(p => ({ ...p, title: e.target.value }))} />
        <input style={{ ...inp, flex: '3 1 250px' }} placeholder="Краткое описание (для Google и карточки в блоге)" value={editing.excerpt || ''} onChange={e => setEditing(p => ({ ...p, excerpt: e.target.value }))} />
        <input style={{ ...inp, flex: '1 1 140px' }} placeholder="URL (slug, авто)" value={editing.slug || ''} onChange={e => setEditing(p => ({ ...p, slug: e.target.value }))} />
        <div style={{ flex: '1 1 140px', display: 'flex', gap: 6, alignItems: 'center' }}>
          <input
            style={{ ...inp, flex: 1, fontSize: 12 }}
            placeholder="URL обложки"
            value={editing.cover_url || ''}
            onChange={e => setEditing(p => ({ ...p, cover_url: e.target.value }))}
          />
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            title="Загрузить картинку с компьютера"
            style={{
              flexShrink: 0, padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(0,207,255,0.3)',
              background: uploading ? 'rgba(0,207,255,0.05)' : 'rgba(0,207,255,0.1)',
              color: uploading ? '#475569' : '#00cfff', cursor: uploading ? 'not-allowed' : 'pointer',
              fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
            }}
          >
            {uploading ? '⏳' : '📁 Загрузить'}
          </button>
          {editing.cover_url && (
            <img
              src={editing.cover_url}
              alt=""
              style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}
              onError={e => { e.target.style.display = 'none' }}
            />
          )}
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div style={{ display: 'flex', gap: 6, padding: '8px 20px', flexShrink: 0, background: 'rgba(0,0,0,0.25)', borderBottom: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap', alignItems: 'center' }}>
        {TOOLBAR.map((btn, i) => (
          <button key={i} onClick={btn.action} title={btn.title} style={{
            padding: '5px 13px', borderRadius: 7,
            border: `1px solid ${btn.accent ? 'rgba(0,207,255,0.3)' : 'rgba(255,255,255,0.1)'}`,
            background: btn.accent ? 'rgba(0,207,255,0.08)' : 'rgba(255,255,255,0.05)',
            color: btn.accent ? '#00cfff' : '#c0cde0',
            fontSize: 13, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
            ...btn.style,
          }}>
            {btn.label}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 11, color: '#334155' }}>
          {(editing.content || '').length} симв.
        </span>
      </div>

      {/* ── Split editor ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Left — Markdown textarea */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.07)', minWidth: 0 }}>
          <div style={{ fontSize: 10, color: '#334155', padding: '5px 20px', background: 'rgba(0,0,0,0.3)', flexShrink: 0, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' }}>✏️ Редактор</div>
          <textarea
            ref={textareaRef}
            style={{ flex: 1, resize: 'none', padding: '16px 20px', background: '#07090f', color: '#c0cde0', border: 'none', outline: 'none', fontFamily: '"Fira Code", "Cascadia Code", monospace', fontSize: 13.5, lineHeight: 1.75, overflowY: 'auto' }}
            value={editing.content || ''}
            onChange={e => setEditing(p => ({ ...p, content: e.target.value }))}
            placeholder={'Нажми кнопки тулбара выше или пиши прямо здесь...\n\nH2 → вставит заголовок раздела\nЖ → выдели текст и нажми для жирного\nСписок → вставит пункт\nВалорикс AI → вставит картинку с анализом'}
          />
        </div>

        {/* Right — Live preview */}
        <div style={{ flex: 1, overflowY: 'auto', background: '#030b18', minWidth: 0 }}>
          <div style={{ fontSize: 10, color: '#334155', padding: '5px 20px', background: 'rgba(0,0,0,0.3)', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', position: 'sticky', top: 0, zIndex: 1 }}>👁 Предпросмотр</div>
          <div style={{ padding: '16px 24px' }}>
            {editing.content?.trim()
              ? <ReactMarkdown components={previewComponents}>{editing.content}</ReactMarkdown>
              : <p style={{ color: '#1e3a5f', fontSize: 14, marginTop: 20, textAlign: 'center' }}>Начни писать — здесь появится предпросмотр</p>
            }
          </div>
        </div>

      </div>
    </div>
  )

  const SPORT_TABS = [
    { key: 'football', label: '⚽ Футбол' },
    { key: 'hockey',   label: '🏒 Хоккей' },
    { key: 'cs2',      label: '🔫 CS2' },
    { key: 'dota2',    label: '🎮 Dota 2' },
    { key: 'all',      label: '📋 Все статьи' },
  ]

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: 0 }}>Блог</h2>
        <button onClick={() => setEditing({ title: '', content: '', excerpt: '', published: false, sport: sportTab !== 'all' ? sportTab : 'other' })}
          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: 10, padding: '9px 20px', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
          + Новая статья
        </button>
      </div>

      {/* Sport sub-tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: 16 }}>
        {SPORT_TABS.map(t => (
          <button key={t.key} onClick={() => setSportTab(t.key)} style={{
            padding: '7px 16px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            background: sportTab === t.key ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(255,255,255,0.05)',
            color: sportTab === t.key ? '#fff' : '#94a3b8', transition: 'all 0.2s',
          }}>{t.label}</button>
        ))}
      </div>

      {loading ? <p style={{ color: '#64748b' }}>Загрузка...</p> : (
        <>
          {/* Upcoming matches with generate button */}
          {(['football','hockey','cs2','dota2'].includes(sportTab)) && matches.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <p style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>
                  Ближайшие матчи ({matches.filter(m => !matchKeys.has(`${sportTab}_${teamName(m.home||m.homeTeam)||'?'}_${teamName(m.away||m.awayTeam)||'?'}_${String(m.rawDate||m.date||'').slice(0,10)}`)).length} без статьи)
                </p>
                <button
                  onClick={generateAllArticles}
                  disabled={!!generatingKey}
                  style={{
                    background: generatingKey ? 'rgba(99,102,241,0.2)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                    border: 'none', borderRadius: 8, padding: '7px 16px',
                    color: generatingKey ? '#64748b' : '#fff', fontSize: 13, fontWeight: 700,
                    cursor: generatingKey ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
                  }}
                >
                  {generatingKey ? '⏳ Генерирую...' : '⚡ Написать все + опубликовать'}
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {matches.map((m, i) => {
                  const home = teamName(m.home || m.homeTeam) || '?'
                  const away = teamName(m.away || m.awayTeam) || '?'
                  const league = String(m.league || m.season?.league?.name || m.tournamentName || '')
                  const rawDate = String(m.rawDate || m.date || '').slice(0, 10)
                  const matchKey = `${sportTab}_${home}_${away}_${rawDate}`
                  const done = matchKeys.has(matchKey)
                  const generating = generatingKey === matchKey
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, background: done ? 'rgba(34,197,94,0.04)' : 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '10px 14px', border: done ? '1px solid rgba(34,197,94,0.1)' : '1px solid transparent' }}>
                      {rawDate && (
                        <span style={{ fontSize: 11, color: '#475569', fontWeight: 700, minWidth: 70, background: 'rgba(0,180,255,0.06)', padding: '2px 8px', borderRadius: 20, textAlign: 'center', flexShrink: 0 }}>
                          {new Date(rawDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>{home}</span>
                        <span style={{ color: '#64748b', margin: '0 8px' }}>—</span>
                        <span style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>{away}</span>
                        {league && <span style={{ color: '#475569', fontSize: 12, marginLeft: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{league}</span>}
                      </div>
                      {done ? (
                        <span style={{ ...pillStyle('#22c55e'), fontSize: 11, padding: '4px 10px', flexShrink: 0 }}>✓ Готово</span>
                      ) : (
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          <button
                            onClick={() => generateArticle(m, false)}
                            disabled={!!generatingKey}
                            title="Написать статью (черновик — можно редактировать)"
                            style={{ background: generating ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.35)', borderRadius: 8, padding: '5px 12px', color: '#a78bfa', fontSize: 12, fontWeight: 600, cursor: generatingKey ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
                            {generating ? '⏳...' : '✍️ Черновик'}
                          </button>
                          <button
                            onClick={() => generateArticle(m, true)}
                            disabled={!!generatingKey}
                            title="Написать и сразу опубликовать"
                            style={{ background: generating ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, padding: '5px 12px', color: '#4ade80', fontSize: 12, fontWeight: 600, cursor: generatingKey ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
                            {generating ? '⏳...' : '🚀 Публикую'}
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Custom topic article generator */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 18, alignItems: 'center' }}>
            <input
              style={{ flex: 1, background: '#0c0f18', border: '1px solid rgba(0,207,255,0.25)', borderRadius: 10, padding: '9px 14px', color: '#fff', fontSize: 14, outline: 'none' }}
              placeholder="Тема статьи — например: «Кто станет чемпионом Major CS2»"
              value={customTopic}
              onChange={e => setCustomTopic(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && generateCustomArticle()}
              disabled={generatingCustom}
            />
            <button
              onClick={generateCustomArticle}
              disabled={generatingCustom || !customTopic.trim()}
              style={{
                background: generatingCustom ? 'rgba(0,207,255,0.1)' : 'linear-gradient(135deg,#00cfff,#0080ff)',
                border: 'none', borderRadius: 10, padding: '9px 18px',
                color: generatingCustom ? '#475569' : '#fff', fontSize: 13, fontWeight: 700,
                cursor: (generatingCustom || !customTopic.trim()) ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
              }}
            >
              {generatingCustom ? '⏳ Пишу...' : '🤖 Написать через AI'}
            </button>
          </div>

          {/* Articles list */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <p style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>
              {articles.length > 0 ? `Статьи (${articles.length})` : 'Статей пока нет'}
            </p>
            {articles.length > 0 && (
              <div style={{ display: 'flex', gap: 6 }}>
                {[
                  { key: 'date',  label: '🕒 По дате' },
                  { key: 'views', label: '🔥 По просмотрам' },
                ].map(s => (
                  <button key={s.key} onClick={() => setSortBy(s.key)} style={{
                    padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none',
                    background: sortBy === s.key ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.05)',
                    color: sortBy === s.key ? '#a78bfa' : '#64748b',
                  }}>{s.label}</button>
                ))}
              </div>
            )}
          </div>
          {articles.length === 0 ? (
            <p style={{ color: '#475569', fontSize: 14 }}>
              {sportTab !== 'all' ? 'Нажми "✍️ Статья" на любом матче выше' : 'Создай первую статью'}
            </p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  {['Заголовок', 'Статус', 'Просмотры', 'Дата', ''].map(h => (
                    <th key={h} style={{ ...tdStyle, textAlign: 'left', color: '#64748b', fontSize: 12, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...articles].sort((a, b) => sortBy === 'views'
                  ? (b.views || 0) - (a.views || 0)
                  : new Date(b.created_at || 0) - new Date(a.created_at || 0)
                ).map(a => (
                  <tr key={a.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={tdStyle}>
                      <div style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{a.title}</div>
                      <div style={{ color: '#64748b', fontSize: 12 }}>/{a.slug}</div>
                    </td>
                    <td style={tdStyle}>
                      <span style={pillStyle(a.published ? '#22c55e' : '#94a3b8')}>{a.published ? 'Опубл.' : 'Черновик'}</span>
                    </td>
                    <td style={{ ...tdStyle, color: '#94a3b8', fontSize: 13 }}>{a.views}</td>
                    <td style={{ ...tdStyle, color: '#64748b', fontSize: 12 }}>{(a.created_at || '').slice(0, 10)}</td>
                    <td style={{ ...tdStyle }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => fetch(`${API_BASE}/blog/admin/${a.id}`, { headers: { Authorization: `Bearer ${token()}` } }).then(r => r.json()).then(d => setEditing(d))}
                          style={{ ...pageBtn, color: '#a78bfa', fontSize: 12, padding: '4px 10px' }}>Редакт.</button>
                        <button onClick={() => togglePublish(a)}
                          style={{ ...pageBtn, color: a.published ? '#f59e0b' : '#22c55e', fontSize: 12, padding: '4px 10px' }}>
                          {a.published ? 'Снять' : 'Публ.'}
                        </button>
                        <a href={`https://valorix.ru/blog/${a.slug}/`} target="_blank" rel="noreferrer"
                          style={{ ...pageBtn, color: '#64748b', fontSize: 12, padding: '4px 10px', textDecoration: 'none' }}>↗</a>
                        <button onClick={() => del(a.id)} style={{ ...pageBtn, color: '#ef4444', fontSize: 12, padding: '4px 10px' }}>✕</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  )
}

/* ─── Newsletter Tab ─── */
function NewsletterTab({ toast }) {
  const [subject, setSubject] = useState('')
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const send = async (e) => {
    e.preventDefault()
    if (!subject.trim() || !text.trim()) return
    if (!window.confirm(`Отправить рассылку всем пользователям?\n\nТема: ${subject}`)) return
    setLoading(true)
    setResult(null)
    try {
      const token = localStorage.getItem('valorix_token')
      const res = await fetch(`${API_BASE}/admin/newsletter`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, text }),
      })
      const data = await res.json()
      if (data.error) { toast.error(data.error); return }
      setResult(data)
      toast.success(`Отправлено ${data.sent} из ${data.total} писем`)
    } catch (err) {
      toast.error('Ошибка отправки')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 720 }}>
      <div className="card" style={{ padding: 28 }}>
        <h3 style={{ fontWeight: 700, fontSize: 16, color: '#dde4ee', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
          📧 Рассылка пользователям
        </h3>
        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 22 }}>
          Письмо уйдёт всем незаблокированным верифицированным пользователям через Resend
        </p>

        <form onSubmit={send} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
              Тема письма
            </label>
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Например: Горячий матч сегодня — сделай анализ!"
              style={{ ...inputStyle, width: '100%' }}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
              Текст письма
            </label>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={'Например:\nСегодня играет BetBoom против Яндекса — зайди на valorix.ru и сделай анализ матча!\n\nНе упусти шанс 🔥'}
              rows={7}
              style={{ ...inputStyle, width: '100%', resize: 'vertical', lineHeight: 1.6 }}
              required
            />
            <p style={{ fontSize: 12, color: '#334155', marginTop: 6 }}>
              Текст отображается как есть, переносы строк сохраняются
            </p>
          </div>

          {/* Превью */}
          {(subject || text) && (
            <div style={{ border: '1px solid rgba(0,207,255,0.15)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', padding: '8px 16px', background: 'rgba(0,207,255,0.04)', letterSpacing: 1, textTransform: 'uppercase' }}>
                Превью письма
              </div>
              <div style={{ padding: '16px 20px', background: '#07090f' }}>
                <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>Тема: <span style={{ color: '#dde4ee' }}>{subject || '—'}</span></div>
                <div style={{ fontSize: 14, color: '#94a3b8', whiteSpace: 'pre-wrap', lineHeight: 1.7, marginTop: 10, padding: '12px 16px', background: 'rgba(0,25,60,0.4)', borderRadius: 8, border: '1px solid rgba(0,180,255,0.08)' }}>
                  {text || '—'}
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !subject.trim() || !text.trim()}
            style={{
              padding: '12px 28px', fontSize: 15, fontWeight: 700, border: 'none', borderRadius: 10,
              background: loading || !subject.trim() || !text.trim() ? '#1e3a5a' : 'linear-gradient(135deg,#00cfff,#7b5ea7)',
              color: loading || !subject.trim() || !text.trim() ? '#4a6a8a' : '#030b18',
              cursor: loading || !subject.trim() || !text.trim() ? 'not-allowed' : 'pointer',
              alignSelf: 'flex-start',
            }}
          >
            {loading ? '⏳ Отправляем...' : '📤 Отправить рассылку'}
          </button>
        </form>
      </div>

      {result && (
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {[
              { label: 'Всего получателей', val: result.total, color: '#00cfff' },
              { label: 'Отправлено',        val: result.sent,  color: '#4ade80' },
              { label: 'Ошибок',            val: result.failed, color: result.failed > 0 ? '#f87171' : '#4a6a8a' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center', minWidth: 100 }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: s.color }}>{s.val}</div>
                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
