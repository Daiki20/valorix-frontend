import { useState, useRef } from 'react'
import { ArrowLeft, Upload, X, Zap, AlertCircle, Lock } from 'lucide-react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import AnalysisResult from '../components/AnalysisResult'
import AuthModal from '../components/AuthModal'
import { analyzeScreenshot } from '../api/sportsApi'
import { coinsApi } from '../api/authApi'
import { useAuth } from '../context/AuthContext'

const ANALYSIS_COST = 28

export default function UploadScreen() {
  const { user, updateCoins } = useAuth()
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

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5' }}>
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
          <h1 style={{ fontSize: 32, fontWeight: 900, color: '#1a1a2e', letterSpacing: -0.5, marginBottom: 8 }}>
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
            style={{
              border: `2px dashed ${dragging ? '#2563eb' : '#cbd5e1'}`,
              borderRadius: 16, padding: '64px 32px',
              textAlign: 'center', cursor: 'pointer',
              background: dragging ? '#eff6ff' : 'white',
              transition: 'all 0.2s',
            }}
          >
            <input ref={inputRef} type="file" accept="image/*"
              style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: '#eff6ff', margin: '0 auto 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Upload size={32} color="#2563eb" />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a2e', marginBottom: 8 }}>
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
                style={{ width: '100%', borderRadius: 10, maxHeight: 400, objectFit: 'contain', background: '#f8fafc' }} />
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
                background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10,
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

        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Советы для лучшего результата:</div>
          {[
            'Работает с лайв-скринами (счёт + время) и предматчевой линией',
            'Команды могут быть на любом языке — AI их распознает',
            'Поддерживаются: BetBoom, Fonbet, Winline, 1xbet, Betcity и другие',
          ].map((tip, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: '#64748b' }}>
              <span style={{ color: '#2563eb', fontWeight: 700 }}>→</span>
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
        <div style={{ background: '#f8fafc', borderRadius: 12, padding: 20, marginBottom: 10 }}>
          {[80, 60, 90, 50, 70].map((w, i) => (
            <div key={i} style={{ height: 14, background: '#e2e8f0', borderRadius: 6, marginBottom: 10, width: `${w}%` }} />
          ))}
        </div>
        <div style={{ background: '#eff6ff', borderRadius: 12, padding: 20 }}>
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
          background: 'white', borderRadius: 20,
          padding: '32px 36px', maxWidth: 360, width: '100%',
          textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            background: '#eff6ff', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <Lock size={26} color="#2563eb" />
          </div>

          <div style={{ fontWeight: 800, fontSize: 18, color: '#1a1a2e', marginBottom: 6 }}>
            Анализ готов
          </div>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
            Подтвердите оплату чтобы увидеть результат
          </div>

          <div style={{
            background: '#f8fafc', borderRadius: 10, padding: '10px 16px',
            marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 14, color: '#64748b' }}>Стоимость</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: 16, color: '#1a1a2e' }}>
              <Zap size={15} color="#2563eb" fill="#2563eb" />
              {cost} монет
            </div>
          </div>

          {notEnough && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca',
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
              background: loading || notEnough ? '#94a3b8' : '#2563eb',
              color: 'white', border: 'none', borderRadius: 10,
              fontWeight: 800, fontSize: 14,
              cursor: loading || notEnough ? 'not-allowed' : 'pointer',
              letterSpacing: 0.3,
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

  useState(() => {
    const timings = [1500, 3000, 5000, 8000]
    const timers = timings.map((t, i) => setTimeout(() => setStep(i + 1), t))
    return () => timers.forEach(clearTimeout)
  })

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
            background: i <= step ? '#eff6ff' : '#f8fafc',
            border: `1px solid ${i <= step ? '#bfdbfe' : '#e2e8f0'}`,
            transition: 'all 0.3s',
          }}>
            <div style={{
              width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
              background: i < step ? '#2563eb' : i === step ? '#93c5fd' : '#e2e8f0',
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
