import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { login as apiLogin, register as apiRegister, logout as apiLogout } from '../api/index.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [accessToken, setAccessToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    const storedToken = localStorage.getItem('accessToken')
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser))
        setAccessToken(storedToken)
      } catch {
        localStorage.removeItem('user')
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
      }
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (email, password) => {
    const response = await apiLogin({ email, password })
    const { user: userData, accessToken: token, refreshToken } = response.data
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('accessToken', token)
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken)
    }
    setUser(userData)
    setAccessToken(token)
    return userData
  }, [])

  const register = useCallback(async (email, password) => {
    const response = await apiRegister({ email, password })
    const { user: userData, accessToken: token, refreshToken } = response.data
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('accessToken', token)
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken)
    }
    setUser(userData)
    setAccessToken(token)
    return userData
  }, [])

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('refreshToken')
    try {
      await apiLogout({ refreshToken })
    } catch {
      // Ignore logout API errors
    }
    localStorage.removeItem('user')
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    setUser(null)
    setAccessToken(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, accessToken, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export default AuthContext
