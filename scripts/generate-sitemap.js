// Runs during GitHub Actions build — generates dist/sitemap.xml on valorix.ru domain
const https = require('https')
const fs    = require('fs')
const path  = require('path')

const BASE        = 'https://valorix.ru'
const RAILWAY_URL = process.env.RAILWAY_URL || 'https://web-production-fefcd.up.railway.app'
const OUT_FILE    = path.join(__dirname, '..', 'dist', 'sitemap.xml')

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => { try { resolve(JSON.parse(data)) } catch { resolve({}) } })
    }).on('error', () => resolve({}))
  })
}

async function main() {
  // Static pages
  const staticPages = [
    { loc: BASE,               priority: '1.0', changefreq: 'weekly'  },
    { loc: `${BASE}/blog`,     priority: '0.8', changefreq: 'weekly'  },
    { loc: `${BASE}/analyze`,  priority: '0.7', changefreq: 'monthly' },
    { loc: `${BASE}/privacy`,  priority: '0.3', changefreq: 'monthly' },
    { loc: `${BASE}/support`,  priority: '0.4', changefreq: 'monthly' },
  ]

  // Fetch published articles from Railway
  let articles = []
  try {
    const data = await get(`${RAILWAY_URL}/blog?limit=200`)
    articles = (data.items || []).map(a => ({
      loc:        `${BASE}/blog/${a.slug}`,
      lastmod:    (a.updated_at || a.created_at || '').slice(0, 10),
      priority:   '0.7',
      changefreq: 'monthly',
    }))
    console.log(`[sitemap] fetched ${articles.length} articles`)
  } catch (e) {
    console.warn('[sitemap] could not fetch articles:', e.message)
  }

  const allPages = [...staticPages, ...articles]
  const urls = allPages.map(p => {
    const lastmod = p.lastmod ? `<lastmod>${p.lastmod}</lastmod>` : ''
    return `  <url><loc>${p.loc}</loc>${lastmod}<changefreq>${p.changefreq}</changefreq><priority>${p.priority}</priority></url>`
  }).join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`

  fs.writeFileSync(OUT_FILE, xml, 'utf8')
  console.log(`[sitemap] written to ${OUT_FILE} (${allPages.length} URLs)`)
}

main()
