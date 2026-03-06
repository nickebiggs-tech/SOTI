import { useMemo, useState } from 'react'
import {
  BarChart, Bar, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { Pill, ChevronRight, X, Search, Factory, FlaskConical, Package } from 'lucide-react'
import { useData } from '../../data/DataProvider'
import { KPICard } from '../../components/ui/KPICard'
import { formatCompact, formatCurrency } from '../../lib/formatters'
import type { ManufacturerSummary } from '../../data/types'

const COLORS = ['#2563EB', '#7C3AED', '#D97706', '#0D9488', '#DC2626', '#DB2777', '#EA580C', '#0891B2', '#4F46E5', '#65A30D']

export function DispensePage() {
  const { ethCategories, ethTotalTY, ethTotalLY, state } = useData()
  const [selectedCat, setSelectedCat] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const ethGrowth = ethTotalLY ? ((ethTotalTY - ethTotalLY) / ethTotalLY) * 100 : 0
  const totalUnits = useMemo(() => ethCategories.reduce((s, c) => s + c.tyUnits, 0), [ethCategories])
  const skuCount = useMemo(() => new Set(state.eth.map(r => r.sku)).size, [state.eth])
  const mfrCount = useMemo(() => new Set(state.eth.map(r => r.manufacturer)).size, [state.eth])

  const filteredCats = useMemo(() => {
    if (!search) return ethCategories
    const q = search.toLowerCase()
    return ethCategories.filter(c => c.category.toLowerCase().includes(q))
  }, [ethCategories, search])

  // Drill-in: manufacturer breakdown for selected category
  const mfrBreakdown = useMemo((): ManufacturerSummary[] => {
    if (!selectedCat) return []
    const catData = state.eth.filter(r => r.category === selectedCat)
    const map: Record<string, { tyV: number; lyV: number; tyU: number; lyU: number }> = {}
    catData.forEach(r => {
      if (!map[r.manufacturer]) map[r.manufacturer] = { tyV: 0, lyV: 0, tyU: 0, lyU: 0 }
      const m = map[r.manufacturer]!
      if (r.period === 'APR24-MAR25') { m.tyV += r.sales; m.tyU += r.units }
      else { m.lyV += r.sales; m.lyU += r.units }
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
  }, [selectedCat, state.eth])

  // Monthly trend for selected category
  const monthlyTrend = useMemo(() => {
    if (!selectedCat) return []
    const catData = state.eth.filter(r => r.category === selectedCat)
    const map: Record<number, { sales: number; units: number }> = {}
    catData.forEach(r => {
      if (!map[r.monthId]) map[r.monthId] = { sales: 0, units: 0 }
      map[r.monthId]!.sales += r.sales
      map[r.monthId]!.units += r.units
    })
    return Object.entries(map)
      .map(([id, d]) => ({ monthId: parseInt(id, 10), month: `${id.slice(4)}/${id.slice(2, 4)}`, sales: d.sales, units: d.units }))
      .sort((a, b) => a.monthId - b.monthId)
  }, [selectedCat, state.eth])

  // Top molecules for selected category
  const topMolecules = useMemo(() => {
    if (!selectedCat) return []
    const catData = state.eth.filter(r => r.category === selectedCat && r.period === 'APR24-MAR25')
    const map: Record<string, number> = {}
    catData.forEach(r => { map[r.molecule] = (map[r.molecule] || 0) + r.sales })
    return Object.entries(map).map(([molecule, sales]) => ({ molecule, sales })).sort((a, b) => b.sales - a.sales).slice(0, 10)
  }, [selectedCat, state.eth])

  return (
    <div className="space-y-4 sm:space-y-6 page-enter">
      <div>
        <div className="flex items-center gap-2 mb-0.5 sm:hidden">
          <span className="text-base font-extrabold tracking-tight"><span className="text-primary">SOTI</span></span>
          <span className="text-[8px] text-slate-400 font-semibold uppercase tracking-widest border border-slate-200 rounded px-1.5 py-0.5">Dispense</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 hidden sm:block">Dispense Analytics</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">Prescription market — category, manufacturer & molecule drill-in</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 stagger-children">
        <KPICard title="Rx Market Value" value={formatCompact(ethTotalTY)} delta={ethGrowth} deltaLabel="YoY" icon={<Pill className="w-4 h-4" />} />
        <KPICard title="Total Units" value={formatCompact(totalUnits)} icon={<Package className="w-4 h-4" />} />
        <KPICard title="Manufacturers" value={`${mfrCount}`} icon={<Factory className="w-4 h-4" />} />
        <KPICard title="SKUs" value={formatCompact(skuCount)} icon={<FlaskConical className="w-4 h-4" />} />
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search categories..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        />
      </div>

      {/* Category cards — mobile scrollable, desktop grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredCats.map((cat) => {
          const isSelected = selectedCat === cat.category
          return (
            <button
              key={cat.category}
              onClick={() => setSelectedCat(isSelected ? null : cat.category)}
              className={`bg-white rounded-xl border text-left transition-all group overflow-hidden ${
                isSelected ? 'border-primary shadow-md' : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
              }`}
              style={isSelected ? { boxShadow: `0 0 0 2px #2563EB30` } : undefined}
            >
              <div className="h-1 w-full" style={{ backgroundColor: isSelected ? '#2563EB' : '#e2e8f0' }} />
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
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-slate-100 bg-blue-50/30">
            <div>
              <h3 className="text-sm font-bold text-slate-800">{selectedCat}</h3>
              <p className="text-xs text-slate-500">Category deep dive — manufacturers, molecules & trend</p>
            </div>
            <button onClick={() => setSelectedCat(null)} className="p-1.5 hover:bg-slate-100 rounded-lg">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 p-4 sm:p-5">
            {/* Monthly trend */}
            <div>
              <h4 className="text-xs font-semibold text-slate-600 mb-3">Monthly Sales Trend</h4>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 9 }} stroke="#94a3b8" tickFormatter={(v: number) => formatCompact(v)} />
                  <Tooltip formatter={(v) => formatCurrency(Number(v ?? 0))} />
                  <Line type="monotone" dataKey="sales" stroke="#2563EB" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 5 }} animationDuration={800} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Top manufacturers bar */}
            <div>
              <h4 className="text-xs font-semibold text-slate-600 mb-3">Top Manufacturers</h4>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={mfrBreakdown.slice(0, 8)} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 9 }} stroke="#94a3b8" tickFormatter={(v: number) => formatCompact(v)} />
                  <YAxis dataKey="manufacturer" type="category" tick={{ fontSize: 8 }} stroke="#94a3b8" width={100} />
                  <Tooltip formatter={(v) => formatCurrency(Number(v ?? 0))} />
                  <Bar dataKey="tyValue" name="TY Value" radius={[0, 4, 4, 0]} animationDuration={600}>
                    {mfrBreakdown.slice(0, 8).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top molecules */}
            <div>
              <h4 className="text-xs font-semibold text-slate-600 mb-3">Top Molecules</h4>
              <div className="space-y-1.5">
                {topMolecules.map((m, i) => (
                  <div key={m.molecule} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-[10px] text-slate-600 flex-1 truncate">{m.molecule}</span>
                    <span className="text-[10px] font-semibold text-slate-700">{formatCompact(m.sales)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Manufacturer share table */}
            <div>
              <h4 className="text-xs font-semibold text-slate-600 mb-3">Manufacturer Share & Growth</h4>
              <div className="space-y-1.5 max-h-[200px] overflow-y-auto scrollbar-thin">
                {mfrBreakdown.slice(0, 12).map((m, i) => (
                  <div key={m.manufacturer} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-[10px] text-slate-600 flex-1 truncate">{m.manufacturer}</span>
                    <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${Math.min(m.share, 100)}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-700 w-10 text-right">{m.share.toFixed(1)}%</span>
                    <span className={`text-[9px] font-bold w-11 text-right ${m.valueGrowth >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {m.valueGrowth >= 0 ? '+' : ''}{m.valueGrowth.toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
