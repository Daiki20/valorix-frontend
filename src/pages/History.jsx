import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Zap, Clock, TrendingUp, Search, X } from 'lucide-react'
import Navbar from '../components/Navbar'
import { authApi } from '../api/authApi'
import { useAuth } from '../context/AuthContext'
import AnalysisResult from '../components/AnalysisResult'

export default function History() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('valorix_token')
    if (!token) {
      navigate('/')
    }
  }, [navigate])

  useEffect(() => {
    authApi.history()
      .then(d => setHistory(d.history || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#07090f' }}>
      <Navbar />
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px' }}>
        <Link to="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          color: '#64748b', fontSize: 14, fontWeight: 600, marginBottom: 28, textDecoration: 'none',
        }}>
          <ArrowLeft size={16} /> На главную
        </Link>

        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#dde4ee', letterSpacing: -0.5, marginBottom: 6 }}>
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
            <div style={{ fontWeight: 700, fontSize: 18, color: '#dde4ee', marginBottom: 8 }}>
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
            {history.map(item => <HistoryRow key={item.id} item={item} onClick={() => setSelected(item)} />)}
          </div>
        )}
      </div>

      {selected && <AnalysisModal item={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

function AnalysisModal({ item, onClose }) {
  let result = {}
  try { result = JSON.parse(item.result || '{}') } catch {}
  const analysis = result.matches?.[0] || result
  const match = {
    home: item.match_home,
    away: item.match_away,
    league: item.league || '',
    date: new Date(item.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
  }

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        zIndex: 200, backdropFilter: 'blur(4px)',
      }} />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: '100%', maxWidth: 640, zIndex: 201,
        overflowY: 'auto', background: '#07090f', padding: '24px 20px',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.15)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 18, color: '#dde4ee' }}>
            {item.match_home} — {item.match_away}
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(0,207,255,0.08)', border: '1px solid rgba(0,180,255,0.15)', borderRadius: '50%',
            width: 36, height: 36, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <X size={18} color="#4a6a8a" />
          </button>
        </div>
        <AnalysisResult match={match} analysis={analysis} shareToken={item.share_token} />
      </div>
    </>
  )
}

function HistoryRow({ item, onClick }) {
  let result = {}
  try { result = JSON.parse(item.result || '{}') } catch {}

  // Handle both screenshot format (matches[]) and direct format
  const analysis = result.matches?.[0] || result
  const verdict = analysis.verdict || ''
  const confidence = analysis.confidence
  const date = new Date(item.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

  // Short badge: first sentence or first 32 chars
  const shortVerdict = (() => {
    if (!verdict) return ''
    const firstSentence = verdict.split(/[.,—–]/)[0].trim()
    if (firstSentence.length <= 36) return firstSentence
    return firstSentence.slice(0, 34) + '…'
  })()

  // Clean league name: cut off garbage like "NHL 26. United Leagues. 3:4 мин. Czech Republic"
  const leagueDisplay = (() => {
    if (!item.league) return null
    const clean = item.league.split('.')[0].trim()
    return clean.length > 40 ? clean.slice(0, 38) + '…' : clean
  })()

  const v = verdict.toLowerCase()
  const verdictColor = v.includes('ничья') ? '#f59e0b' : v.includes('победа') || v.includes('тб') || v.includes('тм') ? '#00cfff' : '#64748b'

  return (
    <div className="card" onClick={onClick} style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', transition: 'box-shadow 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,207,255,0.12)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = ''}
    >
      <div style={{
        width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
        background: 'rgba(0,207,255,0.08)', border: '1px solid rgba(0,207,255,0.18)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <TrendingUp size={18} color="#00cfff" />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#dde4ee', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.match_home} — {item.match_away}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#64748b', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3, whiteSpace: 'nowrap' }}>
            <Clock size={11} /> {date}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3, whiteSpace: 'nowrap' }}>
            <Zap size={11} color="#00cfff" fill="#00cfff" /> {item.coins_spent} монет
          </span>
          {leagueDisplay && (
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>
              {leagueDisplay}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0, maxWidth: 190 }}>
        {shortVerdict && (
          <div style={{
            background: verdictColor + '18', color: verdictColor,
            borderRadius: 20, padding: '4px 10px',
            fontSize: 12, fontWeight: 700,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            maxWidth: '100%',
          }}>
            {shortVerdict}
          </div>
        )}
        {confidence && (
          <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500, whiteSpace: 'nowrap' }}>
            {confidence}% уверенность
          </div>
        )}
      </div>
    </div>
  )
}
