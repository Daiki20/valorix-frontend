import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import CoinsModal from './CoinsModal'

const SEEN_KEY = 'valorix_welcome_bonus_seen'

const STYLES = `
  @keyframes wbGlowFlow {
    0%   { background-position: 0% 0%; }
    100% { background-position: 200% 0%; }
  }
  @keyframes wbPopIn {
    from { transform: scale(0.88) translateY(24px); opacity: 0; }
    to   { transform: scale(1) translateY(0); opacity: 1; }
  }
  @keyframes wbFadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes wbBlink {
    0%,100% { opacity:1 } 50% { opacity:0.2 }
  }
  @keyframes wbBtnShine {
    0%       { left: -100%; }
    40%,100% { left: 150%;  }
  }
  .wb-overlay {
    position: fixed; inset: 0;
    background: rgba(2,6,16,0.92);
    z-index: 500;
    display: flex; align-items: center; justify-content: center;
    padding: 16px;
    animation: wbFadeIn 0.25s ease;
  }
  .wb-card {
    width: 100%; max-width: 500px;
    background: #080f1e;
    border-radius: 24px;
    overflow: hidden;
    position: relative;
    box-shadow: 0 0 0 1px rgba(0,180,255,0.12),
                0 32px 80px rgba(0,0,0,0.7),
                0 0 120px rgba(0,100,255,0.07);
    animation: wbPopIn 0.4s cubic-bezier(0.34,1.56,0.64,1);
  }
  .wb-glow-bar {
    height: 3px;
    background: linear-gradient(90deg,#1246ff,#00d4ff,#6c3fff,#1246ff);
    background-size: 200% 100%;
    animation: wbGlowFlow 3s linear infinite;
  }
  .wb-body { padding: 32px; }
  .wb-close {
    position: absolute; top: 16px; right: 16px;
    width: 32px; height: 32px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 50%; color: #3a5070;
    font-size: 14px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.2s, color 0.2s;
  }
  .wb-close:hover { background: rgba(255,255,255,0.08); color: #e8f0fc; }
  .wb-tag {
    display: inline-flex; align-items: center; gap: 6px;
    background: rgba(0,212,255,0.06);
    border: 1px solid rgba(0,212,255,0.15);
    border-radius: 20px; padding: 4px 12px;
    font-size: 11px; font-weight: 600; color: #00d4ff;
    letter-spacing: 0.5px; text-transform: uppercase;
    margin-bottom: 18px;
  }
  .wb-tag-dot {
    width: 5px; height: 5px; background: #00d4ff;
    border-radius: 50%; animation: wbBlink 1.4s infinite;
  }
  .wb-heading {
    font-size: 28px; font-weight: 900;
    line-height: 1.15; margin-bottom: 6px; letter-spacing: -0.5px;
  }
  .wb-heading em { font-style: normal; color: #00d4ff; }
  .wb-subhead { font-size: 13px; color: #3a5070; margin-bottom: 24px; line-height: 1.5; }
  .wb-pricing {
    background: linear-gradient(135deg,#080f1e,#0c1628);
    border: 1px solid rgba(0,120,200,0.15);
    border-radius: 16px; padding: 20px;
    margin-bottom: 14px; position: relative; overflow: hidden;
  }
  .wb-pricing::after {
    content:''; position:absolute; top:0; left:0; right:0; height:1px;
    background: linear-gradient(90deg,transparent,rgba(0,180,255,0.3),transparent);
  }
  .wb-pricing-row { display:flex; align-items:center; justify-content:space-between; }
  .wb-price-col { display:flex; flex-direction:column; align-items:center; gap:5px; flex:1; }
  .wb-price-label { font-size:10px; text-transform:uppercase; letter-spacing:1px; color:#3a5070; font-weight:600; }
  .wb-price-old { font-size:28px; font-weight:800; color:#ff3e3e; text-decoration:line-through; opacity:0.6; }
  .wb-price-new { font-size:36px; font-weight:900; color:#fff; line-height:1; }
  .wb-price-new sub { font-size:20px; vertical-align:baseline; color:#8899bb; }
  .wb-price-coins { font-size:12px; color:#00d4ff; font-weight:600; margin-top:2px; }
  .wb-price-arrow {
    width:36px; height:36px; flex-shrink:0;
    background: rgba(0,180,255,0.07);
    border: 1px solid rgba(0,180,255,0.15);
    border-radius:50%; display:flex; align-items:center; justify-content:center;
    color: rgba(0,180,255,0.5); font-size:18px; margin:0 8px;
  }
  .wb-save-badge {
    position:absolute; top:14px; right:14px;
    background: linear-gradient(135deg,#cc1f1f,#ff3e3e);
    color:#fff; font-size:11px; font-weight:800;
    padding:5px 10px; border-radius:8px;
    box-shadow: 0 4px 16px rgba(255,62,62,0.3);
  }
  .wb-timer {
    display:flex; align-items:center; gap:12px;
    background: rgba(5,11,23,0.8);
    border: 1px solid rgba(0,100,180,0.15);
    border-radius:12px; padding:11px 16px; margin-bottom:18px;
  }
  .wb-timer-label { font-size:12px; color:#3a5070; flex:1; font-weight:500; }
  .wb-timer-digits {
    font-size:20px; font-weight:800; color:#00d4ff;
    letter-spacing:3px; font-variant-numeric:tabular-nums;
  }
  .wb-timer-sep { color:rgba(0,180,255,0.3); }
  .wb-cta {
    width:100%;
    background: linear-gradient(135deg,#1246ff,#0a30cc);
    border:none; color:#fff;
    font-size:15px; font-weight:800;
    padding:16px 20px; border-radius:14px; cursor:pointer;
    margin-bottom:10px; position:relative; overflow:hidden;
    box-shadow: 0 4px 30px rgba(18,70,255,0.45), 0 0 0 1px rgba(0,180,255,0.1);
    transition: transform 0.15s, box-shadow 0.2s;
    letter-spacing:0.2px;
  }
  .wb-cta::after {
    content:''; position:absolute; top:0; left:-100%; width:60%; height:100%;
    background: linear-gradient(90deg,transparent,rgba(255,255,255,0.07),transparent);
    animation: wbBtnShine 3s ease-in-out infinite;
  }
  .wb-cta:hover { transform:translateY(-2px); box-shadow:0 8px 40px rgba(18,70,255,0.6),0 0 0 1px rgba(0,200,255,0.15); }
  .wb-cta:active { transform:translateY(0); }
  .wb-skip {
    width:100%; background:none; border:none;
    color:#2a3a55; font-size:12px; cursor:pointer;
    padding:6px; font-weight:500; transition:color 0.2s;
  }
  .wb-skip:hover { color:#5577aa; }
  .wb-trust { display:flex; justify-content:center; gap:20px; margin-top:16px; flex-wrap:wrap; }
  .wb-trust span { font-size:11px; color:#1e2e42; }

  /* ── Mobile ── */
  @media (max-width: 520px) {
    .wb-body { padding: 24px 20px; }
    .wb-heading { font-size: 22px; }
    .wb-subhead { margin-bottom: 18px; }
    .wb-price-old { font-size: 22px; }
    .wb-price-new { font-size: 28px; }
    .wb-price-new sub { font-size: 16px; }
    .wb-pricing { padding: 16px 14px; }
    .wb-save-badge { font-size: 10px; padding: 4px 8px; top: 10px; right: 10px; }
    .wb-timer-digits { font-size: 17px; letter-spacing: 2px; }
    .wb-cta { font-size: 14px; padding: 14px 16px; }
    .wb-trust { gap: 12px; }
  }
`

export default function WelcomeBonusPopup() {
  const { user } = useAuth()
  const [show, setShow] = useState(false)
  const [showCoins, setShowCoins] = useState(false)
  const [secs, setSecs] = useState(0)

  useEffect(() => {
    if (!user) return
    const expires = user.bonus_expires_at
    if (!expires || Date.now() > expires) return
    if (localStorage.getItem(SEEN_KEY)) return
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

  const pad = n => String(n).padStart(2, '0')
  const h = pad(Math.floor(secs / 3600))
  const m = pad(Math.floor((secs % 3600) / 60))
  const s = pad(secs % 60)

  if (!show) return null

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      <div className="wb-overlay" onClick={() => setShow(false)}>
        <div className="wb-card" onClick={e => e.stopPropagation()}>
          <div className="wb-glow-bar" />

          <div className="wb-body">
            <button className="wb-close" onClick={() => setShow(false)}>✕</button>

            <div className="wb-tag">
              <span className="wb-tag-dot" />
              Только 1 час после регистрации
            </div>

            <div className="wb-heading">
              Первое пополнение<br />со скидкой <em>−40%</em>
            </div>
            <div className="wb-subhead">
              Автоматически зачислим 1000 монет — успей до истечения таймера
            </div>

            <div className="wb-pricing">
              <div className="wb-save-badge">−400 ₽</div>
              <div className="wb-pricing-row">
                <div className="wb-price-col">
                  <div className="wb-price-label">Обычная цена</div>
                  <div className="wb-price-old">1000 ₽</div>
                </div>
                <div className="wb-price-arrow">›</div>
                <div className="wb-price-col">
                  <div className="wb-price-label">Сейчас</div>
                  <div className="wb-price-new">600<sub>₽</sub></div>
                  <div className="wb-price-coins">💎 1 000 монет</div>
                </div>
              </div>
            </div>

            <div className="wb-timer">
              <span style={{ fontSize: 16 }}>⏳</span>
              <span className="wb-timer-label">Предложение истекает через</span>
              <span className="wb-timer-digits">
                {h}<span className="wb-timer-sep">:</span>
                {m}<span className="wb-timer-sep">:</span>
                {s}
              </span>
            </div>

            <button className="wb-cta" onClick={() => { setShow(false); setShowCoins(true) }}>
              Пополнить за 600 ₽ · Получить 1000 монет
            </button>
            <button className="wb-skip" onClick={() => setShow(false)}>
              Пропустить, оплачу позже по полной цене
            </button>

            <div className="wb-trust">
              <span>🔒 Безопасно</span>
              <span>⚡ Моментально</span>
              <span>🎁 1000 монет сразу</span>
            </div>
          </div>
        </div>
      </div>

      {showCoins && <CoinsModal onClose={() => setShowCoins(false)} initialPackageId="pack_bonus" />}
    </>
  )
}
