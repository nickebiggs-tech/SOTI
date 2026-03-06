import { useMemo, useState } from 'react'
import {
  BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { ShoppingBag, ChevronRight, X, Search, Factory, Package, TrendingUp, TrendingDown, Sparkles } from 'lucide-react'
import { useData } from '../../data/DataProvider'
import { KPICard } from '../../components/ui/KPICard'
import { formatCompact, formatCurrency } from '../../lib/formatters'
import type { ManufacturerSummary } from '../../data/types'

const COLORS = ['#0D9488', '#2563EB', '#7C3AED', '#D97706', '#DC2626', '#DB2777', '#EA580C', '#0891B2', '#4F46E5', '#65A30D']

/** Auto-generate narrative for the OTC market */
function generateOTCNarrative(
  totalTY: number, growth: number,
  categories: { category: string; tyValue: number; valueGrowth: number; manufacturerCount: number }[],
  totalUnits: number, mfrCount: number,
): string[] {
  const lines: string[] = []

  const dir = growth >= 0 ? 'grew' : 'softened'
  lines.push(`The OTC/consumer health market ${dir} ${Math.abs(growth).toFixed(1)}% year-on-year to ${formatCurrency(totalTY)}, encompassing ${formatCompact(totalUnits)} units across ${categories.length} market segments and ${mfrCount} manufacturers.`)

  const growers = [...categories].filter(c => c.valueGrowth > 3).sort((a, b) => b.valueGrowth - a.valueGrowth)
  const decliners = [...categories].filter(c => c.valueGrowth < -3).sort((a, b) => a.valueGrowth - b.valueGrowth)

  if (growers.length > 0 && growers[0]) {
    const top3 = growers.slice(0, 3).map(c => c.category).join(', ')
    lines.push(`Growth pockets include ${top3}, with ${growers[0].category} leading at +${growers[0].valueGrowth.toFixed(1)}% — condition-specific categories continue to outperform general wellness.`)
  }

  if (decliners.length > 0 && decliners[0]) {
    lines.push(`The sharpest decline was in ${decliners[0].category} (${decliners[0].valueGrowth.toFixed(1)}%), reflecting post-pandemic normalisation and intensifying online competition.`)
  }

  if (growth < 0) {
    lines.push(`The overall market contraction signals a structural shift as pandemic-inflated categories normalise, while pharmacist-advised products and pharmacy-exclusive lines maintain stronger performance.`)
  } else {
    lines.push(`The market's return to growth is underpinned by premiumisation, pharmacist-recommended brands, and consumer willingness to invest in proactive health management.`)
  }

  return lines
}

export function OTCPage() {
  const { otcCategories, otcTotalTY, otcTotalLY, state } = useData()
  const [selectedCat, setSelectedCat] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const otcGrowth = otcTotalLY ? ((otcTotalTY - otcTotalLY) / otcTotalLY) * 100 : 0
  const totalUnits = useMemo(() => otcCategories.reduce((s, c) => s + c.tyUnits, 0), [otcCategories])
  const mfrCount = useMemo(() => new Set(state.otc.map(r => r.manufacturer)).size, [state.otc])

  // Auto-narrative
  const narrative = useMemo(() => generateOTCNarrative(
    otcTotalTY, otcGrowth, otcCategories, totalUnits, mfrCount
  ), [otcTotalTY, otcGrowth, otcCategories, totalUnits, mfrCount])

  const filteredCats = useMemo(() => {
    if (!search) return otcCategories
    const q = search.toLowerCase()
    return otcCategories.filter(c => c.category.toLowerCase().includes(q))
  }, [otcCategories, search])

  // Drill-in: manufacturer breakdown
  const mfrBreakdown = useMemo((): ManufacturerSummary[] => {
    if (!selectedCat) return []
    const catData = state.otc.filter(r => r.market === selectedCat)
    const map: Record<string, { tyV: number; lyV: number; tyU: number; lyU: number }> = {}
    catData.forEach(r => {
      if (!map[r.manufacturer]) map[r.manufacturer] = { tyV: 0, lyV: 0, tyU: 0, lyU: 0 }
      const m = map[r.manufacturer]!
      m.tyV += r.tyValue
      m.lyV += r.lyValue
      m.tyU += r.tyUnits
      m.lyU += r.lyUnits
    })
    const totalCatTY = Object.values(map).reduce((s, m) => s + m.tyV, 0)
    return Object.entries(map)
      .map(([manufacturer, m]) => ({
        manufacturer,
        tyValue: m.tyV,
        lyValue: m.lyV,
        tyUnits: m.tyU,
        lyUnits: m.lyU,
        valueGrowth: m.lyV ? ((m.tyV - m.lyV) / m.lyV) * 100 : 0,
        share: totalCatTY ? (m.tyV / totalCatTY) * 100 : 0,
      }))
      .sort((a, b) => b.tyValue - a.tyValue)
  }, [selectedCat, state.otc])

  // Top SKUs for selected category
  const topSkus = useMemo(() => {
    if (!selectedCat) return []
    const catData = state.otc.filter(r => r.market === selectedCat)
    return catData
      .map(r => ({ name: r.packName, tyValue: r.tyValue, lyValue: r.lyValue, growth: r.lyValue ? ((r.tyValue - r.lyValue) / r.lyValue) * 100 : 0 }))
      .sort((a, b) => b.tyValue - a.tyValue)
      .slice(0, 15)
  }, [selectedCat, state.otc])

  // Growth winners & losers
  const growthData = useMemo(() => {
    const growing = [...otcCategories].filter(c => c.lyValue > 50000).sort((a, b) => b.valueGrowth - a.valueGrowth).slice(0, 5)
    const declining = [...otcCategories].filter(c => c.lyValue > 50000).sort((a, b) => a.valueGrowth - b.valueGrowth).slice(0, 5)
    return { growing, declining }
  }, [otcCategories])

  // Category-specific auto-narrative for drill-in
  const catNarrative = useMemo(() => {
    if (!selectedCat || mfrBreakdown.length === 0) return ''
    const catInfo = otcCategories.find(c => c.category === selectedCat)
    if (!catInfo) return ''
    const topMfr = mfrBreakdown[0]
    if (!topMfr) return ''
    const growthDir = catInfo.valueGrowth >= 0 ? 'grew' : 'declined'
    const topSku = topSkus[0]
    const skuNote = topSku ? ` The leading SKU is ${topSku.name} at ${formatCurrency(topSku.tyValue)}.` : ''
    return `${selectedCat} ${growthDir} ${Math.abs(catInfo.valueGrowth).toFixed(1)}% to ${formatCurrency(catInfo.tyValue)}. ${topMfr.manufacturer} leads with ${topMfr.share.toFixed(1)}% share across ${catInfo.skuCount} total SKUs.${skuNote}`
  }, [selectedCat, mfrBreakdown, otcCategories, topSkus])

  return (
    <div className="space-y-4 sm:space-y-6 page-enter">
      <div>
        <div className="flex items-center gap-2 mb-0.5 sm:hidden">
          <span className="text-base font-extrabold tracking-tight"><span className="text-primary">SOTI</span></span>
          <span className="text-[8px] text-slate-400 font-semibold uppercase tracking-widest border border-slate-200 rounded px-1.5 py-0.5">OTC</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 hidden sm:block">OTC / Front of Shop</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">Consumer health market — category & manufacturer drill-in</p>
      </div>

      {/* Auto-Narrative */}
      <div className="bg-gradient-to-r from-teal-900 to-emerald-900 rounded-xl p-4 sm:p-5 text-white animate-fade-in-up overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.03] rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[9px] font-semibold uppercase tracking-widest text-amber-400/80">Market Narrative</span>
          </div>
          <div className="space-y-1.5">
            {narrative.map((line, i) => (
              <p key={i} className="text-[11px] sm:text-xs text-white/80 leading-relaxed">{line}</p>
            ))}
          </div>
          <p className="text-[8px] text-white/25 mt-2">Powered by NostraData</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 stagger-children">
        <KPICard title="OTC Market" value={formatCompact(otcTotalTY)} delta={otcGrowth} deltaLabel="YoY" icon={<ShoppingBag className="w-4 h-4" />} />
        <KPICard title="Total Units" value={formatCompact(totalUnits)} icon={<Package className="w-4 h-4" />} />
        <KPICard title="Manufacturers" value={`${mfrCount}`} icon={<Factory className="w-4 h-4" />} />
        <KPICard title="Categories" value={`${otcCategories.length}`} icon={<TrendingUp className="w-4 h-4" />} />
      </div>

      {/* Growth winners & losers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <h3 className="text-xs font-semibold text-emerald-700 mb-2.5 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" /> Fastest Growing
          </h3>
          <div className="space-y-2">
            {growthData.growing.map((c, i) => (
              <button key={c.category} onClick={() => setSelectedCat(c.category)} className="w-full flex items-center gap-2 text-left hover:bg-slate-50 rounded-lg p-1 -m-1 transition-colors">
                <span className="text-[10px] font-bold text-emerald-600 w-6">{i + 1}.</span>
                <span className="text-[10px] text-slate-700 flex-1 truncate">{c.category}</span>
                <span className="text-[10px] font-bold text-emerald-600">+{c.valueGrowth.toFixed(1)}%</span>
              </button>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <h3 className="text-xs font-semibold text-red-600 mb-2.5 flex items-center gap-1.5">
            <TrendingDown className="w-3.5 h-3.5" /> Steepest Decline
          </h3>
          <div className="space-y-2">
            {growthData.declining.map((c, i) => (
              <button key={c.category} onClick={() => setSelectedCat(c.category)} className="w-full flex items-center gap-2 text-left hover:bg-slate-50 rounded-lg p-1 -m-1 transition-colors">
                <span className="text-[10px] font-bold text-red-500 w-6">{i + 1}.</span>
                <span className="text-[10px] text-slate-700 flex-1 truncate">{c.category}</span>
                <span className="text-[10px] font-bold text-red-500">{c.valueGrowth.toFixed(1)}%</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search OTC categories..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        />
      </div>

      {/* Category cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredCats.map((cat) => {
          const isSelected = selectedCat === cat.category
          return (
            <button
              key={cat.category}
              onClick={() => setSelectedCat(isSelected ? null : cat.category)}
              className={`bg-white rounded-xl border text-left transition-all group overflow-hidden ${
                isSelected ? 'border-teal-500 shadow-md' : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
              }`}
              style={isSelected ? { boxShadow: `0 0 0 2px #0D948830` } : undefined}
            >
              <div className="h-1 w-full" style={{ backgroundColor: isSelected ? '#0D9488' : '#e2e8f0' }} />
              <div className="p-3 sm:p-4">
                <h3 className="text-xs font-bold text-slate-800 mb-2 leading-tight">{cat.category}</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
                  <div>
                    <span className="text-slate-400">TY Value</span>
                    <p className="font-semibold text-slate-700">{formatCompact(cat.tyValue)}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Growth</span>
                    <p className={`font-bold ${cat.valueGrowth >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {cat.valueGrowth >= 0 ? '+' : ''}{cat.valueGrowth.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Manufacturers</span>
                    <p className="font-semibold text-slate-700">{cat.manufacturerCount}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">SKUs</span>
                    <p className="font-semibold text-slate-700">{formatCompact(cat.skuCount)}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                  <span className="text-[9px] text-slate-400 italic">{isSelected ? 'Click to collapse' : 'Click to drill in'}</span>
                  <ChevronRight className={`w-3 h-3 text-slate-400 transition-transform ${isSelected ? 'rotate-90' : 'group-hover:translate-x-0.5'}`} />
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Drill-in panel */}
      {selectedCat && mfrBreakdown.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-fade-in-up">
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-slate-100 bg-teal-50/30">
            <div>
              <h3 className="text-sm font-bold text-slate-800">{selectedCat}</h3>
              <p className="text-xs text-slate-500">Category deep dive — manufacturers & top SKUs</p>
            </div>
            <button onClick={() => setSelectedCat(null)} className="p-1.5 hover:bg-slate-100 rounded-lg">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Category auto-narrative */}
          {catNarrative && (
            <div className="px-4 sm:px-5 py-3 bg-gradient-to-r from-teal-50/50 to-emerald-50/50 border-b border-slate-100">
              <div className="flex items-start gap-2">
                <Sparkles className="w-3 h-3 text-teal-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-600 leading-relaxed">{catNarrative}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 p-4 sm:p-5">
            {/* Top manufacturers bar */}
            <div>
              <h4 className="text-xs font-semibold text-slate-600 mb-3">Top Manufacturers</h4>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={mfrBreakdown.slice(0, 10)} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 9 }} stroke="#94a3b8" tickFormatter={(v: number) => formatCompact(v)} />
                  <YAxis dataKey="manufacturer" type="category" tick={{ fontSize: 8 }} stroke="#94a3b8" width={100} />
                  <Tooltip formatter={(v) => formatCurrency(Number(v ?? 0))} />
                  <Bar dataKey="tyValue" name="TY Value" radius={[0, 4, 4, 0]} animationDuration={800} animationEasing="ease-out">
                    {mfrBreakdown.slice(0, 10).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Manufacturer share & growth */}
            <div>
              <h4 className="text-xs font-semibold text-slate-600 mb-3">Market Share & Growth</h4>
              <div className="space-y-1.5 max-h-[250px] overflow-y-auto scrollbar-thin">
                {mfrBreakdown.slice(0, 15).map((m, i) => (
                  <div key={m.manufacturer} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-[10px] text-slate-600 flex-1 truncate">{m.manufacturer}</span>
                    <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(m.share, 100)}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-700 w-10 text-right">{m.share.toFixed(1)}%</span>
                    <span className={`text-[9px] font-bold w-11 text-right ${m.valueGrowth >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {m.valueGrowth >= 0 ? '+' : ''}{m.valueGrowth.toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top SKUs */}
            <div className="lg:col-span-2">
              <h4 className="text-xs font-semibold text-slate-600 mb-3">Top SKUs</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left py-1.5 text-slate-500 font-medium">Product</th>
                      <th className="text-right py-1.5 text-slate-500 font-medium w-20">TY Value</th>
                      <th className="text-right py-1.5 text-slate-500 font-medium w-20">LY Value</th>
                      <th className="text-right py-1.5 text-slate-500 font-medium w-16">Growth</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topSkus.map((s) => (
                      <tr key={s.name} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="py-1.5 text-slate-700 truncate max-w-[200px]">{s.name}</td>
                        <td className="text-right py-1.5 font-semibold text-slate-700">{formatCompact(s.tyValue)}</td>
                        <td className="text-right py-1.5 text-slate-500">{formatCompact(s.lyValue)}</td>
                        <td className={`text-right py-1.5 font-bold ${s.growth >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {s.growth >= 0 ? '+' : ''}{s.growth.toFixed(0)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center py-2">
        <p className="text-[9px] text-slate-300">Powered by <span className="font-semibold text-slate-400">NostraData</span></p>
      </div>
    </div>
  )
}
