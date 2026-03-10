import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import api, { setAccessToken, getAccessToken } from '../lib/api'
import type { Teacher } from '../types'

interface AuthState {
  teacher: Teacher | null
  isLoading: boolean
  isAuthenticated: boolean
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
  setTeacher: (t: Teacher) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    teacher: null,
    isLoading: true,
    isAuthenticated: false,
  })
  const initRef = useRef(false)

  const setTeacher = useCallback((t: Teacher) => {
    setState({ teacher: t, isLoading: false, isAuthenticated: true })
  }, [])

  const refreshProfile = useCallback(async () => {
    try {
      const res = await api.get('/api/profile/me')
      setTeacher(res.data.teacher)
    } catch {
      setState({ teacher: null, isLoading: false, isAuthenticated: false })
    }
  }, [setTeacher])

  // On mount: try refresh token to get access token, then fetch profile
  useEffect(() => {
    if (initRef.current) return
    initRef.current = true

    async function init() {
      try {
        const token = getAccessToken()
        if (token) {
          // If token exists, just fetch the profile.
          // The interceptor will seamlessly catch 401s and refresh the token gracefully.
          await refreshProfile()
        } else {
          // If no token exists at all, explicitly trigger the refresh
          const res = await api.post('/api/auth/refresh')
          setAccessToken(res.data.accessToken)
          await refreshProfile()
        }
      } catch {
        setAccessToken(null)
        setState({ teacher: null, isLoading: false, isAuthenticated: false })
      }
    }
    init()
  }, [refreshProfile])

  // Listen for forced logout from axios interceptor
  useEffect(() => {
    const handler = () => {
      setAccessToken(null)
      setState({ teacher: null, isLoading: false, isAuthenticated: false })
    }
    window.addEventListener('auth:logout', handler)
    return () => window.removeEventListener('auth:logout', handler)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post('/api/auth/login', { email, password })
    setAccessToken(res.data.accessToken)
    await refreshProfile()
  }, [refreshProfile])

  const logout = useCallback(async () => {
    try {
      await api.post('/api/auth/logout')
    } catch { /* ignore */ }
    setAccessToken(null)
    setState({ teacher: null, isLoading: false, isAuthenticated: false })
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refreshProfile, setTeacher }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
