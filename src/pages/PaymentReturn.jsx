import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Zap, CheckCircle, XCircle, Loader } from 'lucide-react'
import { coinsApi } from '../api/authApi'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function PaymentReturn() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('checking') // checking | credited | failed
  const [coins, setCoins] = useState(null)
  const navigate = useNavigate()
  const { updateCoins } = useAuth()
  const toast = useToast()

  useEffect(() => {
    let storedId
    try { storedId = localStorage.getItem('valorix_pending_payment') } catch {}
    const paymentId = searchParams.get('payment_id') || storedId
    if (!paymentId) { setStatus('failed'); return }

    coinsApi.verifyPayment(paymentId)
      .then(data => {
        if (data.status === 'credited' || data.status === 'already_credited') {
          setCoins(data.coins)
          updateCoins(data.coins)
          try { localStorage.removeItem('valorix_pending_payment') } catch {}
          setStatus('credited')
          toast.success(`Монеты зачислены! Баланс: ${data.coins}`)
          // Яндекс Метрика — цель "Оплата совершена"
          try { window.ym?.(109658356, 'reachGoal', 'payment_success') } catch {}
        } else {
          setStatus('failed')
        }
      })
      .catch(() => setStatus('failed'))
  }, [])

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#07090f', padding: 24,
    }}>
      <div className="card" style={{ padding: '48px 40px', maxWidth: 400, width: '100%', textAlign: 'center' }}>
        {status === 'checking' && (
          <>
            <div style={{ marginBottom: 20 }}>
              <Loader size={48} color="#00cfff" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
            <div style={{ fontWeight: 700, fontSize: 18, color: '#dde4ee', marginBottom: 8 }}>
              Проверяем оплату...
            </div>
            <div style={{ color: '#64748b', fontSize: 14 }}>Пожалуйста, подождите</div>
          </>
        )}

        {status === 'credited' && (
          <>
            <div style={{ marginBottom: 20 }}>
              <CheckCircle size={56} color="#16a34a" />
            </div>
            <div style={{ fontWeight: 800, fontSize: 22, color: '#dde4ee', marginBottom: 8 }}>
              Оплата прошла!
            </div>
            <div style={{ color: '#64748b', fontSize: 15, marginBottom: 24 }}>
              Монеты зачислены на ваш счёт
            </div>
            <div style={{
              background: 'rgba(0,207,255,0.08)', borderRadius: 12, padding: '16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              marginBottom: 28,
            }}>
              <Zap size={20} color="#00cfff" fill="#00cfff" />
              <span style={{ fontWeight: 800, fontSize: 22, color: '#dde4ee' }}>
                {coins} монет
              </span>
            </div>
            <button
              onClick={() => navigate('/analyze')}
              style={{
                width: '100%', padding: '13px', background: '#1a1a2e',
                color: 'white', border: 'none', borderRadius: 10,
                fontWeight: 700, fontSize: 15, cursor: 'pointer',
              }}
            >
              Перейти к анализу
            </button>
          </>
        )}

        {status === 'failed' && (
          <>
            <div style={{ marginBottom: 20 }}>
              <XCircle size={56} color="#dc2626" />
            </div>
            <div style={{ fontWeight: 800, fontSize: 22, color: '#dde4ee', marginBottom: 8 }}>
              Не удалось подтвердить
            </div>
            <div style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>
              Если деньги списались — обратитесь в поддержку
            </div>
            <button
              onClick={() => navigate('/')}
              style={{
                width: '100%', padding: '13px', background: '#1a1a2e',
                color: 'white', border: 'none', borderRadius: 10,
                fontWeight: 700, fontSize: 15, cursor: 'pointer',
              }}
            >
              На главную
            </button>
          </>
        )}
      </div>
    </div>
  )
}
