import { useState } from 'react'
import { X, Search, Upload, Zap, ArrowRight } from 'lucide-react'

const STEPS = [
  {
    icon: <Zap size={32} color="#2563eb" fill="#2563eb" />,
    title: 'Добро пожаловать в Valorix AI! 🎉',
    desc: 'Вам начислено 38 монет. Это ваш стартовый баланс для первых анализов. Расскажем как всё работает.',
    hint: null,
  },
  {
    icon: <Search size={32} color="#2563eb" />,
    title: 'Выбирайте матч из списка',
    desc: 'Перейдите в "Анализ матча" — там загрузятся предстоящие матчи из топ-лиг. Выберите любой.',
    hint: '19 монет за один анализ',
  },
  {
    icon: <Upload size={32} color="#7c3aed" />,
    title: 'Или загрузите скриншот',
    desc: 'Сделайте скрин линии у любого букмекера — AI сам распознает команды и выдаст вердикт.',
    hint: 'Поддерживаются лайв-матчи',
  },
  {
    icon: <Zap size={32} color="#16a34a" fill="#16a34a" />,
    title: 'Пополняйте монеты',
    desc: 'Монеты можно купить в любое время через кнопку с балансом в навбаре. Оплата через ЮКасса.',
    hint: '1 монета = 1 рубль',
  },
]

export default function Onboarding({ onClose }) {
  const [step, setStep] = useState(0)
  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  function finish() {
    localStorage.setItem('valorix_onboarded', '1')
    onClose()
  }

  return (
    <>
      <div onClick={finish} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
        zIndex: 300, backdropFilter: 'blur(6px)',
      }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        zIndex: 301, width: '100%', maxWidth: 440, padding: '0 16px',
      }}>
        <div className="card" style={{ padding: '40px 36px', position: 'relative', overflow: 'hidden' }}>
          {/* Progress bar */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,0.04)' }}>
            <div style={{
              height: '100%', background: 'linear-gradient(90deg, #2563eb, #7c3aed)',
              width: `${((step + 1) / STEPS.length) * 100}%`,
              transition: 'width 0.4s ease', borderRadius: '0 3px 3px 0',
            }} />
          </div>

          <button onClick={finish} style={{
            position: 'absolute', top: 14, right: 14,
            background: 'rgba(255,255,255,0.04)', border: 'none', borderRadius: '50%',
            width: 30, height: 30, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <X size={14} color="#64748b" />
          </button>

          {/* Step indicator */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
            {STEPS.map((_, i) => (
              <div key={i} style={{
                height: 4, flex: 1, borderRadius: 2,
                background: i <= step ? '#2563eb' : '#e2e8f0',
                transition: 'background 0.3s',
              }} />
            ))}
          </div>

          {/* Icon */}
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: 'linear-gradient(135deg, #eff6ff, #e0e7ff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 24, boxShadow: '0 4px 16px rgba(37,99,235,0.15)',
          }}>
            {current.icon}
          </div>

          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#dde4ee', marginBottom: 12, lineHeight: 1.3 }}>
            {current.title}
          </h2>
          <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.75, marginBottom: 24 }}>
            {current.desc}
          </p>

          {current.hint && (
            <div style={{
              background: 'rgba(163,255,78,0.08)', borderRadius: 10, padding: '10px 14px',
              fontSize: 13, color: '#2563eb', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24,
            }}>
              <Zap size={14} fill="#2563eb" color="#2563eb" />
              {current.hint}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)} style={{
                flex: 1, padding: '12px', border: '1.5px solid rgba(255,255,255,0.07)',
                borderRadius: 10, background: '#0c0f18', cursor: 'pointer',
                fontSize: 14, fontWeight: 600, color: '#64748b',
              }}>
                Назад
              </button>
            )}
            <button
              onClick={isLast ? finish : () => setStep(s => s + 1)}
              style={{
                flex: 2, padding: '12px',
                background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
                border: 'none', borderRadius: 10, cursor: 'pointer',
                fontSize: 14, fontWeight: 700, color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 4px 16px rgba(26,26,46,0.3)',
              }}
            >
              {isLast ? 'Начать!' : 'Далее'}
              {!isLast && <ArrowRight size={16} />}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
