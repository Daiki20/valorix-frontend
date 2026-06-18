// Vercel Serverless Function — SSR для статей блога
// Google и Яндекс боты получают готовый HTML с контентом
// Обычные пользователи получают React SPA

const https = require('https')

// Кеш статей в памяти — переживает повторные запросы на том же инстансе
const articleCache = new Map()
const CACHE_TTL = 30 * 60 * 1000 // 30 минут

function fetchFromRailway(slug) {
  return new Promise((resolve) => {
    const req = https.get(
      `https://web-production-fefcd.up.railway.app/blog/${encodeURIComponent(slug)}`,
      { timeout: 9000 },
      res => {
        let data = ''
        res.on('data', c => data += c)
        res.on('end', () => {
          if (res.statusCode !== 200) { resolve(null); return }
          try { resolve(JSON.parse(data)) } catch { resolve(null) }
        })
      }
    )
    req.on('error', () => resolve(null))
    req.on('timeout', () => { req.destroy(); resolve(null) })
    req.end()
  })
}

async function fetchArticle(slug) {
  // Проверяем кеш
  const cached = articleCache.get(slug)
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data

  // Первая попытка
  let article = await fetchFromRailway(slug)

  // Retry через 1.5 сек если первая попытка не удалась
  if (!article) {
    await new Promise(r => setTimeout(r, 1500))
    article = await fetchFromRailway(slug)
  }

  if (article && !article.error) {
    articleCache.set(slug, { data: article, ts: Date.now() })
  }

  return article
}

function esc(s) {
  return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

function mdToHtml(md) {
  return (md || '')
    .replace(/!\[([^\]]*)\]\([^\)]+\)/g, '')
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .replace(/^#{1,6}\s+(.+)$/gm, '<h2>$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^[-*]\s+(.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, s => `<ul>${s}</ul>`)
    .replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/^(?!<[hublp])(.+)$/gm, '$1')
}

module.exports = async (req, res) => {
  const slug = (req.query.slug || '').replace(/\/+$/, '')
  if (!slug) return res.redirect(302, '/')

  const ua = req.headers['user-agent'] || ''
  const isBot = /googlebot|google-inspectiontool|bingbot|yandex|facebookexternalhit|twitterbot|linkedinbot|slurp|applebot|duckduckbot/i.test(ua)

  const article = await fetchArticle(slug)

  // Статья не найдена — 404 для ботов, редирект для людей
  if (!article || article.error) {
    if (isBot) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      return res.status(404).send(`<!DOCTYPE html><html lang="ru"><head><title>Статья не найдена — Valorix AI</title></head><body><h1>404</h1><p>Статья не найдена.</p><a href="https://valorix.ru/blog">← Все статьи</a></body></html>`)
    }
    return res.redirect(302, '/blog')
  }

  const title     = esc(article.title || '')
  const desc      = esc(article.excerpt || article.meta_desc || '')
  const canonical = `https://valorix.ru/blog/${esc(article.slug || slug)}`
  const cover     = article.cover_url ? esc(article.cover_url) : ''
  const bodyHtml  = mdToHtml(article.content || '')

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')

  function escapeJson(str) {
    return str.replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026').replace(/'/g, '\\u0027')
  }

  // Для людей — передаём данные в React SPA
  const clientScript = isBot ? '' : `
  <script>
    window.__PRELOADED_ARTICLE__ = ${escapeJson(JSON.stringify(article))};
    history.replaceState({}, '', '${canonical}');
  </script>`

  res.send(`<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — Valorix AI</title>
  <meta name="description" content="${desc}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${desc}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${canonical}">
  <meta property="og:site_name" content="Valorix AI">
  ${cover ? `<meta property="og:image" content="${cover}">` : ''}
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${desc}">
  ${cover ? `<meta name="twitter:image" content="${cover}">` : ''}
  <link rel="canonical" href="${canonical}">
  <script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt || '',
    image: article.cover_url || undefined,
    datePublished: article.created_at,
    dateModified: article.updated_at,
    author: { '@type': 'Organization', name: 'Valorix AI' },
    publisher: { '@type': 'Organization', name: 'Valorix AI', url: 'https://valorix.ru' },
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical }
  })}</script>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#030b18;color:#d8eeff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.7;padding:2rem 1rem}
    .wrap{max-width:760px;margin:0 auto}
    a{color:#00cfff;text-decoration:none}
    h1{font-size:clamp(1.6rem,4vw,2.2rem);font-weight:900;margin:1rem 0 1.5rem;line-height:1.2;color:#fff}
    h2{font-size:1.3rem;font-weight:800;color:#fff;margin:2rem 0 0.8rem;border-bottom:1px solid rgba(0,207,255,0.15);padding-bottom:.4rem}
    p{color:#94a3b8;margin-bottom:1rem;font-size:.98rem}
    strong{color:#00cfff;font-weight:700}
    ul{color:#94a3b8;padding-left:1.5rem;margin-bottom:1rem}
    li{margin-bottom:.3rem}
    blockquote{border-left:3px solid #00cfff;padding:.5rem 1rem;background:rgba(0,207,255,0.05);margin:1rem 0;color:#94a3b8;border-radius:0 8px 8px 0}
    .meta{color:#475569;font-size:.85rem;margin-bottom:2rem;display:flex;gap:1rem;flex-wrap:wrap}
    .badge{background:rgba(34,197,94,.1);color:#4ade80;padding:3px 12px;border-radius:20px;font-size:.75rem;font-weight:700;border:1px solid rgba(34,197,94,.2)}
    .cta{margin-top:3rem;padding:1.5rem;background:rgba(0,207,255,.06);border:1px solid rgba(0,207,255,.2);border-radius:16px;text-align:center}
    .cta a{display:inline-block;background:linear-gradient(135deg,#00cfff,#6366f1);color:#000;font-weight:800;padding:.8rem 2rem;border-radius:12px;font-size:.95rem;margin-top:.8rem}
    nav{margin-bottom:2rem}
    ${cover ? `img.cover{width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:16px;margin-bottom:1.5rem;border:1px solid rgba(0,207,255,.15)}` : ''}
  </style>
</head>
<body>
  <div class="wrap">
    <nav><a href="https://valorix.ru">← Valorix AI</a> / <a href="https://valorix.ru/blog">Блог</a></nav>
    ${cover ? `<img class="cover" src="${cover}" alt="${title}" loading="eager">` : ''}
    <h1>${title}</h1>
    <div class="meta">
      <span>${new Date(article.created_at).toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'})}</span>
      ${article.sport && article.sport !== 'other' ? `<span class="badge">${article.sport === 'football' ? '⚽ Футбол' : article.sport === 'hockey' ? '🏒 Хоккей' : article.sport === 'cs2' ? '🔫 CS2' : article.sport === 'dota2' ? '🎮 Dota 2' : article.sport}</span>` : ''}
    </div>
    ${desc ? `<p><em>${desc}</em></p>` : ''}
    <div>${bodyHtml}</div>
    <div class="cta">
      <p>Хочешь AI-анализ любого матча?</p>
      <a href="https://valorix.ru/analyze">Попробовать бесплатно →</a>
    </div>
  </div>
  ${clientScript}
</body>
</html>`)
}
