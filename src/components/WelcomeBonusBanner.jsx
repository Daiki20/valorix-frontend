import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import CoinsModal from './CoinsModal'

const CLOSED_KEY = 'valorix_welcome_banner_closed'

export default function WelcomeBonusBanner() {
  const { user } = useAuth()
  const [secs, setSecs] = useState(0)
  const [visible, setVisible] = useState(false)
  const [showCoins, setShowCoins] = useState(false)

  useEffect(() => {
    if (!user) return
    const expires = user.bonus_expires_at
    if (!expires || Date.now() > expires) return
    const closed = localStorage.getItem(CLOSED_KEY)
    if (closed && parseInt(closed, 10) > Date.now()) return
    setSecs(Math.floor((expires - Date.now()) / 1000))
    setVisible(true)
  }, [user])

  useEffect(() => {
    if (!visible) return
    const id = setInterval(() => {
      setSecs(s => {
        if (s <= 1) { setVisible(false); return 0 }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [visible])

  function dismiss(e) {
    e.stopPropagation()
    // закрыто до конца бонусного периода
    const expires = user?.bonus_expires_at || 0
    localStorage.setItem(CLOSED_KEY, String(expires))
    setVisible(false)
  }

  function pad(n) { return String(n).padStart(2, '0') }
  const h = pad(Math.floor(secs / 3600))
  const m = pad(Math.floor((secs % 3600) / 60))
  const s = pad(secs % 60)

  if (!visible) return null

  return (
    <>
      <div
        onClick={() => setShowCoins(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          background: 'linear-gradient(90deg,#06122e 0%,#0a1e5a 45%,#06122e 100%)',
          borderBottom: '1px solid rgba(0,100,255,0.2)',
          padding: '10px 20px',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
          zIndex: 99,
        }}
      >
        {/* shimmer */}
        <style>{`
          @keyframes bannerShimmer {
            0% { transform: translateX(-100%) }
            100% { transform: translateX(100%) }
          }
        `}</style>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(90deg,transparent,rgba(0,100,255,0.04),transparent)',
          animation: 'bannerShimmer 4s infinite',
          pointerEvents: 'none',
        }} />

        {/* left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#aac4e8' }}>Приветственный бонус</div>
            <div style={{ fontSize: 11, color: '#3a5570' }}>Только 1 час после регистрации</div>
          </div>
          <div style={{ width: 1, height: 32, background: 'rgba(0,100,255,0.2)' }} />
          <div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#00cfff', lineHeight: 1 }}>−40%</div>
            <div style={{ fontSize: 11, color: '#3a5570' }}>к первому пополнению</div>
          </div>
        </div>

        {/* timer */}
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          <div style={{ fontSize: 10, color: '#3a5570', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>До конца акции</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#00cfff', letterSpacing: 3, fontVariantNumeric: 'tabular-nums' }}>
            {h}<span style={{ color: '#1a3a66' }}>:</span>{m}<span style={{ color: '#1a3a66' }}>:</span>{s}
          </div>
        </div>

        {/* right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: '#ff6666', textDecoration: 'line-through', opacity: 0.8 }}>1 000 ₽</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>600 ₽</div>
            <div style={{ fontSize: 11, color: '#3a6688' }}>получишь 1000 монет</div>
          </div>
          <button
            onClick={e => { e.stopPropagation(); setShowCoins(true) }}
            style={{
              background: 'linear-gradient(135deg,#1a5aff,#0d3acc)',
              border: 'none', color: '#fff',
              fontSize: 13, fontWeight: 700,
              padding: '9px 18px', borderRadius: 8, cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: '0 0 20px rgba(26,90,255,0.4)',
            }}
          >
            Получить бонус
          </button>
          <button
            onClick={dismiss}
            style={{
              background: 'none', border: 'none',
              color: '#2a3a55', fontSize: 20, cursor: 'pointer',
              padding: '4px 8px', lineHeight: 1,
            }}
            title="Закрыть"
          >×</button>
        </div>
      </div>

      {showCoins && <CoinsModal onClose={() => setShowCoins(false)} initialPackageId="pack_bonus" />}
    </>
  )
}
