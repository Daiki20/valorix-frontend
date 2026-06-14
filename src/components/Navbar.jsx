import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Zap, LogOut, User, History, Menu, X, Shield, BarChart2, Upload } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import AuthModal from './AuthModal'
import CoinsModal from './CoinsModal'
import Logo from './Logo'

const ACCENT = '#00cfff'
const ACCENT_DIM = 'rgba(0,207,255,0.1)'
const BG = '#030b18'
const TEXT = '#dde4ee'
const TEXT_MUTED = '#556070'
const BORDER = 'rgba(0,180,255,0.1)'

export default function Navbar() {
  const { user, logout } = useAuth()
  const toast = useToast()
  const [showAuth, setShowAuth] = useState(false)
  const [showCoins, setShowCoins] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <nav style={{
        background: 'rgba(3,11,24,0.88)',
        backdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${BORDER}`,
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div className="container" style={{
          maxWidth: 1200, margin: '0 auto', padding: '0 24px',
          height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <Logo size="md" dark />
          </Link>

          {/* Desktop nav links */}
          <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ExpressPill />
            <NavPill to="/analyze"  icon={<BarChart2 size={14} color={ACCENT} />}   label="Анализ"    accent={ACCENT}    accentBg={ACCENT_DIM} />
            <NavPill to="/upload"   icon={<Upload size={14} color="#57c8ff" />}      label="Скриншот"  accent="#57c8ff"   accentBg="rgba(87,200,255,0.1)" />
            <div style={{ width: 1, height: 20, background: BORDER, margin: '0 8px' }} />
            <a href="/#partner" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 20,
              background: 'linear-gradient(135deg, rgba(123,94,167,0.2), rgba(0,207,255,0.1))',
              border: '1.5px solid rgba(123,94,167,0.4)',
              textDecoration: 'none', fontSize: 13, fontWeight: 700,
              color: '#b48af7', whiteSpace: 'nowrap',
              transition: 'box-shadow 0.18s, border-color 0.18s',
            }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 2px 16px rgba(123,94,167,0.4)'; e.currentTarget.style.borderColor = 'rgba(123,94,167,0.7)' }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'rgba(123,94,167,0.4)' }}
            >
              🎙️ Для блогеров
            </a>
            <a href="/#how" style={{ color: TEXT_MUTED, textDecoration: 'none', fontSize: 13, fontWeight: 500, transition: 'color 0.18s' }}
               onMouseEnter={e => e.target.style.color = TEXT}
               onMouseLeave={e => e.target.style.color = TEXT_MUTED}>
              Как работает?
            </a>
            <a href="/#faq" style={{ color: TEXT_MUTED, textDecoration: 'none', fontSize: 13, fontWeight: 500, transition: 'color 0.18s' }}
               onMouseEnter={e => e.target.style.color = TEXT}
               onMouseLeave={e => e.target.style.color = TEXT_MUTED}>
              FAQ
            </a>
          </div>

          {/* Desktop right */}
          <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {user && <CoinBadge coins={user.coins} onClick={() => setShowCoins(true)} />}
            {!user && (
              <button onClick={() => setShowAuth(true)} className="btn-primary" style={{ padding: '8px 20px', fontSize: 14 }}>
                Войти
              </button>
            )}
            {user && (
              <UserMenu
                user={user}
                show={showUserMenu}
                onToggle={() => setShowUserMenu(m => !m)}
                onClose={() => setShowUserMenu(false)}
                onLogout={() => { logout(); setShowUserMenu(false); toast.info('Вы вышли из аккаунта') }}
              />
            )}
          </div>

          {/* Mobile burger */}
          <button
            className="mobile-burger"
            onClick={() => setMobileOpen(m => !m)}
            style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
          >
            {mobileOpen ? <X size={22} color={TEXT} /> : <Menu size={22} color={TEXT} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div style={{
            borderTop: `1px solid ${BORDER}`,
            background: 'rgba(3,11,24,0.97)',
            padding: '16px 24px 20px',
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            <div style={{ display: 'flex', gap: 8, paddingBottom: 4 }}>
              <ExpressPill onClick={() => setMobileOpen(false)} />
              <NavPill to="/analyze" icon={<BarChart2 size={14} color={ACCENT} />} label="Анализ" accent={ACCENT} accentBg={ACCENT_DIM} onClick={() => setMobileOpen(false)} />
              <NavPill to="/upload" icon={<Upload size={14} color="#57c8ff" />} label="Скриншот" accent="#57c8ff" accentBg="rgba(87,200,255,0.1)" onClick={() => setMobileOpen(false)} />
            </div>
            <div style={{ height: 1, background: BORDER, margin: '4px 0' }} />
            <a href="/#how" onClick={() => setMobileOpen(false)} style={{ color: TEXT_MUTED, textDecoration: 'none', fontSize: 15, fontWeight: 600, padding: '8px 0' }}>Как это работает?</a>
            <a href="/#faq" onClick={() => setMobileOpen(false)} style={{ color: TEXT_MUTED, textDecoration: 'none', fontSize: 15, fontWeight: 600, padding: '8px 0' }}>FAQ</a>
            {user && <Link to="/history" onClick={() => setMobileOpen(false)} style={{ color: TEXT_MUTED, textDecoration: 'none', fontSize: 15, fontWeight: 600, padding: '8px 0' }}>История анализов</Link>}
            {user?.is_admin && (
              <Link to="/admin" onClick={() => setMobileOpen(false)} style={{ color: ACCENT, textDecoration: 'none', fontSize: 15, fontWeight: 700, padding: '8px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Shield size={14} />Админ панель
              </Link>
            )}
            <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
              {user ? (
                <>
                  <CoinBadge coins={user.coins} onClick={() => { setShowCoins(true); setMobileOpen(false) }} />
                  <button
                    onClick={() => { logout(); setMobileOpen(false); toast.info('Вы вышли из аккаунта') }}
                    style={{
                      background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)',
                      borderRadius: 20, padding: '8px 16px', fontSize: 13, fontWeight: 600,
                      color: '#ff6b6b', cursor: 'pointer',
                    }}>
                    Выйти
                  </button>
                </>
              ) : (
                <button onClick={() => { setShowAuth(true); setMobileOpen(false) }} className="btn-primary" style={{ padding: '10px 24px', fontSize: 14 }}>
                  Войти
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      {showCoins && <CoinsModal onClose={() => setShowCoins(false)} />}
    </>
  )
}

function ExpressPill({ onClick }) {
  return (
    <a href="/#express" onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '7px 14px', borderRadius: 20,
      background: 'linear-gradient(90deg, #00cfff, #5bff9e, #00cfff)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 2.5s linear infinite',
      textDecoration: 'none', fontSize: 13, fontWeight: 700,
      color: '#030b18', whiteSpace: 'nowrap',
      boxShadow: '0 2px 16px rgba(0,207,255,0.35)',
      border: 'none',
    }}>
      <Zap size={14} color="#030b18" fill="#030b18" />
      AI Экспресс
    </a>
  )
}

function NavPill({ to, icon, label, accent = ACCENT, accentBg = ACCENT_DIM, onClick }) {
  return (
    <Link to={to} onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '7px 14px', borderRadius: 20,
      background: accentBg, border: `1.5px solid ${accent}22`,
      textDecoration: 'none', fontSize: 13, fontWeight: 700,
      color: accent, whiteSpace: 'nowrap',
      transition: 'box-shadow 0.18s, background 0.18s',
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 2px 12px ${accent}44` }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none' }}
    >
      {icon}
      {label}
    </Link>
  )
}

function CoinBadge({ coins, onClick }) {
  const [displayed, setDisplayed] = useState(coins)
  const [rolling, setRolling] = useState(false)
  const prev = useRef(coins)

  useEffect(() => {
    if (coins !== prev.current) {
      setRolling(true)
      const t = setTimeout(() => { setDisplayed(coins); setRolling(false); prev.current = coins }, 220)
      return () => clearTimeout(t)
    }
  }, [coins])

  return (
    <button onClick={onClick} style={{
      background: 'rgba(0,25,60,0.4)',
      border: `1.5px solid ${BORDER}`,
      borderRadius: 50, padding: '8px 16px', fontSize: 14, fontWeight: 700,
      color: TEXT, cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: 6,
      transition: 'border-color 0.18s, box-shadow 0.18s',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,207,255,0.3)'; e.currentTarget.style.boxShadow = '0 2px 16px rgba(0,207,255,0.12)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.boxShadow = 'none' }}
    >
      <Zap size={14} color={ACCENT} fill={ACCENT} />
      <span className={rolling ? 'coin-roll' : ''} style={{ minWidth: 24, textAlign: 'right', display: 'inline-block' }}>
        {displayed}
      </span>
      <span style={{ color: TEXT_MUTED, fontWeight: 500 }}>монет</span>
    </button>
  )
}

function UserMenu({ user, show, onToggle, onClose, onLogout }) {
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={onToggle} style={{
        background: ACCENT_DIM,
        border: `1.5px solid rgba(0,207,255,0.2)`,
        borderRadius: 50, padding: '8px 16px',
        fontSize: 14, fontWeight: 600, color: ACCENT, cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 8,
        transition: 'box-shadow 0.18s',
      }}
        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 16px rgba(0,207,255,0.2)'}
        onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
      >
        <div style={{
          width: 22, height: 22, borderRadius: '50%',
          background: 'linear-gradient(135deg, #00cfff, #5bff9e)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 800, color: '#030b18',
        }}>
          {(user.username || user.email || '?')[0].toUpperCase()}
        </div>
        <span className="nav-username">{user.username}</span>
      </button>

      {show && (
        <>
          <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 150 }} />
          <div style={{
            position: 'absolute', top: 'calc(100% + 8px)', right: 0,
            background: '#050f22',
            border: `1px solid ${BORDER}`,
            borderRadius: 14, padding: 8, minWidth: 200,
            boxShadow: '0 12px 40px rgba(0,0,0,0.5)', zIndex: 151,
            animation: 'toastIn 0.2s ease forwards',
          }}>
            <div style={{ padding: '10px 12px', marginBottom: 4 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: TEXT }}>{user.username}</div>
              <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 2 }}>{user.email}</div>
            </div>
            <div style={{ height: 1, background: BORDER, margin: '4px 0' }} />
            <Link
              to="/history" onClick={onClose}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 8, fontSize: 14, fontWeight: 500, color: TEXT, textDecoration: 'none', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,25,60,0.4)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <History size={14} color={TEXT_MUTED} />
              История анализов
            </Link>
            {user.is_admin && (
              <Link
                to="/admin" onClick={onClose}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 8, fontSize: 14, fontWeight: 600, color: ACCENT, textDecoration: 'none', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = ACCENT_DIM}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <Shield size={14} color={ACCENT} />
                Админ панель
              </Link>
            )}
            <button
              onClick={onLogout}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                padding: '9px 12px', border: 'none', background: 'none',
                cursor: 'pointer', borderRadius: 8, fontSize: 14, fontWeight: 500,
                color: '#ff6b6b', textAlign: 'left', transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(220,38,38,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <LogOut size={14} />
              Выйти
            </button>
          </div>
        </>
      )}
    </div>
  )
}
