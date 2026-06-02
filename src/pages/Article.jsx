import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
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

export default function Article() {
  const { slug } = useParams()
  const navigate = useNavigate()
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
        <Link to="/blog" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 text-sm">
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
              <img
                src={article.cover_url}
                alt={article.title}
                className="w-full h-64 object-cover rounded-2xl mb-8 opacity-90"
                onError={e => { e.target.style.display = 'none' }}
              />
            )}

            <h1 className="text-3xl font-bold leading-tight mb-4">{article.title}</h1>

            <div className="flex items-center gap-4 text-sm text-gray-500 mb-8 pb-6 border-b border-white/10">
              <span className="flex items-center gap-1"><Calendar size={14} />{formatDate(article.created_at)}</span>
              <span className="flex items-center gap-1"><Eye size={14} />{article.views} просмотров</span>
            </div>

            {/* Article content — rendered from markdown */}
            <div className="prose prose-invert prose-lg max-w-none
              prose-headings:font-bold prose-headings:text-white
              prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
              prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
              prose-p:text-gray-300 prose-p:leading-relaxed prose-p:mb-4
              prose-li:text-gray-300 prose-ul:my-4 prose-ol:my-4
              prose-strong:text-white prose-strong:font-semibold
              prose-blockquote:border-l-purple-500 prose-blockquote:text-gray-400
              prose-code:text-purple-300 prose-code:bg-[#1a1a2e] prose-code:px-1.5 prose-code:rounded
              prose-a:text-purple-400 prose-a:no-underline hover:prose-a:underline
            ">
              <ReactMarkdown>{article.content}</ReactMarkdown>
            </div>

            {/* CTA */}
            <div className="mt-12 p-6 bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/20 rounded-2xl text-center">
              <p className="text-lg font-semibold mb-2">Хочешь AI-анализ любого матча?</p>
              <p className="text-gray-400 text-sm mb-4">Valorix анализирует статистику, H2H, коэффициенты и находит Value ставки</p>
              <Link
                to="/analyze"
                className="inline-block bg-purple-600 hover:bg-purple-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
              >
                Попробовать бесплатно
              </Link>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
