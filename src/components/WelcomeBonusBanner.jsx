import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import CoinsModal from './CoinsModal'

const CLOSED_KEY = 'valorix_welcome_banner_closed'

const STYLES = `
  @keyframes wbbSweep {
    0%,100% { opacity:0; transform:translateX(-60%); }
    50%      { opacity:1; transform:translateX(60%);  }
  }
  @keyframes wbbBlink {
    0%,100% { opacity:1 } 50% { opacity:0.2 }
  }
  .wbb-wrap {
    position: relative;
    background: linear-gradient(90deg,rgba(0,60,120,0.4) 0%,rgba(18,70,255,0.15) 50%,rgba(0,60,120,0.4) 100%);
    border-bottom: 1px solid rgba(0,180,255,0.15);
    overflow: hidden;
    cursor: pointer;
    z-index: 99;
  }
  .wbb-wrap::before {
    content:''; position:absolute; inset:0; pointer-events:none;
    background: linear-gradient(90deg,transparent,rgba(0,180,255,0.04),transparent);
    animation: wbbSweep 4s ease-in-out infinite;
  }

  /* ── Desktop layout ── */
  .wbb-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    height: 52px;
    gap: 12px;
  }
  .wbb-left  { display:flex; align-items:center; gap:16px; flex-shrink:0; }
  .wbb-right { display:flex; align-items:center; gap:14px; flex-shrink:0; }

  .wbb-pill {
    display:flex; align-items:center; gap:6px;
    background: rgba(0,180,255,0.08);
    border: 1px solid rgba(0,180,255,0.2);
    border-radius:20px; padding:4px 11px;
    font-size:11px; font-weight:600; color:#00d4ff;
    text-transform:uppercase; letter-spacing:0.5px;
    white-space:nowrap;
  }
  .wbb-pill-dot {
    width:5px; height:5px; background:#00d4ff;
    border-radius:50%; animation:wbbBlink 1.2s infinite;
  }
  .wbb-deal {
    display:flex; align-items:center; gap:8px;
    font-size:14px; font-weight:700;
  }
  .wbb-old { color:#ff3e3e; text-decoration:line-through; opacity:0.6; font-size:12px; }
  .wbb-new { color:#fff; font-size:16px; font-weight:800; }
  .wbb-sep { color:rgba(0,180,255,0.25); }
  .wbb-coins { color:#00d4ff; font-size:13px; }
  .wbb-divider { width:1px; height:24px; background:rgba(0,180,255,0.1); flex-shrink:0; }
  .wbb-tag2 { font-size:11px; color:#3a5070; white-space:nowrap; }

  .wbb-timer { display:flex; align-items:center; gap:5px; }
  .wbb-timer-icon { color:rgba(0,180,255,0.35); font-size:13px; }
  .wbb-timer-digits {
    font-size:16px; font-weight:800; color:#00d4ff;
    letter-spacing:2px; font-variant-numeric:tabular-nums;
  }

  .wbb-btn {
    background: linear-gradient(135deg,#00d4ff,#1246ff);
    border:none; color:#fff;
    font-size:12px; font-weight:700;
    padding:8px 18px; border-radius:8px; cursor:pointer;
    white-space:nowrap;
    transition: opacity 0.2s, transform 0.1s;
    box-shadow: 0 2px 14px rgba(0,180,255,0.25);
  }
  .wbb-btn:hover { opacity:0.9; transform:translateY(-1px); }

  .wbb-close {
    background:none; border:none;
    color:#2a3a55; font-size:18px; cursor:pointer;
    padding:4px 2px; line-height:1; transition:color 0.2s;
    flex-shrink:0;
  }
  .wbb-close:hover { color:#e8f0fc; }

  /* ── Mobile layout ── */
  @media (max-width: 600px) {
    .wbb-inner {
      height: auto;
      padding: 10px 16px;
      flex-wrap: wrap;
      gap: 8px;
    }
    .wbb-left  { gap:10px; flex:1; min-width:0; }
    .wbb-right { gap:8px;  width:100%; justify-content:space-between; }
    .wbb-pill  { display:none; }
    .wbb-divider { display:none; }
    .wbb-tag2  { display:none; }
    .wbb-deal  { gap:6px; font-size:13px; }
    .wbb-new   { font-size:15px; }
    .wbb-timer-digits { font-size:15px; letter-spacing:1.5px; }
    .wbb-btn   { flex:1; text-align:center; font-size:13px; padding:9px 12px; }
  }

  @media (max-width: 380px) {
    .wbb-old   { display:none; }
    .wbb-sep   { display:none; }
  }
`

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
    localStorage.setItem(CLOSED_KEY, String(user?.bonus_expires_at || 0))
    setVisible(false)
  }

  const pad = n => String(n).padStart(2, '0')
  const h = pad(Math.floor(secs / 3600))
  const m = pad(Math.floor((secs % 3600) / 60))
  const s = pad(secs % 60)

  if (!visible) return null

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      <div className="wbb-wrap" onClick={() => setShowCoins(true)}>
        <div className="wbb-inner">

          {/* left */}
          <div className="wbb-left">
            <div className="wbb-pill">
              <span className="wbb-pill-dot" />
              Бонус активен
            </div>
            <div className="wbb-deal">
              <span className="wbb-old">1 000 ₽</span>
              <span className="wbb-sep">→</span>
              <span className="wbb-new">600 ₽</span>
              <span className="wbb-sep">·</span>
              <span className="wbb-coins">💎 1000 монет</span>
            </div>
            <div className="wbb-divider" />
            <div className="wbb-tag2">−40% к первому пополнению</div>
          </div>

          {/* right */}
          <div className="wbb-right">
            <div className="wbb-timer">
              <span className="wbb-timer-icon">⏱</span>
              <span className="wbb-timer-digits">{h}:{m}:{s}</span>
            </div>
            <button
              className="wbb-btn"
              onClick={e => { e.stopPropagation(); setShowCoins(true) }}
            >
              Получить бонус
            </button>
            <button className="wbb-close" onClick={dismiss}>×</button>
          </div>

        </div>
      </div>

      {showCoins && <CoinsModal onClose={() => setShowCoins(false)} initialPackageId="pack_bonus" />}
    </>
  )
}
