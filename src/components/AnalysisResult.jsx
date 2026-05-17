import { CheckCircle, AlertTriangle, TrendingUp, Info } from 'lucide-react'

export default function AnalysisResult({ match, analysis }) {
  const confidence = analysis.confidence || 68
  const circumference = 2 * Math.PI * 40
  const dash = (confidence / 100) * circumference

  const riskColor = { low: '#22c55e', medium: '#f59e0b', high: '#ef4444' }[analysis.risk?.toLowerCase()] || '#f59e0b'
  const riskLabel = { low: 'Низкий', medium: 'Средний', high: 'Высокий' }[analysis.risk?.toLowerCase()] || analysis.risk

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Match header */}
      <div className="card analysis-header" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
            <TeamCircle name={match.home} size={44} />
            <div style={{ minWidth: 0 }}>
              <div className="analysis-header-team" style={{ fontWeight: 700, fontSize: 16, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{match.home}</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Хозяева</div>
            </div>
          </div>
          <div className="analysis-header-vs" style={{ textAlign: 'center', flexShrink: 0, padding: '0 4px' }}>
            <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, whiteSpace: 'nowrap' }}>{match.league}</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#1a1a2e', margin: '2px 0' }}>VS</div>
            <div style={{ fontSize: 10, color: '#94a3b8', whiteSpace: 'nowrap' }}>{match.date}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0, justifyContent: 'flex-end' }}>
            <div style={{ textAlign: 'right', minWidth: 0 }}>
              <div className="analysis-header-team" style={{ fontWeight: 700, fontSize: 16, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{match.away}</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Гости</div>
            </div>
            <TeamCircle name={match.away} size={44} />
          </div>
        </div>
      </div>

      {/* Verdict */}
      <div className="card" style={{ padding: '20px 28px', borderLeft: '4px solid #22c55e' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <CheckCircle size={20} color="#22c55e" />
          <span style={{ fontWeight: 800, fontSize: 17, color: '#1a1a2e' }}>
            Вердикт AI: {analysis.verdict}
          </span>
        </div>
        <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7 }}>{analysis.summary}</p>
      </div>

      {/* Stats row */}
      <div className="analysis-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {/* Confidence gauge */}
        <div className="card" style={{ padding: '20px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginBottom: 12 }}>ИНДЕКС ДОВЕРИЯ</div>
          <svg width="90" height="90" viewBox="0 0 90 90" style={{ display: 'block', margin: '0 auto' }}>
            <circle cx="45" cy="45" r="40" fill="none" stroke="#e2e8f0" strokeWidth="8" />
            <circle
              cx="45" cy="45" r="40" fill="none"
              stroke={confidence >= 70 ? '#22c55e' : confidence >= 50 ? '#f59e0b' : '#ef4444'}
              strokeWidth="8"
              strokeDasharray={`${dash} ${circumference}`}
              strokeLinecap="round"
              transform="rotate(-90 45 45)"
            />
            <text x="45" y="49" textAnchor="middle" fontSize="18" fontWeight="900" fill="#1a1a2e">{confidence}</text>
          </svg>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>из 100</div>
        </div>

        {/* Risk */}
        <div className="card" style={{ padding: '20px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginBottom: 12 }}>РИСК</div>
          <div style={{ fontSize: 32, marginBottom: 8 }}>
            {analysis.risk?.toLowerCase() === 'low' ? '🟢' : analysis.risk?.toLowerCase() === 'high' ? '🔴' : '🟡'}
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: riskColor }}>{riskLabel}</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>уровень риска</div>
        </div>

        {/* Odds */}
        <div className="card" style={{ padding: '20px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginBottom: 12 }}>FAIR ODDS</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#1a1a2e', marginBottom: 4 }}>
            {analysis.fairOdds || '—'}
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>Реальная вероятность</div>
          {analysis.bookOdds && (
            <div style={{ marginTop: 8, fontSize: 12 }}>
              <span style={{ color: '#64748b' }}>Букмекер: </span>
              <span style={{ fontWeight: 700, color: '#1a1a2e' }}>{analysis.bookOdds}</span>
            </div>
          )}
        </div>

        {/* Value */}
        <div className="card" style={{ padding: '20px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginBottom: 12 }}>VALUE</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: analysis.value > 0 ? '#22c55e' : '#ef4444', marginBottom: 4 }}>
            {analysis.value > 0 ? '+' : ''}{analysis.value}%
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>
            {analysis.value > 5 ? 'Рекомендуем' : analysis.value > 0 ? 'Умеренно' : 'Не рекомендуем'}
          </div>
        </div>
      </div>

      {/* Extra bets */}
      {analysis.extraBets && analysis.extraBets.length > 0 && (
        <div className="card" style={{ padding: '24px 28px' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={18} color="#7c3aed" />
            Дополнительные ставки
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {analysis.extraBets.map((bet, i) => {
              const color = bet.confidence >= 70 ? '#22c55e' : bet.confidence >= 55 ? '#f59e0b' : '#94a3b8'
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: '14px 16px', background: '#f8fafc', borderRadius: 12,
                  border: '1px solid #e2e8f0',
                }}>
                  <div style={{ flexShrink: 0, textAlign: 'center', minWidth: 48 }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color }}>{bet.confidence}%</div>
                    <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600 }}>уверен.</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e', marginBottom: 4 }}>{bet.type}</div>
                    <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>{bet.reason}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Reasons */}
      <div className="card" style={{ padding: '24px 28px' }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Info size={18} color="#2563eb" />
          Причины прогноза
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(analysis.reasons || []).map((reason, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: '12px 16px', background: '#f8fafc', borderRadius: 10,
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%', background: '#2563eb',
                marginTop: 5, flexShrink: 0,
              }} />
              <span style={{ fontSize: 14, color: '#374151', lineHeight: 1.6 }}>{reason}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Best odds */}
      {analysis.bestOdds && analysis.bestOdds.length > 0 && (
        <div className="card" style={{ padding: '24px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e', display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={18} color="#2563eb" />
              Коэффициенты букмекеров
            </h3>
            {analysis.bestOdds[0]?.real && (
              <span style={{
                background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0',
                borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700,
              }}>
                ✓ Реальные данные
              </span>
            )}
          </div>

          {analysis.bestOdds[0]?.real ? (
            // Real bookmaker data — show table
            <div>
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 60px 60px 60px',
                gap: 4, marginBottom: 6, padding: '0 8px',
              }}>
                <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>БУКМЕКЕР</span>
                <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textAlign: 'center' }}>П1</span>
                <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textAlign: 'center' }}>X</span>
                <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textAlign: 'center' }}>П2</span>
              </div>
              {analysis.bestOdds.map((bk, i) => (
                <div key={i} style={{
                  display: 'grid', gridTemplateColumns: '1fr 60px 60px 60px',
                  gap: 4, padding: '10px 8px',
                  background: i === 0 ? '#f0fdf4' : i % 2 === 0 ? '#f8fafc' : 'white',
                  borderRadius: 8, marginBottom: 4,
                  border: i === 0 ? '1px solid #bbf7d0' : '1px solid transparent',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {i === 0 && <span style={{ fontSize: 10, color: '#16a34a', fontWeight: 800 }}>★</span>}
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e' }}>{bk.name}</span>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e', textAlign: 'center' }}>{bk.odds}</span>
                  <span style={{ fontSize: 14, color: '#64748b', textAlign: 'center' }}>{bk.draw || '—'}</span>
                  <span style={{ fontSize: 14, color: '#64748b', textAlign: 'center' }}>{bk.away || '—'}</span>
                </div>
              ))}
            </div>
          ) : (
            // AI-estimated (no real data available)
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 10 }}>
                * Оценка AI — реальные данные недоступны для этого матча
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {analysis.bestOdds.map((bk, i) => (
                  <div key={i} style={{
                    background: ['#ef4444', '#f59e0b', '#3b82f6'][i % 3],
                    color: 'white', borderRadius: 24,
                    padding: '8px 18px', fontSize: 14, fontWeight: 700,
                  }}>
                    {bk.name} {bk.odds}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Warning */}
      <div style={{
        background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12,
        padding: '14px 18px', display: 'flex', gap: 10, alignItems: 'center',
      }}>
        <AlertTriangle size={16} color="#d97706" />
        <span style={{ fontSize: 13, color: '#92400e' }}>
          Этот анализ носит информационный характер. Играйте ответственно. 18+
        </span>
      </div>
    </div>
  )
}

function TeamCircle({ name, size = 52 }) {
  const colors = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899']
  const color = colors[name.charCodeAt(0) % colors.length]
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: color, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 800, color: 'white',
    }}>
      {name[0]}
    </div>
  )
}
