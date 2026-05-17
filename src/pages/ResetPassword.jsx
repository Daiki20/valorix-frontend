import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Lock, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react'
import Logo from '../components/Logo'
import { authApi } from '../api/authApi'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token')

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) navigate('/')
  }, [token])

  async function handleSubmit(e) {
    e.preventDefault()
    if (password.length < 6) return setError('Пароль должен быть не менее 6 символов')
    if (password !== confirm) return setError('Пароли не совпадают')

    setLoading(true)
    setError('')
    try {
      await authApi.resetPassword(token, password)
      setDone(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#f0f2f5',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <Link to="/"><Logo size="md" /></Link>
        </div>

        <div className="card" style={{ padding: '36px 32px' }}>
          {done ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 60, height: 60, borderRadius: '50%', background: '#f0fdf4',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
              }}>
                <CheckCircle size={30} color="#10b981" />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a2e', marginBottom: 10 }}>Пароль изменён!</h2>
              <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>
                Теперь вы можете войти с новым паролем.
              </p>
              <Link to="/" className="btn-primary" style={{ textDecoration: 'none', justifyContent: 'center', width: '100%' }}>
                Войти на сайт
              </Link>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a2e', marginBottom: 6 }}>Новый пароль</h2>
                <p style={{ color: '#64748b', fontSize: 14 }}>Введите новый пароль для вашего аккаунта</p>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}>
                    <Lock size={16} color="#94a3b8" />
                  </div>
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="Новый пароль"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError('') }}
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#2563eb'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                  <button type="button" onClick={() => setShowPass(s => !s)}
                    style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}>
                    {showPass ? <EyeOff size={16} color="#94a3b8" /> : <Eye size={16} color="#94a3b8" />}
                  </button>
                </div>

                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}>
                    <Lock size={16} color="#94a3b8" />
                  </div>
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="Повторите пароль"
                    value={confirm}
                    onChange={e => { setConfirm(e.target.value); setError('') }}
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#2563eb'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>

                {error && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <XCircle size={14} />
                    {error}
                  </div>
                )}

                <button type="submit" disabled={loading} style={{
                  background: loading ? '#94a3b8' : '#1a1a2e', color: 'white',
                  border: 'none', borderRadius: 10, padding: 13,
                  fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer',
                  marginTop: 4, fontFamily: 'Montserrat, sans-serif',
                }}>
                  {loading ? 'Сохранение...' : 'Сохранить пароль'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '12px 14px 12px 40px', paddingRight: 44,
  border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14,
  outline: 'none', background: 'white', transition: 'border-color 0.2s',
  fontFamily: 'Montserrat, sans-serif',
}
