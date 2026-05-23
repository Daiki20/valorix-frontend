import { useState } from 'react'

const ACCENT  = '#00cfff'
const A2      = '#7b5ea7'
const BORDER  = 'rgba(0,180,255,0.12)'
const TEXT    = '#d8eeff'
const MUTED   = '#4a6a8a'
const BG_CARD = 'rgba(0,25,60,0.55)'
const DIM     = 'rgba(255,255,255,0.04)'

const TABS = ['Вердикт', 'Причины']

export default function MatchPreviewCard() {
  const [activeTab, setActiveTab] = useState(0)

  return (
    <div style={{ width: '100%', maxWidth: 620 }}>
      {/* Label */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${BORDER})` }} />
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(0,207,255,0.07)', border: '1.5px dashed rgba(0,207,255,0.3)',
          borderRadius: 20, padding: '5px 14px',
          fontSize: 11, fontWeight: 700, letterSpacing: 0.8,
          animation: 'samplePulse 2s ease-in-out infinite',
        }}>
          <style>{`
            @keyframes samplePulse {
              0%, 100% { color: #00cfff; border-color: rgba(0,207,255,0.3); }
              50% { color: #7b5ea7; border-color: rgba(123,94,167,0.4); }
            }
          `}</style>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
          ОБРАЗЕЦ · ТАК ВЫГЛЯДИТ ВАШ АНАЛИЗ
        </div>
        <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${BORDER}, transparent)` }} />
      </div>

      <div style={{
        background: '#06112a', borderRadius: 24,
        boxShadow: '0 24px 80px rgba(0,207,255,0.1), 0 4px 16px rgba(0,0,0,0.4)',
        overflow: 'hidden', width: '100%',
        border: `1px solid ${BORDER}`,
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #030b18 0%, #07152a 100%)',
          padding: '18px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: `1px solid ${BORDER}`,
        }}>
          <div>
            <div style={{ fontSize: 10, color: MUTED, fontWeight: 700, letterSpacing: 1, marginBottom: 2 }}>АНАЛИЗ МАТЧА</div>
            <div style={{ fontSize: 12, color: 'rgba(216,238,255,0.6)', fontWeight: 500 }}>Premier League · 11 мая · 12:30</div>
          </div>
          <div style={{
            background: 'rgba(0,207,255,0.1)', borderRadius: 10,
            padding: '3px 10px', fontSize: 10, fontWeight: 800,
            color: ACCENT, letterSpacing: 0.5, border: `1px solid rgba(0,207,255,0.2)`,
          }}>DEMO</div>
        </div>

        {/* Teams */}
        <div style={{
          padding: '20px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: `1px solid ${BORDER}`,
          background: 'rgba(0,15,40,0.4)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 900, color: 'white',
              boxShadow: '0 4px 12px rgba(239,68,68,0.35)',
            }}>A</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: TEXT }}>Arsenal</div>
              <div style={{ fontSize: 11, color: MUTED, fontWeight: 500 }}>Хозяева</div>
            </div>
          </div>

          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <div style={{
              background: 'rgba(0,207,255,0.08)',
              border: `1px solid rgba(0,207,255,0.2)`,
              borderRadius: 10, padding: '4px 10px',
            }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: ACCENT, letterSpacing: 1 }}>VS</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: TEXT }}>Juventus</div>
              <div style={{ fontSize: 11, color: MUTED, fontWeight: 500 }}>Гости</div>
            </div>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'linear-gradient(135deg, #1e293b, #374151)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 900, color: 'white',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}>J</div>
          </div>
        </div>

        {/* Verdict banner */}
        <div style={{
          margin: '16px 20px 0',
          background: 'rgba(34,197,94,0.08)',
          border: '1px solid rgba(34,197,94,0.2)',
          borderLeft: '4px solid #22c55e',
          borderRadius: 14, padding: '12px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
            <span style={{ fontWeight: 800, fontSize: 15, color: '#5eff9e' }}>Победа: Arsenal</span>
          </div>
          <div style={{
            background: 'rgba(34,197,94,0.15)', color: '#22c55e',
            border: '1px solid rgba(34,197,94,0.3)',
            borderRadius: 20, padding: '3px 10px',
            fontSize: 11, fontWeight: 800,
          }}>68% уверен.</div>
        </div>

        {/* Extra bets */}
        <div style={{ padding: '14px 20px 0' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: 0.5, marginBottom: 8 }}>ДОПОЛНИТЕЛЬНЫЕ СТАВКИ</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {[
              { type: 'Угловые Арсенала больше 5.5', confidence: 82, reason: 'Арсенал подавал 7+ угловых в 8 из 10 домашних матчей' },
              { type: 'Тотал 1-го тайма больше 0.5', confidence: 74, reason: 'Арсенал забивал в первом тайме в 7 последних домашних играх' },
              { type: 'Победа с нулём (Арсенал)', confidence: 61, reason: 'Хозяева не пропускали в 5 из 7 последних матчей дома' },
            ].map((bet, i) => {
              const isGreen  = bet.confidence >= 70
              const isYellow = bet.confidence >= 55 && bet.confidence < 70
              const color      = isGreen ? '#22c55e' : isYellow ? '#f59e0b' : MUTED
              const bg         = isGreen ? 'rgba(34,197,94,0.07)'  : isYellow ? 'rgba(245,158,11,0.07)'  : DIM
              const border     = isGreen ? 'rgba(34,197,94,0.2)'   : isYellow ? 'rgba(245,158,11,0.2)'   : BORDER
              const leftBorder = isGreen ? '#22c55e' : isYellow ? '#f59e0b' : BORDER
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '10px 12px', background: bg,
                  borderRadius: 10, border: `1px solid ${border}`,
                  borderLeft: `4px solid ${leftBorder}`,
                }}>
                  <div style={{ textAlign: 'center', minWidth: 36, flexShrink: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color }}>{bet.confidence}%</div>
                    <div style={{ fontSize: 9, color: MUTED, fontWeight: 600 }}>увер.</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: TEXT, marginBottom: 2 }}>{bet.type}</div>
                    <div style={{ fontSize: 11, color: MUTED, lineHeight: 1.4 }}>{bet.reason}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ height: 1, background: BORDER, margin: '14px 0 0' }} />
        <div className="preview-tabs" style={{ display: 'flex', padding: '12px 20px 0', gap: 6 }}>
          {TABS.map((tab, i) => (
            <button key={i} onClick={() => setActiveTab(i)} style={{
              padding: '7px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 700,
              background: activeTab === i ? ACCENT : 'rgba(0,25,60,0.4)',
              color: activeTab === i ? '#030b18' : MUTED,
              transition: 'all 0.2s',
            }}>{tab}</button>
          ))}
        </div>

        {/* Tab content */}
        <div className="preview-card-pad" style={{ padding: '12px 20px 20px' }}>
          {activeTab === 0 && (
            <div className="preview-stats" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
              <StatBox label="Индекс доверия" value="68" color={ACCENT} isGauge />
              <StatBox label="Риск" value="Средний" color="#f59e0b" isRisk />
              <StatBox label="Fair Odds" value="1.91" sub="Букмекер 2.08" color={ACCENT} />
              <StatBox label="Value" value="+8.9%" sub="Рекомендуем" color="#22c55e" />
            </div>
          )}

          {activeTab === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {[
                'Арсенал выиграл 7 из последних 10 домашних матчей',
                'Ювентус потерял ключевого нападающего из-за травмы',
                'Форма Арсенала: 4 победы в последних 5 матчах',
                'Личные встречи: 60% побед Арсенала за 10 лет',
              ].map((reason, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 8,
                  padding: '9px 12px', background: DIM,
                  border: `1px solid ${BORDER}`, borderRadius: 10,
                }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: ACCENT, marginTop: 4, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: MUTED, lineHeight: 1.5 }}>{reason}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatBox({ label, value, sub, color, isGauge, isRisk }) {
  return (
    <div style={{
      background: 'rgba(0,25,60,0.5)', borderRadius: 12, padding: '10px 8px',
      textAlign: 'center', border: `1px solid rgba(0,180,255,0.12)`,
    }}>
      <div style={{ fontSize: 9, color: '#4a6a8a', marginBottom: 6, fontWeight: 700, letterSpacing: 0.5 }}>{label.toUpperCase()}</div>
      {isGauge ? (
        <svg width="52" height="52" viewBox="0 0 52 52" style={{ display: 'block', margin: '0 auto' }}>
          <circle cx="26" cy="26" r="20" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
          <circle cx="26" cy="26" r="20" fill="none" stroke={color} strokeWidth="6"
            strokeDasharray={`${(68 / 100) * 125.6} 125.6`}
            strokeLinecap="round" transform="rotate(-90 26 26)" />
          <text x="26" y="30" textAnchor="middle" fontSize="12" fontWeight="800" fill="#d8eeff">{value}</text>
        </svg>
      ) : isRisk ? (
        <div>
          <div style={{ fontSize: 20, marginBottom: 2 }}>🟡</div>
          <div style={{ fontSize: 12, fontWeight: 700, color }}>{value}</div>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: 15, fontWeight: 900, color, marginTop: 4 }}>{value}</div>
          {sub && <div style={{ fontSize: 9, color: '#4a6a8a', marginTop: 3 }}>{sub}</div>}
        </div>
      )}
    </div>
  )
}
