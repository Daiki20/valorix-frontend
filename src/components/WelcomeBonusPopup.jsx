import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import CoinsModal from './CoinsModal'

const SEEN_KEY = 'valorix_welcome_bonus_seen'

export default function WelcomeBonusPopup() {
  const { user } = useAuth()
  const [show, setShow] = useState(false)
  const [showCoins, setShowCoins] = useState(false)
  const [secs, setSecs] = useState(0)

  useEffect(() => {
    if (!user) return
    const expires = user.bonus_expires_at
    if (!expires || Date.now() > expires) return
    const seen = localStorage.getItem(SEEN_KEY)
    if (seen) return
    setSecs(Math.floor((expires - Date.now()) / 1000))
    setShow(true)
    localStorage.setItem(SEEN_KEY, '1')
  }, [user])

  useEffect(() => {
    if (!show) return
    const id = setInterval(() => {
      setSecs(s => {
        if (s <= 1) { setShow(false); return 0 }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [show])

  function pad(n) { return String(n).padStart(2, '0') }
  const h = pad(Math.floor(secs / 3600))
  const m = pad(Math.floor((secs % 3600) / 60))
  const s = pad(secs % 60)

  if (!show) return null

  return (
    <>
      {/* overlay */}
      <div
        onClick={() => setShow(false)}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(3,11,24,0.82)',
          backdropFilter: 'blur(6px)',
          zIndex: 500,
        }}
      />

      {/* popup */}
      <div style={{
        position: 'fixed', inset: 0,
        zIndex: 501,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}>
        <div style={{
          background: 'linear-gradient(145deg,#07132a,#0d1e50)',
          border: '1px solid rgba(0,180,255,0.25)',
          borderRadius: 20,
          padding: '36px 32px',
          width: '100%',
          maxWidth: 480,
          position: 'relative',
          boxShadow: '0 0 60px rgba(0,120,255,0.2), 0 20px 80px rgba(0,0,0,0.8)',
          animation: 'bonusSlideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        }}>
          <style>{`
            @keyframes bonusSlideUp {
              from { transform: translateY(40px) scale(0.95); opacity: 0 }
              to   { transform: translateY(0) scale(1); opacity: 1 }
            }
            @keyframes bonusPulse {
              0%,100% { opacity:1 } 50% { opacity:0.3 }
            }
          `}</style>

          <button
            onClick={() => setShow(false)}
            style={{
              position: 'absolute', top: 14, right: 18,
              background: 'none', border: 'none',
              color: '#334466', fontSize: 24, cursor: 'pointer', lineHeight: 1,
            }}
          >×</button>

          {/* badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: '#0d1e45', border: '1px solid rgba(0,150,255,0.2)',
            borderRadius: 20, padding: '5px 14px',
            fontSize: 12, color: '#5599dd', marginBottom: 16,
          }}>
            <span style={{ width: 6, height: 6, background: '#4da6ff', borderRadius: '50%', animation: 'bonusPulse 1.5s infinite', display: 'inline-block' }} />
            Приветственный бонус активен
          </div>

          <div style={{ fontSize: 26, fontWeight: 900, lineHeight: 1.2, marginBottom: 6 }}>
            Получите <span style={{ color: '#00cfff' }}>−40%</span><br />к первому пополнению!
          </div>
          <div style={{ fontSize: 14, color: '#6688aa', marginBottom: 24 }}>
            Специальное предложение действует ровно 1 час после регистрации
          </div>

          {/* deal block */}
          <div style={{
            background: '#06101f',
            border: '1px solid rgba(0,100,200,0.2)',
            borderRadius: 14, padding: '18px 22px',
            display: 'flex', alignItems: 'center', gap: 16,
            marginBottom: 18,
          }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#3355aa', marginBottom: 6 }}>Обычная цена</div>
              <div style={{ fontSize: 30, fontWeight: 900, color: '#ff6666', textDecoration: 'line-through', opacity: 0.7 }}>1000 ₽</div>
            </div>
            <div style={{ color: '#223366', fontSize: 24 }}>›</div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#3355aa', marginBottom: 6 }}>Цена сейчас</div>
              <div style={{ fontSize: 34, fontWeight: 900, color: '#fff' }}>600 ₽</div>
              <div style={{ fontSize: 12, color: '#00cfff', marginTop: 2 }}>💎 зачислим 1000 монет</div>
            </div>
            <div style={{
              background: 'linear-gradient(135deg,#cc2222,#ff4444)',
              color: '#fff', fontSize: 13, fontWeight: 800,
              padding: '8px 12px', borderRadius: 8, textAlign: 'center', lineHeight: 1.3,
              boxShadow: '0 0 16px rgba(255,60,60,0.3)',
            }}>
              Экономия<br />400 ₽
            </div>
          </div>

          {/* timer */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: '#040d1c', borderRadius: 10,
            border: '1px solid rgba(0,80,160,0.25)',
            padding: '11px 16px', marginBottom: 20,
          }}>
            <span style={{ fontSize: 12, color: '#3355aa', flex: 1 }}>⏱ Бонус исчезнет через:</span>
            <span style={{ fontSize: 22, fontWeight: 800, color: '#00cfff', letterSpacing: 3, fontVariantNumeric: 'tabular-nums' }}>
              {h}<span style={{ color: '#1a4488' }}>:</span>{m}<span style={{ color: '#1a4488' }}>:</span>{s}
            </span>
          </div>

          <button
            onClick={() => { setShow(false); setShowCoins(true) }}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg,#1a5aff,#0d3acc)',
              border: 'none', color: '#fff',
              fontSize: 16, fontWeight: 800,
              padding: 16, borderRadius: 12, cursor: 'pointer',
              boxShadow: '0 0 30px rgba(26,90,255,0.5)',
              marginBottom: 10, letterSpacing: '0.3px',
            }}
          >
            Пополнить за 600 ₽ и получить 1000 монет
          </button>
          <button
            onClick={() => setShow(false)}
            style={{
              width: '100%', background: 'none', border: 'none',
              color: '#2a3a55', fontSize: 13, cursor: 'pointer', padding: 4,
            }}
          >
            Пропустить, оплачу позже по полной цене
          </button>

          <div style={{ display: 'flex', gap: 16, marginTop: 16, justifyContent: 'center' }}>
            {['🔒 Безопасно', '⚡ Мгновенное зачисление', '🎁 1000 монет сразу'].map(t => (
              <span key={t} style={{ fontSize: 11, color: '#334466' }}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      {showCoins && <CoinsModal onClose={() => setShowCoins(false)} initialPackageId="pack_bonus" />}
    </>
  )
}
