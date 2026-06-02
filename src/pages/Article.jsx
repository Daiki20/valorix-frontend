import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import ReactMarkdown from 'react-markdown'
import Navbar from '../components/Navbar'
import { Calendar, Eye, ArrowLeft } from 'lucide-react'

const API_BASE = import.meta.env.PROD
  ? 'https://web-production-fefcd.up.railway.app'
  : (import.meta.env.VITE_API_URL || '')

function formatDate(str) {
  if (!str) return ''
  try {
    return new Date(str).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch { return str }
}

// Custom renderers for ReactMarkdown
const components = {
  h2: ({ children }) => (
    <h2 className="text-2xl font-bold text-white mt-10 mb-4 pb-3 border-b border-white/10">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-xl font-semibold text-slate-200 mt-8 mb-3">{children}</h3>
  ),
  p: ({ children }) => {
    // Detect Valorix AI prediction block
    const text = String(children)
    if (text.includes('🤖') && text.includes('Valorix AI прогнозирует')) {
      return (
        <div className="my-6 rounded-2xl overflow-hidden border border-purple-500/30"
          style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))' }}>
          <div className="flex items-center gap-2 px-5 py-3 border-b border-purple-500/20"
            style={{ background: 'rgba(99,102,241,0.15)' }}>
            <span className="text-lg">🤖</span>
            <span className="font-bold text-white text-sm tracking-wide">Valorix AI прогнозирует</span>
          </div>
          <div className="px-5 py-4 space-y-2 text-sm">
            {text.split('\n').filter(l => l.trim() && !l.includes('🤖')).map((line, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="mt-0.5 flex-shrink-0">{line.startsWith('✅') ? '✅' : '🔒'}</span>
                <span className={line.startsWith('✅') ? 'text-green-300 font-medium' : 'text-slate-400'}>
                  {line.replace(/^[✅🔒]\s*/, '')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )
    }
    return <p className="text-slate-400 leading-relaxed mb-4">{children}</p>
  },
  ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-4 text-slate-400">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-4 text-slate-400">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="text-slate-200 font-semibold">{children}</strong>,
  em: ({ children }) => <em className="text-purple-400 italic">{children}</em>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-purple-500 pl-4 py-2 my-4 bg-purple-500/5 rounded-r-xl text-slate-400 italic">
      {children}
    </blockquote>
  ),
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noreferrer" className="text-purple-400 hover:text-purple-300 hover:underline transition-colors">
      {children}
    </a>
  ),
}

export default function Article() {
  const { slug } = useParams()
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    setLoading(true)
    setNotFound(false)
    fetch(`${API_BASE}/blog/${slug}`)
      .then(r => {
        if (r.status === 404) { setNotFound(true); return null }
        return r.json()
      })
      .then(data => { if (data) setArticle(data) })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [slug])

  if (notFound) return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <p className="text-2xl font-semibold">Статья не найдена</p>
        <Link to="/blog" className="text-purple-400 hover:underline">← Все статьи</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {article && (
        <Helmet>
          <title>{article.meta_title || article.title} — Valorix AI</title>
          <meta name="description" content={article.meta_desc || article.excerpt || ''} />
          <meta property="og:title" content={article.meta_title || article.title} />
          <meta property="og:description" content={article.meta_desc || article.excerpt || ''} />
          <meta property="og:type" content="article" />
          {article.cover_url && <meta property="og:image" content={article.cover_url} />}
          <link rel="canonical" href={`https://valorix.ru/blog/${article.slug}`} />
          <script type="application/ld+json">{JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: article.title,
            description: article.excerpt || '',
            image: article.cover_url || '',
            datePublished: article.created_at,
            dateModified: article.updated_at,
            publisher: { '@type': 'Organization', name: 'Valorix AI', url: 'https://valorix.ru' },
          })}</script>
        </Helmet>
      )}

      <Navbar />

      <div className="max-w-3xl mx-auto px-4 py-10">
        <Link to="/blog" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 text-sm">
          <ArrowLeft size={16} /> Все статьи
        </Link>

        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-[#141420] rounded w-3/4" />
            <div className="h-4 bg-[#141420] rounded w-1/2" />
            <div className="h-64 bg-[#141420] rounded-2xl mt-6" />
          </div>
        ) : article ? (
          <>
            {article.cover_url && (
              <img src={article.cover_url} alt={article.title}
                className="w-full h-64 object-cover rounded-2xl mb-8 opacity-90"
                onError={e => { e.target.style.display = 'none' }} />
            )}

            {/* Sport badge */}
            {article.sport && article.sport !== 'other' && (
              <span className="inline-block mb-4 px-3 py-1 rounded-full text-xs font-semibold"
                style={{ background: article.sport === 'football' ? 'rgba(34,197,94,0.15)' : 'rgba(99,102,241,0.15)',
                         color: article.sport === 'football' ? '#4ade80' : '#a78bfa' }}>
                {article.sport === 'football' ? '⚽ Футбол' : article.sport === 'hockey' ? '🏒 Хоккей' : article.sport}
              </span>
            )}

            <h1 className="text-3xl font-bold leading-tight mb-4">{article.title}</h1>

            <div className="flex items-center gap-4 text-sm text-slate-500 mb-8 pb-6 border-b border-white/10">
              <span className="flex items-center gap-1"><Calendar size={14} />{formatDate(article.created_at)}</span>
              <span className="flex items-center gap-1"><Eye size={14} />{article.views} просмотров</span>
            </div>

            {/* Article content */}
            <div className="article-body">
              <ReactMarkdown components={components}>{article.content}</ReactMarkdown>
            </div>

            {/* CTA */}
            <div className="mt-12 p-6 rounded-2xl text-center"
              style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))', border: '1px solid rgba(99,102,241,0.25)' }}>
              <p className="text-lg font-bold mb-1">Хочешь AI-анализ любого матча?</p>
              <p className="text-slate-400 text-sm mb-4">Valorix анализирует статистику, H2H, коэффициенты и находит Value ставки</p>
              <Link to="/analyze"
                className="inline-block font-bold px-6 py-3 rounded-xl transition-colors text-white"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                Попробовать бесплатно →
              </Link>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
