import { useState } from 'react'

const TABS = ['Вердикт', 'Доп. ставки', 'Причины']

export default function MatchPreviewCard() {
  const [activeTab, setActiveTab] = useState(0)

  return (
    <div style={{ width: '100%', maxWidth: 620 }}>
      {/* Sample label */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, #e2e8f0)' }} />
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: '#eff6ff', border: '1.5px dashed #93c5fd',
          borderRadius: 20, padding: '5px 14px',
          fontSize: 11, fontWeight: 700, letterSpacing: 0.8,
          whiteSpace: 'nowrap', animation: 'samplePulse 2s ease-in-out infinite',
        }}>
          <style>{`
            @keyframes samplePulse {
              0%, 100% { color: #2563eb; border-color: #93c5fd; }
              50% { color: #7c3aed; border-color: #c4b5fd; }
            }
          `}</style>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
          ОБРАЗЕЦ · ТАК ВЫГЛЯДИТ ВАШ АНАЛИЗ
        </div>
        <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, #e2e8f0, transparent)' }} />
      </div>

      <div style={{
        background: 'white', borderRadius: 24,
        boxShadow: '0 24px 80px rgba(37,99,235,0.13), 0 4px 16px rgba(0,0,0,0.06)',
        overflow: 'hidden', width: '100%',
        border: '1px solid rgba(37,99,235,0.1)',
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          padding: '18px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 700, letterSpacing: 1, marginBottom: 2 }}>АНАЛИЗ МАТЧА</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Premier League · 11 мая · 12:30</div>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.1)', borderRadius: 10,
            padding: '3px 10px', fontSize: 10, fontWeight: 800,
            color: 'rgba(255,255,255,0.5)', letterSpacing: 0.5,
          }}>DEMO</div>
        </div>

        {/* Teams */}
        <div style={{
          padding: '20px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid #f1f5f9',
          background: 'linear-gradient(180deg, #fafbff 0%, white 100%)',
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
              <div style={{ fontWeight: 800, fontSize: 16, color: '#1a1a2e' }}>Arsenal</div>
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>Хозяева</div>
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{
              background: 'linear-gradient(135deg, #eff6ff, #e0e7ff)',
              border: '1px solid rgba(37,99,235,0.15)',
              borderRadius: 12, padding: '6px 14px',
            }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#1a1a2e', letterSpacing: 2 }}>VS</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: '#1a1a2e' }}>Juventus</div>
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>Гости</div>
            </div>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'linear-gradient(135deg, #1a1a2e, #374151)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 900, color: 'white',
              boxShadow: '0 4px 12px rgba(26,26,46,0.3)',
            }}>J</div>
          </div>
        </div>

        {/* Verdict banner */}
        <div style={{
          margin: '16px 20px 0',
          background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
          border: '1px solid #bbf7d0', borderRadius: 14,
          padding: '12px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
            <span style={{ fontWeight: 800, fontSize: 15, color: '#15803d' }}>Победа: Arsenal</span>
          </div>
          <div style={{
            background: '#22c55e', color: 'white',
            borderRadius: 20, padding: '3px 10px',
            fontSize: 11, fontWeight: 800,
          }}>68% уверен.</div>
        </div>

        {/* Tabs */}
        <div className="preview-tabs" style={{ display: 'flex', padding: '14px 20px 0', gap: 6 }}>
          {TABS.map((tab, i) => (
            <button key={i} onClick={() => setActiveTab(i)} style={{
              padding: '7px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 700,
              background: activeTab === i ? '#1a1a2e' : '#f1f5f9',
              color: activeTab === i ? 'white' : '#64748b',
              transition: 'all 0.2s',
            }}>{tab}</button>
          ))}
        </div>

        {/* Tab content */}
        <div className="preview-card-pad" style={{ padding: '14px 20px 20px' }}>

          {/* Tab 0: Verdict stats */}
          {activeTab === 0 && (
            <div className="preview-stats" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
              <StatBox label="Индекс доверия" value="68" color="#2563eb" isGauge />
              <StatBox label="Риск" value="Средний" color="#f59e0b" isRisk />
              <StatBox label="Fair Odds" value="1.91" sub="Букмекер 2.08" color="#1a1a2e" />
              <StatBox label="Value" value="+8.9%" sub="Рекомендуем" color="#22c55e" />
            </div>
          )}

          {/* Tab 1: Extra bets */}
          {activeTab === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { type: 'Угловые Арсенала больше 5.5', confidence: 82, reason: 'Арсенал подавал 7+ угловых в 8 из 10 домашних матчей', color: '#22c55e' },
                { type: 'Тотал голов первого тайма больше 0.5', confidence: 74, reason: 'Арсенал забивал в первом тайме в 7 последних домашних играх', color: '#f59e0b' },
                { type: 'Победа с нулём (Арсенал)', confidence: 61, reason: 'Хозяева не пропускали в 5 из 7 последних матчей дома', color: '#3b82f6' },
              ].map((bet, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '12px 14px', background: '#f8fafc',
                  borderRadius: 12, border: '1px solid #e2e8f0',
                }}>
                  <div style={{ textAlign: 'center', minWidth: 40, flexShrink: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 900, color: bet.color }}>{bet.confidence}%</div>
                    <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600 }}>увер.</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e', marginBottom: 3 }}>{bet.type}</div>
                    <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.5 }}>{bet.reason}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 2: Reasons */}
          {activeTab === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {[
                'Арсенал выиграл 7 из последних 10 домашних матчей',
                'Ювентус потерял ключевого нападающего из-за травмы',
                'Форма Арсенала: 4 победы в последних 5 матчах',
                'Личные встречи: 60% побед Арсенала за 10 лет',
              ].map((reason, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 8,
                  padding: '9px 12px', background: '#f8fafc', borderRadius: 10,
                }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#2563eb', marginTop: 4, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: '#374151', lineHeight: 1.5 }}>{reason}</span>
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
      background: '#f8fafc', borderRadius: 12, padding: '10px 8px',
      textAlign: 'center', border: '1px solid #e2e8f0',
    }}>
      <div style={{ fontSize: 9, color: '#94a3b8', marginBottom: 6, fontWeight: 700, letterSpacing: 0.5 }}>{label.toUpperCase()}</div>
      {isGauge ? (
        <svg width="52" height="52" viewBox="0 0 52 52" style={{ display: 'block', margin: '0 auto' }}>
          <circle cx="26" cy="26" r="20" fill="none" stroke="#e2e8f0" strokeWidth="6" />
          <circle cx="26" cy="26" r="20" fill="none" stroke={color} strokeWidth="6"
            strokeDasharray={`${(68 / 100) * 125.6} 125.6`}
            strokeLinecap="round" transform="rotate(-90 26 26)" />
          <text x="26" y="30" textAnchor="middle" fontSize="12" fontWeight="800" fill="#1a1a2e">{value}</text>
        </svg>
      ) : isRisk ? (
        <div>
          <div style={{ fontSize: 20, marginBottom: 2 }}>🟡</div>
          <div style={{ fontSize: 12, fontWeight: 700, color }}>{value}</div>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: 15, fontWeight: 900, color, marginTop: 4 }}>{value}</div>
          {sub && <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 3 }}>{sub}</div>}
        </div>
      )}
    </div>
  )
}
