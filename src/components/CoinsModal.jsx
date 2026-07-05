import { useState, useEffect } from 'react'
import { X, Zap, Star, Tag } from 'lucide-react'
import { coinsApi } from '../api/authApi'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const ACCENT = '#00cfff'
const BORDER = 'rgba(0,180,255,0.15)'
const TEXT   = '#d8eeff'
const MUTED  = '#4a6a8a'
const DIM    = 'rgba(0,15,40,0.6)'

const PAYMENT_METHODS = [
  { id: 'sbp',           label: 'СБП',     desc: 'Система быстрых платежей', emoji: '⚡' },
  { id: 'bank_card',     label: 'Карта',   desc: 'Visa, MasterCard, МИР',    emoji: '💳' },
  { id: 'tinkoff_bank',  label: 'T-Pay',   desc: 'Через приложение Т-Банка', emoji: '🟡' },
  { id: 'sberbank',      label: 'SberPay', desc: 'Через приложение Сбера',   emoji: '🟢' },
]

export default function CoinsModal({ onClose, initialPackageId }) {
  const { user, updateCoins } = useAuth()
  const toast = useToast()
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedId, setSelectedId] = useState(initialPackageId || 'pack_600')
  const [paymentMethod, setPaymentMethod] = useState('sbp')
  const [promoCode, setPromoCode] = useState('')

  const VALID_PROMOS = { valor: 28 }
  const promoKey = promoCode.trim().toLowerCase()
  const promoBonus = VALID_PROMOS[promoKey] || 0
  const promoValid = promoBonus > 0

  const BONUS_PACKAGE = { id: 'pack_bonus', coins: 1000, price: 600, label: '1000 монет', bonus: 'Приветственный −40%' }

  useEffect(() => {
    coinsApi.packages().then(d => {
      const list = d.packages
      if (initialPackageId === 'pack_bonus') {
        setPackages([BONUS_PACKAGE, ...list])
      } else {
        setPackages(list)
      }
    })
  }, [])

  async function handleBuy() {
    setLoading(true)
    try {
      const { confirmationUrl, paymentId } = await coinsApi.createPayment(selectedId, paymentMethod, promoCode.trim() || undefined)
      try { localStorage.setItem('valorix_pending_payment', paymentId) } catch {}
      window.location.href = confirmationUrl
    } catch (err) {
      toast.error(err.message || 'Ошибка оплаты')
    } finally {
      setLoading(false)
    }
  }

  const selected = packages.find(p => p.id === selectedId)

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0,
        background: 'rgba(3,11,24,0.75)',
        zIndex: 200, backdropFilter: 'blur(8px)',
      }} />

      <div className="coin-packages-modal" style={{
        position: 'fixed', inset: 0,
        zIndex: 201,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px', overflowY: 'auto',
      }}>
        <div className="card coin-packages-inner" style={{
          width: '100%', maxWidth: 460,
          padding: '36px 32px', position: 'relative',
          background: '#07132a',
          border: `1px solid ${BORDER}`,
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
          flexShrink: 0,
        }}>
          {/* Close */}
          <button onClick={onClose} style={{
            position: 'absolute', top: 16, right: 16,
            background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`,
            borderRadius: '50%', width: 32, height: 32, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <X size={16} color={MUTED} />
          </button>

          {/* Title */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontWeight: 900, fontSize: 20, color: TEXT, marginBottom: 4 }}>
              Пополнить монеты
            </div>
            <div style={{ fontSize: 14, color: MUTED }}>
              1 анализ = 46 монет · Баланс:{' '}
              <strong style={{ color: ACCENT }}>{user?.coins ?? 0}</strong> монет
            </div>
          </div>

          {/* Packages */}
          <div className="coin-packages" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
            {packages.map(pkg => {
              const isSelected = selectedId === pkg.id
              return (
                <button
                  key={pkg.id}
                  onClick={() => setSelectedId(pkg.id)}
                  style={{
                    display: 'flex', flexDirection: 'column',
                    padding: '14px 16px',
                    border: `2px solid ${isSelected ? ACCENT : BORDER}`,
                    borderRadius: 12,
                    background: isSelected ? 'rgba(0,207,255,0.1)' : DIM,
                    cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left',
                    boxShadow: isSelected ? '0 0 20px rgba(0,207,255,0.15)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: isSelected
                        ? 'linear-gradient(135deg, #00cfff, #7b5ea7)'
                        : 'rgba(0,180,255,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Zap size={15} color={isSelected ? '#030b18' : ACCENT} fill={isSelected ? '#030b18' : 'none'} />
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: TEXT }}>{pkg.label}</div>
                  </div>
                  {pkg.bonus && (
                    <div style={{
                      fontSize: 11, color: '#22c55e', fontWeight: 600,
                      display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4,
                    }}>
                      <Star size={10} fill="#22c55e" color="#22c55e" /> {pkg.bonus}
                    </div>
                  )}
                  <div style={{
                    fontWeight: 800, fontSize: 20,
                    color: isSelected ? ACCENT : TEXT,
                  }}>
                    {pkg.price} ₽
                  </div>
                </button>
              )
            })}
          </div>

          {/* Payment methods */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: 1, marginBottom: 10, textTransform: 'uppercase' }}>
              Способ оплаты
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {PAYMENT_METHODS.map(m => {
                const isSelected = paymentMethod === m.id
                return (
                  <button
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id)}
                    style={{
                      flex: '1 1 calc(50% - 4px)', minWidth: 80,
                      padding: '10px 8px', borderRadius: 10,
                      border: `2px solid ${isSelected ? ACCENT : BORDER}`,
                      background: isSelected ? 'rgba(0,207,255,0.1)' : DIM,
                      cursor: 'pointer', transition: 'all 0.15s', textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: 18, marginBottom: 3 }}>{m.emoji}</div>
                    <div style={{ fontWeight: 700, fontSize: 12, color: isSelected ? ACCENT : TEXT }}>{m.label}</div>
                    <div style={{ fontSize: 10, color: MUTED, marginTop: 2, lineHeight: 1.3 }}>{m.desc}</div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Promo code */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' }}>
              Промокод
            </div>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <Tag size={14} color={promoValid ? '#22c55e' : MUTED} />
              </div>
              <input
                value={promoCode}
                onChange={e => setPromoCode(e.target.value)}
                placeholder="Введите промокод"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'rgba(0,15,40,0.6)',
                  border: `1.5px solid ${promoValid ? '#22c55e' : promoCode.trim() ? '#ef4444' : BORDER}`,
                  borderRadius: 10, padding: '10px 12px 10px 36px',
                  color: TEXT, fontSize: 14, outline: 'none',
                  textTransform: 'uppercase', letterSpacing: 1,
                }}
              />
              {promoValid && (
                <div style={{ marginTop: 6, fontSize: 12, color: '#22c55e', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Star size={11} fill="#22c55e" color="#22c55e" />
                  Промокод принят! +{promoBonus} монет в подарок к пополнению
                </div>
              )}
              {promoCode.trim() && !promoValid && (
                <div style={{ marginTop: 6, fontSize: 12, color: '#ef4444', fontWeight: 600 }}>
                  Промокод не найден
                </div>
              )}
            </div>
          </div>

          {/* Buy button */}
          <button
            onClick={handleBuy}
            disabled={loading || !selected}
            style={{
              width: '100%', padding: '14px',
              background: loading
                ? 'rgba(0,207,255,0.3)'
                : 'linear-gradient(90deg, #00cfff, #7b5ea7)',
              color: loading ? 'rgba(255,255,255,0.4)' : '#030b18',
              border: 'none', borderRadius: 12,
              fontWeight: 700, fontSize: 16,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.2s',
              boxShadow: loading ? 'none' : '0 4px 24px rgba(0,207,255,0.35)',
            }}
          >
            {loading
              ? 'Перенаправление...'
              : promoValid
                ? `Оплатить ${selected?.price ?? ''} ₽ · +${promoBonus} монет в подарок`
                : `Оплатить ${selected?.price ?? ''} ₽`
            }
          </button>

          <div style={{ marginTop: 12, textAlign: 'center', fontSize: 12, color: MUTED }}>
            Безопасная оплата через ЮКасса
          </div>
        </div>
      </div>
    </>
  )
}
