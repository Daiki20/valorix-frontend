import { Link } from 'react-router-dom'
import { Home, Search } from 'lucide-react'
import Logo from '../components/Logo'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh', background: '#f0f2f5',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '24px', textAlign: 'center',
    }}>
      <div style={{ marginBottom: 32 }}>
        <Logo size="md" />
      </div>

      <div style={{
        fontSize: 96, fontWeight: 900, lineHeight: 1,
        background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        marginBottom: 16,
      }}>
        404
      </div>

      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a1a2e', marginBottom: 10 }}>
        Страница не найдена
      </h1>
      <p style={{ color: '#64748b', fontSize: 15, marginBottom: 36, maxWidth: 360 }}>
        Возможно, ссылка устарела или такой страницы не существует.
      </p>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link to="/" className="btn-primary" style={{ padding: '12px 24px', fontSize: 14, textDecoration: 'none' }}>
          <Home size={16} />
          На главную
        </Link>
        <Link to="/support" className="btn-outline" style={{ padding: '12px 24px', fontSize: 14, textDecoration: 'none' }}>
          Поддержка
        </Link>
      </div>
    </div>
  )
}
