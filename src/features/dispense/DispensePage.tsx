import { useMemo, useState, useEffect, useRef } from 'react'
import {
  BarChart, Bar, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { useLocation } from 'react-router-dom'
import { Pill, ChevronRight, ChevronDown, X, Search, Factory, FlaskConical, Package, Sparkles, TrendingUp, TrendingDown, BarChart3, Award, AlertTriangle } from 'lucide-react'
import { useData } from '../../data/DataProvider'
import { KPICard } from '../../components/ui/KPICard'
import { formatCompact, formatCompactDollar, formatCurrency } from '../../lib/formatters'
import type { ManufacturerSummary } from '../../data/types'

const COLORS = ['#2563EB', '#7C3AED', '#D97706', '#0D9488', '#DC2626', '#DB2777', '#EA580C', '#0891B2', '#4F46E5', '#65A30D']

/** IQVIA-grade Dispense market narrative — commercial, actionable, $ denominated */
function generateDispenseNarrative(
  totalTY: number, growth: number,
  categories: { category: string; tyValue: number; lyValue: number; valueGrowth: number; manufacturerCount: number; skuCount: number }[],
  totalUnits: number, mfrCount: number,
): string[] {
  const lines: string[] = []

  const dir = growth >= 0 ? 'grew' : 'contracted'
  lines.push(`The prescription market ${dir} ${Math.abs(growth).toFixed(1)}% YoY to ${formatCompactDollar(totalTY)}, representing ${formatCompact(totalUnits)} dispensed units across ${categories.length} therapeutic categories and ${mfrCount} suppliers. Value growth is outpacing volume — average script value is increasing, driven by specialty therapies.`)

  const growers = [...categories].filter(c => c.valueGrowth > 5 && c.lyValue > 10000).sort((a, b) => b.valueGrowth - a.valueGrowth)
  const decliners = [...categories].filter(c => c.valueGrowth < -5 && c.lyValue > 10000).sort((a, b) => a.valueGrowth - b.valueGrowth)

  if (growers.length > 0 && growers[0]) {
    const incremental = growers[0].tyValue - growers[0].lyValue
    lines.push(`Opportunity: ${growers[0].category} delivered +${growers[0].valueGrowth.toFixed(1)}% growth, adding ${formatCompactDollar(incremental)} in incremental value. Suppliers with exposure to this therapy area should consider increasing sales force allocation and pharmacy engagement programs.`)
  }

  if (decliners.length > 0 && decliners[0]) {
    const valueEroded = Math.abs(decliners[0].tyValue - decliners[0].lyValue)
    lines.push(`Risk: ${decliners[0].category} eroded ${formatCompactDollar(valueEroded)} (${decliners[0].valueGrowth.toFixed(1)}%). ${decliners[0].manufacturerCount} competing suppliers face share compression — recommend portfolio review, promotional intensity assessment, and potential SKU rationalisation.`)
  }

  const topByValue = categories[0]
  if (topByValue) {
    lines.push(`Market leader: ${topByValue.category} holds the largest category value at ${formatCompactDollar(topByValue.tyValue)} with ${topByValue.manufacturerCount} suppliers competing across ${topByValue.skuCount} SKUs. Concentration analysis suggests opportunities for targeted share gains.`)
  }

  return lines
}

export function DispensePage() {
  const { ethCategories, ethTotalTY, ethTotalLY, state } = useData()
  const [selectedCat, setSelectedCat] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selectedMfr, setSelectedMfr] = useState<string | null>(null)
  const [narrativeOpen, setNarrativeOpen] = useState(false)
  const [skuTab, setSkuTab] = useState<'value' | 'growing' | 'declining'>('value')
  const location = useLocation()
  const drillRef = useRef<HTMLDivElement>(null)

  // Navigation state receiver — from Dashboard click-through
  useEffect(() => {
    const navState = location.state as { selectedCategory?: string } | null
    if (navState?.selectedCategory) {
      setSelectedCat(navState.selectedCategory)
      // Clear navigation state so refresh doesn't re-trigger
      window.history.replaceState({}, '')
      setTimeout(() => drillRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300)
    }
  }, [location.state])

  // Reset manufacturer when category changes
  useEffect(() => { setSelectedMfr(null) }, [selectedCat])

  const ethGrowth = ethTotalLY ? ((ethTotalTY - ethTotalLY) / ethTotalLY) * 100 : 0
  const totalUnits = useMemo(() => ethCategories.reduce((s, c) => s + c.tyUnits, 0), [ethCategories])
  const skuCount = useMemo(() => new Set(state.eth.map(r => r.sku)).size, [state.eth])
  const mfrCount = useMemo(() => new Set(state.eth.map(r => r.manufacturer)).size, [state.eth])

  // Auto-narrative
  const narrative = useMemo(() => generateDispenseNarrative(
    ethTotalTY, ethGrowth, ethCategories, totalUnits, mfrCount
  ), [ethTotalTY, ethGrowth, ethCategories, totalUnits, mfrCount])

  // Growth leaders & decliners
  const growthData = useMemo(() => {
    const growing = [...ethCategories].filter(c => c.lyValue > 10000).sort((a, b) => b.valueGrowth - a.valueGrowth).slice(0, 5)
    const declining = [...ethCategories].filter(c => c.lyValue > 10000).sort((a, b) => a.valueGrowth - b.valueGrowth).slice(0, 5)
    return { growing, declining }
  }, [ethCategories])

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

  // Category-specific auto-narrative for drill-in
  const catNarrative = useMemo(() => {
    if (!selectedCat || mfrBreakdown.length === 0) return ''
    const catInfo = ethCategories.find(c => c.category === selectedCat)
    if (!catInfo) return ''
    const topMfr = mfrBreakdown[0]
    if (!topMfr) return ''
    const growthDir = catInfo.valueGrowth >= 0 ? 'grew' : 'declined'
    const incremental = Math.abs(catInfo.tyValue - catInfo.lyValue)
    const action = catInfo.valueGrowth >= 0
      ? `This represents a ${formatCompactDollar(incremental)} growth opportunity for suppliers with competitive positioning.`
      : `${formatCompactDollar(incremental)} in value has shifted — suppliers should assess competitive dynamics and promotional ROI.`
    return `${selectedCat} ${growthDir} ${Math.abs(catInfo.valueGrowth).toFixed(1)}% to ${formatCompactDollar(catInfo.tyValue)}. ${topMfr.manufacturer} leads with ${topMfr.share.toFixed(1)}% share across ${catInfo.manufacturerCount} suppliers and ${catInfo.skuCount} SKUs. ${action}`
  }, [selectedCat, mfrBreakdown, ethCategories])

  // SKU breakdown for selected manufacturer within selected category
  const skuBreakdown = useMemo(() => {
    if (!selectedCat || !selectedMfr) return []
    const catMfrData = state.eth.filter(r => r.category === selectedCat && r.manufacturer === selectedMfr)
    const map: Record<string, { tyV: number; lyV: number; tyU: number; lyU: number; molecule: string }> = {}
    catMfrData.forEach(r => {
      if (!map[r.sku]) map[r.sku] = { tyV: 0, lyV: 0, tyU: 0, lyU: 0, molecule: r.molecule }
      const s = map[r.sku]!
      if (r.period === 'APR24-MAR25') { s.tyV += r.sales; s.tyU += r.units }
      else { s.lyV += r.sales; s.lyU += r.units }
    })
    return Object.entries(map)
      .map(([sku, s]) => ({ sku, molecule: s.molecule, tyValue: s.tyV, lyValue: s.lyV, growth: s.lyV ? ((s.tyV - s.lyV) / s.lyV) * 100 : 0 }))
      .sort((a, b) => b.tyValue - a.tyValue)
  }, [selectedCat, selectedMfr, state.eth])

  // ── Market-wide SKU Intelligence ──
  const skuInsights = useMemo(() => {
    const map: Record<string, { tyV: number; lyV: number; tyU: number; lyU: number; cat: string; mfr: string; mol: string }> = {}
    state.eth.forEach(r => {
      if (!map[r.sku]) map[r.sku] = { tyV: 0, lyV: 0, tyU: 0, lyU: 0, cat: r.category, mfr: r.manufacturer, mol: r.molecule }
      const s = map[r.sku]!
      if (r.period === 'APR24-MAR25') { s.tyV += r.sales; s.tyU += r.units }
      else { s.lyV += r.sales; s.lyU += r.units }
    })
    const all = Object.entries(map).map(([sku, s]) => ({
      sku, category: s.cat, manufacturer: s.mfr, molecule: s.mol,
      tyValue: s.tyV, lyValue: s.lyV, tyUnits: s.tyU, lyUnits: s.lyU,
      growth: s.lyV ? ((s.tyV - s.lyV) / s.lyV) * 100 : 999,
      absChange: s.tyV - s.lyV,
    }))
    const byValue = [...all].sort((a, b) => b.tyValue - a.tyValue)
    const growing = [...all].filter(s => s.lyValue > 5000 && s.growth < 900).sort((a, b) => b.growth - a.growth).slice(0, 15)
    const declining = [...all].filter(s => s.lyValue > 5000 && s.growth < 900).sort((a, b) => a.absChange - b.absChange).slice(0, 15)
    // Pareto: how many SKUs account for 80% of market value
    const totalTY = byValue.reduce((s, r) => s + r.tyValue, 0)
    let cum = 0, p80 = 0
    for (const s of byValue) { cum += s.tyValue; p80++; if (cum >= totalTY * 0.8) break }
    return {
      total: all.length,
      byValue: byValue.slice(0, 15),
      growing,
      declining,
      pareto80: { count: p80, pct: all.length ? (p80 / all.length) * 100 : 0 },
    }
  }, [state.eth])

  const activeSkuList = skuTab === 'value' ? skuInsights.byValue : skuTab === 'growing' ? skuInsights.growing : skuInsights.declining

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
        <KPICard title="Rx Market Value" value={formatCompactDollar(ethTotalTY)} delta={ethGrowth} deltaLabel="YoY" icon={<Pill className="w-4 h-4" />} />
        <KPICard title="Total Units" value={formatCompact(totalUnits)} icon={<Package className="w-4 h-4" />} />
        <KPICard title="Manufacturers" value={`${mfrCount}`} icon={<Factory className="w-4 h-4" />} />
        <KPICard title="SKUs" value={formatCompact(skuCount)} icon={<FlaskConical className="w-4 h-4" />} />
      </div>

      {/* Market Narrative — compact collapsible */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-xl overflow-hidden">
        <button onClick={() => setNarrativeOpen(v => !v)} className="w-full p-3 sm:p-4 flex items-start gap-3 text-left cursor-pointer">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-[9px] font-semibold uppercase tracking-widest text-amber-400/80">Market Narrative</span>
            <p className="text-[11px] sm:text-xs text-white/75 leading-relaxed mt-1 line-clamp-2">{narrative[0]}</p>
          </div>
          <ChevronDown className={`w-4 h-4 text-white/40 shrink-0 mt-0.5 transition-transform duration-200 ${narrativeOpen ? 'rotate-180' : ''}`} />
        </button>
        {narrativeOpen && (
          <div className="px-3 sm:px-4 pb-3 sm:pb-4 space-y-2 border-t border-white/10 pt-3 ml-[26px] sm:ml-[30px]">
            {narrative.slice(1).map((line, i) => (
              <p key={i} className="text-[11px] text-white/60 leading-relaxed">{line}</p>
            ))}
            <p className="text-[8px] text-white/25 mt-2">Powered by NostraData</p>
          </div>
        )}
      </div>

      {/* Growth winners & losers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <h3 className="text-xs font-semibold text-emerald-700 mb-2.5 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" /> Growth Leaders
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
            <TrendingDown className="w-3.5 h-3.5" /> Under Pressure
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

      {/* ── SKU Intelligence ── */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-fade-in-up" style={{ animationDelay: '300ms' }}>
        <div className="px-4 sm:px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-violet-50/60 to-indigo-50/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-violet-600" />
              <h3 className="text-xs font-bold text-slate-800">SKU Intelligence</h3>
              <span className="text-[8px] bg-violet-100 text-violet-600 font-semibold px-1.5 py-0.5 rounded">{formatCompact(skuInsights.total)} SKUs</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[8px] text-slate-400">Pareto:</span>
              <span className="text-[9px] font-bold text-violet-600">{skuInsights.pareto80.count} SKUs = 80% value</span>
              <span className="text-[8px] text-slate-400">({skuInsights.pareto80.pct.toFixed(1)}% of portfolio)</span>
            </div>
          </div>
        </div>
        {/* Tab buttons */}
        <div className="flex border-b border-slate-100">
          {([
            { key: 'value' as const, label: 'Highest Value', icon: <Award className="w-3 h-3" /> },
            { key: 'growing' as const, label: 'Fastest Growing', icon: <TrendingUp className="w-3 h-3" /> },
            { key: 'declining' as const, label: 'At Risk', icon: <AlertTriangle className="w-3 h-3" /> },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setSkuTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-semibold transition-colors ${
                skuTab === tab.key
                  ? 'text-violet-700 border-b-2 border-violet-600 bg-violet-50/40'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
        {/* SKU table */}
        <div className="p-4 sm:p-5 overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-1.5 text-slate-500 font-medium w-6">#</th>
                <th className="text-left py-1.5 text-slate-500 font-medium">SKU</th>
                <th className="text-left py-1.5 text-slate-500 font-medium w-20 hidden sm:table-cell">Molecule</th>
                <th className="text-left py-1.5 text-slate-500 font-medium w-24 hidden md:table-cell">Manufacturer</th>
                <th className="text-left py-1.5 text-slate-500 font-medium w-20 hidden lg:table-cell">Category</th>
                <th className="text-right py-1.5 text-slate-500 font-medium w-18">TY Value</th>
                <th className="text-right py-1.5 text-slate-500 font-medium w-18 hidden sm:table-cell">LY Value</th>
                <th className="text-right py-1.5 text-slate-500 font-medium w-16">Growth</th>
              </tr>
            </thead>
            <tbody>
              {activeSkuList.map((s, i) => (
                <tr key={s.sku} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="py-1.5 text-slate-400 font-bold">{i + 1}</td>
                  <td className="py-1.5 text-slate-700 truncate max-w-[200px] font-medium">{s.sku}</td>
                  <td className="py-1.5 text-slate-500 truncate hidden sm:table-cell text-[9px]">{s.molecule}</td>
                  <td className="py-1.5 text-slate-500 truncate hidden md:table-cell text-[9px]">{s.manufacturer}</td>
                  <td className="py-1.5 text-slate-400 truncate hidden lg:table-cell text-[9px]">{s.category}</td>
                  <td className="text-right py-1.5 font-semibold text-slate-700">{formatCompactDollar(s.tyValue)}</td>
                  <td className="text-right py-1.5 text-slate-500 hidden sm:table-cell">{formatCompactDollar(s.lyValue)}</td>
                  <td className={`text-right py-1.5 font-bold ${s.growth >= 0 && s.growth < 900 ? 'text-emerald-600' : s.growth >= 900 ? 'text-blue-500' : 'text-red-500'}`}>
                    {s.growth >= 900 ? 'New' : `${s.growth >= 0 ? '+' : ''}${s.growth.toFixed(0)}%`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {skuTab === 'declining' && activeSkuList.length > 0 && (
            <div className="mt-3 flex items-start gap-2 bg-red-50/60 rounded-lg p-2.5">
              <AlertTriangle className="w-3 h-3 text-red-500 shrink-0 mt-0.5" />
              <p className="text-[9px] text-red-600/80 leading-relaxed">
                These SKUs are losing the most absolute value YoY. Consider portfolio rationalisation, promotional intervention, or competitive displacement analysis.
              </p>
            </div>
          )}
          {skuTab === 'growing' && activeSkuList.length > 0 && (
            <div className="mt-3 flex items-start gap-2 bg-emerald-50/60 rounded-lg p-2.5">
              <TrendingUp className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-[9px] text-emerald-700/80 leading-relaxed">
                High-growth SKUs represent incremental value opportunities. Suppliers should assess distribution gaps and invest in pharmacy engagement to accelerate adoption.
              </p>
            </div>
          )}
        </div>
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

      {/* Category cards */}
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
                    <p className="font-semibold text-slate-700">{formatCompactDollar(cat.tyValue)}</p>
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
        <div ref={drillRef} className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-fade-in-up">
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-slate-100 bg-blue-50/30">
            <div>
              <h3 className="text-sm font-bold text-slate-800">{selectedCat}</h3>
              <p className="text-xs text-slate-500">Category deep dive — manufacturers, molecules & trend</p>
            </div>
            <button onClick={() => setSelectedCat(null)} className="p-1.5 hover:bg-slate-100 rounded-lg">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Category auto-narrative */}
          {catNarrative && (
            <div className="px-4 sm:px-5 py-3 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border-b border-slate-100">
              <div className="flex items-start gap-2">
                <Sparkles className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-600 leading-relaxed">{catNarrative}</p>
              </div>
            </div>
          )}

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
                  <Line type="monotone" dataKey="sales" stroke="#2563EB" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 5, strokeWidth: 2 }} animationDuration={1200} animationEasing="ease-out" />
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
                  <Bar dataKey="tyValue" name="TY Value" radius={[0, 4, 4, 0]} animationDuration={800} animationEasing="ease-out">
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

            {/* Manufacturer share table — click to drill into SKUs */}
            <div>
              <h4 className="text-xs font-semibold text-slate-600 mb-3">Manufacturer Share & Growth</h4>
              <div className="space-y-1 max-h-[220px] overflow-y-auto scrollbar-thin">
                {mfrBreakdown.slice(0, 12).map((m, i) => {
                  const isSel = selectedMfr === m.manufacturer
                  return (
                    <button
                      key={m.manufacturer}
                      onClick={() => setSelectedMfr(isSel ? null : m.manufacturer)}
                      className={`w-full flex items-center gap-2 rounded-lg p-1.5 -mx-1 transition-colors cursor-pointer ${isSel ? 'bg-blue-50 ring-1 ring-blue-200' : 'hover:bg-slate-50'}`}
                    >
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-[10px] text-slate-600 flex-1 truncate text-left">{m.manufacturer}</span>
                      <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(m.share, 100)}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                      </div>
                      <span className="text-[10px] font-bold text-slate-700 w-10 text-right">{m.share.toFixed(1)}%</span>
                      <span className={`text-[9px] font-bold w-11 text-right ${m.valueGrowth >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {m.valueGrowth >= 0 ? '+' : ''}{m.valueGrowth.toFixed(0)}%
                      </span>
                      <ChevronDown className={`w-3 h-3 text-slate-400 shrink-0 transition-transform ${isSel ? 'rotate-180' : ''}`} />
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* SKU breakdown for selected manufacturer */}
          {selectedMfr && skuBreakdown.length > 0 && (
            <div className="border-t border-slate-100 p-4 sm:p-5 animate-fade-in-up">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-xs font-semibold text-slate-700">{selectedMfr} — SKU Breakdown</h4>
                  <p className="text-[9px] text-slate-400 mt-0.5">{skuBreakdown.length} SKUs in {selectedCat}</p>
                </div>
                <button onClick={() => setSelectedMfr(null)} className="text-[9px] text-primary hover:underline">
                  Clear
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left py-1.5 text-slate-500 font-medium">SKU</th>
                      <th className="text-left py-1.5 text-slate-500 font-medium w-24">Molecule</th>
                      <th className="text-right py-1.5 text-slate-500 font-medium w-20">TY Value</th>
                      <th className="text-right py-1.5 text-slate-500 font-medium w-20">LY Value</th>
                      <th className="text-right py-1.5 text-slate-500 font-medium w-16">Growth</th>
                    </tr>
                  </thead>
                  <tbody>
                    {skuBreakdown.slice(0, 20).map((s) => (
                      <tr key={s.sku} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="py-1.5 text-slate-700 truncate max-w-[220px]">{s.sku}</td>
                        <td className="py-1.5 text-slate-500 truncate">{s.molecule}</td>
                        <td className="text-right py-1.5 font-semibold text-slate-700">{formatCompactDollar(s.tyValue)}</td>
                        <td className="text-right py-1.5 text-slate-500">{formatCompactDollar(s.lyValue)}</td>
                        <td className={`text-right py-1.5 font-bold ${s.growth >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {s.growth >= 0 ? '+' : ''}{s.growth.toFixed(0)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="text-center py-2">
        <p className="text-[9px] text-slate-300">Powered by <span className="font-semibold text-slate-400">NostraData</span></p>
      </div>
    </div>
  )
}
