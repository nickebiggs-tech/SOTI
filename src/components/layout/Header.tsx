import { useAuth } from '../../auth/AuthContext'
import { useTheme } from '../../theme/ThemeProvider'
import { LogOut, User, Menu } from 'lucide-react'

interface HeaderProps {
  onMenuToggle: () => void
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { user, logout } = useAuth()
  const { livery } = useTheme()
  const isSoti = livery.id === 'soti-terminal'

  return (
    <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-3 sm:px-6">
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center -ml-1 bg-primary/10 text-primary hover:bg-primary/20 active:bg-primary/30 rounded-xl transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-6 h-6" strokeWidth={2.5} />
        </button>
        <div className="flex items-center gap-1.5">
          {isSoti ? (
            <>
              <span className="smark text-base sm:text-sm" style={{ fontFamily: 'var(--display)', fontWeight: 800, letterSpacing: '.01em' }}>
                SOTI
              </span>
              <span className="ping" />
              <span className="hidden sm:inline text-[10px] uppercase tracking-wider" style={{ fontFamily: 'var(--mono)', color: 'var(--dim)', letterSpacing: '.12em' }}>
                State of the Industry
              </span>
            </>
          ) : (
            <>
              <span className="text-base sm:text-sm font-extrabold tracking-tight">
                <span className="text-primary">SOTI</span>
              </span>
              <span className="hidden sm:inline text-[10px] text-slate-400 font-medium uppercase tracking-wider">State of the Industry</span>
              <span className="hidden sm:inline text-[9px] text-slate-300 ml-1">by <span className="font-semibold text-slate-400">NostraData</span></span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <div className="flex items-center gap-1.5 text-sm text-slate-600">
          <User className="w-4 h-4" />
          <span className="hidden sm:inline">{user?.displayName}</span>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-500 active:text-red-600 transition-colors p-1.5 -mr-1.5 rounded-lg"
          aria-label="Logout"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  )
}
