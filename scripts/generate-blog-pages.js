// Runs during GitHub Actions build
// Creates dist/blog/{slug}/index.html for every published article
// → GitHub Pages serves them with HTTP 200 (not 404)
// → Google indexes real content
// → React SPA loads client-side for full interactivity

import https from 'https'
import fs    from 'fs'
import path  from 'path'
import { fileURLToPath } from 'url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const RAILWAY_URL = process.env.RAILWAY_URL || 'https://web-production-fefcd.up.railway.app'
const BASE        = 'https://valorix.ru'
const DIST_DIR    = path.join(__dirname, '..', 'dist')

function get(url) {
  return new Promise((resolve) => {
    const req = https.get(url, { timeout: 10000, headers: { 'X-No-Track': '1' } }, res => {
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => {
        if (res.statusCode !== 200) { resolve(null); return }
        try { resolve(JSON.parse(data)) } catch { resolve(null) }
      })
    })
    req.on('error', () => resolve(null))
    req.on('timeout', () => { req.destroy(); resolve(null) })
  })
}

function esc(s) {
  return (s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
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

function buildHtml(article) {
  const title     = esc(article.title || '')
  const desc      = esc(article.excerpt || article.meta_desc || '')
  const canonical = `${BASE}/blog/${esc(article.slug)}/`
  const cover     = article.cover_url ? esc(article.cover_url) : ''
  const bodyHtml  = mdToHtml(article.content || '')
  const dateStr   = article.created_at
    ? new Date(article.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''

  const schema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt || '',
    image: article.cover_url || undefined,
    datePublished: article.created_at,
    dateModified: article.updated_at,
    author: { '@type': 'Organization', name: 'Valorix AI' },
    publisher: { '@type': 'Organization', name: 'Valorix AI', url: BASE },
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
  })

  // Read the built index.html to get the asset hashes (JS/CSS)
  let appScripts = ''
  try {
    const indexHtml = fs.readFileSync(path.join(DIST_DIR, 'index.html'), 'utf8')
    // Extract script and link tags
    const scripts = (indexHtml.match(/<script[^>]*>[^<]*<\/script>|<script[^>]*\/>/g) || [])
      .filter(s => s.includes('/assets/'))
    const links   = (indexHtml.match(/<link[^>]*>/g) || [])
      .filter(l => l.includes('/assets/') && l.includes('stylesheet'))
    appScripts = [...links, ...scripts].join('\n  ')
  } catch {}

  return `<!DOCTYPE html>
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
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
  <script type="application/ld+json">${schema}</script>
  ${appScripts}
  <style>
    #seo-content{background:#030b18;color:#94a3b8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:760px;margin:0 auto;padding:2rem 1rem;line-height:1.75}
    #seo-content h1{font-size:clamp(1.6rem,4vw,2.2rem);font-weight:900;color:#fff;margin:1rem 0 1.5rem;line-height:1.2}
    #seo-content h2{font-size:1.3rem;font-weight:800;color:#fff;margin:2rem 0 .8rem;border-bottom:1px solid rgba(0,207,255,.15);padding-bottom:.4rem}
    #seo-content p{margin-bottom:1rem}
    #seo-content strong{color:#00cfff;font-weight:700}
    #seo-content ul{padding-left:1.5rem;margin-bottom:1rem}
    #seo-content li{margin-bottom:.3rem}
    #seo-content blockquote{border-left:3px solid #00cfff;padding:.5rem 1rem;background:rgba(0,207,255,.05);margin:1rem 0;border-radius:0 8px 8px 0}
    #seo-content .meta{color:#475569;font-size:.85rem;margin-bottom:2rem}
    #seo-content img.cover{width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:16px;margin-bottom:1.5rem;border:1px solid rgba(0,207,255,.15)}
    /* Скрываем SEO-контент когда React загрузился */
    body.react-ready #seo-content{display:none}
    #root:not(:empty) ~ #seo-content{display:none}
  </style>
</head>
<body>
  <!-- React SPA -->
  <div id="root"></div>

  <!-- SEO-контент: виден для Google, скрывается когда React загружается -->
  <div id="seo-content">
    <a href="${BASE}" style="color:#00cfff;text-decoration:none">← Valorix AI</a> /
    <a href="${BASE}/blog" style="color:#00cfff;text-decoration:none">Блог</a>
    ${cover ? `<img class="cover" src="${cover}" alt="${title}">` : ''}
    <h1>${title}</h1>
    <div class="meta">${dateStr}${article.sport && article.sport !== 'other' ? ` · ⚽ ${article.sport === 'football' ? 'Футбол' : article.sport}` : ''}</div>
    ${desc ? `<p><em>${desc}</em></p>` : ''}
    <div>${bodyHtml}</div>
  </div>

  <script>
    // Передаём данные статьи в React — не делает повторный запрос к API
    window.__PRELOADED_ARTICLE__ = ${JSON.stringify(article)};
    // Скрываем SEO-блок сразу как React отрендерился
    const _obs = new MutationObserver(() => {
      const root = document.getElementById('root');
      if (root && root.children.length > 0) {
        document.body.classList.add('react-ready');
        _obs.disconnect();
      }
    });
    _obs.observe(document.getElementById('root'), { childList: true });
  </script>
</body>
</html>`
}

async function main() {
  // 1. Fetch article list
  const listData = await get(`${RAILWAY_URL}/blog?limit=200`)
  const items = listData?.items || []
  if (!items.length) {
    console.log('[blog-pages] no published articles found')
    return
  }
  console.log(`[blog-pages] found ${items.length} articles`)

  // 2. Ensure dist/blog dir exists
  const blogDir = path.join(DIST_DIR, 'blog')
  fs.mkdirSync(blogDir, { recursive: true })

  let generated = 0
  for (const item of items) {
    // 3. Fetch full article content
    const article = await get(`${RAILWAY_URL}/blog/${item.slug}`)
    if (!article || !article.title) {
      console.warn(`[blog-pages] skipping ${item.slug} (no data)`)
      continue
    }

    // 4. Create dist/blog/{slug}/index.html
    const articleDir = path.join(blogDir, article.slug)
    fs.mkdirSync(articleDir, { recursive: true })
    fs.writeFileSync(path.join(articleDir, 'index.html'), buildHtml(article), 'utf8')
    generated++
    console.log(`[blog-pages] ✓ ${article.slug}`)
  }

  console.log(`[blog-pages] generated ${generated}/${items.length} pages`)
}

main().catch(e => {
  console.error('[blog-pages] error:', e.message)
  process.exit(0) // не ломаем деплой если скрипт упал
})
