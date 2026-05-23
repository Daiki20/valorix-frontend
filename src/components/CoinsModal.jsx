import { useState, useEffect } from 'react'
import { X, Zap, Star } from 'lucide-react'
import { coinsApi } from '../api/authApi'
import { useAuth } from '../context/AuthContext'

const PAYMENT_METHODS = [
  { id: 'sbp',           label: 'СБП',     desc: 'Система быстрых платежей', emoji: '⚡' },
  { id: 'bank_card',     label: 'Карта',   desc: 'Visa, MasterCard, МИР',    emoji: '💳' },
  { id: 'tinkoff_bank',  label: 'T-Pay',   desc: 'Через приложение Т-Банка', emoji: '🟡' },
  { id: 'sberbank',      label: 'SberPay', desc: 'Через приложение Сбера',   emoji: '🟢' },
]

export default function CoinsModal({ onClose }) {
  const { user, updateCoins } = useAuth()
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedId, setSelectedId] = useState('pack_300')
  const [paymentMethod, setPaymentMethod] = useState('sbp')

  useEffect(() => {
    coinsApi.packages().then(d => setPackages(d.packages))
  }, [])

  async function handleBuy() {
    setLoading(true)
    try {
      const { confirmationUrl, paymentId } = await coinsApi.createPayment(selectedId, paymentMethod)
      try { localStorage.setItem('valorix_pending_payment', paymentId) } catch {}
      window.location.href = confirmationUrl
    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  const selected = packages.find(p => p.id === selectedId)

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        zIndex: 200, backdropFilter: 'blur(4px)',
      }} />

      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        zIndex: 201, width: '100%', maxWidth: 460, padding: '0 16px',
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

          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontWeight: 900, fontSize: 20, color: '#1a1a2e', marginBottom: 4 }}>
              Пополнить монеты
            </div>
            <div style={{ fontSize: 14, color: '#64748b' }}>
              1 анализ = 25 монет • Баланс: <strong>{user?.coins ?? 0}</strong> монет
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {packages.map(pkg => (
              <button
                key={pkg.id}
                onClick={() => setSelectedId(pkg.id)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 18px', border: `2px solid ${selectedId === pkg.id ? '#2563eb' : '#e2e8f0'}`,
                  borderRadius: 12, background: selectedId === pkg.id ? '#eff6ff' : 'white',
                  cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: selectedId === pkg.id ? '#2563eb' : '#f1f5f9',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Zap size={16} color={selectedId === pkg.id ? 'white' : '#94a3b8'} fill={selectedId === pkg.id ? 'white' : 'none'} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1a2e' }}>{pkg.label}</div>
                    {pkg.bonus && (
                      <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Star size={10} fill="#16a34a" color="#16a34a" /> {pkg.bonus}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ fontWeight: 800, fontSize: 18, color: selectedId === pkg.id ? '#2563eb' : '#1a1a2e' }}>
                  {pkg.price} ₽
                </div>
              </button>
            ))}
          </div>

          {/* Способ оплаты */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', letterSpacing: 0.5, marginBottom: 10 }}>
              СПОСОБ ОПЛАТЫ
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {PAYMENT_METHODS.map(m => (
                <button
                  key={m.id}
                  onClick={() => setPaymentMethod(m.id)}
                  style={{
                    flex: '1 1 calc(50% - 4px)', minWidth: 80, padding: '10px 8px', borderRadius: 10,
                    border: `2px solid ${paymentMethod === m.id ? '#2563eb' : '#e2e8f0'}`,
                    background: paymentMethod === m.id ? '#eff6ff' : 'white',
                    cursor: 'pointer', transition: 'all 0.15s', textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 18, marginBottom: 3 }}>{m.emoji}</div>
                  <div style={{ fontWeight: 700, fontSize: 12, color: paymentMethod === m.id ? '#2563eb' : '#1a1a2e' }}>{m.label}</div>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2, lineHeight: 1.3 }}>{m.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleBuy}
            disabled={loading || !selected}
            style={{
              width: '100%', padding: '14px',
              background: loading ? '#94a3b8' : '#2563eb',
              color: 'white', border: 'none', borderRadius: 12,
              fontWeight: 700, fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {loading ? 'Перенаправление...' : `Оплатить ${selected?.price ?? ''} ₽`}
          </button>

          <div style={{ marginTop: 12, textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>
            Безопасная оплата через ЮКасса
          </div>
        </div>
      </div>
    </>
  )
}
