import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { MessageCircle, Clock, Shield, HelpCircle, Zap, AlertCircle } from 'lucide-react'

export default function Support() {
  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Navbar />
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div className="badge" style={{ marginBottom: 16 }}>Поддержка</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#1a1a2e', marginBottom: 10 }}>Служба поддержки</h1>
          <p style={{ color: '#64748b', fontSize: 16 }}>
            Помогаем решить любой вопрос
          </p>
        </div>

        {/* Telegram card */}
        <a
          href="https://t.me/andrusha_pv"
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: 'none' }}
        >
          <div style={{
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            borderRadius: 20, padding: '32px 36px',
            display: 'flex', alignItems: 'center', gap: 24,
            boxShadow: '0 12px 40px rgba(37,99,235,0.3)',
            cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s',
            marginBottom: 24,
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 20px 50px rgba(37,99,235,0.4)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(37,99,235,0.3)' }}
          >
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <MessageCircle size={32} color="white" />
            </div>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                Написать в Telegram
              </div>
              <div style={{ color: 'white', fontSize: 22, fontWeight: 800 }}>@andrusha_pv</div>
              <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, marginTop: 4 }}>
                Нажмите, чтобы открыть чат
              </div>
            </div>
          </div>
        </a>

        {/* Response time */}
        <div className="card" style={{ padding: '18px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Clock size={18} color="#10b981" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#1a1a2e' }}>Время ответа</div>
            <div style={{ color: '#64748b', fontSize: 13 }}>Обычно отвечаем в течение нескольких часов в рабочие дни</div>
          </div>
        </div>

        {/* FAQ */}
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a2e', marginBottom: 14 }}>Частые вопросы</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
          {faqs.map((f, i) => (
            <FaqCard key={i} icon={f.icon} q={f.q} a={f.a} />
          ))}
        </div>

        <div style={{ textAlign: 'center' }}>
          <Link to="/" style={{ color: '#2563eb', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
            ← Вернуться на главную
          </Link>
        </div>
      </div>

      <footer style={{ background: '#1a1a2e', color: '#94a3b8', padding: '28px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 12 }}>© 2026 Valorix AI · Пищев Андрей Сергеевич · ИНН 470805349664</p>
      </footer>
    </div>
  )
}

function FaqCard({ icon, q, a }) {
  return (
    <div className="card" style={{ padding: '18px 22px' }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
          {icon}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#1a1a2e', marginBottom: 5 }}>{q}</div>
          <div style={{ color: '#64748b', fontSize: 13, lineHeight: 1.6 }}>{a}</div>
        </div>
      </div>
    </div>
  )
}

const faqs = [
  {
    icon: <Zap size={16} color="#2563eb" fill="#2563eb" />,
    q: 'Я оплатил монеты, но они не зачислились',
    a: 'Вернитесь на главную страницу — система автоматически проверяет статус платежа. Если монеты не появились в течение 5 минут, напишите нам в Telegram с указанием email аккаунта.',
  },
  {
    icon: <Shield size={16} color="#2563eb" />,
    q: 'Можно ли вернуть монеты обратно деньгами?',
    a: 'Монеты являются внутренней валютой сервиса и обратному обмену на деньги не подлежат. Пожалуйста, ознакомьтесь с этим условием перед покупкой.',
  },
  {
    icon: <HelpCircle size={16} color="#2563eb" />,
    q: 'Насколько точны прогнозы?',
    a: 'Valorix AI использует нейросеть для анализа статистики, форм команд и других факторов. Прогнозы носят аналитический характер и не гарантируют результат. Играйте ответственно.',
  },
  {
    icon: <AlertCircle size={16} color="#2563eb" />,
    q: 'Как удалить аккаунт и данные?',
    a: 'Напишите нам в Telegram @andrusha_pv с просьбой об удалении аккаунта. Мы удалим все ваши данные в течение 30 дней в соответствии с Политикой конфиденциальности.',
  },
]
