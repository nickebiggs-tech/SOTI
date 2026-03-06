import { useState } from 'react'
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
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useTheme } from '../../theme/ThemeProvider'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/dispense', icon: Pill, label: 'Dispense' },
  { to: '/otc', icon: ShoppingBag, label: 'OTC' },
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

  const navContent = (
    <>
      {/* Logo & Branding */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
        {collapsed && !mobileOpen ? (
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/40 to-accent/30 flex items-center justify-center shrink-0">
            <span className="text-[11px] font-extrabold text-white">{livery.logoShort}</span>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden">
            <div className="flex items-center gap-2.5">
              <span className="text-[17px] font-extrabold text-white tracking-tight">SOTI</span>
              <span className="text-[9px] text-white/40 font-medium">by NostraData</span>
            </div>
            <div className="mt-1">
              <span className="text-[8px] text-white/30 font-semibold uppercase tracking-widest">State of the Industry</span>
            </div>
          </div>
        )}
        {/* Mobile close button */}
        <button
          onClick={onMobileClose}
          className="lg:hidden ml-auto p-2 text-white/60 hover:text-white active:bg-white/10 rounded-lg transition-colors"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto scrollbar-thin">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onMobileClose}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-white/15 text-white font-medium'
                  : 'text-white/60 hover:text-white hover:bg-white/8',
                collapsed && !mobileOpen && 'justify-center px-2',
              )
            }
          >
            <item.icon className="w-[18px] h-[18px] shrink-0" />
            {(!collapsed || mobileOpen) && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Powered by */}
      {(!collapsed || mobileOpen) && (
        <div className="px-4 py-3 border-t border-white/10">
          <p className="text-[10px] text-white/30">Powered by {livery.poweredBy}</p>
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
        {navContent}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="absolute -right-3 top-8 w-6 h-6 bg-slate-700 border border-slate-600 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-slate-600 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onMobileClose} />
          <aside className="relative w-72 max-w-[80vw] flex flex-col bg-gradient-to-b from-sidebar-from to-sidebar-to text-white shadow-2xl animate-slide-in safe-area-inset">
            {navContent}
          </aside>
        </div>
      )}
    </>
  )
}
