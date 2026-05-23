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
      minHeight: '100vh', background: '#07090f',
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
                width: 60, height: 60, borderRadius: '50%', background: 'rgba(34,197,94,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
              }}>
                <CheckCircle size={30} color="#10b981" />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#dde4ee', marginBottom: 10 }}>Пароль изменён!</h2>
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
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#dde4ee', marginBottom: 6 }}>Новый пароль</h2>
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
                    onFocus={e => e.target.style.borderColor = '#00cfff'}
                    onBlur={e => e.target.style.borderColor = 'rgba(0,180,255,0.15)'}
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
                    onFocus={e => e.target.style.borderColor = '#00cfff'}
                    onBlur={e => e.target.style.borderColor = 'rgba(0,180,255,0.15)'}
                  />
                </div>

                {error && (
                  <div style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#ff7070', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <XCircle size={14} />
                    {error}
                  </div>
                )}

                <button type="submit" disabled={loading} style={{
                  background: loading ? 'rgba(0,207,255,0.25)' : 'linear-gradient(90deg, #00cfff, #7b5ea7)',
                  color: loading ? 'rgba(255,255,255,0.4)' : '#030b18',
                  border: 'none', borderRadius: 10, padding: 13,
                  fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: loading ? 'none' : '0 4px 20px rgba(0,207,255,0.3)',
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
  border: '1.5px solid rgba(255,255,255,0.07)', borderRadius: 10, fontSize: 14,
  outline: 'none', background: '#0c0f18', transition: 'border-color 0.2s',
  fontFamily: 'Montserrat, sans-serif',
}
