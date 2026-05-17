import { useState } from 'react'

const TABS = ['Что думает AI?', 'Причины', 'Коэффициенты']

export default function MatchPreviewCard() {
  const [activeTab, setActiveTab] = useState(0)

  return (
    <div style={{ width: '100%', maxWidth: 620 }}>
      {/* Sample label */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        marginBottom: 12,
      }}>
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
      background: 'white',
      borderRadius: 20,
      boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
      overflow: 'hidden',
      width: '100%',
      border: '1.5px dashed #e2e8f0',
    }}>
      {/* Header */}
      <div className="preview-header" style={{ background: '#f8fafc', padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>Анализ матча</span>
        <span style={{
          fontSize: 10, fontWeight: 800, color: '#94a3b8',
          background: '#f1f5f9', borderRadius: 10, padding: '2px 8px', letterSpacing: 0.5,
        }}>DEMO</span>
      </div>

      {/* Match info */}
      <div className="preview-match-pad" style={{
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #f1f5f9',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 900, color: 'white',
          }}>A</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Arsenal</div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>Хозяева</div>
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', letterSpacing: 1 }}>Premier League</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#1a1a2e', margin: '4px 0' }}>VS</div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>11 мая · 12:30</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Juventus</div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>Гости</div>
          </div>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: 'linear-gradient(135deg, #1a1a2e, #374151)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 900, color: 'white',
          }}>J</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="preview-tabs" style={{ display: 'flex', padding: '0 24px', gap: 4, paddingTop: 16 }}>
        {TABS.map((tab, i) => (
          <button key={i} onClick={() => setActiveTab(i)} style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            background: activeTab === i ? '#1a1a2e' : '#f1f5f9',
            color: activeTab === i ? 'white' : '#64748b',
            transition: 'all 0.2s',
          }}>
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="preview-card-pad" style={{ padding: '16px 24px 20px' }}>
        {activeTab === 0 && (
          <div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 16px', background: '#f0fdf4', borderRadius: 10, marginBottom: 12,
            }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }} />
              <span style={{ fontWeight: 700, fontSize: 14 }}>Победа: <span style={{ color: '#ef4444' }}>Arsenal</span></span>
            </div>

            {/* Stats row */}
            <div className="preview-stats" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
              <StatBox label="Индекс доверия" value="68" sub="/100" color="#2563eb" isGauge />
              <StatBox label="Риск" value="Средний" sub="" color="#f59e0b" isRisk />
              <StatBox label="Fair Odds" value="1.91" sub="Sportsbook 2.08" color="#1a1a2e" />
              <StatBox label="Value" value="+8.9%" sub="Рекомендуем" color="#22c55e" />
            </div>
          </div>
        )}

        {activeTab === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              'Арсенал выиграл 7 из последних 10 домашних матчей',
              'Ювентус потерял ключевого игрока из-за травмы',
              'Форма Арсенала в последние 5 матчей — 4 победы',
              'Статистика личных встреч: 60% побед Арсенала',
            ].map((reason, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 8,
                padding: '10px 14px', background: '#f8fafc', borderRadius: 8,
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563eb', marginTop: 5, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{reason}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 2 && (
          <div>
            <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 600, color: '#64748b' }}>Лучшие коэффициенты:</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { name: 'Fonbet', odds: '2.5', color: '#ef4444' },
                { name: 'Winline', odds: '2.3', color: '#f59e0b' },
                { name: '1xbet', odds: '2.1', color: '#3b82f6' },
              ].map(bk => (
                <div key={bk.name} style={{
                  background: bk.color, color: 'white',
                  borderRadius: 20, padding: '6px 14px',
                  fontSize: 13, fontWeight: 700,
                }}>
                  {bk.name} {bk.odds}
                </div>
              ))}
            </div>
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
      background: '#f8fafc', borderRadius: 10, padding: '10px 8px',
      textAlign: 'center', border: '1px solid #e2e8f0',
    }}>
      <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>{label}</div>
      {isGauge ? (
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <svg width="52" height="52" viewBox="0 0 52 52">
            <circle cx="26" cy="26" r="20" fill="none" stroke="#e2e8f0" strokeWidth="6" />
            <circle
              cx="26" cy="26" r="20" fill="none"
              stroke={color} strokeWidth="6"
              strokeDasharray={`${(68 / 100) * 125.6} 125.6`}
              strokeLinecap="round"
              transform="rotate(-90 26 26)"
            />
            <text x="26" y="30" textAnchor="middle" fontSize="12" fontWeight="800" fill="#1a1a2e">{value}</text>
          </svg>
        </div>
      ) : isRisk ? (
        <div>
          <div style={{ fontSize: 18, marginBottom: 2 }}>🟡</div>
          <div style={{ fontSize: 12, fontWeight: 700, color }}>{value}</div>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color }}>{value}</div>
          {sub && <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 2 }}>{sub}</div>}
        </div>
      )}
    </div>
  )
}
