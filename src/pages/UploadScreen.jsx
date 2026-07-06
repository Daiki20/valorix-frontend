import { useState, useRef, useEffect } from 'react'
import { ArrowLeft, Upload, X, Zap, AlertCircle, Lock } from 'lucide-react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import AnalysisResult from '../components/AnalysisResult'
import AuthModal from '../components/AuthModal'
import { analyzeScreenshot } from '../api/sportsApi'
import { coinsApi } from '../api/authApi'
import { useAuth } from '../context/AuthContext'

const ANALYSIS_COST = 46
const DISCLAIMER_KEY = 'valorix_screenshot_disclaimer_seen'

const DISCLAIMER_STYLES = `
  @keyframes discPopIn {
    from { transform: scale(0.92) translateY(16px); opacity: 0; }
    to   { transform: scale(1) translateY(0); opacity: 1; }
  }
  @keyframes discFadeIn { from { opacity: 0; } to { opacity: 1; } }
  .disc-overlay {
    position: fixed; inset: 0; z-index: 600;
    background: rgba(0,0,0,0.75);
    display: flex; align-items: center; justify-content: center;
    padding: 16px;
    animation: discFadeIn 0.2s ease;
  }
  .disc-card {
    width: 100%; max-width: 480px;
    background: linear-gradient(145deg, #0d1b6e 0%, #0a1250 60%, #0c1870 100%);
    border-radius: 20px;
    border: 1px solid rgba(100,140,255,0.25);
    overflow: hidden;
    animation: discPopIn 0.35s cubic-bezier(0.34,1.56,0.64,1);
  }
  .disc-top {
    padding: 28px 28px 0;
    display: flex; align-items: center; gap: 16px;
  }
  .disc-icon {
    width: 56px; height: 56px; border-radius: 14px;
    background: #f5c000;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .disc-title { font-size: 22px; font-weight: 700; color: #fff; line-height: 1.2; }
  .disc-title span { color: #5b8aff; }
  .disc-sub { font-size: 11px; font-weight: 600; color: #4a6a9a; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 3px; }
  .disc-body { padding: 20px 28px 24px; display: flex; flex-direction: column; gap: 14px; }
  .disc-section {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(100,140,255,0.15);
    border-radius: 14px; padding: 16px;
  }
  .disc-section-label {
    font-size: 11px; font-weight: 700; color: #5b8aff;
    letter-spacing: 1.5px; text-transform: uppercase; text-align: center; margin-bottom: 12px;
  }
  .disc-tags { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
  .disc-tag {
    padding: 6px 18px; border-radius: 30px; font-size: 13px;
    font-weight: 700; border: 2px solid;
  }
  .disc-tag-soccer  { color: #00e676; border-color: #00e676; background: rgba(0,230,118,0.08); }
  .disc-tag-hockey  { color: #5b8aff; border-color: #5b8aff; background: rgba(91,138,255,0.08); }
  .disc-tag-dota    { color: #ff4d6d; border-color: #ff4d6d; background: rgba(255,77,109,0.08); }
  .disc-tag-cs      { color: #ff9f43; border-color: #ff9f43; background: rgba(255,159,67,0.08); }
  .disc-warn {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(100,140,255,0.15);
    border-radius: 14px; padding: 16px;
    font-size: 13px; color: #8a9ec0; line-height: 1.65;
  }
  .disc-btns { display: flex; gap: 10px; }
  .disc-btn-cancel {
    flex: 1; padding: 14px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(100,140,255,0.2);
    border-radius: 12px; color: #4a6a9a;
    font-size: 14px; font-weight: 600; cursor: pointer;
  }
  .disc-btn-ok {
    flex: 2; padding: 14px;
    background: linear-gradient(90deg, #1246ff, #3a6fff);
    border: none; border-radius: 12px; color: #fff;
    font-size: 14px; font-weight: 700; cursor: pointer;
    box-shadow: 0 4px 20px rgba(18,70,255,0.4);
  }
`

function ScreenshotDisclaimer({ onConfirm, onCancel }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: DISCLAIMER_STYLES }} />
      <div className="disc-overlay">
        <div className="disc-card">
          <div className="disc-top">
            <div className="disc-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <div>
              <div className="disc-title">Анализ по <span>скриншоту</span></div>
              <div className="disc-sub">Ознакомьтесь перед использованием</div>
            </div>
          </div>
          <div className="disc-body">
            <div className="disc-section">
              <div className="disc-section-label">Лучшая точность</div>
              <div className="disc-tags">
                <span className="disc-tag disc-tag-soccer">⚽ Футбол</span>
                <span className="disc-tag disc-tag-hockey">🏒 Хоккей</span>
                <span className="disc-tag disc-tag-dota">🐉 Dota 2</span>
                <span className="disc-tag disc-tag-cs">🎮 CS2</span>
              </div>
            </div>
            <div className="disc-warn">
              Для других видов спорта (теннис, баскетбол и др.) ИИ может выдавать{' '}
              <span style={{ color: '#ff4d6d', fontWeight: 600 }}>неточные или некорректные результаты.</span>{' '}
              Valorix не несёт ответственности за решения, принятые на основе таких анализов.
            </div>
            <div className="disc-btns">
              <button className="disc-btn-cancel" onClick={onCancel}>Отмена</button>
              <button className="disc-btn-ok" onClick={onConfirm}>Понятно, продолжить</button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default function UploadScreen() {
  const { user, updateCoins } = useAuth()
  const [showDisclaimer, setShowDisclaimer] = useState(() => !localStorage.getItem(DISCLAIMER_KEY))
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [locked, setLocked] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [payLoading, setPayLoading] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const pendingResult = useRef(null)
  const [revealedResult, setRevealedResult] = useState(null)
  const inputRef = useRef()

  function handleFile(f) {
    if (!f || !f.type.startsWith('image/')) return
    setFile(f)
    pendingResult.current = null
    setLocked(false)
    setRevealed(false)
    setRevealedResult(null)
    setError(null)
    const reader = new FileReader()
    reader.onload = e => setPreview(e.target.result)
    reader.readAsDataURL(f)
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  async function handleAnalyze() {
    if (!file || !preview) return
    if (!user) { setShowAuth(true); return }
    setLoading(true)
    setError(null)
    try {
      const res = await analyzeScreenshot(preview)
      pendingResult.current = res
      setLocked(true)
    } catch (err) {
      setError(`Ошибка: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirmPayment() {
    if (!user) { setShowAuth(true); return }
    if (user.coins < ANALYSIS_COST) {
      setError(`Недостаточно монет. Нужно ${ANALYSIS_COST}, у вас ${user.coins}.`)
      return
    }
    setPayLoading(true)
    setError(null)
    const res = pendingResult.current
    const firstMatch = res?.matches?.[0]
    try {
      const data = await coinsApi.spend({
        amount: ANALYSIS_COST,
        matchHome: firstMatch?.home || 'Скриншот',
        matchAway: firstMatch?.away || '',
        league: firstMatch?.league || '',
        sport: res?.game || 'football',
        result: res,
      })
      updateCoins(data.coins)
      setRevealedResult(pendingResult.current)
      pendingResult.current = null
      setLocked(false)
      setRevealed(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setPayLoading(false)
    }
  }

  function handleDisclaimerConfirm() {
    localStorage.setItem(DISCLAIMER_KEY, '1')
    setShowDisclaimer(false)
  }

  function handleDisclaimerCancel() {
    window.history.back()
  }

  return (
    <div style={{ minHeight: '100vh', background: '#07090f' }}>
      {showDisclaimer && <ScreenshotDisclaimer onConfirm={handleDisclaimerConfirm} onCancel={handleDisclaimerCancel} />}
      <Navbar />
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px' }}>
        <Link to="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          color: '#64748b', fontSize: 14, fontWeight: 600, marginBottom: 24,
          textDecoration: 'none',
        }}>
          <ArrowLeft size={16} /> На главную
        </Link>

        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: '#dde4ee', letterSpacing: -0.5, marginBottom: 8 }}>
            Загрузить скрин линии
          </h1>
          <p style={{ color: '#64748b', fontSize: 15 }}>
            Сделай скриншот линии у букмекера — AI проанализирует коэффициенты и найдёт Value
          </p>
        </div>

        {/* Drop zone */}
        {!preview ? (
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current.click()}
            className="upload-dropzone"
            style={{
              border: `2px dashed ${dragging ? '#00cfff' : 'rgba(0,180,255,0.2)'}`,
              borderRadius: 16, padding: '64px 32px',
              textAlign: 'center', cursor: 'pointer',
              background: dragging ? 'rgba(0,207,255,0.07)' : 'rgba(0,15,40,0.4)',
              transition: 'all 0.2s',
            }}
          >
            <input ref={inputRef} type="file" accept="image/*"
              style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'rgba(0,207,255,0.08)', margin: '0 auto 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Upload size={32} color="#00cfff" />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#dde4ee', marginBottom: 8 }}>
              Перетащи скриншот сюда
            </h3>
            <p style={{ color: '#94a3b8', fontSize: 14 }}>
              или нажми для выбора файла · PNG, JPG, WEBP
            </p>
          </div>
        ) : (
          <div className="card" style={{ padding: 20 }}>
            {/* Preview image */}
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <img src={preview} alt="preview"
                style={{ width: '100%', borderRadius: 10, maxHeight: 400, objectFit: 'contain', background: 'rgba(255,255,255,0.04)' }} />
              {!loading && !locked && !revealed && (
                <button
                  onClick={() => { setFile(null); setPreview(null); setError(null) }}
                  style={{
                    position: 'absolute', top: 8, right: 8,
                    background: 'rgba(0,0,0,0.6)', border: 'none',
                    borderRadius: '50%', width: 32, height: 32,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  }}
                >
                  <X size={16} color="white" />
                </button>
              )}
            </div>

            {/* Analyze button */}
            {!loading && !locked && !revealed && (
              <button onClick={handleAnalyze} className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', fontSize: 15, padding: '14px' }}>
                <Zap size={18} fill="white" />
                Анализировать скрин ({ANALYSIS_COST} монет)
              </button>
            )}

            {loading && <AnalysisSteps />}

            {error && (
              <div style={{
                background: 'rgba(220,38,38,0.08)', border: '1px solid #fecaca', borderRadius: 10,
                padding: '14px 18px', display: 'flex', gap: 10, alignItems: 'center', marginTop: 12,
              }}>
                <AlertCircle size={18} color="#ef4444" />
                <span style={{ fontSize: 13, color: '#dc2626' }}>{error}</span>
              </div>
            )}

            {/* Locked result */}
            {locked && !revealed && (
              <LockedResult
                cost={ANALYSIS_COST}
                userCoins={user?.coins ?? 0}
                loading={payLoading}
                onConfirm={handleConfirmPayment}
              />
            )}

            {/* Revealed result */}
            {revealed && revealedResult && revealedResult.matches?.map((m, i) => (
              <div key={i}>
                {revealedResult.matches.length > 1 && (
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', marginBottom: 8, marginTop: i > 0 ? 20 : 0 }}>
                    Матч {i + 1} из {revealedResult.matches.length}
                  </div>
                )}
                <AnalysisResult
                  match={{
                    home: m.home, away: m.away,
                    league: m.league || '',
                    date: m.minute ? `Лайв · ${m.minute}'` : 'Предстоящий матч',
                  }}
                  analysis={m}
                />
              </div>
            ))}
          </div>
        )}

        {/* Example screenshot */}
        {!preview && (
          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 10, letterSpacing: 0.5 }}>
              ПРИМЕР ПОДХОДЯЩЕГО СКРИНА:
            </div>
            <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(0,207,255,0.15)', cursor: 'pointer' }}
              onClick={() => inputRef.current.click()}>
              <img
                src="/draft-example.jpg"
                alt="Пример скрина"
                style={{ width: '100%', display: 'block' }}
              />
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                background: 'linear-gradient(to top, rgba(7,9,15,0.95) 0%, transparent 100%)',
                padding: '24px 16px 14px',
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#dde4ee', marginBottom: 3 }}>
                  Скрин с командами и коэффициентами
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>
                  Valorix распознает матч и проведёт полный AI-анализ с вердиктом и дополнительными ставками
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Советы для лучшего результата:</div>
          {[
            'Работает с лайв-скринами (счёт + время) и предматчевой линией',
            'Команды могут быть на любом языке — AI их распознает',
            'Поддерживаются: BetBoom, Fonbet, Winline, 1xbet, Betcity и другие',
          ].map((tip, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: '#64748b' }}>
              <span style={{ color: '#00cfff', fontWeight: 700 }}>→</span>
              {tip}
            </div>
          ))}
        </div>
      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  )
}

function LockedResult({ cost, userCoins, loading, onConfirm }) {
  const notEnough = userCoins < cost
  return (
    <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', marginTop: 16 }}>
      {/* Blurred fake content */}
      <div style={{ filter: 'blur(7px)', pointerEvents: 'none', userSelect: 'none' }}>
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 20, marginBottom: 10 }}>
          {[80, 60, 90, 50, 70].map((w, i) => (
            <div key={i} style={{ height: 14, background: 'rgba(0,207,255,0.1)', borderRadius: 6, marginBottom: 10, width: `${w}%` }} />
          ))}
        </div>
        <div style={{ background: 'rgba(0,207,255,0.08)', borderRadius: 12, padding: 20 }}>
          {[100, 75, 85].map((w, i) => (
            <div key={i} style={{ height: 16, background: '#bfdbfe', borderRadius: 6, marginBottom: 10, width: `${w}%` }} />
          ))}
        </div>
      </div>

      {/* Overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(15, 20, 40, 0.55)',
        backdropFilter: 'blur(2px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}>
        <div style={{
          background: '#0c0f18', borderRadius: 20,
          padding: '32px 36px', maxWidth: 360, width: '100%',
          textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            background: 'rgba(0,207,255,0.08)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <Lock size={26} color="#00cfff" />
          </div>

          <div style={{ fontWeight: 800, fontSize: 18, color: '#dde4ee', marginBottom: 6 }}>
            Анализ готов
          </div>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
            Подтвердите оплату чтобы увидеть результат
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 16px',
            marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 14, color: '#64748b' }}>Стоимость</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: 16, color: '#dde4ee' }}>
              <Zap size={15} color="#00cfff" fill="#00cfff" />
              {cost} монет
            </div>
          </div>

          {notEnough && (
            <div style={{
              background: 'rgba(220,38,38,0.08)', border: '1px solid #fecaca',
              borderRadius: 8, padding: '9px 12px',
              fontSize: 13, color: '#dc2626', marginBottom: 14,
            }}>
              Недостаточно монет. У вас {userCoins}, нужно {cost}.
            </div>
          )}

          <button
            onClick={onConfirm}
            disabled={loading || notEnough}
            style={{
              width: '100%', padding: '13px',
              background: loading || notEnough ? 'rgba(0,207,255,0.2)' : 'linear-gradient(90deg, #00cfff, #7b5ea7)',
              color: loading || notEnough ? 'rgba(255,255,255,0.4)' : '#030b18',
              border: 'none', borderRadius: 10,
              fontWeight: 800, fontSize: 14,
              cursor: loading || notEnough ? 'not-allowed' : 'pointer',
              letterSpacing: 0.3,
              boxShadow: loading || notEnough ? 'none' : '0 4px 20px rgba(0,207,255,0.3)',
            }}
          >
            {loading ? 'Обработка...' : `ПОДТВЕРДИТЬ ОПЛАТУ ${cost} МОНЕТ`}
          </button>

          <div style={{ marginTop: 10, fontSize: 12, color: '#94a3b8' }}>
            Баланс: {userCoins} монет
          </div>
        </div>
      </div>
    </div>
  )
}

function AnalysisSteps() {
  const steps = [
    'Читаю скриншот, распознаю команды...',
    'Ищу команды в базе данных...',
    'Загружаю статистику и историю встреч...',
    'AI проводит глубокий анализ...',
    'Формирую вердикт...',
  ]
  const [step, setStep] = useState(0)

  useEffect(() => {
    const timings = [1500, 3000, 5000, 8000]
    const timers = timings.map((t, i) => setTimeout(() => setStep(i + 1), t))
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div style={{ padding: '24px 0' }}>
      <div className="thinking-dots" style={{ fontSize: 20, textAlign: 'center', marginBottom: 20 }}>
        <span>●</span><span> ●</span><span> ●</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {steps.map((s, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px', borderRadius: 8,
            background: i <= step ? 'rgba(0,207,255,0.07)' : 'rgba(0,15,40,0.4)',
            border: `1px solid ${i <= step ? 'rgba(0,207,255,0.3)' : 'rgba(0,180,255,0.1)'}`,
            transition: 'all 0.3s',
          }}>
            <div style={{
              width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
              background: i < step ? '#00cfff' : i === step ? 'rgba(0,207,255,0.4)' : 'rgba(0,180,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, color: 'white', fontWeight: 700,
            }}>
              {i < step ? '✓' : i + 1}
            </div>
            <span style={{ fontSize: 13, color: i <= step ? '#1e40af' : '#94a3b8', fontWeight: i === step ? 600 : 400 }}>
              {s}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
