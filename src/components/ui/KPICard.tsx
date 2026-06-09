import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useCountUp } from './AnimatedValue'

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
  const animatedValue = useCountUp(value, 1400, 200)

  return (
    <div className={cn('relative bg-white rounded-xl border border-slate-200 p-4 sm:p-5 kpi-hover overflow-hidden group', className)}>
      <div className="kpi-accent-bar" />

      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <p className="text-[10px] sm:text-xs font-medium text-slate-500 uppercase tracking-wide" style={{ fontFamily: 'var(--mono, inherit)', letterSpacing: '.12em' }}>{title}</p>
        {icon && (
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
            {icon}
          </div>
        )}
      </div>
      <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight animate-number-pop animate-value-glow" style={{ fontFamily: 'var(--display, inherit)', fontWeight: 800, letterSpacing: '-.02em' }}>{animatedValue}</p>
      {delta !== undefined && (
        <div className="flex items-center gap-1.5 mt-2 animate-fade-in" style={{ animationDelay: '400ms' }}>
          <div className={cn(
            'flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-semibold transition-colors animate-scale-bounce',
            trend === 'up' && 'bg-emerald-50 text-emerald-600',
            trend === 'down' && 'bg-red-50 text-red-600',
            trend === 'flat' && 'bg-slate-50 text-slate-400',
          )} style={{ animationDelay: '600ms', fontFamily: 'var(--mono, inherit)' }}>
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
