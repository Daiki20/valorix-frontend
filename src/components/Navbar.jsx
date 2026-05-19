import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Zap, LogOut, User, History, Menu, X, Shield, BarChart2, Upload } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import AuthModal from './AuthModal'
import CoinsModal from './CoinsModal'
import Logo from './Logo'

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
        background: 'rgba(240,242,245,0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(226,232,240,0.8)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div className="container" style={{
          maxWidth: 1200, margin: '0 auto', padding: '0 24px',
          height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <Logo size="md" />
          </Link>

          {/* Desktop nav links */}
          <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <NavPill to="/" icon={<Zap size={14} color="#2563eb" fill="#2563eb" />} label="Экспресс" />
            <NavPill to="/analyze" icon={<BarChart2 size={14} color="#7c3aed" />} label="Анализ" accent="#7c3aed" accentBg="#f5f3ff" />
            <NavPill to="/upload" icon={<Upload size={14} color="#0891b2" />} label="Скриншот" accent="#0891b2" accentBg="#ecfeff" />
            <div style={{ width: 1, height: 20, background: '#e2e8f0', margin: '0 8px' }} />
            <a href="/#how" style={{ color: '#4b5563', textDecoration: 'none', fontSize: 13, fontWeight: 500 }}>
              Как работает?
            </a>
            <a href="/#faq" style={{ color: '#4b5563', textDecoration: 'none', fontSize: 13, fontWeight: 500 }}>
              FAQ
            </a>
          </div>

          {/* Desktop right */}
          <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {user && (
              <CoinBadge coins={user.coins} onClick={() => setShowCoins(true)} />
            )}

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
            style={{
              display: 'none', background: 'none', border: 'none',
              cursor: 'pointer', padding: 4,
            }}
          >
            {mobileOpen ? <X size={22} color="#1a1a2e" /> : <Menu size={22} color="#1a1a2e" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div style={{
            borderTop: '1px solid #e2e8f0',
            background: 'rgba(240,242,245,0.98)',
            padding: '16px 24px 20px',
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            <div style={{ display: 'flex', gap: 8, paddingBottom: 4 }}>
              <NavPill to="/" icon={<Zap size={14} color="#2563eb" fill="#2563eb" />} label="Экспресс" onClick={() => setMobileOpen(false)} />
              <NavPill to="/analyze" icon={<BarChart2 size={14} color="#7c3aed" />} label="Анализ" accent="#7c3aed" accentBg="#f5f3ff" onClick={() => setMobileOpen(false)} />
              <NavPill to="/upload" icon={<Upload size={14} color="#0891b2" />} label="Скриншот" accent="#0891b2" accentBg="#ecfeff" onClick={() => setMobileOpen(false)} />
            </div>
            <div style={{ height: 1, background: '#e2e8f0', margin: '4px 0' }} />
            <a href="/#how" onClick={() => setMobileOpen(false)} style={{ color: '#4b5563', textDecoration: 'none', fontSize: 15, fontWeight: 600, padding: '8px 0' }}>Как это работает?</a>
            <a href="/#faq" onClick={() => setMobileOpen(false)} style={{ color: '#4b5563', textDecoration: 'none', fontSize: 15, fontWeight: 600, padding: '8px 0' }}>FAQ</a>
            {user && <Link to="/history" onClick={() => setMobileOpen(false)} style={{ color: '#4b5563', textDecoration: 'none', fontSize: 15, fontWeight: 600, padding: '8px 0' }}>История анализов</Link>}
            {user?.is_admin && <Link to="/admin" onClick={() => setMobileOpen(false)} style={{ color: '#2563eb', textDecoration: 'none', fontSize: 15, fontWeight: 700, padding: '8px 0', display: 'flex', alignItems: 'center', gap: 6 }}><Shield size={14} />Админ панель</Link>}
            <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
              {user ? (
                <>
                  <CoinBadge coins={user.coins} onClick={() => { setShowCoins(true); setMobileOpen(false) }} />
                  <button onClick={() => { logout(); setMobileOpen(false); toast.info('Вы вышли из аккаунта') }}
                    style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 20, padding: '8px 16px', fontSize: 13, fontWeight: 600, color: '#dc2626', cursor: 'pointer' }}>
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

function NavPill({ to, icon, label, accent = '#2563eb', accentBg = '#eff6ff', onClick }) {
  return (
    <Link to={to} onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '7px 14px', borderRadius: 20,
      background: accentBg, border: `1.5px solid ${accent}22`,
      textDecoration: 'none', fontSize: 13, fontWeight: 700,
      color: accent, whiteSpace: 'nowrap',
      transition: 'box-shadow 0.18s, background 0.18s',
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 2px 10px ${accent}33`; e.currentTarget.style.background = accentBg }}
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
      background: 'white', border: '1.5px solid #e2e8f0',
      borderRadius: 50, padding: '8px 16px', fontSize: 14, fontWeight: 700,
      color: '#1a1a2e', cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: 6,
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)', transition: 'box-shadow 0.2s',
    }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(37,99,235,0.15)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'}
    >
      <Zap size={14} color="#2563eb" fill="#2563eb" />
      <span className={rolling ? 'coin-roll' : ''} style={{ minWidth: 24, textAlign: 'right', display: 'inline-block' }}>
        {displayed}
      </span>
      <span style={{ color: '#64748b', fontWeight: 500 }}>монет</span>
    </button>
  )
}

function UserMenu({ user, show, onToggle, onClose, onLogout }) {
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={onToggle} style={{
        background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
        border: 'none', borderRadius: 50, padding: '8px 16px',
        fontSize: 14, fontWeight: 600, color: 'white', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 8,
        boxShadow: '0 4px 12px rgba(26,26,46,0.3)',
      }}>
        <div style={{
          width: 22, height: 22, borderRadius: '50%',
          background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 800,
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
            background: 'white', border: '1.5px solid #e2e8f0',
            borderRadius: 14, padding: 8, minWidth: 200,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)', zIndex: 151,
            animation: 'toastIn 0.2s ease forwards',
          }}>
            <div style={{ padding: '10px 12px', marginBottom: 4 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#1a1a2e' }}>{user.username}</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{user.email}</div>
            </div>
            <div style={{ height: 1, background: '#f1f5f9', margin: '4px 0' }} />
            <Link
              to="/history"
              onClick={onClose}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '9px 12px', borderRadius: 8, fontSize: 14, fontWeight: 500,
                color: '#1a1a2e', textDecoration: 'none',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <History size={14} color="#64748b" />
              История анализов
            </Link>
            {user.is_admin && (
              <Link
                to="/admin"
                onClick={onClose}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '9px 12px', borderRadius: 8, fontSize: 14, fontWeight: 600,
                  color: '#2563eb', textDecoration: 'none',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <Shield size={14} color="#2563eb" />
                Админ панель
              </Link>
            )}
            <button
              onClick={onLogout}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                padding: '9px 12px', border: 'none', background: 'none',
                cursor: 'pointer', borderRadius: 8, fontSize: 14, fontWeight: 500,
                color: '#dc2626', textAlign: 'left',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
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
