import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Upload, Zap, TrendingUp, ChevronDown, Shield, Clock, BarChart2, Star } from 'lucide-react'
import Navbar from '../components/Navbar'
import MatchPreviewCard from '../components/MatchPreviewCard'
import Logo from '../components/Logo'
import Onboarding from '../components/Onboarding'
import ExpressCard from '../components/ExpressCard'
import AuthModal from '../components/AuthModal'
import { useAuth } from '../context/AuthContext'

const ACCENT = '#a3ff4e'
const ACCENT_DIM = 'rgba(163,255,78,0.12)'
const ACCENT_GLOW = 'rgba(163,255,78,0.22)'
const BG = '#07090f'
const BG2 = '#0c0f18'
const CARD = 'rgba(255,255,255,0.03)'
const CARD_BORDER = 'rgba(255,255,255,0.07)'
const TEXT = '#dde4ee'
const TEXT_MUTED = '#556070'

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

      {/* Ambient orbs */}
      <div style={{
        position: 'fixed', top: -200, right: -150, width: 700, height: 700,
        background: 'radial-gradient(circle, rgba(163,255,78,0.06) 0%, transparent 65%)',
        borderRadius: '50%', pointerEvents: 'none', zIndex: 0,
        animation: 'floatOrb 9s ease-in-out infinite',
      }} />
      <div style={{
        position: 'fixed', bottom: -200, left: -150, width: 600, height: 600,
        background: 'radial-gradient(circle, rgba(91,255,158,0.04) 0%, transparent 65%)',
        borderRadius: '50%', pointerEvents: 'none', zIndex: 0,
        animation: 'floatOrb 13s ease-in-out infinite reverse',
      }} />

      <style>{`
        @keyframes floatOrb {
          0%,100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-30px) scale(1.06); }
        }
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
      `}</style>

      <div style={{ position: 'relative', zIndex: 1 }}>
        <Navbar />

        {/* ── Hero ── */}
        <section className="grid-bg section-pad" style={{ padding: '96px 24px 80px', position: 'relative', overflow: 'hidden' }}>
          {/* Subtle noise/texture overlay */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(163,255,78,0.05) 0%, transparent 70%)',
          }} />

          <div className="container" style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
            <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
              <div style={{ animation: 'fadeInUp 0.6s ease forwards' }}>

                {/* New pill badge */}
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: ACCENT_DIM, border: `1px solid rgba(163,255,78,0.2)`,
                  borderRadius: 50, padding: '6px 16px 6px 10px',
                  marginBottom: 28,
                }}>
                  <span style={{
                    background: ACCENT, color: BG, borderRadius: 50,
                    padding: '2px 8px', fontSize: 11, fontWeight: 800, letterSpacing: 0.5,
                  }}>NEW</span>
                  <span style={{ color: ACCENT, fontSize: 13, fontWeight: 600, letterSpacing: 0.3 }}>
                    AI-аналитика нового поколения
                  </span>
                </div>

                <h1 className="hero-title" style={{
                  fontSize: 54, fontWeight: 800, lineHeight: 1.07,
                  color: TEXT, marginBottom: 22, letterSpacing: -2,
                }}>
                  Принимай умные<br />
                  решения с{' '}
                  <span className="gradient-text" style={{ fontStyle: 'italic' }}>AI‑анализом</span>
                </h1>

                <p className="hero-subtitle" style={{
                  fontSize: 16, color: TEXT_MUTED, lineHeight: 1.8,
                  marginBottom: 40, maxWidth: 460, overflowWrap: 'break-word',
                }}>
                  Выбирай матч или загружай скрин линии — AI проанализирует форму команд,
                  игроков, травмы, риски и покажет где{' '}
                  <span style={{ color: ACCENT, fontWeight: 600 }}>лучший коэффициент</span>
                </p>

                <div className="hero-buttons" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 44 }}>
                  <Link to="/analyze" className="btn-primary">
                    <Search size={16} />
                    Анализ матча
                    <span style={{
                      background: 'rgba(7,9,15,0.25)', borderRadius: 20,
                      padding: '2px 8px', fontSize: 12, fontWeight: 800,
                    }}>19</span>
                    <Zap size={14} fill={BG} color={BG} />
                  </Link>
                  <Link to="/upload" className="btn-outline">
                    <Upload size={16} />
                    Загрузить скрин
                    <span style={{
                      background: ACCENT_DIM, borderRadius: 20,
                      padding: '2px 8px', fontSize: 12, fontWeight: 800, color: ACCENT,
                    }}>19</span>
                  </Link>
                </div>

                {/* Stats row */}
                <div className="hero-stats" style={{ display: 'flex', gap: 36 }}>
                  {[
                    { num: '10 000+', label: 'Анализов сделано' },
                    { num: '73%',     label: 'Точность прогнозов' },
                    { num: '< 15с',   label: 'Время анализа' },
                  ].map((s, i) => (
                    <div key={i}>
                      <div className="stat-number" style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>{s.num}</div>
                      <div style={{ fontSize: 12, color: TEXT_MUTED, fontWeight: 500, marginTop: 3 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="hero-card-wrap" style={{ display: 'flex', justifyContent: 'flex-end', animation: 'fadeInUp 0.7s ease 0.12s both' }}>
                <MatchPreviewCard />
              </div>
            </div>
          </div>
        </section>

        <div className="glow-divider" />

        {/* ── Express of the Day ── */}
        <div id="express" className="express-section" style={{ maxWidth: 1440, margin: '0 auto', padding: '56px 32px 0' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div className="badge" style={{ marginBottom: 14 }}>ЕЖЕДНЕВНО</div>
            <h2 style={{ fontSize: 38, fontWeight: 800, color: TEXT, letterSpacing: -1.2, margin: 0 }}>
              Топовые <span className="gradient-text">AI‑экспрессы</span>
            </h2>
            <p style={{ color: TEXT_MUTED, fontSize: 15, marginTop: 12 }}>
              Каждый день — готовые экспрессы на основе реальных коэффициентов
            </p>
          </div>
          <ExpressCard onAuthRequired={() => setShowAuth(true)} />
        </div>

        {/* ── How it works ── */}
        <section id="how" className="section-pad" style={{
          background: BG2, padding: '96px 24px', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)',
            width: 900, height: 300,
            background: 'radial-gradient(ellipse, rgba(163,255,78,0.04) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div className="container" style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
            <div style={{ textAlign: 'center', marginBottom: 64 }}>
              <div className="badge" style={{ marginBottom: 16 }}>КАК ЭТО РАБОТАЕТ</div>
              <h2 className="section-title" style={{ fontSize: 40, fontWeight: 800, color: TEXT, letterSpacing: -1.2 }}>
                Три шага до умного прогноза
              </h2>
            </div>
            <div className="steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
              {[
                {
                  icon: <Search size={24} color={ACCENT} />,
                  step: '01',
                  title: 'Выбери матч',
                  desc: 'Найди предстоящий матч по названию команды или лиге. Или загрузи скрин линии букмекера.',
                },
                {
                  icon: <Zap size={24} color={ACCENT} />,
                  step: '02',
                  title: 'AI анализирует',
                  desc: 'Система изучает форму команд, травмы, новости, статистику личных встреч и сотни других факторов.',
                },
                {
                  icon: <TrendingUp size={24} color={ACCENT} />,
                  step: '03',
                  title: 'Получи прогноз',
                  desc: 'Чёткий вердикт с индексом доверия, оценкой рисков и лучшими коэффициентами у букмекеров.',
                },
              ].map((item, i) => (
                <div key={i} className="card-glow" style={{ padding: 32 }}>
                  <div style={{ marginBottom: 20 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 800, color: ACCENT,
                      letterSpacing: 2, background: ACCENT_DIM,
                      padding: '3px 10px', borderRadius: 20,
                    }}>
                      ШАГ {item.step}
                    </span>
                  </div>
                  <div style={{
                    width: 52, height: 52, borderRadius: 14,
                    background: ACCENT_DIM,
                    border: `1px solid rgba(163,255,78,0.15)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 20,
                    boxShadow: `0 0 20px ${ACCENT_GLOW}`,
                  }}>
                    {item.icon}
                  </div>
                  <h3 style={{ fontSize: 19, fontWeight: 700, color: TEXT, marginBottom: 12 }}>{item.title}</h3>
                  <p style={{ fontSize: 14, color: TEXT_MUTED, lineHeight: 1.8 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="glow-divider" />

        {/* ── Features ── */}
        <section className="section-pad" style={{ padding: '96px 24px', background: BG }}>
          <div className="container" style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 64 }}>
              <div className="badge" style={{ marginBottom: 16 }}>ПРЕИМУЩЕСТВА</div>
              <h2 className="section-title" style={{ fontSize: 40, fontWeight: 800, color: TEXT, letterSpacing: -1.2, marginBottom: 14 }}>
                Почему <span className="gradient-text">Valorix AI</span>?
              </h2>
              <p style={{ fontSize: 16, color: TEXT_MUTED }}>
                Мы не гарантируем победу — мы даём вам данные для умного решения
              </p>
            </div>
            <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              {[
                {
                  icon: <BarChart2 size={22} color={ACCENT} />,
                  title: 'Глубокий анализ',
                  desc: 'Форма команд, травмы, погода, мотивация, коэффициенты — всё в одном анализе',
                  glow: ACCENT_GLOW,
                },
                {
                  icon: <Clock size={22} color="#5bff9e" />,
                  title: 'Мгновенный результат',
                  desc: 'Анализ за 10–15 секунд. Никаких долгих ожиданий',
                  glow: 'rgba(91,255,158,0.2)',
                },
                {
                  icon: <Star size={22} color="#ffdd57" />,
                  title: 'Value-ставки',
                  desc: 'Находим матчи где реальная вероятность выше, чем предлагает букмекер',
                  glow: 'rgba(255,221,87,0.18)',
                },
                {
                  icon: <Shield size={22} color="#57c8ff" />,
                  title: 'Реальные коэффициенты',
                  desc: 'Показываем актуальные коэффициенты Fonbet, Pari, 1xbet и других в реальном времени',
                  glow: 'rgba(87,200,255,0.18)',
                },
              ].map((f, i) => (
                <div key={i} className="card-glow" style={{ padding: '28px 32px', display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid rgba(255,255,255,0.08)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 0 16px ${f.glow}`,
                  }}>
                    {f.icon}
                  </div>
                  <div>
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: TEXT, marginBottom: 8 }}>{f.title}</h3>
                    <p style={{ fontSize: 14, color: TEXT_MUTED, lineHeight: 1.75 }}>{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="glow-divider" />

        {/* ── FAQ ── */}
        <section id="faq" className="section-pad" style={{ background: BG2, padding: '96px 24px' }}>
          <div className="container" style={{ maxWidth: 720, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <div className="badge" style={{ marginBottom: 16 }}>FAQ</div>
              <h2 style={{ fontSize: 40, fontWeight: 800, color: TEXT, letterSpacing: -1.2 }}>Частые вопросы</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { q: 'Насколько точен AI-анализ?', a: 'AI анализирует сотни факторов и показывает индекс доверия. Мы не гарантируем результат — это аналитический инструмент для принятия решений.' },
                { q: 'Что значит "загрузить скрин"?', a: 'Сделай скриншот линии у букмекера и загрузи его. AI прочитает коэффициенты и проанализирует где есть Value.' },
                { q: 'Сколько стоит один анализ?', a: 'Один анализ стоит 19 монет. Монеты можно пополнить в любое время через раздел "Пополнить".' },
                { q: 'Какие виды спорта поддерживаются?', a: 'Сейчас поддерживается футбол. В ближайшее время добавим теннис, баскетбол и хоккей.' },
              ].map((item, i) => (
                <FaqItem key={i} q={item.q} a={item.a} />
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="section-pad" style={{
          padding: '110px 24px', textAlign: 'center',
          position: 'relative', overflow: 'hidden', background: BG,
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at center, rgba(163,255,78,0.06) 0%, transparent 65%)',
            pointerEvents: 'none',
          }} />
          {/* Grid overlay */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: 'linear-gradient(rgba(163,255,78,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(163,255,78,0.025) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }} />
          <div style={{ maxWidth: 600, margin: '0 auto', position: 'relative' }}>
            <div className="badge" style={{ marginBottom: 22 }}>НАЧНИ СЕЙЧАС</div>
            <h2 style={{ fontSize: 48, fontWeight: 800, color: TEXT, letterSpacing: -2, marginBottom: 18 }}>
              Готов к умным ставкам?
            </h2>
            <p style={{ fontSize: 16, color: TEXT_MUTED, marginBottom: 40, lineHeight: 1.75 }}>
              Зарегистрируйся и получи{' '}
              <strong style={{ color: ACCENT }}>38 монет бесплатно</strong>{' '}
              для первого анализа
            </p>
            <Link to="/analyze" className="btn-primary" style={{
              fontSize: 16, padding: '16px 44px', margin: '0 auto',
              boxShadow: `0 8px 40px ${ACCENT_GLOW}`,
            }}>
              <Zap size={18} fill={BG} color={BG} />
              Начать анализ
            </Link>
          </div>
        </section>

        {showOnboarding && <Onboarding onClose={() => setShowOnboarding(false)} />}
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

        {/* ── Footer ── */}
        <footer style={{
          background: '#040609', color: TEXT_MUTED,
          padding: '48px 24px 32px', textAlign: 'center', position: 'relative',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(163,255,78,0.25), rgba(91,255,158,0.2), transparent)',
          }} />
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
              <Logo size="md" dark />
            </div>
            <p style={{ fontSize: 13, marginBottom: 22, color: TEXT_MUTED }}>
              AI-аналитика для спортивных ставок. Играйте ответственно. 18+
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 28, flexWrap: 'wrap', marginBottom: 24 }}>
              {[
                { to: '/support', label: 'Поддержка' },
                { to: '/privacy', label: 'Политика конфиденциальности' },
              ].map(({ to, label }) => (
                <Link key={to} to={to} style={{ color: TEXT_MUTED, fontSize: 13, textDecoration: 'none', fontWeight: 500, transition: 'color 0.18s' }}
                  onMouseEnter={e => e.target.style.color = ACCENT}
                  onMouseLeave={e => e.target.style.color = TEXT_MUTED}>
                  {label}
                </Link>
              ))}
            </div>
            <div style={{ height: 1, background: 'rgba(255,255,255,0.04)', marginBottom: 18 }} />
            <p style={{ fontSize: 12, color: '#2a3444' }}>© 2026 Valorix AI · Пищев Андрей Сергеевич · ИНН 470805349664 · Самозанятый</p>
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
        padding: '20px 24px', cursor: 'pointer', userSelect: 'none',
        transition: 'border-color 0.2s, background 0.2s',
        borderColor: open ? 'rgba(163,255,78,0.2)' : 'rgba(255,255,255,0.07)',
        background: open ? 'rgba(163,255,78,0.04)' : 'rgba(255,255,255,0.03)',
      }}
      onClick={() => setOpen(!open)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 700, fontSize: 15, color: '#dde4ee' }}>{q}</span>
        <ChevronDown size={18} color="#556070"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
      </div>
      {open && (
        <p style={{ fontSize: 14, color: '#556070', lineHeight: 1.8, marginTop: 14 }}>{a}</p>
      )}
    </div>
  )
}
