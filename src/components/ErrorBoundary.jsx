import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#07090f', padding: 24,
        }}>
          <div style={{
            background: '#0c0f18', borderRadius: 16, padding: '40px 32px',
            maxWidth: 420, width: '100%', textAlign: 'center',
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
            <div style={{ fontWeight: 800, fontSize: 18, color: '#dde4ee', marginBottom: 8 }}>
              Что-то пошло не так
            </div>
            <div style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>
              Произошла непредвиденная ошибка. Попробуйте обновить страницу.
            </div>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: '#1a1a2e', color: 'white', border: 'none',
                borderRadius: 10, padding: '12px 28px', fontWeight: 700,
                fontSize: 14, cursor: 'pointer',
              }}
            >
              Обновить страницу
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
