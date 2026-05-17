import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const show = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random()
    setToasts(t => [...t, { id, message, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), duration)
  }, [])

  const success = useCallback((msg) => show(msg, 'success'), [show])
  const error = useCallback((msg) => show(msg, 'error'), [show])
  const info = useCallback((msg) => show(msg, 'info'), [show])

  return (
    <ToastContext.Provider value={{ show, success, error, info }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={id => setToasts(t => t.filter(x => x.id !== id))} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}

function ToastContainer({ toasts, onRemove }) {
  if (!toasts.length) return null
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24,
      display: 'flex', flexDirection: 'column', gap: 10,
      zIndex: 9999, pointerEvents: 'none',
    }}>
      {toasts.map(t => <Toast key={t.id} toast={t} onRemove={onRemove} />)}
    </div>
  )
}

const STYLES = {
  success: { bg: '#f0fdf4', border: '#86efac', icon: '✓', iconBg: '#16a34a', text: '#15803d' },
  error:   { bg: '#fef2f2', border: '#fca5a5', icon: '✕', iconBg: '#dc2626', text: '#b91c1c' },
  info:    { bg: '#eff6ff', border: '#93c5fd', icon: '⚡', iconBg: '#2563eb', text: '#1d4ed8' },
}

function Toast({ toast, onRemove }) {
  const st = STYLES[toast.type] || STYLES.info
  return (
    <div
      onClick={() => onRemove(toast.id)}
      style={{
        pointerEvents: 'all', cursor: 'pointer',
        background: st.bg, border: `1.5px solid ${st.border}`,
        borderRadius: 14, padding: '12px 16px',
        display: 'flex', alignItems: 'center', gap: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        minWidth: 280, maxWidth: 360,
        animation: 'toastIn 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards',
      }}
    >
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        background: st.iconBg, color: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 700, flexShrink: 0,
      }}>
        {st.icon}
      </div>
      <span style={{ fontSize: 14, fontWeight: 600, color: st.text, lineHeight: 1.4 }}>
        {toast.message}
      </span>
    </div>
  )
}
