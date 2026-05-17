import { createContext, useContext, useState, useEffect } from 'react'
import { authApi } from '../api/authApi'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('valorix_token')
    if (!token) { setLoading(false); return }
    authApi.me()
      .then(data => setUser(data.user))
      .catch(() => localStorage.removeItem('valorix_token'))
      .finally(() => setLoading(false))
  }, [])

  function saveAuth({ token, user }) {
    localStorage.setItem('valorix_token', token)
    setUser(user)
  }

  function logout() {
    localStorage.removeItem('valorix_token')
    setUser(null)
  }

  function updateCoins(coins) {
    setUser(u => u ? { ...u, coins } : u)
  }

  return (
    <AuthContext.Provider value={{ user, loading, saveAuth, logout, updateCoins }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
