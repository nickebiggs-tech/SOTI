import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '../../lib/utils'

interface KPICardProps {
  title: string
  value: string
  delta?: number
  deltaLabel?: string
  icon?: React.ReactNode
  className?: string
}

export function KPICard({ title, value, delta, deltaLabel, icon, className }: KPICardProps) {
  const trend = delta !== undefined ? (delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat') : null

  return (
    <div className={cn('relative bg-white rounded-xl border border-slate-200 p-4 sm:p-5 kpi-hover overflow-hidden', className)}>
      {/* Animated accent bar */}
      <div className="kpi-accent-bar" />

      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <p className="text-[10px] sm:text-xs font-medium text-slate-500 uppercase tracking-wide">{title}</p>
        {icon && (
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
        )}
      </div>
      <p className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
      {delta !== undefined && (
        <div className="flex items-center gap-1.5 mt-2">
          <div className={cn(
            'flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-semibold',
            trend === 'up' && 'bg-emerald-50 text-emerald-600',
            trend === 'down' && 'bg-red-50 text-red-600',
            trend === 'flat' && 'bg-slate-50 text-slate-400',
          )}>
            {trend === 'up' && <TrendingUp className="w-3 h-3" />}
            {trend === 'down' && <TrendingDown className="w-3 h-3" />}
            {trend === 'flat' && <Minus className="w-3 h-3" />}
            {delta > 0 ? '+' : ''}{delta.toFixed(1)}%
          </div>
          {deltaLabel && <span className="text-[10px] sm:text-xs text-slate-400 hidden sm:inline">{deltaLabel}</span>}
        </div>
      )}
    </div>
  )
}
