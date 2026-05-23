import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Upload, Zap, TrendingUp, ChevronDown, Shield, Clock, BarChart2, Star, Target, Activity, Trophy } from 'lucide-react'
import Navbar from '../components/Navbar'
import MatchPreviewCard from '../components/MatchPreviewCard'
import Onboarding from '../components/Onboarding'
import ExpressCard from '../components/ExpressCard'
import AuthModal from '../components/AuthModal'
import { useAuth } from '../context/AuthContext'

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

/* ── Glowing cosmic orb (иллюстрация справа) ── */
function CosmicOrb() {
  return (
    <div style={{ position: 'relative', width: 480, height: 480, flexShrink: 0 }}>
      {/* Outer glow ring 1 */}
      <div style={{
        position: 'absolute', inset: -40,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,207,255,0.08) 0%, transparent 65%)',
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
      {/* Core sphere */}
      <div style={{
        position: 'absolute', inset: 80,
        borderRadius: '50%',
        background: `radial-gradient(circle at 35% 35%, rgba(0,207,255,0.35) 0%, rgba(123,94,167,0.25) 45%, rgba(0,10,40,0.9) 100%)`,
        boxShadow: `0 0 60px rgba(0,207,255,0.2), 0 0 120px rgba(123,94,167,0.15), inset 0 0 40px rgba(0,207,255,0.1)`,
        animation: 'floatOrb 7s ease-in-out infinite',
      }}>
        {/* Inner highlight */}
        <div style={{
          position: 'absolute', top: '18%', left: '22%',
          width: '30%', height: '30%',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
          filter: 'blur(8px)',
        }} />
        {/* Stats floating inside */}
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          <div style={{ fontSize: 11, color: 'rgba(0,207,255,0.7)', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>Точность</div>
          <div style={{ fontSize: 38, fontWeight: 800, fontFamily: 'Playfair Display, serif', color: TEXT, letterSpacing: -1 }}>73%</div>
          <div style={{ fontSize: 11, color: MUTED, fontWeight: 500 }}>прогнозов</div>
        </div>
      </div>
      {/* Floating data bubbles */}
      {[
        { top: '8%',  left: '12%',  label: 'Форма',    val: '↑ 89%', color: A },
        { top: '75%', left: '5%',   label: 'Травмы',   val: '3 игрока', color: '#ff7043' },
        { top: '15%', right: '5%',  label: 'Value',    val: '+12%', color: '#b5ff4e' },
        { top: '70%', right: '8%',  label: 'Риск',     val: 'Низкий', color: '#4caf7d' },
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
      }} />
      {/* Purple glow — bottom left */}
      <div style={{
        position: 'fixed', bottom: -200, left: -150, width: 700, height: 700,
        background: 'radial-gradient(circle, rgba(123,94,167,0.08) 0%, transparent 65%)',
        borderRadius: '50%', pointerEvents: 'none', zIndex: 0,
        animation: 'floatOrb 14s ease-in-out infinite reverse',
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <Navbar />

        {/* ════════════════════════════════════
            HERO
        ════════════════════════════════════ */}
        <section style={{ padding: '80px 24px 60px', position: 'relative', overflow: 'hidden' }}>
          <div className="container" style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>

              {/* ── Left: text ── */}
              <div style={{ animation: 'fadeInUp 0.7s ease forwards' }}>
                <h1 className="hero-title" style={{
                  fontFamily: 'Playfair Display, serif',
                  fontSize: 62, fontWeight: 800, lineHeight: 1.08,
                  color: TEXT, marginBottom: 28, letterSpacing: -1.5,
                }}>
                  Анализ матчей,<br />
                  который{' '}
                  <em style={{ color: A, fontStyle: 'italic', textShadow: `0 0 40px ${AGLOW}` }}>побеждает</em>
                  <br />вместе с тобой
                </h1>

                <p className="hero-subtitle" style={{
                  fontSize: 15, color: MUTED, lineHeight: 1.85, marginBottom: 36,
                  maxWidth: 480, fontFamily: 'Inter, sans-serif',
                }}>
                  Выбирай матч или загружай скрин линии букмекера — AI за{' '}
                  <span style={{ color: A, fontWeight: 600 }}>15 секунд</span>{' '}
                  проанализирует форму команд, травмы, личные встречи и покажет где настоящая ценность.
                </p>

                <div className="hero-buttons" style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 48 }}>
                  <Link to="/analyze" className="btn-primary" style={{ fontSize: 15, padding: '14px 32px' }}>
                    <Search size={16} />
                    Анализ матча
                    <span style={{
                      background: 'rgba(3,11,24,0.3)', borderRadius: 20,
                      padding: '2px 8px', fontSize: 12, fontWeight: 800,
                    }}>19 🔥</span>
                  </Link>
                  <Link to="/upload" className="btn-outline" style={{ fontSize: 15 }}>
                    <Upload size={16} />
                    Загрузить скрин
                  </Link>
                </div>

                {/* Feature icon grid (2 rows × 3 cols) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, maxWidth: 360 }}>
                  <IconCell href="/analyze" icon={<BarChart2 size={18} color={A} />} label="AI Анализ" />
                  <IconCell href="/#express" icon={<Zap size={18} color="#b5ff4e" />} label="Экспресс" />
                  <IconCell href="/upload" icon={<Upload size={18} color="#7b5ea7" />} label="Скриншот" />
                  <IconCell href="/#how" icon={<TrendingUp size={18} color="#4caf7d" />} label="Прогнозы" />
                  <IconCell href="/analyze" icon={<Target size={18} color="#ff7043" />} label="Value-ставки" />
                  <IconCell href="/history" icon={<Activity size={18} color="#ffb74d" />} label="История" />
                </div>
              </div>

              {/* ── Right: cosmic orb ── */}
              <div style={{
                display: 'flex', justifyContent: 'flex-end',
                animation: 'fadeInRight 0.8s ease forwards',
              }}>
                <CosmicOrb />
              </div>

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
          <div className="container" style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'center', gap: 64, flexWrap: 'wrap' }}>
            {[
              { num: '10 000+', label: 'Анализов сделано' },
              { num: '73%',     label: 'Точность прогнозов' },
              { num: '< 15с',   label: 'Время анализа' },
              { num: '5+',      label: 'Видов спорта' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div className="stat-number" style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5 }}>{s.num}</div>
                <div style={{ fontSize: 12, color: MUTED, fontWeight: 500, marginTop: 3, fontFamily: 'Inter, sans-serif' }}>{s.label}</div>
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
            <h2 style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: 42, fontWeight: 800, color: TEXT, letterSpacing: -1, margin: 0,
            }}>
              Топовые{' '}
              <em style={{ color: A, fontStyle: 'italic' }}>AI‑экспрессы</em>
            </h2>
            <p style={{ color: MUTED, fontSize: 15, marginTop: 14, fontFamily: 'Inter, sans-serif' }}>
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
                fontFamily: 'Playfair Display, serif',
                fontSize: 42, fontWeight: 800, color: TEXT, letterSpacing: -1,
              }}>
                Три шага до умного прогноза
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 48, alignItems: 'start' }}>
              {/* Left: big card */}
              <div className="card-glow" style={{ padding: '36px 32px' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 16,
                  background: ADIM, border: `1px solid rgba(0,207,255,0.15)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 24, boxShadow: `0 0 24px ${AGLOW}`,
                }}>
                  <Zap size={26} color={A} />
                </div>
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 24, fontWeight: 700, color: TEXT, marginBottom: 14 }}>
                  AI думает за тебя
                </h3>
                <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.85, fontFamily: 'Inter, sans-serif' }}>
                  Пока ты смотришь матч — AI уже проанализировал сотни факторов, нашёл паттерны и посчитал реальные вероятности.
                </p>
                <div style={{ marginTop: 28, padding: '16px 20px', borderRadius: 12, background: 'rgba(0,207,255,0.06)', border: `1px solid rgba(0,207,255,0.12)` }}>
                  <div style={{ fontSize: 12, color: MUTED, marginBottom: 6, fontFamily: 'Inter, sans-serif' }}>Индекс уверенности</div>
                  <div style={{ height: 6, borderRadius: 3, background: 'rgba(0,207,255,0.15)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: '78%', borderRadius: 3, background: `linear-gradient(90deg, ${A}, #7b5ea7)`, boxShadow: `0 0 8px ${AGLOW}` }} />
                  </div>
                  <div style={{ fontSize: 13, color: A, fontWeight: 700, marginTop: 6 }}>78% — Высокий</div>
                </div>
              </div>

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
                      <div style={{ fontSize: 11, color: A, fontWeight: 700, letterSpacing: 2, marginBottom: 6, fontFamily: 'Inter, sans-serif' }}>ШАГ {s.n}</div>
                      <h3 style={{ fontSize: 17, fontWeight: 700, color: TEXT, marginBottom: 8, fontFamily: 'Inter, sans-serif' }}>{s.title}</h3>
                      <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.75, fontFamily: 'Inter, sans-serif' }}>{s.desc}</p>
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'start' }}>
              {/* Left header */}
              <div>
                <div className="badge" style={{ marginBottom: 20 }}>ПРЕИМУЩЕСТВА</div>
                <h2 style={{
                  fontFamily: 'Playfair Display, serif',
                  fontSize: 42, fontWeight: 800, color: TEXT, letterSpacing: -1, marginBottom: 20, lineHeight: 1.15,
                }}>
                  Почему именно<br />
                  <em style={{ color: A, fontStyle: 'italic' }}>Valorix AI</em>?
                </h2>
                <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.8, marginBottom: 32, fontFamily: 'Inter, sans-serif' }}>
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
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: TEXT, marginBottom: 8, fontFamily: 'Inter, sans-serif' }}>{f.title}</h3>
                    <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.7, fontFamily: 'Inter, sans-serif' }}>{f.desc}</p>
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
              <h2 style={{
                fontFamily: 'Playfair Display, serif',
                fontSize: 42, fontWeight: 800, color: TEXT, letterSpacing: -1,
              }}>Частые вопросы</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { q: 'Насколько точен AI-анализ?', a: 'AI анализирует сотни факторов и показывает индекс доверия. Мы не гарантируем результат — это аналитический инструмент для принятия решений.' },
                { q: 'Что значит "загрузить скрин"?', a: 'Сделай скриншот линии у букмекера и загрузи его. AI прочитает коэффициенты и проанализирует где есть Value.' },
                { q: 'Сколько стоит один анализ?', a: 'Один анализ стоит 19 монет. Монеты можно пополнить в любое время через раздел "Пополнить".' },
                { q: 'Какие виды спорта поддерживаются?', a: 'Сейчас поддерживается футбол и хоккей. В ближайшее время добавим теннис и баскетбол.' },
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
            <h2 style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: 52, fontWeight: 800, color: TEXT, letterSpacing: -2, marginBottom: 20, lineHeight: 1.1,
            }}>
              Готов к умным<br />
              <em style={{ color: A, fontStyle: 'italic' }}>ставкам</em>?
            </h2>
            <p style={{ fontSize: 16, color: MUTED, marginBottom: 40, lineHeight: 1.8, fontFamily: 'Inter, sans-serif' }}>
              Зарегистрируйся и получи{' '}
              <strong style={{ color: A }}>38 монет бесплатно</strong>{' '}
              для первого анализа
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
              {['✓ Регистрация бесплатна', '✓ 38 монет в подарок', '✓ Анализ за 15 секунд'].map((t, i) => (
                <span key={i} style={{ fontSize: 13, color: MUTED, fontFamily: 'Inter, sans-serif' }}>{t}</span>
              ))}
            </div>
          </div>
        </section>

        {showOnboarding && <Onboarding onClose={() => setShowOnboarding(false)} />}
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

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
                fontFamily: 'Playfair Display, serif', fontWeight: 800, fontSize: 22,
                color: TEXT, letterSpacing: -0.5,
              }}>
                Valorix <em style={{ color: A, fontStyle: 'italic' }}>AI</em>
              </span>
            </div>
            <p style={{ fontSize: 13, marginBottom: 24, fontFamily: 'Inter, sans-serif' }}>
              AI-аналитика для спортивных ставок. Играйте ответственно. 18+
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 28, flexWrap: 'wrap', marginBottom: 28 }}>
              {[{ to: '/support', l: 'Поддержка' }, { to: '/privacy', l: 'Конфиденциальность' }].map(({ to, l }) => (
                <Link key={to} to={to} style={{ color: MUTED, fontSize: 13, textDecoration: 'none', fontWeight: 500, fontFamily: 'Inter, sans-serif', transition: 'color 0.18s' }}
                  onMouseEnter={e => e.target.style.color = A}
                  onMouseLeave={e => e.target.style.color = MUTED}>
                  {l}
                </Link>
              ))}
            </div>
            <div style={{ height: 1, background: 'rgba(255,255,255,0.04)', marginBottom: 20 }} />
            <p style={{ fontSize: 12, color: '#1e3a5a', fontFamily: 'Inter, sans-serif' }}>© 2026 Valorix AI · Пищев Андрей Сергеевич · ИНН 470805349664 · Самозанятый</p>
          </div>
        </footer>
      </div>
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
        <span style={{ fontWeight: 600, fontSize: 15, color: TEXT, fontFamily: 'Inter, sans-serif' }}>{q}</span>
        <ChevronDown size={18} color={MUTED}
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.22s', flexShrink: 0 }} />
      </div>
      {open && (
        <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.8, marginTop: 14, fontFamily: 'Inter, sans-serif' }}>{a}</p>
      )}
    </div>
  )
}
