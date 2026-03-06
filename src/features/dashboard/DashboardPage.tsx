import { LayoutDashboard } from 'lucide-react'

export function DashboardPage() {
  return (
    <div className="space-y-5 sm:space-y-6 page-enter">
      <div>
        <div className="flex items-center gap-2 mb-0.5 sm:hidden">
          <span className="text-base font-extrabold tracking-tight">
            <span className="text-primary">SOTI</span>
          </span>
          <span className="text-[8px] text-slate-400 font-semibold uppercase tracking-widest border border-slate-200 rounded px-1.5 py-0.5">Dashboard</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 hidden sm:block">Dashboard</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">
          Welcome to SOTI — your intelligence platform is ready
        </p>
      </div>

      {/* Placeholder — ready for KPIs and charts */}
      <div className="bg-white rounded-xl border border-slate-200 p-8 sm:p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <LayoutDashboard className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-lg font-bold text-slate-800 mb-2">Dashboard Ready</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          SOTI is set up with the same architecture as Shopper360 — React 19, TypeScript, Vite 6, Tailwind v4, Recharts, and multi-livery theming. Add your data and features here.
        </p>
      </div>
    </div>
  )
}
