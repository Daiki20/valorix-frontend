import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'

export default function About() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a1a', color: '#e2e8f0', padding: '80px 20px' }}>
      <Helmet>
        <title>О сервисе — Valorix AI</title>
        <meta name="description" content="Valorix — AI-аналитика спортивных матчей: футбол, хоккей, CS2, Dota2. Умный анализ для осознанных решений." />
      </Helmet>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <Link to="/" style={{ color: '#6366f1', textDecoration: 'none', display: 'inline-block', marginBottom: '32px' }}>
          ← На главную
        </Link>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '24px', color: '#fff' }}>
          О сервисе Valorix
        </h1>
        <p style={{ fontSize: '1.125rem', lineHeight: 1.8, color: '#94a3b8', marginBottom: '32px' }}>
          Valorix — AI-платформа для анализа спортивных событий. Мы используем GPT-4 для глубокого анализа
          матчей по футболу, хоккею, CS2 и Dota2, помогая принимать более осознанные решения.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '48px' }}>
          {[
            { number: '4', label: 'Вида спорта' },
            { number: '10k+', label: 'Матчей проанализировано' },
            { number: '2024', label: 'Год основания' },
          ].map(stat => (
            <div key={stat.label} style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#818cf8' }}>{stat.number}</div>
              <div style={{ color: '#94a3b8', marginTop: '8px' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#fff', marginBottom: '16px' }}>Наша миссия</h2>
        <p style={{ lineHeight: 1.8, color: '#94a3b8', marginBottom: '32px' }}>
          Сделать профессиональную спортивную аналитику доступной каждому. Мы верим, что качественный анализ
          данных — это не привилегия профессионалов, а инструмент, который должен быть у каждого.
        </p>

        <div style={{ padding: '24px', background: 'rgba(99,102,241,0.1)', borderRadius: '12px', border: '1px solid rgba(99,102,241,0.2)' }}>
          <p style={{ color: '#94a3b8', margin: 0 }}>
            По вопросам сотрудничества: <a href="mailto:support@valorix.ru" style={{ color: '#6366f1' }}>support@valorix.ru</a>
          </p>
        </div>
      </div>
    </div>
  )
}
