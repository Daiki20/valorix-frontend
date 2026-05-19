import { useState } from 'react'
import { X, Mail, Lock, User, Eye, EyeOff, Zap, ArrowLeft } from 'lucide-react'
import { authApi } from '../api/authApi'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { fireConfetti } from '../hooks/useConfetti'
import Logo from './Logo'

export default function AuthModal({ onClose }) {
  const [mode, setMode] = useState('login') // 'login' | 'register' | 'forgot'
  const [form, setForm] = useState({ email: '', password: '', username: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [forgotSent, setForgotSent] = useState(false)
  const { saveAuth } = useAuth()
  const toast = useToast()

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); setError('') }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (mode === 'forgot') {
        await authApi.forgotPassword(form.email)
        setForgotSent(true)
        setLoading(false)
        return
      }
      let data
      if (mode === 'login') {
        data = await authApi.login(form.email, form.password)
      } else {
        data = await authApi.register(form.email, form.password, form.username)
      }
      saveAuth(data)
      if (mode === 'register') {
        fireConfetti()
        toast.success('Добро пожаловать! Вам начислено 34 монеты')
        localStorage.removeItem('valorix_onboarded')
      } else {
        toast.success('Вы вошли в аккаунт')
      }
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          zIndex: 200, backdropFilter: 'blur(4px)',
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        zIndex: 201, width: '100%', maxWidth: 420,
        padding: '0 16px',
      }}>
        <div className="card" style={{ padding: '36px 32px', position: 'relative' }}>
          {/* Close */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 16, right: 16,
              background: '#f1f5f9', border: 'none', borderRadius: '50%',
              width: 32, height: 32, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={16} color="#64748b" />
          </button>

          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
              <Logo size="md" />
            </div>
            <div style={{ fontSize: 14, color: '#64748b' }}>
              {mode === 'login' ? 'Войдите в аккаунт' : 'Создайте аккаунт'}
            </div>
          </div>

          {/* Tabs — только для login/register */}
          {mode !== 'forgot' && (
            <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 10, padding: 4, marginBottom: 24 }}>
              {['login', 'register'].map(m => (
                <button key={m} onClick={() => { setMode(m); setError('') }} style={{
                  flex: 1, padding: '8px', border: 'none', cursor: 'pointer',
                  borderRadius: 8, fontWeight: 600, fontSize: 14, transition: 'all 0.2s',
                  background: mode === m ? 'white' : 'transparent',
                  color: mode === m ? '#1a1a2e' : '#64748b',
                  boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                }}>
                  {m === 'login' ? 'Войти' : 'Регистрация'}
                </button>
              ))}
            </div>
          )}

          {/* Forgot password header */}
          {mode === 'forgot' && (
            <div style={{ marginBottom: 20 }}>
              <button onClick={() => { setMode('login'); setError(''); setForgotSent(false) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 13, fontWeight: 600, padding: 0, marginBottom: 12 }}>
                <ArrowLeft size={14} /> Назад
              </button>
              <div style={{ fontSize: 14, color: '#64748b' }}>
                {forgotSent ? 'Проверьте почту' : 'Восстановление пароля'}
              </div>
            </div>
          )}

          {/* Forgot sent state */}
          {mode === 'forgot' && forgotSent ? (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📬</div>
              <p style={{ color: '#1a1a2e', fontWeight: 600, marginBottom: 8 }}>Письмо отправлено!</p>
              <p style={{ color: '#64748b', fontSize: 13 }}>
                Проверьте почту <strong>{form.email}</strong> и перейдите по ссылке. Ссылка действует 1 час.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {mode === 'register' && (
                <Field icon={<User size={16} color="#94a3b8" />} placeholder="Имя пользователя"
                  value={form.username} onChange={v => set('username', v)} />
              )}
              <Field icon={<Mail size={16} color="#94a3b8" />} placeholder="Email" type="email"
                value={form.email} onChange={v => set('email', v)} />
              {mode !== 'forgot' && (
                <Field
                  icon={<Lock size={16} color="#94a3b8" />}
                  placeholder="Пароль"
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={v => set('password', v)}
                  suffix={
                    <button type="button" onClick={() => setShowPass(s => !s)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1 }}>
                      {showPass ? <EyeOff size={16} color="#94a3b8" /> : <Eye size={16} color="#94a3b8" />}
                    </button>
                  }
                />
              )}

              {/* Forgot password link */}
              {mode === 'login' && (
                <button type="button" onClick={() => { setMode('forgot'); setError('') }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb', fontSize: 13, fontWeight: 600, textAlign: 'right', padding: 0, marginTop: -6 }}>
                  Забыли пароль?
                </button>
              )}

              {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#dc2626' }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} style={{
                background: loading ? '#94a3b8' : '#1a1a2e',
                color: 'white', border: 'none', borderRadius: 10,
                padding: '13px', fontWeight: 700, fontSize: 15,
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: 4, transition: 'background 0.2s', fontFamily: 'Montserrat, sans-serif',
              }}>
                {loading ? 'Загрузка...' : mode === 'login' ? 'Войти' : mode === 'register' ? 'Создать аккаунт' : 'Отправить ссылку'}
              </button>
            </form>
          )}

          {mode === 'register' && (
            <div style={{ marginTop: 16, padding: '12px 16px', background: '#eff6ff', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#1e40af' }}>
              <Zap size={14} fill="#2563eb" color="#2563eb" />
              <span><strong>34 монеты</strong> в подарок при регистрации</span>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function Field({ icon, suffix, ...props }) {
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}>
        {icon}
      </div>
      <input
        {...props}
        onChange={e => props.onChange(e.target.value)}
        style={{
          width: '100%', padding: `12px 14px 12px ${suffix ? '40px' : '40px'}`,
          paddingRight: suffix ? 44 : 14,
          border: '1.5px solid #e2e8f0', borderRadius: 10,
          fontSize: 14, outline: 'none', background: 'white',
          transition: 'border-color 0.2s',
        }}
        onFocus={e => e.target.style.borderColor = '#2563eb'}
        onBlur={e => e.target.style.borderColor = '#e2e8f0'}
      />
      {suffix && (
        <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)' }}>
          {suffix}
        </div>
      )}
    </div>
  )
}
