import { useState, useRef } from 'react'
import { X, Mail, Lock, User, Eye, EyeOff, Zap, ArrowLeft, Shield } from 'lucide-react'
import { authApi } from '../api/authApi'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { fireConfetti } from '../hooks/useConfetti'
import Logo from './Logo'

export default function AuthModal({ onClose }) {
  const [mode, setMode] = useState('login') // 'login' | 'register' | 'forgot' | 'verify'
  const [form, setForm] = useState({ email: '', password: '', username: '' })
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [forgotSent, setForgotSent] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const codeRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()]
  const { saveAuth } = useAuth()
  const toast = useToast()

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); setError('') }

  function handleCodeInput(i, val) {
    const digit = val.replace(/\D/g, '').slice(-1)
    const next = [...code]
    next[i] = digit
    setCode(next)
    setError('')
    if (digit && i < 5) codeRefs[i + 1].current?.focus()
    if (!digit && i > 0) codeRefs[i - 1].current?.focus()
  }

  function handleCodePaste(e) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setCode(pasted.split(''))
      codeRefs[5].current?.focus()
    }
  }

  async function startResendCooldown() {
    setResendCooldown(60)
    const interval = setInterval(() => {
      setResendCooldown(c => {
        if (c <= 1) { clearInterval(interval); return 0 }
        return c - 1
      })
    }, 1000)
  }

  async function handleResend() {
    if (resendCooldown > 0) return
    try {
      await authApi.resendCode(form.email)
      toast.success('Новый код отправлен на почту')
      startResendCooldown()
    } catch {}
  }

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

      if (mode === 'verify') {
        const fullCode = code.join('')
        if (fullCode.length < 6) { setError('Введите все 6 цифр'); setLoading(false); return }
        const data = await authApi.verifyEmail(form.email, fullCode)
        saveAuth(data)
        fireConfetti()
        toast.success('Email подтверждён! Вам начислено 38 монет')
        localStorage.removeItem('valorix_onboarded')
        onClose()
        return
      }

      let data
      if (mode === 'login') {
        data = await authApi.login(form.email, form.password)
        saveAuth(data)
        toast.success('Вы вошли в аккаунт')
        onClose()
      } else {
        data = await authApi.register(form.email, form.password, form.username)
        if (data.needsVerification) {
          setMode('verify')
          setCode(['', '', '', '', '', ''])
          startResendCooldown()
          setLoading(false)
          return
        }
        saveAuth(data)
        fireConfetti()
        toast.success('Добро пожаловать! Вам начислено 38 монет')
        localStorage.removeItem('valorix_onboarded')
        onClose()
      }
    } catch (err) {
      if (err.data?.needsVerification) {
        if (err.data.email) setForm(f => ({ ...f, email: err.data.email }))
        setMode('verify')
        setCode(['', '', '', '', '', ''])
        startResendCooldown()
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        zIndex: 200, backdropFilter: 'blur(4px)',
      }} />

      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        zIndex: 201, width: '100%', maxWidth: 420,
        padding: '0 16px',
      }}>
        <div className="card" style={{ padding: '36px 32px', position: 'relative' }}>
          <button onClick={onClose} style={{
            position: 'absolute', top: 16, right: 16,
            background: '#f1f5f9', border: 'none', borderRadius: '50%',
            width: 32, height: 32, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <X size={16} color="#64748b" />
          </button>

          {/* Verify mode */}
          {mode === 'verify' ? (
            <>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: 16,
                    background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Shield size={26} color="white" />
                  </div>
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#1a1a2e', marginBottom: 6 }}>Подтвердите email</div>
                <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
                  Мы отправили 6-значный код на<br />
                  <strong style={{ color: '#1a1a2e' }}>{form.email}</strong>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                {/* Code input */}
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
                  {code.map((digit, i) => (
                    <input
                      key={i}
                      ref={codeRefs[i]}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleCodeInput(i, e.target.value)}
                      onPaste={i === 0 ? handleCodePaste : undefined}
                      onKeyDown={e => {
                        if (e.key === 'Backspace' && !code[i] && i > 0) codeRefs[i - 1].current?.focus()
                      }}
                      style={{
                        width: 46, height: 54, textAlign: 'center',
                        fontSize: 22, fontWeight: 800, color: '#1a1a2e',
                        border: `2px solid ${digit ? '#2563eb' : '#e2e8f0'}`,
                        borderRadius: 10, outline: 'none',
                        background: digit ? '#eff6ff' : 'white',
                        transition: 'all 0.15s',
                        fontFamily: 'Montserrat, sans-serif',
                      }}
                      onFocus={e => e.target.style.borderColor = '#2563eb'}
                      onBlur={e => e.target.style.borderColor = code[i] ? '#2563eb' : '#e2e8f0'}
                    />
                  ))}
                </div>

                {error && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#dc2626', marginBottom: 14 }}>
                    {error}
                  </div>
                )}

                <button type="submit" disabled={loading} style={{
                  width: '100%', background: loading ? '#94a3b8' : '#1a1a2e',
                  color: 'white', border: 'none', borderRadius: 10,
                  padding: '13px', fontWeight: 700, fontSize: 15,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: 'Montserrat, sans-serif',
                }}>
                  {loading ? 'Проверяем...' : 'Подтвердить'}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13 }}>
                <span style={{ color: '#64748b' }}>Не получили код? </span>
                {resendCooldown > 0 ? (
                  <span style={{ color: '#94a3b8' }}>Повторить через {resendCooldown}с</span>
                ) : (
                  <button onClick={handleResend} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#2563eb', fontWeight: 600, fontSize: 13, padding: 0,
                  }}>
                    Отправить снова
                  </button>
                )}
              </div>

              <button onClick={() => { setMode('register'); setError('') }} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#64748b', fontSize: 13, fontWeight: 600, padding: 0,
                marginTop: 16,
              }}>
                <ArrowLeft size={14} /> Назад
              </button>
            </>
          ) : (
            <>
              {/* Logo */}
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                  <Logo size="md" />
                </div>
                <div style={{ fontSize: 14, color: '#64748b' }}>
                  {mode === 'login' ? 'Войдите в аккаунт' : mode === 'forgot' ? '' : 'Создайте аккаунт'}
                </div>
              </div>

              {/* Tabs */}
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

              {/* Forgot header */}
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

              {/* Forgot sent */}
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
                  <span><strong>38 монет</strong> в подарок при регистрации</span>
                </div>
              )}
            </>
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
          width: '100%', padding: `12px 14px 12px 40px`,
          paddingRight: suffix ? 44 : 14,
          border: '1.5px solid #e2e8f0', borderRadius: 10,
          fontSize: 14, outline: 'none', background: 'white',
          transition: 'border-color 0.2s', boxSizing: 'border-box',
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
