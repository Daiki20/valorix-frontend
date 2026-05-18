import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import AnalysisResult from '../components/AnalysisResult'
import { AlertCircle } from 'lucide-react'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

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

  const match = data ? { home: data.match_home, away: data.match_away, league: data.league || '', date: new Date(data.created_at).toLocaleDateString('ru-RU') } : null
  const analysis = data ? (data.result?.matches?.[0] || data.result) : null

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Navbar />
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ marginBottom: 24, padding: '10px 16px', background: '#eff6ff', borderRadius: 10, border: '1px solid #bfdbfe', fontSize: 13, color: '#1e40af', fontWeight: 600 }}>
          Анализ предоставлен Valorix AI · <Link to="/analyze" style={{ color: '#2563eb' }}>Попробовать самому</Link>
        </div>
        {loading && <div style={{ textAlign: 'center', padding: 64, color: '#94a3b8' }}>Загрузка...</div>}
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '20px 24px', display: 'flex', gap: 12 }}>
            <AlertCircle size={20} color="#ef4444" />
            <span style={{ color: '#dc2626' }}>{error}</span>
          </div>
        )}
        {match && analysis && <AnalysisResult match={match} analysis={analysis} />}
      </div>
    </div>
  )
}
