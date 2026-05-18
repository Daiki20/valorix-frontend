import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Zap, Clock, TrendingUp, Search } from 'lucide-react'
import Navbar from '../components/Navbar'
import { authApi } from '../api/authApi'
import { useAuth } from '../context/AuthContext'

export default function History() {
  const { user } = useAuth()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    authApi.history()
      .then(d => setHistory(d.history || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Navbar />
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px' }}>
        <Link to="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          color: '#64748b', fontSize: 14, fontWeight: 600, marginBottom: 28, textDecoration: 'none',
        }}>
          <ArrowLeft size={16} /> На главную
        </Link>

        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#1a1a2e', letterSpacing: -0.5, marginBottom: 6 }}>
            История анализов
          </h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>
            Все ваши прогнозы за последнее время
          </p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3,4].map(i => (
              <div key={i} className="card" style={{ padding: '20px 24px', display: 'flex', gap: 16, alignItems: 'center' }}>
                <div className="skeleton" style={{ width: 44, height: 44, borderRadius: '50%' }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="skeleton" style={{ height: 16, width: '60%' }} />
                  <div className="skeleton" style={{ height: 12, width: '35%' }} />
                </div>
                <div className="skeleton" style={{ width: 70, height: 28, borderRadius: 20 }} />
              </div>
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="card" style={{ padding: '64px 32px', textAlign: 'center' }}>
            <Search size={48} color="#cbd5e1" style={{ margin: '0 auto 16px', display: 'block' }} />
            <div style={{ fontWeight: 700, fontSize: 18, color: '#1a1a2e', marginBottom: 8 }}>
              Анализов пока нет
            </div>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>
              Выберите матч и запустите первый анализ
            </p>
            <Link to="/analyze" className="btn-primary" style={{ margin: '0 auto' }}>
              <Zap size={16} fill="white" /> Начать анализ
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {history.map(item => <HistoryRow key={item.id} item={item} />)}
          </div>
        )}
      </div>
    </div>
  )
}

function HistoryRow({ item }) {
  let result = {}
  try { result = JSON.parse(item.result || '{}') } catch {}

  // Handle both screenshot format (matches[]) and direct format
  const analysis = result.matches?.[0] || result
  const verdict = analysis.verdict || ''
  const confidence = analysis.confidence
  const date = new Date(item.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

  const v = verdict.toLowerCase()
  const verdictColor = v.includes('ничья') ? '#f59e0b' : (v.includes('победа') || verdict) ? '#2563eb' : '#64748b'

  return (
    <div className="card" style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{
        width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
        background: 'linear-gradient(135deg, #eff6ff, #e0e7ff)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <TrendingUp size={20} color="#2563eb" />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1a2e', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.match_home} — {item.match_away}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: '#94a3b8' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={11} /> {date}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Zap size={11} color="#2563eb" fill="#2563eb" /> {item.coins_spent} монет
          </span>
          {item.league && <span>{item.league}</span>}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
        {verdict && (
          <div style={{
            background: verdictColor + '15', color: verdictColor,
            borderRadius: 20, padding: '4px 12px',
            fontSize: 12, fontWeight: 700,
          }}>
            {verdict}
          </div>
        )}
        {confidence && (
          <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>
            {confidence}% уверенность
          </div>
        )}
      </div>
    </div>
  )
}
