import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import type { AuthUser } from './types'
import { LocalAuthProvider } from './local-auth'

interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const provider = new LocalAuthProvider()

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)

  const login = useCallback(async (username: string, password: string) => {
    const result = await provider.login(username, password)
    if (result) {
      setUser(result)
      return true
    }
    return false
  }, [])

  const logout = useCallback(() => {
    provider.logout()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function RequireAuth() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}
