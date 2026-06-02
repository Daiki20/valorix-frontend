import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import Navbar from '../components/Navbar'
import { Calendar, Eye, ArrowRight } from 'lucide-react'

const API_BASE = import.meta.env.PROD
  ? 'https://web-production-fefcd.up.railway.app'
  : (import.meta.env.VITE_API_URL || '')

function formatDate(str) {
  if (!str) return ''
  try {
    return new Date(str).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch { return str }
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
      .then(data => {
        setArticles(data.items || [])
        setTotal(data.total || 0)
      })
      .catch(() => setArticles([]))
      .finally(() => setLoading(false))
  }, [page])

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <Helmet>
        <title>Блог — Valorix AI | Аналитика ставок на спорт</title>
        <meta name="description" content="Статьи об анализе спортивных матчей, стратегиях ставок, обзоры лиг и советы по работе с коэффициентами." />
        <meta property="og:title" content="Блог Valorix AI" />
        <meta property="og:description" content="Аналитика ставок, разборы матчей, стратегии — всё для осознанных ставок." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://valorix.ru/blog" />
      </Helmet>

      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-10">
          <h1 className="text-4xl font-bold mb-3">Блог</h1>
          <p className="text-gray-400 text-lg">Аналитика матчей, стратегии ставок и разборы лиг</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="bg-[#141420] rounded-2xl p-6 animate-pulse">
                <div className="h-5 bg-[#1e1e2e] rounded w-3/4 mb-3" />
                <div className="h-4 bg-[#1e1e2e] rounded w-full mb-2" />
                <div className="h-4 bg-[#1e1e2e] rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-xl mb-2">Статей пока нет</p>
            <p className="text-sm">Скоро здесь появятся материалы</p>
          </div>
        ) : (
          <div className="space-y-5">
            {articles.map(article => (
              <Link
                key={article.id}
                to={`/blog/${article.slug}`}
                className="block bg-[#141420] hover:bg-[#1a1a2e] border border-white/5 hover:border-purple-500/30 rounded-2xl p-6 transition-all group"
              >
                <div className="flex gap-6 items-start">
                  {article.cover_url && (
                    <img
                      src={article.cover_url}
                      alt={article.title}
                      className="w-28 h-20 object-cover rounded-xl flex-shrink-0 opacity-90"
                      onError={e => { e.target.style.display = 'none' }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-semibold group-hover:text-purple-400 transition-colors mb-2 leading-snug">
                      {article.title}
                    </h2>
                    {article.excerpt && (
                      <p className="text-gray-400 text-sm line-clamp-2 mb-3">{article.excerpt}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {formatDate(article.created_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye size={12} />
                        {article.views} просмотров
                      </span>
                      <span className="flex items-center gap-1 text-purple-400 ml-auto">
                        Читать <ArrowRight size={12} />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > LIMIT && (
          <div className="flex justify-center gap-2 mt-8">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg bg-[#141420] border border-white/10 disabled:opacity-40 hover:border-purple-500/40 transition-colors"
            >
              ← Назад
            </button>
            <span className="px-4 py-2 text-gray-400 text-sm flex items-center">
              {page} / {Math.ceil(total / LIMIT)}
            </span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= Math.ceil(total / LIMIT)}
              className="px-4 py-2 rounded-lg bg-[#141420] border border-white/10 disabled:opacity-40 hover:border-purple-500/40 transition-colors"
            >
              Вперёд →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
