import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import ReactMarkdown from 'react-markdown'
import Navbar from '../components/Navbar'
import { Calendar, Eye, ArrowLeft, ArrowRight, Zap } from 'lucide-react'

const API_BASE = import.meta.env.PROD
  ? 'https://web-production-fefcd.up.railway.app'
  : (import.meta.env.VITE_API_URL || '')

const ACCENT = '#00cfff'

function formatDate(str) {
  if (!str) return ''
  try {
    return new Date(str).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch { return str }
}

// ── Custom markdown renderers ─────────────────────────────────────────────────
const components = {
  h2: ({ children }) => (
    <h2 style={{
      fontSize: '1.6rem', fontWeight: 800, color: '#fff',
      margin: '2.5rem 0 1rem', paddingBottom: '0.6rem',
      borderBottom: `2px solid rgba(0,207,255,0.2)`,
      letterSpacing: '-0.02em',
    }}>
      <span style={{ color: ACCENT, marginRight: 8 }}>—</span>{children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#e2e8f0', margin: '2rem 0 0.6rem' }}>
      {children}
    </h3>
  ),
  p: ({ children }) => {
    const text = typeof children === 'string' ? children : ''
    const flatText = Array.isArray(children)
      ? children.map(c => typeof c === 'string' ? c : (c?.props?.children || '')).join('')
      : text

    // Отдельная строка ✅ или 🔒 — рендерим как элемент прогноза
    const trimmed = flatText.trim()
    if (trimmed.startsWith('✅') || trimmed.startsWith('🔒')) {
      const isGood = trimmed.startsWith('✅')
      const content = trimmed.replace(/^[✅🔒]\s*/, '')
      return (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 12,
          padding: '10px 14px', borderRadius: 12, marginBottom: 8,
          background: isGood ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.03)',
          border: `1px solid ${isGood ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.06)'}`,
        }}>
          <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{isGood ? '✅' : '🔒'}</span>
          <span style={{
            fontSize: 14, lineHeight: 1.5,
            color: isGood ? '#4ade80' : '#64748b',
            fontWeight: isGood ? 600 : 400,
          }}>{content}</span>
        </div>
      )
    }

    const hasRobot = flatText.includes('🤖')

    if (hasRobot) {
      // Extract lines from the prediction block
      const allText = Array.isArray(children)
        ? children.map(c => typeof c === 'string' ? c : (c?.props?.children || '')).join('')
        : text
      const lines = allText.split('\n').filter(l => l.trim())

      return (
        <div style={{
          margin: '2rem 0',
          borderRadius: 20,
          overflow: 'hidden',
          border: '1px solid rgba(0,207,255,0.25)',
          background: 'linear-gradient(135deg, rgba(0,207,255,0.06) 0%, rgba(99,102,241,0.08) 100%)',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '14px 20px',
            background: 'rgba(0,207,255,0.08)',
            borderBottom: '1px solid rgba(0,207,255,0.15)',
          }}>
            <span style={{ fontSize: 20 }}>🤖</span>
            <span style={{ fontWeight: 800, color: '#fff', fontSize: 15, letterSpacing: '-0.01em' }}>
              Valorix AI прогнозирует
            </span>
            <span style={{
              marginLeft: 'auto', fontSize: 11, fontWeight: 700,
              background: 'rgba(0,207,255,0.15)', color: ACCENT,
              padding: '2px 10px', borderRadius: 20,
            }}>AI</span>
          </div>
          {/* Predictions */}
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {lines.filter(l => !l.includes('🤖') && !l.includes('прогнозирует')).map((line, i) => {
              const isGood = line.startsWith('✅')
              const isLocked = line.startsWith('🔒')
              const content = line.replace(/^[✅🔒]\s*/, '').trim()
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: '10px 14px', borderRadius: 12,
                  background: isGood ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isGood ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.06)'}`,
                }}>
                  <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{isGood ? '✅' : '🔒'}</span>
                  <span style={{
                    fontSize: 14, lineHeight: 1.5,
                    color: isGood ? '#4ade80' : '#64748b',
                    fontWeight: isGood ? 600 : 400,
                  }}>
                    {isGood
                      ? <><span style={{ color: '#94a3b8', marginRight: 4 }}></span>{content}</>
                      : content
                    }
                  </span>
                </div>
              )
            })}
          </div>
          <div style={{ padding: '10px 20px 14px', textAlign: 'center' }}>
            <Link to="/analyze" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 13, fontWeight: 700, color: ACCENT,
              textDecoration: 'none', opacity: 0.85,
            }}>
              <Zap size={13} />
              Получить полный анализ с коэффициентами
            </Link>
          </div>
        </div>
      )
    }

    return (
      <p style={{ color: '#94a3b8', lineHeight: 1.85, marginBottom: '1.1rem', fontSize: '1rem' }}>
        {children}
      </p>
    )
  },
  ul: ({ children }) => (
    <ul style={{ color: '#94a3b8', paddingLeft: '1.5rem', marginBottom: '1rem', lineHeight: 1.8 }}>
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol style={{ color: '#94a3b8', paddingLeft: '1.5rem', marginBottom: '1rem', lineHeight: 1.8 }}>
      {children}
    </ol>
  ),
  li: ({ children }) => <li style={{ marginBottom: '0.3rem' }}>{children}</li>,
  strong: ({ children }) => (
    <strong style={{ color: ACCENT, fontWeight: 700 }}>{children}</strong>
  ),
  em: ({ children }) => <em style={{ color: '#a78bfa', fontStyle: 'italic' }}>{children}</em>,
  blockquote: ({ children }) => (
    <blockquote style={{
      borderLeft: `3px solid ${ACCENT}`, paddingLeft: '1rem', margin: '1.5rem 0',
      background: 'rgba(0,207,255,0.05)', borderRadius: '0 12px 12px 0',
      padding: '0.75rem 1rem', color: '#94a3b8',
    }}>
      {children}
    </blockquote>
  ),
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noreferrer"
      style={{ color: ACCENT, textDecoration: 'none', fontWeight: 500 }}
      onMouseOver={e => e.target.style.textDecoration = 'underline'}
      onMouseOut={e => e.target.style.textDecoration = 'none'}>
      {children}
    </a>
  ),
  img: ({ src, alt }) => (
    <figure style={{ margin: '2.5rem 0', textAlign: 'center' }}>
      <img
        src={src}
        alt={alt || ''}
        loading="lazy"
        style={{
          width: '100%',
          maxWidth: 680,
          borderRadius: 20,
          border: '1px solid rgba(0,207,255,0.15)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
          display: 'block',
          margin: '0 auto',
        }}
        onError={e => { e.target.style.display = 'none'; e.target.nextSibling && (e.target.nextSibling.style.display = 'none') }}
      />
      {alt && (
        <figcaption style={{
          marginTop: 12,
          fontSize: 13,
          color: '#475569',
          fontStyle: 'italic',
        }}>
          {alt}
        </figcaption>
      )}
    </figure>
  ),
}

export default function Article() {
  const { slug } = useParams()
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [related, setRelated] = useState([])

  // Загружаем статью
  useEffect(() => {
    const preloaded = window.__PRELOADED_ARTICLE__
    if (preloaded && preloaded.slug === slug) {
      setArticle(preloaded)
      setLoading(false)
      window.__PRELOADED_ARTICLE__ = null
      return
    }
    setLoading(true); setNotFound(false)
    fetch(`${API_BASE}/blog/${slug}`)
      .then(r => { if (r.status === 404) { setNotFound(true); return null } return r.json() })
      .then(data => { if (data) setArticle(data) })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [slug])

  // Загружаем похожие статьи — отдельный эффект, всегда работает
  useEffect(() => {
    if (!slug) return
    fetch(`${API_BASE}/blog/related/${slug}`)
      .then(r => r.json())
      .then(data => setRelated(data.items || []))
      .catch(() => {})
  }, [slug])

  if (notFound) return (
    <div style={{ minHeight: '100vh', background: '#030b18', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>Статья не найдена</p>
        <Link to="/blog" style={{ color: ACCENT }}>← Все статьи</Link>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#030b18', color: '#fff', position: 'relative', overflow: 'hidden' }}>
      {article && (
        <Helmet>
          <title>{article.meta_title || article.title} — Valorix AI</title>
          <meta name="description" content={article.meta_desc || article.excerpt || ''} />
          <meta property="og:title" content={article.meta_title || article.title} />
          <meta property="og:description" content={article.meta_desc || article.excerpt || ''} />
          <meta property="og:type" content="article" />
          {article.cover_url && <meta property="og:image" content={article.cover_url} />}
          <link rel="canonical" href={`https://valorix.ru/blog/${article.slug}/`} />
          <script type="application/ld+json">{JSON.stringify({
            '@context': 'https://schema.org', '@type': 'Article',
            headline: article.title, description: article.excerpt || '',
            image: article.cover_url || '', datePublished: article.created_at,
            dateModified: article.updated_at,
            publisher: { '@type': 'Organization', name: 'Valorix AI', url: 'https://valorix.ru' },
          })}</script>
        </Helmet>
      )}

      {/* ── Atmospheric background glows ────────────────────────────── */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: 900, height: 500, background: 'radial-gradient(ellipse, rgba(0,207,255,0.07) 0%, transparent 65%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', top: '30%', right: '-15%', width: 600, height: 600, background: 'radial-gradient(circle, rgba(123,94,167,0.08) 0%, transparent 65%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '10%', left: '-10%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(0,207,255,0.05) 0%, transparent 65%)', borderRadius: '50%' }} />
      </div>

      <Navbar />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 760, margin: '0 auto', padding: '2.5rem 1.5rem 5rem' }}>

        {/* Back link */}
        <Link to="/blog" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          color: '#475569', fontSize: 14, textDecoration: 'none', marginBottom: 32,
          transition: 'color 0.2s',
        }}>
          <ArrowLeft size={15} /> Все статьи
        </Link>

        {loading ? (
          <div>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: i === 1 ? 40 : 16, background: 'rgba(255,255,255,0.05)', borderRadius: 8, marginBottom: 16, width: i === 1 ? '70%' : '100%', animation: 'pulse 1.5s infinite' }} />
            ))}
          </div>
        ) : article ? (
          <>
            {/* Sport badge */}
            {article.sport && article.sport !== 'other' && (
              <div style={{ marginBottom: 16 }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '4px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                  background: article.sport === 'football' ? 'rgba(34,197,94,0.1)' : 'rgba(0,207,255,0.1)',
                  color: article.sport === 'football' ? '#4ade80' : ACCENT,
                  border: `1px solid ${article.sport === 'football' ? 'rgba(34,197,94,0.2)' : 'rgba(0,207,255,0.2)'}`,
                }}>
                  {article.sport === 'football' ? '⚽ Футбол' : article.sport === 'hockey' ? '🏒 Хоккей' : article.sport}
                </span>
              </div>
            )}

            {/* Cover image */}
            {article.cover_url && (
              <img src={article.cover_url} alt={article.title}
                loading="eager"
                style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', borderRadius: 20, marginBottom: 28, opacity: 0.9 }}
                onError={e => { e.target.style.display = 'none' }} />
            )}

            {/* Title */}
            <h1 style={{
              fontSize: 'clamp(1.7rem, 4vw, 2.4rem)',
              fontWeight: 900, lineHeight: 1.2,
              letterSpacing: '-0.03em',
              marginBottom: 20, color: '#fff',
            }}>
              {article.title}
            </h1>

            {/* Meta */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 36, paddingBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.07)', color: '#475569', fontSize: 13 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={13} style={{ color: ACCENT }} />{formatDate(article.created_at)}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Eye size={13} style={{ color: ACCENT }} />{article.views} просмотров
              </span>
            </div>

            {/* Article content */}
            <div>
              <ReactMarkdown components={components}>{article.content}</ReactMarkdown>
            </div>

            {/* CTA */}
            <div style={{
              marginTop: 48, padding: '28px 32px', borderRadius: 24, textAlign: 'center',
              background: 'linear-gradient(135deg, rgba(0,207,255,0.08) 0%, rgba(99,102,241,0.1) 100%)',
              border: '1px solid rgba(0,207,255,0.2)',
            }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>⚡</div>
              <p style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', marginBottom: 8 }}>
                Хочешь <span style={{ color: ACCENT }}>полный AI-анализ</span> любого матча?
              </p>
              <p style={{ color: '#475569', fontSize: 14, marginBottom: 20 }}>
                Статистика, H2H, коэффициенты, Value ставки — всё в одном месте
              </p>
              <Link to="/analyze" style={{
                display: 'inline-block', padding: '12px 28px', borderRadius: 14,
                background: 'linear-gradient(135deg, #00cfff, #6366f1)',
                color: '#000', fontWeight: 800, fontSize: 15, textDecoration: 'none',
              }}>
                Попробовать бесплатно →
              </Link>
            </div>

            {/* Похожие статьи */}
            {related.length > 0 && (
              <div style={{ marginTop: 48 }}>
                <h2 style={{
                  fontSize: '1.25rem', fontWeight: 800, color: '#fff',
                  marginBottom: 20, letterSpacing: '-0.02em',
                }}>
                  Читайте также
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {related.map(item => {
                    const isFootball = item.sport === 'football'
                    const isHockey   = item.sport === 'hockey'
                    return (
                      <Link
                        key={item.id}
                        to={`/blog/${item.slug}/`}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 14,
                          padding: '14px 18px', borderRadius: 16, textDecoration: 'none',
                          background: 'rgba(255,255,255,0.025)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          transition: 'all 0.2s',
                        }}
                        onMouseOver={e => {
                          e.currentTarget.style.background = 'rgba(0,207,255,0.06)'
                          e.currentTarget.style.borderColor = 'rgba(0,207,255,0.2)'
                        }}
                        onMouseOut={e => {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.025)'
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
                        }}
                      >
                        {item.cover_url && (
                          <img src={item.cover_url} alt={item.title}
                            loading="lazy"
                            style={{ width: 72, height: 48, objectFit: 'cover', borderRadius: 10, flexShrink: 0 }}
                            onError={e => { e.target.style.display = 'none' }} />
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {(isFootball || isHockey) && (
                            <span style={{
                              display: 'inline-block', fontSize: 10, fontWeight: 700, marginBottom: 4,
                              padding: '1px 8px', borderRadius: 20,
                              color: isFootball ? '#4ade80' : ACCENT,
                              background: isFootball ? 'rgba(34,197,94,0.1)' : 'rgba(0,207,255,0.1)',
                              border: `1px solid ${isFootball ? 'rgba(34,197,94,0.2)' : 'rgba(0,207,255,0.2)'}`,
                            }}>
                              {isFootball ? '⚽ Футбол' : '🏒 Хоккей'}
                            </span>
                          )}
                          <p style={{
                            color: '#e2e8f0', fontSize: '0.9rem', fontWeight: 600,
                            lineHeight: 1.4, margin: 0,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {item.title}
                          </p>
                        </div>
                        <ArrowRight size={14} style={{ color: ACCENT, flexShrink: 0 }} />
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}
