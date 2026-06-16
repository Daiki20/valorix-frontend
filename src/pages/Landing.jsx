import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'

/* ── Хук: подписывается на ширину окна ── */
function useWidth() {
  const [w, setW] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 1200)
  useEffect(() => {
    const handler = () => setW(window.innerWidth)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return w
}
import ballImg from '../assets/ball.png'
import { Link } from 'react-router-dom'
import { Search, Upload, Zap, TrendingUp, ChevronDown, Shield, Clock, BarChart2, Star, Target, Activity, Trophy, X } from 'lucide-react'
import Navbar from '../components/Navbar'
import MatchPreviewCard from '../components/MatchPreviewCard'
import Onboarding from '../components/Onboarding'
import ExpressCard from '../components/ExpressCard'
import AuthModal from '../components/AuthModal'
import AnalysisResult from '../components/AnalysisResult'
import { useAuth } from '../context/AuthContext'

/* ── Sample analysis data ── */
const SAMPLE_MATCH = {
  home: 'Реал Мадрид',
  away: 'Барселона',
  homeImg: 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg',
  awayImg: 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg',
  league: 'Ла Лига · Тур 28',
  date: 'Пример анализа',
}

const SAMPLE_ANALYSIS = {
  verdict: 'Победа Реал Мадрид или Ничья (Двойной шанс 1X)',
  summary: 'Реал Мадрид находится в великолепной форме — 7 побед в последних 9 матчах. Барселона испытывает проблемы в обороне (пропустила 14 голов в последних 7 выездных играх). Исторически El Clásico на «Сантьяго Бернабеу» даёт 61% побед хозяев.',
  confidence: 74,
  risk: 'medium',
  fairOdds: '1.62',
  bookOdds: '1.75',
  value: 8,
  reasons: [
    'Реал Мадрид выиграл 7 из последних 9 матчей Ла Лиги, набирая в среднем 2.3 гола за игру',
    'Барселона пропустила в 6 из 7 последних выездных матчей чемпионата',
    'На «Сантьяго Бернабеу» Реал не проигрывал Барселоне последние 4 встречи',
    'Левандовски под вопросом — возможное отсутствие главного форварда гостей',
    'Высокий мотивационный фактор: разница в 3 очка в таблице, Реал лидирует',
  ],
  extraBets: [
    { type: 'Тотал голов Больше 2.5', confidence: 78, reason: 'Обе команды в высоких по результативности сериях — среднее 3.4 гола в очных встречах за последние 5 лет' },
    { type: 'Обе команды забьют', confidence: 69, reason: 'Барселона забивала в 11 из 12 последних матчей, несмотря на проблемы в обороне' },
  ],
  bestOdds: [
    { name: 'Фонбет',   odds: '1.75', draw: '3.40', away: '4.20', real: true },
    { name: '1xBet',    odds: '1.72', draw: '3.45', away: '4.30', real: true },
    { name: 'Betcity',  odds: '1.68', draw: '3.50', away: '4.15', real: true },
    { name: 'Marathonbet', odds: '1.70', draw: '3.38', away: '4.25', real: true },
  ],
}

const A = '#00cfff'
const A2 = '#7b5ea7'
const ADIM = 'rgba(0,207,255,0.1)'
const AGLOW = 'rgba(0,207,255,0.25)'
const BG = '#030b18'
const BG2 = '#050f22'
const CARD = 'rgba(0,25,60,0.55)'
const BORDER = 'rgba(0,180,255,0.1)'
const TEXT = '#d8eeff'
const MUTED = '#4a6a8a'

/* ── Space Football (иллюстрация справа) ── */
function CosmicOrb() {
  return (
    <div className="cosmic-orb" style={{ position: 'relative', width: 480, height: 480, flexShrink: 0 }}>
      {/* Outer ambient glow */}
      <div style={{
        position: 'absolute', inset: -40,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,207,255,0.09) 0%, transparent 65%)',
        animation: 'glowPulse 4s ease-in-out infinite',
      }} />
      {/* Rotating outer ring */}
      <div style={{
        position: 'absolute', inset: 20,
        borderRadius: '50%',
        border: '1px solid rgba(0,207,255,0.12)',
        animation: 'rotateSlow 20s linear infinite',
      }}>
        <div style={{
          position: 'absolute', top: -4, left: '50%', transform: 'translateX(-50%)',
          width: 8, height: 8, borderRadius: '50%',
          background: A, boxShadow: `0 0 12px ${A}`,
        }} />
      </div>
      {/* Inner rotating ring */}
      <div style={{
        position: 'absolute', inset: 60,
        borderRadius: '50%',
        border: '1px solid rgba(123,94,167,0.2)',
        animation: 'rotateSlowRev 14s linear infinite',
      }}>
        <div style={{
          position: 'absolute', bottom: -4, right: '20%',
          width: 6, height: 6, borderRadius: '50%',
          background: A2, boxShadow: `0 0 10px ${A2}`,
        }} />
      </div>

      {/* ── Real Ball Image ── */}
      <div style={{
        position: 'absolute', inset: 80,
        animation: 'floatOrb 7s ease-in-out infinite',
        filter: 'drop-shadow(0 0 44px rgba(0,207,255,0.55)) drop-shadow(0 0 90px rgba(123,94,167,0.38))',
        willChange: 'transform',
      }}>
        {/* Circle clip wrapper */}
        <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', position: 'relative' }}>
          <img
            src={ballImg}
            alt="ball"
            loading="eager"
            style={{
              width: '100%', height: '100%',
              objectFit: 'cover', display: 'block',
              // Адаптация под тёмную космо-тему:
              // brightness — убираем студийную белизну
              // contrast  — сохраняем объём и детали панелей
              // saturate  — золото и синие швы становятся ярче
              // hue-rotate — лёгкий сдвиг в сторону cyan сайта
              filter: 'brightness(0.9) contrast(1.1) saturate(1.3) hue-rotate(-8deg)',
            }}
          />
          {/* Cyan ambient light — имитирует основной источник света сайта */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%', pointerEvents: 'none',
            background: 'radial-gradient(circle at 30% 25%, rgba(0,207,255,0.18) 0%, transparent 52%)',
          }} />
          {/* Purple rim light справа */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%', pointerEvents: 'none',
            background: 'radial-gradient(circle at 78% 40%, rgba(123,94,167,0.12) 0%, transparent 45%)',
          }} />
          {/* Тёмная виньетка снизу — приземляет */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%', pointerEvents: 'none',
            background: 'radial-gradient(circle at 50% 85%, rgba(1,6,24,0.55) 0%, transparent 55%)',
          }} />
        </div>
      </div>

      {/* Floating data bubbles */}
      {[
        { top: '8%',  left: '12%',  label: 'Форма',    val: '↑ 89%',    color: A },
        { top: '75%', left: '5%',   label: 'Травмы',   val: '3 игрока', color: '#ff7043' },
        { top: '15%', right: '5%',  label: 'Value',    val: '+12%',     color: '#b5ff4e' },
        { top: '70%', right: '8%',  label: 'Риск',     val: 'Низкий',   color: '#4caf7d' },
      ].map((b, i) => (
        <div key={i} style={{
          position: 'absolute', ...b,
          background: CARD, border: `1px solid ${BORDER}`,
          borderRadius: 10, padding: '7px 12px',
          backdropFilter: 'blur(12px)',
          animation: `floatOrb ${5 + i * 1.5}s ease-in-out infinite`,
          animationDelay: `${i * 0.8}s`,
        }}>
          <div style={{ fontSize: 10, color: MUTED, fontWeight: 600, marginBottom: 2 }}>{b.label}</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: b.color }}>{b.val}</div>
        </div>
      ))}
    </div>
  )
}

/* ── Feature icon cell ── */
function IconCell({ icon, label, href, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <a href={href} onClick={onClick} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      padding: '16px 12px', borderRadius: 14,
      background: hov ? 'rgba(0,207,255,0.08)' : 'rgba(0,207,255,0.04)',
      border: `1px solid ${hov ? 'rgba(0,207,255,0.25)' : 'rgba(0,207,255,0.08)'}`,
      cursor: 'pointer', transition: 'all 0.2s', textDecoration: 'none',
      boxShadow: hov ? '0 0 20px rgba(0,207,255,0.1)' : 'none',
    }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        background: hov ? 'rgba(0,207,255,0.15)' : ADIM,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: hov ? `0 0 16px ${AGLOW}` : 'none',
        transition: 'all 0.2s',
      }}>
        {icon}
      </div>
      <span style={{ fontSize: 11, color: hov ? TEXT : MUTED, fontWeight: 600, textAlign: 'center', transition: 'color 0.2s' }}>{label}</span>
    </a>
  )
}

export default function Landing() {
  const { user } = useAuth()
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [showSampleAnalysis, setShowSampleAnalysis] = useState(false)

  const vw = useWidth()
  const isMobile  = vw <= 767   // планшет и ниже
  const isSmall   = vw <= 479   // маленький телефон

  useEffect(() => {
    let onboarded = false
    try { onboarded = !!localStorage.getItem('valorix_onboarded') } catch {}
    if (user && !onboarded) {
      const t = setTimeout(() => setShowOnboarding(true), 600)
      return () => clearTimeout(t)
    }
  }, [user])

  return (
    <div style={{ minHeight: '100vh', background: BG, position: 'relative', overflow: 'hidden' }}>
      <Helmet>
        <title>Valorix AI — AI анализ матчей и прогнозы на спорт</title>
        <meta name="description" content="Valorix AI — бесплатный анализ матча за 15 секунд. AI прогнозы на футбол, хоккей, CS2, Dota 2, UFC. Загрузи скриншот линии букмекера — получи разбор формы команд, травм и value ставок." />
        <link rel="canonical" href="https://valorix.ru/" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "Какие виды спорта поддерживаются?",
              "acceptedAnswer": { "@type": "Answer", "text": "Valorix анализирует матчи по футболу, хоккею, CS2 и Dota2." }
            },
            {
              "@type": "Question",
              "name": "Сколько стоит один анализ?",
              "acceptedAnswer": { "@type": "Answer", "text": "Один AI-анализ матча стоит 28 монет. При регистрации вы получаете 50 монет бесплатно." }
            }
          ]
        })}</script>
      </Helmet>

      {/* ── Deep space background layers ── */}
      {/* Stars field */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: `
          radial-gradient(1px 1px at 15% 20%, rgba(0,207,255,0.5) 0%, transparent 100%),
          radial-gradient(1px 1px at 40% 8%,  rgba(255,255,255,0.4) 0%, transparent 100%),
          radial-gradient(1px 1px at 70% 15%, rgba(255,255,255,0.3) 0%, transparent 100%),
          radial-gradient(1px 1px at 85% 35%, rgba(0,207,255,0.4) 0%, transparent 100%),
          radial-gradient(1px 1px at 25% 60%, rgba(255,255,255,0.3) 0%, transparent 100%),
          radial-gradient(1px 1px at 55% 75%, rgba(0,207,255,0.3) 0%, transparent 100%),
          radial-gradient(1px 1px at 90% 70%, rgba(255,255,255,0.4) 0%, transparent 100%),
          radial-gradient(1px 1px at 10% 85%, rgba(123,94,167,0.5) 0%, transparent 100%),
          radial-gradient(1px 1px at 60% 45%, rgba(255,255,255,0.2) 0%, transparent 100%),
          radial-gradient(1px 1px at 78% 55%, rgba(0,207,255,0.3) 0%, transparent 100%)
        `,
      }} />
      {/* Main glow — top right */}
      <div style={{
        position: 'fixed', top: -300, right: -200, width: 800, height: 800,
        background: 'radial-gradient(circle, rgba(0,207,255,0.06) 0%, transparent 65%)',
        borderRadius: '50%', pointerEvents: 'none', zIndex: 0,
        animation: 'floatOrb 10s ease-in-out infinite',
        willChange: 'transform',
      }} />
      {/* Purple glow — bottom left */}
      <div style={{
        position: 'fixed', bottom: -200, left: -150, width: 700, height: 700,
        background: 'radial-gradient(circle, rgba(123,94,167,0.08) 0%, transparent 65%)',
        borderRadius: '50%', pointerEvents: 'none', zIndex: 0,
        animation: 'floatOrb 14s ease-in-out infinite reverse',
        willChange: 'transform',
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <Navbar />

        {/* ════════════════════════════════════
            HERO
        ════════════════════════════════════ */}
        <section className="hero-section" style={{
          padding: isSmall ? '36px 20px 28px' : isMobile ? '52px 24px 36px' : '80px 24px 60px',
          position: 'relative', overflow: 'hidden',
        }}>
          <div className="container" style={{ maxWidth: 1200, margin: '0 auto' }}>


            <div className="hero-grid" style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: isMobile ? 0 : 60,
              alignItems: 'center',
            }}>

              {/* ── Left: text ── */}
              <div style={{ animation: 'fadeInUp 0.7s ease forwards' }}>
                <h1 className="hero-title" style={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: 62, fontWeight: 800, lineHeight: 1.08,
                  color: TEXT, marginBottom: 28, letterSpacing: -1.5,
                }}>
                  AI анализ матча<br />
                  и прогнозы, которые{' '}
                  <em style={{ color: A, fontStyle: 'italic', textShadow: `0 0 40px ${AGLOW}` }}>побеждают</em>
                </h1>

                <p className="hero-subtitle" style={{
                  fontSize: 15, color: MUTED, lineHeight: 1.85, marginBottom: 36,
                  maxWidth: 480, fontFamily: 'Outfit, sans-serif',
                }}>
                  Выбирай матч или загружай скрин линии букмекера — искусственный интеллект за{' '}
                  <span style={{ color: A, fontWeight: 600 }}>15 секунд</span>{' '}
                  проанализирует форму команд, травмы, личные встречи и найдёт value ставки.
                  Футбол, хоккей, CS2, Dota 2.
                </p>

                <div className="hero-buttons" style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 48 }}>
                  <Link to="/analyze" className="btn-primary" style={{ fontSize: 15, padding: '14px 32px' }}>
                    <Search size={16} />
                    Анализ матча
                    <span style={{
                      background: 'rgba(3,11,24,0.3)', borderRadius: 20,
                      padding: '2px 8px', fontSize: 12, fontWeight: 800,
                      display: 'flex', alignItems: 'center', gap: 3,
                    }}>
                      <Zap size={11} fill="currentColor" strokeWidth={0} />
                      28
                    </span>
                  </Link>
                  <Link to="/upload" className="btn-outline" style={{ fontSize: 15 }}>
                    <Upload size={16} />
                    Загрузить скрин
                  </Link>
                  <button
                    onClick={() => setShowSampleAnalysis(true)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '14px 24px', fontSize: 15, fontWeight: 600,
                      background: 'rgba(123,94,167,0.12)',
                      color: '#c4a8ff',
                      border: '1px solid rgba(123,94,167,0.35)',
                      borderRadius: 12, cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontFamily: 'Outfit, sans-serif',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(123,94,167,0.22)'; e.currentTarget.style.borderColor = 'rgba(123,94,167,0.6)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(123,94,167,0.12)'; e.currentTarget.style.borderColor = 'rgba(123,94,167,0.35)' }}
                  >
                    📊 Пример анализа
                  </button>
                </div>

                {/* Feature icon grid (2 rows × 3 cols) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, maxWidth: isSmall ? '100%' : 360 }}>
                  <IconCell href="/analyze" icon={<BarChart2 size={18} color={A} />} label="AI Анализ" />
                  <IconCell href="/#express" icon={<Zap size={18} color="#b5ff4e" />} label="Экспресс" />
                  <IconCell href="/upload" icon={<Upload size={18} color="#7b5ea7" />} label="Скриншот" />
                  <IconCell href="/#how" icon={<TrendingUp size={18} color="#4caf7d" />} label="Прогнозы" />
                  <IconCell href="/analyze" icon={<Target size={18} color="#ff7043" />} label="Value-ставки" />
                  <IconCell href="/history" icon={<Activity size={18} color="#ffb74d" />} label="История" />
                </div>
              </div>

              {/* ── Right: cosmic orb (только десктоп) ── */}
              {!isMobile && (
                <div className="hero-orb-section" style={{
                  display: 'flex', justifyContent: 'flex-end',
                  animation: 'fadeInRight 0.8s ease forwards',
                }}>
                  <CosmicOrb />
                </div>
              )}

            </div>
          </div>
        </section>

        {/* ── Stats ticker ── */}
        <div style={{
          borderTop: `1px solid ${BORDER}`,
          borderBottom: `1px solid ${BORDER}`,
          background: 'rgba(0,25,60,0.3)',
          padding: '20px 24px',
          backdropFilter: 'blur(8px)',
        }}>
          <div className="container stats-ticker-inner" style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'center', gap: isMobile ? 20 : 64, flexWrap: 'wrap' }}>
            {[
              { num: '10 000+', label: 'Анализов сделано' },
              { num: '73%',     label: 'Точность прогнозов' },
              { num: '< 15с',   label: 'Время анализа' },
              { num: '5+',      label: 'Видов спорта' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div className="stat-number" style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5 }}>{s.num}</div>
                <div style={{ fontSize: 12, color: MUTED, fontWeight: 500, marginTop: 3, fontFamily: 'Outfit, sans-serif' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ════════════════════════════════════
            EXPRESS SECTION
        ════════════════════════════════════ */}
        <div id="express" className="express-section" style={{ maxWidth: 1440, margin: '0 auto', padding: '72px 32px 0' }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div className="badge" style={{ marginBottom: 16 }}>ЕЖЕДНЕВНО</div>
            <h2 className="section-title" style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: 42, fontWeight: 800, color: TEXT, letterSpacing: -1, margin: 0,
            }}>
              Топовые{' '}
              <em style={{ color: A, fontStyle: 'italic' }}>AI‑экспрессы</em>
            </h2>
            <p style={{ color: MUTED, fontSize: 15, marginTop: 14, fontFamily: 'Outfit, sans-serif' }}>
              Каждый день — готовые экспрессы на основе реальной статистики и коэффициентов
            </p>
          </div>
          <ExpressCard onAuthRequired={() => setShowAuth(true)} />
        </div>

        {/* ════════════════════════════════════
            HOW IT WORKS
        ════════════════════════════════════ */}
        <section id="how" className="section-pad" style={{
          background: BG2, padding: '96px 24px', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: -120, left: '50%', transform: 'translateX(-50%)',
            width: 900, height: 400,
            background: 'radial-gradient(ellipse, rgba(0,207,255,0.04) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div className="container" style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
            <div style={{ marginBottom: 64 }}>
              <div className="badge" style={{ marginBottom: 16 }}>КАК ЭТО РАБОТАЕТ</div>
              <h2 className="section-title" style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: 42, fontWeight: 800, color: TEXT, letterSpacing: -1,
              }}>
                Три шага до умного прогноза
              </h2>
            </div>

            <div className="how-grid" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 2fr', gap: isMobile ? 20 : 48, alignItems: 'start' }}>
              {/* Left: big card — скрываем на мобилке */}
              {!isMobile && <div className="card-glow how-grid-feature" style={{ padding: '36px 32px' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 16,
                  background: ADIM, border: `1px solid rgba(0,207,255,0.15)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 24, boxShadow: `0 0 24px ${AGLOW}`,
                }}>
                  <Zap size={26} color={A} />
                </div>
                <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 24, fontWeight: 700, color: TEXT, marginBottom: 14 }}>
                  AI думает за тебя
                </h3>
                <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.85, fontFamily: 'Outfit, sans-serif' }}>
                  Пока ты смотришь матч — AI уже проанализировал сотни факторов, нашёл паттерны и посчитал реальные вероятности.
                </p>
                <div style={{ marginTop: 28, padding: '16px 20px', borderRadius: 12, background: 'rgba(0,207,255,0.06)', border: `1px solid rgba(0,207,255,0.12)` }}>
                  <div style={{ fontSize: 12, color: MUTED, marginBottom: 6, fontFamily: 'Outfit, sans-serif' }}>Индекс уверенности</div>
                  <div style={{ height: 6, borderRadius: 3, background: 'rgba(0,207,255,0.15)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: '78%', borderRadius: 3, background: `linear-gradient(90deg, ${A}, #7b5ea7)`, boxShadow: `0 0 8px ${AGLOW}` }} />
                  </div>
                  <div style={{ fontSize: 13, color: A, fontWeight: 700, marginTop: 6 }}>78% — Высокий</div>
                </div>
              </div>}

              {/* Right: 3 steps */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { icon: <Search size={20} color={A} />, n: '01', title: 'Выбери матч', desc: 'Найди предстоящий матч по названию команды или лиге. Или загрузи скрин линии букмекера.' },
                  { icon: <Activity size={20} color={A} />, n: '02', title: 'AI анализирует', desc: 'Система изучает форму команд, травмы, новости, статистику личных встреч и сотни других факторов за 15 секунд.' },
                  { icon: <Trophy size={20} color={A} />, n: '03', title: 'Получи прогноз', desc: 'Чёткий вердикт с индексом доверия, оценкой рисков и лучшими коэффициентами у букмекеров.' },
                ].map((s, i) => (
                  <div key={i} className="card-glow" style={{ padding: '24px 28px', display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                      background: ADIM, border: `1px solid rgba(0,207,255,0.15)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: `0 0 16px rgba(0,207,255,0.12)`,
                    }}>{s.icon}</div>
                    <div>
                      <div style={{ fontSize: 11, color: A, fontWeight: 700, letterSpacing: 2, marginBottom: 6, fontFamily: 'Outfit, sans-serif' }}>ШАГ {s.n}</div>
                      <h3 style={{ fontSize: 17, fontWeight: 700, color: TEXT, marginBottom: 8, fontFamily: 'Outfit, sans-serif' }}>{s.title}</h3>
                      <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.75, fontFamily: 'Outfit, sans-serif' }}>{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="glow-divider" />

        {/* ════════════════════════════════════
            FEATURES
        ════════════════════════════════════ */}
        <section className="section-pad" style={{ padding: '96px 24px', background: BG }}>
          <div className="container" style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div className="features-outer" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 28 : 48, alignItems: 'start' }}>
              {/* Left header */}
              <div>
                <div className="badge" style={{ marginBottom: 20 }}>ПРЕИМУЩЕСТВА</div>
                <h2 className="section-title" style={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: 42, fontWeight: 800, color: TEXT, letterSpacing: -1, marginBottom: 20, lineHeight: 1.15,
                }}>
                  Почему именно<br />
                  <em style={{ color: A, fontStyle: 'italic' }}>Valorix AI</em>?
                </h2>
                <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.8, marginBottom: 32, fontFamily: 'Outfit, sans-serif' }}>
                  Мы не гарантируем победу — мы даём тебе данные для принятия умных решений. Как профессиональный аналитик в кармане.
                </p>
                <Link to="/analyze" className="btn-primary">
                  <Zap size={16} />
                  Попробовать бесплатно
                </Link>
              </div>

              {/* Right feature cards 2×2 */}
              <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                {[
                  { icon: <BarChart2 size={20} color={A} />, title: 'Глубокий анализ', desc: 'Форма, травмы, погода, мотивация и коэффициенты в одном месте', glow: AGLOW },
                  { icon: <Clock size={20} color='#b5ff4e' />, title: 'За 15 секунд', desc: 'Мгновенный результат без долгих ожиданий', glow: 'rgba(181,255,78,0.2)' },
                  { icon: <Star size={20} color='#ffb74d' />, title: 'Value-ставки', desc: 'Находим где реальная вероятность выше предложения', glow: 'rgba(255,183,77,0.2)' },
                  { icon: <Shield size={20} color='#7b5ea7' />, title: 'Реальные коэфы', desc: 'Fonbet, Pari, 1xbet и другие в реальном времени', glow: 'rgba(123,94,167,0.25)' },
                ].map((f, i) => (
                  <div key={i} className="card-glow" style={{ padding: '22px 20px' }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: 12,
                      background: 'rgba(0,207,255,0.06)',
                      border: `1px solid rgba(0,207,255,0.1)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: 14, boxShadow: `0 0 14px ${f.glow}`,
                    }}>{f.icon}</div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: TEXT, marginBottom: 8, fontFamily: 'Outfit, sans-serif' }}>{f.title}</h3>
                    <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.7, fontFamily: 'Outfit, sans-serif' }}>{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="glow-divider" />

        {/* ════════════════════════════════════
            FAQ
        ════════════════════════════════════ */}
        <section id="faq" className="section-pad" style={{ background: BG2, padding: '96px 24px' }}>
          <div className="container" style={{ maxWidth: 760, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 60 }}>
              <div className="badge" style={{ marginBottom: 16 }}>FAQ</div>
              <h2 className="section-title" style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: 42, fontWeight: 800, color: TEXT, letterSpacing: -1,
              }}>Частые вопросы</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { q: 'Насколько точен AI-анализ?', a: 'AI анализирует сотни факторов и показывает индекс доверия. Мы не гарантируем результат — это аналитический инструмент для принятия решений.' },
                { q: 'Что значит "загрузить скрин"?', a: 'Сделай скриншот линии у букмекера и загрузи его. AI прочитает коэффициенты и проанализирует где есть Value.' },
                { q: 'Сколько стоит один анализ?', a: 'Один анализ стоит 28 монет. Монеты можно пополнить в любое время через раздел "Пополнить".' },
                { q: 'Какие виды спорта и игры поддерживаются?', a: 'Valorix анализирует матчи по футболу, хоккею, CS2 и Dota2. Список поддерживаемых видов спорта постоянно расширяется.' },
              ].map((item, i) => (
                <FaqItem key={i} q={item.q} a={item.a} />
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════
            CTA
        ════════════════════════════════════ */}
        <section style={{
          padding: '110px 24px', textAlign: 'center',
          position: 'relative', overflow: 'hidden', background: BG,
        }}>
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(0,207,255,0.05) 0%, transparent 70%)',
          }} />
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: 'linear-gradient(rgba(0,207,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,207,255,0.02) 1px, transparent 1px)',
            backgroundSize: '52px 52px',
          }} />
          <div style={{ maxWidth: 600, margin: '0 auto', position: 'relative' }}>
            <div className="badge" style={{ marginBottom: 24 }}>НАЧНИ СЕЙЧАС</div>
            <h2 className="cta-title" style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: 52, fontWeight: 800, color: TEXT, letterSpacing: -2, marginBottom: 20, lineHeight: 1.1,
            }}>
              Готов к умным<br />
              <em style={{ color: A, fontStyle: 'italic' }}>ставкам</em>?
            </h2>
            <p style={{ fontSize: 16, color: MUTED, marginBottom: 40, lineHeight: 1.8, fontFamily: 'Outfit, sans-serif' }}>
              Зарегистрируйся и получи{' '}
              <strong style={{ color: A }}>50 монет бесплатно</strong>{' '}
              для первых анализов
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/analyze" className="btn-primary" style={{ fontSize: 16, padding: '16px 44px', boxShadow: `0 8px 44px ${AGLOW}` }}>
                <Zap size={18} />
                Начать анализ
              </Link>
              <button onClick={() => setShowAuth(true)} className="btn-outline" style={{ fontSize: 16, padding: '16px 36px' }}>
                Регистрация
              </button>
            </div>
            {/* Trust indicators */}
            <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginTop: 28, flexWrap: 'wrap' }}>
              {['✓ Регистрация бесплатна', '✓ 50 монет в подарок', '✓ Анализ за 15 секунд'].map((t, i) => (
                <span key={i} style={{ fontSize: 13, color: MUTED, fontFamily: 'Outfit, sans-serif' }}>{t}</span>
              ))}
            </div>
          </div>
        </section>

        {showOnboarding && <Onboarding onClose={() => setShowOnboarding(false)} />}
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

        {/* ════════════════════════════════════
            STREAMER AFFILIATE BANNER
        ════════════════════════════════════ */}
        <section id="partner" style={{ background: BG, padding: '0 24px 80px' }}>
          <div style={{
            maxWidth: 1100, margin: '0 auto',
            background: 'linear-gradient(135deg, #0d1f3c 0%, #1a1040 50%, #0d1f3c 100%)',
            borderRadius: 24, border: '1px solid rgba(0,207,255,0.15)',
            padding: '48px 56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 40, flexWrap: 'wrap', position: 'relative', overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
          }}>
            <div style={{ position: 'absolute', right: -60, top: -60, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(123,94,167,0.25) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', left: '40%', bottom: -80, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,207,255,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ flex: 1, minWidth: 260, position: 'relative' }}>
              <div style={{ display: 'inline-block', background: 'rgba(0,207,255,0.1)', border: '1px solid rgba(0,207,255,0.25)', borderRadius: 20, padding: '4px 14px', fontSize: 12, fontWeight: 700, color: A, letterSpacing: 1, marginBottom: 16, fontFamily: 'Outfit, sans-serif' }}>ПАРТНЁРСКАЯ ПРОГРАММА</div>
              <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 28, fontWeight: 800, color: TEXT, marginBottom: 12, lineHeight: 1.2 }}>
                Есть аудитория?<br /><span style={{ color: A }}>Зарабатывай с нами</span>
              </h3>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 15, color: MUTED, lineHeight: 1.7, marginBottom: 24 }}>
                Ты стример или блогер с онлайном от 50 человек?<br />
                Получай <strong style={{ color: TEXT }}>50% с первого пополнения</strong> и{' '}
                <strong style={{ color: TEXT }}>30% с каждого следующего</strong> — без ограничений.
              </p>
              <a href="https://t.me/andrusha_pv" target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'linear-gradient(135deg, #00cfff, #7b5ea7)', color: '#fff', fontWeight: 700, fontSize: 15, padding: '14px 28px', borderRadius: 12, textDecoration: 'none', boxShadow: '0 8px 30px rgba(0,207,255,0.25)', transition: 'transform 0.2s, box-shadow 0.2s', fontFamily: 'Outfit, sans-serif' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,207,255,0.4)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,207,255,0.25)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.19 13.9l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.958.659z"/></svg>
                Написать в Telegram
              </a>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 220, position: 'relative' }}>
              {[
                { pct: '50%', label: 'с первого пополнения', color: A },
                { pct: '30%', label: 'со всех следующих', color: '#7b5ea7' },
                { pct: '∞', label: 'без лимита рефералов', color: '#22c55e' },
              ].map(({ pct, label, color }) => (
                <div key={pct} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 26, fontWeight: 800, color, minWidth: 56 }}>{pct}</span>
                  <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13, color: MUTED, lineHeight: 1.4 }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer style={{
          background: '#020810', color: MUTED,
          padding: '52px 24px 36px', textAlign: 'center', position: 'relative',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 1,
            background: `linear-gradient(90deg, transparent, rgba(0,207,255,0.25), rgba(123,94,167,0.2), transparent)`,
          }} />
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ marginBottom: 20 }}>
              <span style={{
                fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: 22,
                color: TEXT, letterSpacing: -0.5,
              }}>
                Valorix <em style={{ color: A, fontStyle: 'italic' }}>AI</em>
              </span>
            </div>
            <p style={{ fontSize: 13, marginBottom: 24, fontFamily: 'Outfit, sans-serif' }}>
              AI-аналитика для спортивных ставок. Играйте ответственно. 18+
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 28, flexWrap: 'wrap', marginBottom: 28 }}>
              {[
                { to: '/support', l: 'Поддержка' },
                { to: '/privacy', l: 'Конфиденциальность' },
                { to: '/terms', l: 'Пользовательское соглашение' },
                { to: '/about', l: 'О сервисе' },
              ].map(({ to, l }) => (
                <Link key={to} to={to} style={{ color: MUTED, fontSize: 13, textDecoration: 'none', fontWeight: 500, fontFamily: 'Outfit, sans-serif', transition: 'color 0.18s' }}
                  onMouseEnter={e => e.target.style.color = A}
                  onMouseLeave={e => e.target.style.color = MUTED}>
                  {l}
                </Link>
              ))}
            </div>
            <div style={{ height: 1, background: 'rgba(255,255,255,0.04)', marginBottom: 20 }} />
            <p style={{ fontSize: 12, color: '#1e3a5a', fontFamily: 'Outfit, sans-serif' }}>© 2026 Valorix AI · Пищев Андрей Сергеевич · ИНН 470805349664 · Самозанятый</p>
          </div>
        </footer>
      </div>

      {/* ── Sample Analysis Modal ── */}
      {showSampleAnalysis && (
        <div
          onClick={() => setShowSampleAnalysis(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(3,11,24,0.88)',
            backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            padding: '24px 16px',
            overflowY: 'auto',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 720,
              background: 'rgba(5,15,34,0.98)',
              border: '1px solid rgba(0,180,255,0.15)',
              borderRadius: 20,
              padding: '28px 28px 32px',
              boxShadow: '0 0 60px rgba(0,207,255,0.12), 0 32px 80px rgba(0,0,0,0.6)',
              position: 'relative',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 24, paddingBottom: 16,
              borderBottom: '1px solid rgba(0,180,255,0.1)',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 18, }}>📊</span>
                  <span style={{ fontSize: 18, fontWeight: 800, color: TEXT, fontFamily: 'Space Grotesk, sans-serif' }}>
                    Пример AI-анализа
                  </span>
                </div>
                <p style={{ fontSize: 13, color: MUTED, fontFamily: 'Outfit, sans-serif', margin: 0 }}>
                  Так выглядит полный анализ матча — данные примерные
                </p>
              </div>
              <button
                onClick={() => setShowSampleAnalysis(false)}
                style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: MUTED,
                  transition: 'all 0.2s', flexShrink: 0,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = TEXT }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = MUTED }}
              >
                <X size={16} />
              </button>
            </div>

            <AnalysisResult match={SAMPLE_MATCH} analysis={SAMPLE_ANALYSIS} />

            {/* CTA */}
            <div style={{
              marginTop: 24, padding: '20px 24px',
              background: 'rgba(0,207,255,0.06)',
              border: '1px solid rgba(0,207,255,0.18)',
              borderRadius: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexWrap: 'wrap', gap: 12,
            }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: TEXT, marginBottom: 2, fontFamily: 'Space Grotesk, sans-serif' }}>
                  Хочешь такой же анализ?
                </div>
                <div style={{ fontSize: 13, color: MUTED, fontFamily: 'Outfit, sans-serif' }}>
                  Выбери матч — AI выдаст результат за 15 секунд
                </div>
              </div>
              <Link
                to="/analyze"
                onClick={() => setShowSampleAnalysis(false)}
                className="btn-primary"
                style={{ fontSize: 14, padding: '12px 24px', whiteSpace: 'nowrap' }}
              >
                <Search size={15} />
                Анализировать матч
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      className="card"
      style={{
        padding: '20px 26px', cursor: 'pointer', userSelect: 'none',
        transition: 'border-color 0.2s, background 0.2s',
        borderColor: open ? 'rgba(0,207,255,0.25)' : BORDER,
        background: open ? 'rgba(0,207,255,0.05)' : CARD,
      }}
      onClick={() => setOpen(!open)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 600, fontSize: 15, color: TEXT, fontFamily: 'Outfit, sans-serif' }}>{q}</span>
        <ChevronDown size={18} color={MUTED}
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.22s', flexShrink: 0 }} />
      </div>
      {open && (
        <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.8, marginTop: 14, fontFamily: 'Outfit, sans-serif' }}>{a}</p>
      )}
    </div>
  )
}
