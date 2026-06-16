import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import Navbar from '../components/Navbar'
import { Calendar, Eye, ArrowRight, Zap } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || 'https://web-production-fefcd.up.railway.app'

const ACCENT = '#00cfff'

function formatDate(str) {
  if (!str) return ''
  try {
    return new Date(str).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch { return str }
}

const SPORT_LABELS = {
  football: { label: '⚽ Футбол', color: '#4ade80', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)' },
  hockey:   { label: '🏒 Хоккей', color: '#00cfff', bg: 'rgba(0,207,255,0.1)',  border: 'rgba(0,207,255,0.2)' },
}

export default function Blog() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const LIMIT = 10

  useEffect(() => {
    setLoading(true)
    fetch(`${API_BASE}/blog?page=${page}&limit=${LIMIT}`)
      .then(r => r.json())
      .then(data => { setArticles(data.items || []); setTotal(data.total || 0) })
      .catch(() => setArticles([]))
      .finally(() => setLoading(false))
  }, [page])

  return (
    <div style={{ minHeight: '100vh', background: '#030b18', color: '#fff', position: 'relative', overflow: 'hidden' }}>
      <Helmet>
        <title>Блог — Valorix AI | Аналитика ставок на спорт</title>
        <meta name="description" content="Прогнозы матчей, анализ статистики, стратегии ставок и разборы лиг от Valorix AI." />
        <meta property="og:title" content="Блог Valorix AI" />
        <meta property="og:description" content="Прогнозы матчей, аналитика и стратегии ставок." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://valorix.ru/blog" />
      </Helmet>

      {/* Background glows */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-5%', left: '50%', transform: 'translateX(-50%)', width: 1000, height: 500, background: 'radial-gradient(ellipse, rgba(0,207,255,0.07) 0%, transparent 65%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', top: '40%', right: '-10%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(123,94,167,0.07) 0%, transparent 65%)', borderRadius: '50%' }} />
      </div>

      <Navbar />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 860, margin: '0 auto', padding: '3rem 1.5rem 5rem' }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: ACCENT, background: 'rgba(0,207,255,0.1)', padding: '4px 12px', borderRadius: 20, border: '1px solid rgba(0,207,255,0.2)' }}>
              <Zap size={11} /> AI-прогнозы
            </span>
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 10, lineHeight: 1.1 }}>
            Блог <span style={{ color: ACCENT }}>Valorix</span>
          </h1>
          <p style={{ color: '#475569', fontSize: '1.05rem' }}>
            Прогнозы матчей, анализ статистики и стратегии ставок
          </p>
        </div>

        {/* Articles */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ height: 100, background: 'rgba(255,255,255,0.03)', borderRadius: 20, animation: 'pulse 1.5s infinite' }} />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 0', color: '#334155' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📝</div>
            <p style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 8 }}>Статей пока нет</p>
            <p style={{ fontSize: 14 }}>Скоро здесь появятся прогнозы матчей</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {articles.map((article, idx) => {
              const sport = SPORT_LABELS[article.sport]
              const isFirst = idx === 0
              return (
                <Link
                  key={article.id}
                  to={`/blog/${article.slug}/`}
                  style={{
                    display: 'block', textDecoration: 'none',
                    background: isFirst
                      ? 'linear-gradient(135deg, rgba(0,207,255,0.06) 0%, rgba(99,102,241,0.08) 100%)'
                      : 'rgba(255,255,255,0.025)',
                    border: `1px solid ${isFirst ? 'rgba(0,207,255,0.18)' : 'rgba(255,255,255,0.06)'}`,
                    borderRadius: 20,
                    padding: isFirst ? '24px 28px' : '18px 24px',
                    transition: 'all 0.2s',
                    cursor: 'pointer',
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.background = 'rgba(0,207,255,0.06)'
                    e.currentTarget.style.borderColor = 'rgba(0,207,255,0.25)'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.background = isFirst
                      ? 'linear-gradient(135deg, rgba(0,207,255,0.06) 0%, rgba(99,102,241,0.08) 100%)'
                      : 'rgba(255,255,255,0.025)'
                    e.currentTarget.style.borderColor = isFirst ? 'rgba(0,207,255,0.18)' : 'rgba(255,255,255,0.06)'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    {/* Cover image */}
                    {article.cover_url && (
                      <img src={article.cover_url} alt={article.title}
                        loading={isFirst ? 'eager' : 'lazy'}
                        style={{ width: isFirst ? 120 : 88, height: isFirst ? 80 : 60, objectFit: 'cover', borderRadius: 12, flexShrink: 0, opacity: 0.9 }}
                        onError={e => { e.target.style.display = 'none' }} />
                    )}

                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Sport badge */}
                      {sport && (
                        <span style={{
                          display: 'inline-block', fontSize: 11, fontWeight: 700,
                          padding: '2px 10px', borderRadius: 20, marginBottom: 8,
                          color: sport.color, background: sport.bg, border: `1px solid ${sport.border}`,
                        }}>{sport.label}</span>
                      )}

                      {/* Title */}
                      <h2 style={{
                        fontSize: isFirst ? '1.15rem' : '1rem',
                        fontWeight: 700, color: '#fff', marginBottom: 6,
                        lineHeight: 1.4, letterSpacing: '-0.01em',
                      }}>
                        {article.title}
                      </h2>

                      {/* Excerpt */}
                      {article.excerpt && (
                        <p style={{ color: '#475569', fontSize: 13, lineHeight: 1.5, marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {article.excerpt}
                        </p>
                      )}

                      {/* Meta */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: '#334155' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Calendar size={11} style={{ color: ACCENT }} />
                          {formatDate(article.created_at)}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Eye size={11} style={{ color: ACCENT }} />
                          {article.views}
                        </span>
                        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, color: ACCENT, fontWeight: 600 }}>
                          Читать <ArrowRight size={11} />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {total > LIMIT && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 32 }}>
            {[
              { label: '← Назад', action: () => setPage(p => Math.max(1, p-1)), disabled: page === 1 },
              { label: `${page} / ${Math.ceil(total/LIMIT)}`, action: null, disabled: false, isInfo: true },
              { label: 'Вперёд →', action: () => setPage(p => p+1), disabled: page >= Math.ceil(total/LIMIT) },
            ].map((btn, i) => (
              <button key={i} onClick={btn.action || undefined} disabled={btn.disabled}
                style={{
                  padding: '8px 18px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.03)', color: btn.isInfo ? '#475569' : '#94a3b8',
                  fontSize: 13, cursor: btn.action && !btn.disabled ? 'pointer' : 'default',
                  opacity: btn.disabled ? 0.3 : 1,
                }}>
                {btn.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
