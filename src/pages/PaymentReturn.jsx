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
    const paymentId = searchParams.get('payment_id') || localStorage.getItem('valorix_pending_payment')
    if (!paymentId) { setStatus('failed'); return }

    coinsApi.verifyPayment(paymentId)
      .then(data => {
        if (data.status === 'credited' || data.status === 'already_credited') {
          setCoins(data.coins)
          updateCoins(data.coins)
          localStorage.removeItem('valorix_pending_payment')
          setStatus('credited')
          toast.success(`Монеты зачислены! Баланс: ${data.coins}`)
        } else {
          setStatus('failed')
        }
      })
      .catch(() => setStatus('failed'))
  }, [])

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#f0f2f5', padding: 24,
    }}>
      <div className="card" style={{ padding: '48px 40px', maxWidth: 400, width: '100%', textAlign: 'center' }}>
        {status === 'checking' && (
          <>
            <div style={{ marginBottom: 20 }}>
              <Loader size={48} color="#2563eb" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
            <div style={{ fontWeight: 700, fontSize: 18, color: '#1a1a2e', marginBottom: 8 }}>
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
            <div style={{ fontWeight: 800, fontSize: 22, color: '#1a1a2e', marginBottom: 8 }}>
              Оплата прошла!
            </div>
            <div style={{ color: '#64748b', fontSize: 15, marginBottom: 24 }}>
              Монеты зачислены на ваш счёт
            </div>
            <div style={{
              background: '#eff6ff', borderRadius: 12, padding: '16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              marginBottom: 28,
            }}>
              <Zap size={20} color="#2563eb" fill="#2563eb" />
              <span style={{ fontWeight: 800, fontSize: 22, color: '#1a1a2e' }}>
                {coins} монет
              </span>
            </div>
            <button
              onClick={() => navigate('/')}
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
            <div style={{ fontWeight: 800, fontSize: 22, color: '#1a1a2e', marginBottom: 8 }}>
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
