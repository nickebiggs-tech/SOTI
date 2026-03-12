import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Pill,
  ShoppingBag,
  Search,
  LogOut,
  MoreHorizontal,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useAuth } from '../../auth/AuthContext'

const BOTTOM_NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/dispense', icon: Pill, label: 'Dispense' },
  { to: '/otc', icon: ShoppingBag, label: 'OTC' },
  { to: '/search', icon: Search, label: 'Search' },
]

interface BottomNavProps {
  onMoreTap: () => void
}

export function BottomNav({ onMoreTap }: BottomNavProps) {
  const { logout } = useAuth()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-slate-200 safe-area-bottom">
      <div className="flex items-stretch justify-around h-14">
        {BOTTOM_NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center flex-1 gap-0.5 text-[10px] font-medium transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-slate-400 active:text-slate-600',
              )
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
        <button
          onClick={onMoreTap}
          className="flex flex-col items-center justify-center flex-1 gap-0.5 text-[10px] font-medium text-slate-400 active:text-slate-600 transition-colors"
        >
          <MoreHorizontal className="w-5 h-5" />
          <span>More</span>
        </button>
        <button
          onClick={logout}
          className="flex flex-col items-center justify-center flex-1 gap-0.5 text-[10px] font-medium text-slate-400 active:text-red-500 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  )
}
