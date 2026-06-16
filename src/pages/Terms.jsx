import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'

export default function Terms() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a1a', color: '#e2e8f0', padding: '80px 20px' }}>
      <Helmet>
        <title>Пользовательское соглашение — Valorix</title>
        <meta name="description" content="Условия использования сервиса Valorix AI" />
      </Helmet>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <Link to="/" style={{ color: '#6366f1', textDecoration: 'none', display: 'inline-block', marginBottom: '32px' }}>
          ← На главную
        </Link>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '32px', color: '#fff' }}>
          Пользовательское соглашение
        </h1>
        <p style={{ color: '#94a3b8', marginBottom: '24px' }}>Дата последнего обновления: 17 июня 2026 г.</p>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#c7d2fe', marginBottom: '12px' }}>1. Общие положения</h2>
          <p style={{ lineHeight: 1.7, color: '#94a3b8' }}>
            Использование сервиса Valorix (valorix.ru) означает ваше согласие с настоящим пользовательским соглашением.
            Если вы не согласны с условиями, пожалуйста, не используйте сервис.
          </p>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#c7d2fe', marginBottom: '12px' }}>2. Описание сервиса</h2>
          <p style={{ lineHeight: 1.7, color: '#94a3b8' }}>
            Valorix — это аналитический инструмент с использованием искусственного интеллекта для анализа спортивных матчей.
            Сервис предоставляет аналитические данные и прогнозы исключительно в информационных целях.
          </p>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#c7d2fe', marginBottom: '12px' }}>3. Ограничение ответственности</h2>
          <p style={{ lineHeight: 1.7, color: '#94a3b8' }}>
            Valorix не является букмекерской конторой и не принимает ставки. Аналитические данные носят
            рекомендательный характер и не гарантируют результат. Пользователь самостоятельно несёт
            ответственность за свои решения, основанные на данных сервиса.
          </p>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#c7d2fe', marginBottom: '12px' }}>4. Использование монет</h2>
          <p style={{ lineHeight: 1.7, color: '#94a3b8' }}>
            Внутренняя валюта сервиса (монеты) используется для оплаты AI-анализа матчей.
            Монеты не имеют денежного эквивалента и не подлежат обмену на реальные деньги.
            При регистрации начисляется 50 бесплатных монет.
          </p>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#c7d2fe', marginBottom: '12px' }}>5. Конфиденциальность</h2>
          <p style={{ lineHeight: 1.7, color: '#94a3b8' }}>
            Мы не передаём ваши персональные данные третьим лицам. Email используется только для авторизации
            и уведомлений, связанных с работой сервиса.
          </p>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#c7d2fe', marginBottom: '12px' }}>6. Контакты</h2>
          <p style={{ lineHeight: 1.7, color: '#94a3b8' }}>
            По вопросам, связанным с соглашением, обращайтесь: <a href="mailto:support@valorix.ru" style={{ color: '#6366f1' }}>support@valorix.ru</a>
          </p>
        </section>
      </div>
    </div>
  )
}
