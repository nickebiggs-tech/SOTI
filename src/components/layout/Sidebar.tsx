import { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Pill,
  ShoppingBag,
  BookOpen,
  Bot,
  CalendarDays,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useTheme } from '../../theme/ThemeProvider'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/dispense', icon: Pill, label: 'Dispense' },
  { to: '/otc', icon: ShoppingBag, label: 'OTC' },
  { to: '/rx-watch', icon: Eye, label: 'Rx Watch' },
  { to: '/otc-watch', icon: Eye, label: 'OTC Watch' },
  { to: '/insights', icon: BookOpen, label: 'Insights' },
  { to: '/seasonality', icon: CalendarDays, label: 'Seasonality' },
  { to: '/ask', icon: Bot, label: 'Ask SOTI' },
  { to: '/admin/branding', icon: Settings, label: 'Settings' },
]

interface SidebarProps {
  mobileOpen: boolean
  onMobileClose: () => void
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const { livery } = useTheme()
  const closeRef = useRef<HTMLButtonElement>(null)
  const navRef = useRef<HTMLElement>(null)

  // Focus the close button when menu opens (accessibility)
  useEffect(() => {
    if (mobileOpen) {
      // Small delay to allow animation to start
      const t = setTimeout(() => closeRef.current?.focus(), 100)
      return () => clearTimeout(t)
    }
  }, [mobileOpen])

  // Close on Escape key
  useEffect(() => {
    if (!mobileOpen) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onMobileClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [mobileOpen, onMobileClose])

  // Prevent body scroll when menu is open (Safari fix)
  useEffect(() => {
    if (mobileOpen) {
      const scrollY = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.width = ''
        document.body.style.overflow = ''
        window.scrollTo(0, scrollY)
      }
    }
  }, [mobileOpen])

  const navContent = (isMobile: boolean) => (
    <>
      {/* Logo & Branding */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
        {collapsed && !isMobile ? (
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/40 to-accent/30 flex items-center justify-center shrink-0">
            <span className="text-[11px] font-extrabold text-white">{livery.logoShort}</span>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden">
            <div className="flex items-center gap-2.5">
              <span className="text-[17px] font-extrabold text-white tracking-tight">SOTI</span>
            </div>
            <div className="mt-0.5">
              <span className="text-[9px] text-white/50 font-semibold uppercase tracking-widest">State of the Industry</span>
            </div>
            <div className="mt-1">
              <span className="text-[8px] text-white/40 font-medium">Powered by <span className="font-bold text-white/60">NostraData</span></span>
            </div>
          </div>
        )}
        {/* Mobile close button — large touch target for Safari */}
        {isMobile && (
          <button
            ref={closeRef}
            onClick={onMobileClose}
            className="ml-auto min-w-[44px] min-h-[44px] flex items-center justify-center text-white/70 hover:text-white active:bg-white/10 rounded-xl transition-colors"
            aria-label="Close navigation menu"
          >
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav
        ref={isMobile ? navRef : undefined}
        className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto scrollbar-thin sidebar-scroll"
        role="navigation"
        aria-label="Main navigation"
      >
        {NAV_ITEMS.map((item, i) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onMobileClose}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                'min-h-[44px]', // iOS minimum touch target
                isActive
                  ? 'bg-white/15 text-white shadow-sm shadow-black/10'
                  : 'text-white/60 hover:text-white hover:bg-white/8 active:bg-white/12',
                collapsed && !isMobile && 'justify-center px-2',
              )
            }
            style={isMobile ? { animationDelay: `${i * 30}ms` } : undefined}
          >
            <item.icon className="w-[18px] h-[18px] shrink-0" />
            {(!collapsed || isMobile) && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Powered by */}
      {(!collapsed || isMobile) && (
        <div className="px-4 py-4 border-t border-white/10 bg-white/[0.03]">
          <p className="text-[11px] text-white/50 font-medium">Powered by <span className="font-bold text-white/70">{livery.poweredBy}</span></p>
        </div>
      )}
    </>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden lg:flex h-screen flex-col bg-gradient-to-b from-sidebar-from to-sidebar-to text-white transition-all duration-300 relative',
          collapsed ? 'w-16' : 'w-60',
        )}
      >
        {navContent(false)}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="absolute -right-3 top-8 w-6 h-6 bg-slate-700 border border-slate-600 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-slate-600 transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* Mobile overlay — Safari-optimised */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-[9999] flex"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm sidebar-backdrop-enter"
            onClick={onMobileClose}
            aria-hidden="true"
          />
          {/* Sidebar panel — slides from left */}
          <aside className="relative w-72 max-w-[85vw] flex flex-col bg-gradient-to-b from-sidebar-from to-sidebar-to text-white shadow-2xl sidebar-panel-enter safe-area-inset">
            {navContent(true)}
          </aside>
        </div>
      )}
    </>
  )
}
