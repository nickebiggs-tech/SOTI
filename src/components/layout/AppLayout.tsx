import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { BottomNav } from './BottomNav'

export function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex h-[100dvh] overflow-hidden">
      <Sidebar mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuToggle={() => setMobileMenuOpen((o) => !o)} />
        <main className="flex-1 overflow-y-auto bg-slate-50 p-3 sm:p-4 lg:p-6 pb-20 lg:pb-6 overscroll-contain">
          <Outlet />
        </main>
      </div>
      <BottomNav onMoreTap={() => setMobileMenuOpen(true)} />
    </div>
  )
}
