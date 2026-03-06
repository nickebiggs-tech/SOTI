import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { LIVERIES, type Livery } from './themes'

const STORAGE_KEY = 'soti-livery'

interface ThemeContextValue {
  livery: Livery
  setLivery: (id: string) => void
  liveryOptions: Livery[]
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function applyLivery(livery: Livery) {
  const root = document.documentElement
  Object.entries(livery.colors).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value)
  })
  root.style.setProperty('--font-sans', livery.fontFamily)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [livery, setLiveryState] = useState<Livery>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return (saved && LIVERIES[saved]) || LIVERIES['soti']!
  })

  const setLivery = useCallback((id: string) => {
    const next = LIVERIES[id]
    if (next) {
      setLiveryState(next)
      localStorage.setItem(STORAGE_KEY, id)
    }
  }, [])

  useEffect(() => {
    applyLivery(livery)
  }, [livery])

  const liveryOptions = Object.values(LIVERIES)

  return (
    <ThemeContext.Provider value={{ livery, setLivery, liveryOptions }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
