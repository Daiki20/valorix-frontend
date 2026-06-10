import { useState } from 'react'
import { CheckCircle, AlertTriangle, TrendingUp, Info } from 'lucide-react'

const ACCENT  = '#00cfff'
const BORDER  = 'rgba(0,180,255,0.12)'
const TEXT    = '#d8eeff'
const MUTED   = '#4a6a8a'
const CARD_BG = 'rgba(0,25,60,0.55)'
const DIM     = 'rgba(255,255,255,0.04)'

// Защита от объектов в строковых полях (старые форматы анализов)
const safeStr = (v) => {
  if (v === null || v === undefined) return ''
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}
const safeNum = (v, fallback = 0) => {
  const n = parseFloat(v)
  return isNaN(n) ? fallback : n
}

export default function AnalysisResult({ match, analysis, shareToken, isLive }) {
  const confidence = safeNum(analysis.confidence, 68)
  const circumference = 2 * Math.PI * 40
  const dash = (confidence / 100) * circumference

  const riskColor = { low: '#22c55e', medium: '#f59e0b', high: '#ef4444' }[analysis.risk?.toLowerCase()] || '#f59e0b'
  const riskLabel = { low: 'Низкий', medium: 'Средний', high: 'Высокий' }[analysis.risk?.toLowerCase()] || analysis.risk

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {shareToken && <ShareButton token={shareToken} match={match} />}

      {/* Match header */}
      <div className="card analysis-header" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
            <TeamCircle name={match.home} img={analysis.homeLogoTSDB || match.homeImg} size={44} />
            <div style={{ minWidth: 0 }}>
              <div className="analysis-header-team" style={{ fontWeight: 700, fontSize: 16, color: TEXT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{match.home}</div>
              <div style={{ fontSize: 11, color: MUTED }}>Хозяева</div>
            </div>
          </div>
          <div className="analysis-header-vs" style={{ textAlign: 'center', flexShrink: 0, padding: '0 4px' }}>
            <div style={{ fontSize: 10, color: MUTED, fontWeight: 600, whiteSpace: 'nowrap' }}>{match.league}</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: ACCENT, margin: '2px 0' }}>VS</div>
            <div style={{ fontSize: 10, color: MUTED, whiteSpace: 'nowrap' }}>{match.date}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0, justifyContent: 'flex-end' }}>
            <div style={{ textAlign: 'right', minWidth: 0 }}>
              <div className="analysis-header-team" style={{ fontWeight: 700, fontSize: 16, color: TEXT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{match.away}</div>
              <div style={{ fontSize: 11, color: MUTED }}>Гости</div>
            </div>
            <TeamCircle name={match.away} img={analysis.awayLogoTSDB || match.awayImg} size={44} />
          </div>
        </div>
      </div>

      {/* Verdict */}
      <div style={{
        padding: '20px 28px',
        background: 'rgba(34,197,94,0.08)',
        border: '1px solid rgba(34,197,94,0.2)',
        borderLeft: '4px solid #22c55e',
        borderRadius: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <CheckCircle size={20} color="#22c55e" />
          <span style={{ fontWeight: 800, fontSize: 17, color: '#5eff9e' }}>
            Вердикт AI: {safeStr(analysis.verdict)}
          </span>
        </div>
        <p style={{ fontSize: 14, color: '#a7f3c0', lineHeight: 1.7 }}>{safeStr(analysis.summary)}</p>
      </div>

      {/* Extra bets */}
      {analysis.extraBets && analysis.extraBets.length > 0 && (
        <div className="card" style={{ padding: '24px 28px' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: TEXT, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={18} color="#7b5ea7" />
            Дополнительные ставки
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {analysis.extraBets.map((bet, i) => {
              const isGreen  = bet.confidence >= 70
              const isYellow = bet.confidence >= 55 && bet.confidence < 70
              const color      = isGreen ? '#22c55e' : isYellow ? '#f59e0b' : MUTED
              const bg         = isGreen ? 'rgba(34,197,94,0.07)'  : isYellow ? 'rgba(245,158,11,0.07)'  : DIM
              const border     = isGreen ? 'rgba(34,197,94,0.2)'   : isYellow ? 'rgba(245,158,11,0.2)'   : BORDER
              const leftBorder = isGreen ? '#22c55e' : isYellow ? '#f59e0b' : BORDER
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: '14px 16px', background: bg, borderRadius: 12,
                  border: `1px solid ${border}`,
                  borderLeft: `4px solid ${leftBorder}`,
                }}>
                  <div style={{ flexShrink: 0, textAlign: 'center', minWidth: 48 }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color }}>{safeNum(bet.confidence)}%</div>
                    <div style={{ fontSize: 9, color: MUTED, fontWeight: 600 }}>уверен.</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: TEXT, marginBottom: 4 }}>{safeStr(bet.type)}</div>
                    <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.5 }}>{safeStr(bet.reason)}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="analysis-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {/* Confidence gauge */}
        <div className="card" style={{ padding: '20px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: MUTED, fontWeight: 600, marginBottom: 12 }}>ИНДЕКС ДОВЕРИЯ</div>
          <svg width="90" height="90" viewBox="0 0 90 90" style={{ display: 'block', margin: '0 auto' }}>
            <circle cx="45" cy="45" r="40" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="8" />
            <circle
              cx="45" cy="45" r="40" fill="none"
              stroke={confidence >= 70 ? '#22c55e' : confidence >= 50 ? '#f59e0b' : '#ef4444'}
              strokeWidth="8"
              strokeDasharray={`${dash} ${circumference}`}
              strokeLinecap="round"
              transform="rotate(-90 45 45)"
            />
            <text x="45" y="49" textAnchor="middle" fontSize="18" fontWeight="900" fill={TEXT}>{confidence}</text>
          </svg>
          <div style={{ fontSize: 12, color: MUTED, marginTop: 8 }}>из 100</div>
        </div>

        {/* Risk */}
        <div className="card" style={{ padding: '20px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: MUTED, fontWeight: 600, marginBottom: 12 }}>РИСК</div>
          <div style={{ fontSize: 32, marginBottom: 8 }}>
            {analysis.risk?.toLowerCase() === 'low' ? '🟢' : analysis.risk?.toLowerCase() === 'high' ? '🔴' : '🟡'}
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: riskColor }}>{riskLabel}</div>
          <div style={{ fontSize: 11, color: MUTED, marginTop: 4 }}>уровень риска</div>
        </div>

        {/* Odds */}
        <div className="card" style={{ padding: '20px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: MUTED, fontWeight: 600, marginBottom: 12 }}>FAIR ODDS</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: ACCENT, marginBottom: 4 }}>
            {analysis.fairOdds || '—'}
          </div>
          <div style={{ fontSize: 11, color: MUTED }}>Реальная вероятность</div>
          {analysis.bookOdds && !isLive && (
            <div style={{ marginTop: 8, fontSize: 12 }}>
              <span style={{ color: MUTED }}>Букмекер: </span>
              <span style={{ fontWeight: 700, color: TEXT }}>{analysis.bookOdds}</span>
            </div>
          )}
        </div>

        {/* Value */}
        <div className="card" style={{ padding: '20px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: MUTED, fontWeight: 600, marginBottom: 12 }}>VALUE</div>
          {isLive ? (
            <>
              <div style={{ fontSize: 22, marginBottom: 6 }}>🔴</div>
              <div style={{ fontSize: 11, color: MUTED, lineHeight: 1.4 }}>Лайв коэфы<br/>меняются</div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 28, fontWeight: 900, color: safeNum(analysis.value) > 0 ? '#22c55e' : '#ef4444', marginBottom: 4 }}>
                {safeNum(analysis.value) > 0 ? '+' : ''}{safeNum(analysis.value)}%
              </div>
              <div style={{ fontSize: 11, color: MUTED }}>
                {analysis.value > 5 ? 'Рекомендуем' : analysis.value > 0 ? 'Умеренно' : 'Не рекомендуем'}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Reasons */}
      <div className="card" style={{ padding: '24px 28px' }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: TEXT, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Info size={18} color={ACCENT} />
          Причины прогноза
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(analysis.reasons || []).map((reason, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: '12px 16px', background: DIM, borderRadius: 10,
              border: `1px solid ${BORDER}`,
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%', background: ACCENT,
                marginTop: 5, flexShrink: 0,
              }} />
              <span style={{ fontSize: 14, color: MUTED, lineHeight: 1.6 }}>{safeStr(reason)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Best odds */}
      {analysis.bestOdds && analysis.bestOdds.length > 0 && (
        <div className="card" style={{ padding: '24px 28px' }}>
          <div className="bk-odds-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 8, flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: TEXT, display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={18} color={ACCENT} />
              Коэффициенты букмекеров
            </h3>
            {analysis.bestOdds[0]?.real && (
              <span style={{
                background: 'rgba(34,197,94,0.1)', color: '#22c55e',
                border: '1px solid rgba(34,197,94,0.25)',
                borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700,
              }}>
                ✓ Реальные данные
              </span>
            )}
          </div>

          {analysis.bestOdds[0]?.real ? (
            <div style={{ overflowX: 'auto' }}>
              <div className="bk-odds-row" style={{
                display: 'grid', gridTemplateColumns: '1fr 60px 60px 60px',
                gap: 4, marginBottom: 6, padding: '0 8px', minWidth: 260,
              }}>
                {['БУКМЕКЕР','П1','X','П2'].map(h => (
                  <span key={h} style={{ fontSize: 11, color: MUTED, fontWeight: 600, textAlign: h !== 'БУКМЕКЕР' ? 'center' : 'left' }}>{h}</span>
                ))}
              </div>
              {analysis.bestOdds.map((bk, i) => (
                <div key={i} className="bk-odds-row" style={{
                  display: 'grid', gridTemplateColumns: '1fr 60px 60px 60px',
                  gap: 4, padding: '10px 8px', minWidth: 260,
                  background: i === 0
                    ? 'rgba(34,197,94,0.07)'
                    : i % 2 === 0 ? DIM : 'rgba(255,255,255,0.02)',
                  borderRadius: 8, marginBottom: 4,
                  border: i === 0 ? '1px solid rgba(34,197,94,0.2)' : '1px solid transparent',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {i === 0 && <span style={{ fontSize: 10, color: '#22c55e', fontWeight: 800 }}>★</span>}
                    <span style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>{bk.name}</span>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: ACCENT, textAlign: 'center' }}>{bk.odds}</span>
                  <span style={{ fontSize: 14, color: MUTED, textAlign: 'center' }}>{bk.draw || '—'}</span>
                  <span style={{ fontSize: 14, color: MUTED, textAlign: 'center' }}>{bk.away || '—'}</span>
                </div>
              ))}
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 12, color: MUTED, marginBottom: 10 }}>
                * Оценка AI — реальные данные недоступны для этого матча
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {analysis.bestOdds.map((bk, i) => (
                  <div key={i} style={{
                    background: [
                      'rgba(34,197,94,0.12)',
                      'rgba(245,158,11,0.12)',
                      'rgba(0,207,255,0.12)',
                    ][i % 3],
                    color: ['#22c55e','#f59e0b', ACCENT][i % 3],
                    border: `1px solid ${['rgba(34,197,94,0.3)','rgba(245,158,11,0.3)','rgba(0,207,255,0.3)'][i % 3]}`,
                    borderRadius: 24, padding: '8px 18px',
                    fontSize: 14, fontWeight: 700,
                  }}>
                    {bk.name} {bk.odds}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Data warning */}
      {analysis.dataWarning && analysis.dataWarning !== 'null' && (
        <div style={{
          background: 'rgba(234,88,12,0.08)', border: '1px solid rgba(234,88,12,0.25)',
          borderRadius: 12, padding: '14px 18px',
          display: 'flex', gap: 10, alignItems: 'flex-start',
        }}>
          <AlertTriangle size={16} color="#fb923c" style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 13, color: '#fbbf90', lineHeight: 1.5 }}>
            <strong>Неполные данные:</strong> {safeStr(analysis.dataWarning)}
          </span>
        </div>
      )}

      {/* Disclaimer */}
      <div style={{
        background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)',
        borderRadius: 12, padding: '14px 18px',
        display: 'flex', gap: 10, alignItems: 'center',
      }}>
        <AlertTriangle size={16} color="#f59e0b" />
        <span style={{ fontSize: 13, color: '#fcd87a' }}>
          Этот анализ носит информационный характер. Играйте ответственно. 18+
        </span>
      </div>
    </div>
  )
}

function ShareButton({ token, match }) {
  const [copied, setCopied] = useState(false)
  const url = `${window.location.origin}/share/${token}`

  function copy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div style={{
      display: 'flex', gap: 10, alignItems: 'center',
      padding: '12px 16px', borderRadius: 12,
      background: 'rgba(0,207,255,0.06)',
      border: '1px solid rgba(0,207,255,0.15)',
    }}>
      <span style={{ fontSize: 13, color: MUTED, flex: 1 }}>Поделись анализом с другом</span>
      <button onClick={copy} style={{
        padding: '8px 16px',
        background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(0,207,255,0.12)',
        color: copied ? '#22c55e' : '#00cfff',
        border: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : 'rgba(0,207,255,0.25)'}`,
        borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer',
        transition: 'all 0.2s',
      }}>
        {copied ? '✓ Скопировано' : 'Копировать ссылку'}
      </button>
    </div>
  )
}

function TeamCircle({ name, img, size = 52 }) {
  const [imgError, setImgError] = useState(false)
  const colors = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899']
  const color = colors[(name || ' ').charCodeAt(0) % colors.length]
  if (img && !imgError) {
    return (
      <img
        src={img} alt={name}
        width={size} height={size}
        style={{ borderRadius: '50%', objectFit: 'contain', flexShrink: 0, background: 'rgba(0,25,60,0.4)' }}
        onError={() => setImgError(true)}
      />
    )
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: color, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 800, color: 'white',
    }}>
      {(name || '?')[0]}
    </div>
  )
}
