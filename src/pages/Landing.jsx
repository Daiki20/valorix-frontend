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

export default function Landing() {
  const { user } = useAuth()
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showAuth, setShowAuth] = useState(false)

  useEffect(() => {
    if (user && !localStorage.getItem('valorix_onboarded')) {
      const t = setTimeout(() => setShowOnboarding(true), 600)
      return () => clearTimeout(t)
    }
  }, [user])

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', position: 'relative', overflow: 'hidden' }}>

      {/* Global ambient orbs */}
      <div style={{
        position: 'absolute', top: -200, right: -150, width: 700, height: 700,
        background: 'radial-gradient(circle, rgba(37,99,235,0.10) 0%, transparent 65%)',
        borderRadius: '50%', pointerEvents: 'none', zIndex: 0,
        animation: 'floatOrb 9s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', bottom: -150, left: -100, width: 600, height: 600,
        background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 65%)',
        borderRadius: '50%', pointerEvents: 'none', zIndex: 0,
        animation: 'floatOrb 12s ease-in-out infinite reverse',
      }} />
      <style>{`
        @keyframes floatOrb {
          0%,100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-28px) scale(1.05); }
        }
      `}</style>

      <div style={{ position: 'relative', zIndex: 1 }}>
        <Navbar />

        {/* ── Hero ── */}
        <section className="grid-bg section-pad" style={{ padding: '88px 24px 72px', position: 'relative', overflow: 'hidden' }}>
          <div className="container" style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
              <div style={{ animation: 'fadeInUp 0.6s ease forwards' }}>
                <div className="badge" style={{ marginBottom: 20 }}>
                  ✦ AI АНАЛИТИКА СПОРТИВНЫХ МАТЧЕЙ
                </div>
                <h1 className="hero-title" style={{ fontSize: 52, fontWeight: 900, lineHeight: 1.1, color: '#1a1a2e', marginBottom: 20, letterSpacing: -1.5 }}>
                  Принимай умные<br />решения с{' '}
                  <span className="gradient-text">AI‑АНАЛИТИКОЙ</span>
                </h1>
                <p className="hero-subtitle" style={{ fontSize: 16, color: '#64748b', lineHeight: 1.75, marginBottom: 36, maxWidth: 460, overflowWrap: 'break-word', wordBreak: 'break-word' }}>
                  Выбирай матч или загружай скрин линии — AI проанализирует форму команд,
                  игроков, травмы, риски и покажет в какой{' '}
                  <span style={{ color: '#2563eb', fontWeight: 600 }}>букмекерской конторе лучший коэффициент</span>
                </p>
                <div className="hero-buttons" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 40 }}>
                  <Link to="/analyze" className="btn-primary">
                    <Search size={16} />
                    Анализ матча
                    <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: '2px 8px', fontSize: 12, fontWeight: 700 }}>28</span>
                    <Zap size={14} fill="white" />
                  </Link>
                  <Link to="/upload" className="btn-outline">
                    <Upload size={16} />
                    Загрузить скрин
                    <span style={{ background: '#1a1a2e', borderRadius: 20, padding: '2px 8px', fontSize: 12, fontWeight: 700, color: 'white' }}>28</span>
                    <Zap size={14} />
                  </Link>
                </div>

                {/* Stats row */}
                <div className="hero-stats" style={{ display: 'flex', gap: 32 }}>
                  {[
                    { num: '10 000+', label: 'Анализов сделано' },
                    { num: '73%', label: 'Точность прогнозов' },
                    { num: '< 15с', label: 'Время анализа' },
                  ].map((s, i) => (
                    <div key={i}>
                      <div className="stat-number" style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.5 }}>{s.num}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500, marginTop: 2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="hero-card-wrap" style={{ display: 'flex', justifyContent: 'flex-end', animation: 'fadeInUp 0.7s ease 0.1s both' }}>
                <MatchPreviewCard />
              </div>
            </div>
          </div>
        </section>

        <div className="glow-divider" />

        {/* ── Express of the Day ── */}
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 24px 0' }}>
          <ExpressCard onAuthRequired={() => setShowAuth(true)} />
        </div>

        {/* ── How it works ── */}
        <section id="how" className="section-pad" style={{ background: 'white', padding: '88px 24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)',
            width: 800, height: 300,
            background: 'radial-gradient(ellipse, rgba(37,99,235,0.05) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div className="container" style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
            <div style={{ textAlign: 'center', marginBottom: 60 }}>
              <div className="badge" style={{ marginBottom: 14 }}>КАК ЭТО РАБОТАЕТ</div>
              <h2 className="section-title" style={{ fontSize: 38, fontWeight: 900, color: '#1a1a2e', letterSpacing: -1 }}>
                Три шага до умного прогноза
              </h2>
            </div>
            <div className="steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
              {[
                { icon: <Search size={26} color="#2563eb" />, step: '01', title: 'Выбери матч', desc: 'Найди предстоящий матч по названию команды или лиге. Или загрузи скрин линии букмекера.' },
                { icon: <Zap size={26} color="#2563eb" />, step: '02', title: 'AI анализирует', desc: 'Система изучает форму команд, травмы, новости, статистику личных встреч и сотни других факторов.' },
                { icon: <TrendingUp size={26} color="#2563eb" />, step: '03', title: 'Получи прогноз', desc: 'Чёткий вердикт с индексом доверия, оценкой рисков и лучшими коэффициентами у букмекеров.' },
              ].map((item, i) => (
                <div key={i} className="card-glow" style={{ padding: 32 }}>
                  <div style={{ marginBottom: 14 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 800, color: '#2563eb',
                      letterSpacing: 2, background: '#eff6ff',
                      padding: '3px 10px', borderRadius: 20,
                    }}>
                      ШАГ {item.step}
                    </span>
                  </div>
                  <div style={{
                    width: 56, height: 56, borderRadius: 16,
                    background: 'linear-gradient(135deg, #eff6ff, #e0e7ff)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 18, boxShadow: '0 4px 12px rgba(37,99,235,0.15)',
                  }}>
                    {item.icon}
                  </div>
                  <h3 style={{ fontSize: 19, fontWeight: 800, color: '#1a1a2e', marginBottom: 10 }}>{item.title}</h3>
                  <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.75 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="glow-divider" />

        {/* ── Features ── */}
        <section className="section-pad" style={{ padding: '88px 24px' }}>
          <div className="container" style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 60 }}>
              <div className="badge" style={{ marginBottom: 14 }}>ПРЕИМУЩЕСТВА</div>
              <h2 className="section-title" style={{ fontSize: 38, fontWeight: 900, color: '#1a1a2e', letterSpacing: -1, marginBottom: 12 }}>
                Почему Valorix AI?
              </h2>
              <p style={{ fontSize: 16, color: '#64748b' }}>
                Мы не гарантируем победу — мы даём вам данные для умного решения
              </p>
            </div>
            <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              {[
                { icon: <BarChart2 size={24} color="#2563eb" />, title: 'Глубокий анализ', desc: 'Форма команд, травмы, погода, мотивация, коэффициенты — всё в одном анализе' },
                { icon: <Clock size={24} color="#7c3aed" />, title: 'Мгновенный результат', desc: 'Анализ за 10–15 секунд. Никаких долгих ожиданий' },
                { icon: <Star size={24} color="#f59e0b" />, title: 'Value-ставки', desc: 'Находим матчи где реальная вероятность выше, чем предлагает букмекер' },
                { icon: <Shield size={24} color="#16a34a" />, title: 'Реальные коэффициенты', desc: 'Показываем актуальные коэффициенты Fonbet, Pari, 1xbet и других в реальном времени' },
              ].map((f, i) => (
                <div key={i} className="card-glow" style={{ padding: '28px 32px', display: 'flex', gap: 18, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                    background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  }}>
                    {f.icon}
                  </div>
                  <div>
                    <h3 style={{ fontSize: 17, fontWeight: 800, color: '#1a1a2e', marginBottom: 8 }}>{f.title}</h3>
                    <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7 }}>{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="glow-divider" />

        {/* ── FAQ ── */}
        <section id="faq" className="section-pad" style={{ background: 'white', padding: '88px 24px' }}>
          <div className="container" style={{ maxWidth: 720, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 52 }}>
              <div className="badge" style={{ marginBottom: 14 }}>FAQ</div>
              <h2 style={{ fontSize: 38, fontWeight: 900, color: '#1a1a2e', letterSpacing: -1 }}>Частые вопросы</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { q: 'Насколько точен AI-анализ?', a: 'AI анализирует сотни факторов и показывает индекс доверия. Мы не гарантируем результат — это аналитический инструмент для принятия решений.' },
                { q: 'Что значит "загрузить скрин"?', a: 'Сделай скриншот линии у букмекера и загрузи его. AI прочитает коэффициенты и проанализирует где есть Value.' },
                { q: 'Сколько стоит один анализ?', a: 'Один анализ стоит 28 монет. Монеты можно пополнить в любое время через раздел "Пополнить".' },
                { q: 'Какие виды спорта поддерживаются?', a: 'Сейчас поддерживается футбол. В ближайшее время добавим теннис, баскетбол и хоккей.' },
              ].map((item, i) => (
                <FaqItem key={i} q={item.q} a={item.a} />
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section style={{ padding: '100px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at center, rgba(37,99,235,0.07) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div style={{ maxWidth: 600, margin: '0 auto', position: 'relative' }}>
            <div className="badge" style={{ marginBottom: 20 }}>НАЧНИ СЕЙЧАС</div>
            <h2 style={{ fontSize: 44, fontWeight: 900, color: '#1a1a2e', letterSpacing: -1.5, marginBottom: 16 }}>
              Готов к умным ставкам?
            </h2>
            <p style={{ fontSize: 16, color: '#64748b', marginBottom: 36, lineHeight: 1.7 }}>
              Зарегистрируйся и получи <strong style={{ color: '#1a1a2e' }}>50 монет бесплатно</strong> для первого анализа
            </p>
            <Link to="/analyze" className="btn-primary" style={{ fontSize: 16, padding: '16px 40px', margin: '0 auto', boxShadow: '0 8px 32px rgba(37,99,235,0.3)' }}>
              <Zap size={18} fill="white" />
              Начать анализ
            </Link>
          </div>
        </section>

        {showOnboarding && <Onboarding onClose={() => setShowOnboarding(false)} />}
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

        {/* ── Footer ── */}
        <footer style={{ background: '#1a1a2e', color: '#94a3b8', padding: '44px 24px 32px', textAlign: 'center', position: 'relative' }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(37,99,235,0.4), rgba(124,58,237,0.4), transparent)',
          }} />
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <Logo size="md" dark />
            </div>
            <p style={{ fontSize: 13, marginBottom: 20 }}>AI-аналитика для спортивных ставок. Играйте ответственно. 18+</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap', marginBottom: 20 }}>
              <Link to="/support" style={{ color: '#64748b', fontSize: 13, textDecoration: 'none', fontWeight: 500 }}
                onMouseEnter={e => e.target.style.color = '#94a3b8'}
                onMouseLeave={e => e.target.style.color = '#64748b'}>
                Поддержка
              </Link>
              <Link to="/privacy" style={{ color: '#64748b', fontSize: 13, textDecoration: 'none', fontWeight: 500 }}
                onMouseEnter={e => e.target.style.color = '#94a3b8'}
                onMouseLeave={e => e.target.style.color = '#64748b'}>
                Политика конфиденциальности
              </Link>
            </div>
            <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', marginBottom: 16 }} />
            <p style={{ fontSize: 12, color: '#475569' }}>© 2026 Valorix AI · Пищев Андрей Сергеевич · ИНН 470805349664 · Самозанятый</p>
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
        transition: 'box-shadow 0.2s',
        boxShadow: open ? '0 8px 32px rgba(37,99,235,0.12)' : undefined,
        border: open ? '1px solid rgba(37,99,235,0.15)' : undefined,
      }}
      onClick={() => setOpen(!open)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 700, fontSize: 15, color: '#1a1a2e' }}>{q}</span>
        <ChevronDown size={18} color="#64748b"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
      </div>
      {open && (
        <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.75, marginTop: 14 }}>{a}</p>
      )}
    </div>
  )
}
