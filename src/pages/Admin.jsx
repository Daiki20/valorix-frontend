import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import Navbar from '../components/Navbar'
import { getStats, getUsers, getTransactions, addCoins, setAdmin, setBlocked } from '../api/adminApi'
import { Users, Zap, BarChart3, RefreshCw, Shield, Ban, Plus, Minus, Search, ChevronLeft, ChevronRight, Star } from 'lucide-react'
const API_BASE = import.meta.env.VITE_API_URL || ''

const TABS = ['Дашборд', 'Пользователи', 'Транзакции']

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
      const res = await fetch(`${API_BASE}/express/generate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, sport }),
      })
      const data = await res.json()
      if (data.error) { toast.error(data.error); return }
      setExpressResults(p => ({ ...p, [key]: data }))
      toast.success(`${sport === 'hockey' ? '🏒 Хоккей' : '⚽ Футбол'} · ${type === 'standard' ? 'Lite' : 'Hard'} сгенерирован!`)
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

        {/* Football */}
        {[
          { sport: 'football', label: '⚽ Футбол', gradL: 'linear-gradient(135deg,#00cfff,#7b5ea7)', gradH: 'linear-gradient(135deg,#f97316,#dc2626)' },
          { sport: 'hockey',   label: '🏒 Хоккей', gradL: 'linear-gradient(135deg,#0ea5e9,#00cfff)', gradH: 'linear-gradient(135deg,#ea580c,#dc2626)' },
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
  fontFamily: 'Montserrat, sans-serif', width: 240,
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
