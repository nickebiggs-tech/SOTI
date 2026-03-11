import { DollarSign, Hash } from 'lucide-react'

export type MetricMode = 'value' | 'volume'

interface MetricToggleProps {
  mode: MetricMode
  onChange: (mode: MetricMode) => void
}

export function MetricToggle({ mode, onChange }: MetricToggleProps) {
  return (
    <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
      <button
        onClick={() => onChange('value')}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] sm:text-[11px] font-semibold transition-all ${
          mode === 'value'
            ? 'bg-white text-primary shadow-sm border border-slate-200'
            : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <DollarSign className="w-3 h-3" />
        Value
      </button>
      <button
        onClick={() => onChange('volume')}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] sm:text-[11px] font-semibold transition-all ${
          mode === 'volume'
            ? 'bg-white text-primary shadow-sm border border-slate-200'
            : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <Hash className="w-3 h-3" />
        Volume
      </button>
    </div>
  )
}
