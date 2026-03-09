import React, { useMemo, useState, useEffect, useRef } from 'react'
import {
  BarChart, Bar, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { useLocation } from 'react-router-dom'
import { Pill, ChevronRight, ChevronDown, X, Search, Factory, FlaskConical, Package, Sparkles, TrendingUp, TrendingDown, BarChart3, Award, AlertTriangle, Target, DollarSign } from 'lucide-react'
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
  const [selectedSku, setSelectedSku] = useState<string | null>(null)
  const [catTab, setCatTab] = useState<'leaders' | 'gainers' | 'decliners'>('leaders')
  const location = useLocation()
  const drillRef = useRef<HTMLDivElement>(null)
  const skipMfrReset = useRef(false)

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

  // Reset manufacturer when category changes (skip when drilling from SKU Intelligence)
  useEffect(() => {
    if (skipMfrReset.current) { skipMfrReset.current = false; return }
    setSelectedMfr(null)
  }, [selectedCat])
  useEffect(() => { setSelectedSku(null) }, [selectedMfr])

  const { loadMonthlyData } = useData()
  useEffect(() => { loadMonthlyData() }, [loadMonthlyData])

  const ethGrowth = ethTotalLY ? ((ethTotalTY - ethTotalLY) / ethTotalLY) * 100 : 0
  const totalUnits = useMemo(() => ethCategories.reduce((s, c) => s + c.tyUnits, 0), [ethCategories])
  const skuCount = state.ethSkus.length
  const mfrCount = useMemo(() => new Set(state.ethSkus.map(r => r.manufacturer)).size, [state.ethSkus])

  // Auto-narrative
  const narrative = useMemo(() => generateDispenseNarrative(
    ethTotalTY, ethGrowth, ethCategories, totalUnits, mfrCount
  ), [ethTotalTY, ethGrowth, ethCategories, totalUnits, mfrCount])

  // Growth leaders & decliners
  // Category landscape — absolute $ movers & market share
  const categoryMovers = useMemo(() => {
    const withMeta = ethCategories
      .filter(c => c.lyValue > 5000)
      .map(c => ({
        ...c,
        absChange: c.tyValue - c.lyValue,
        shareOfMarket: ethTotalTY ? (c.tyValue / ethTotalTY) * 100 : 0,
      }))
    const topByValue = [...withMeta].sort((a, b) => b.tyValue - a.tyValue).slice(0, 10)
    const biggestGainers = [...withMeta].filter(c => c.absChange > 0).sort((a, b) => b.absChange - a.absChange).slice(0, 8)
    const biggestDecliners = [...withMeta].filter(c => c.absChange < 0).sort((a, b) => a.absChange - b.absChange).slice(0, 8)
    return { topByValue, biggestGainers, biggestDecliners }
  }, [ethCategories, ethTotalTY])

  const activeCatList = catTab === 'leaders' ? categoryMovers.topByValue : catTab === 'gainers' ? categoryMovers.biggestGainers : categoryMovers.biggestDecliners

  const filteredCats = useMemo(() => {
    if (!search) return ethCategories
    const q = search.toLowerCase()
    return ethCategories.filter(c => c.category.toLowerCase().includes(q))
  }, [ethCategories, search])

  // Drill-in: manufacturer breakdown for selected category (from SKU data)
  const mfrBreakdown = useMemo((): ManufacturerSummary[] => {
    if (!selectedCat) return []
    const catData = state.ethSkus.filter(r => r.category === selectedCat)
    const map: Record<string, { tyV: number; lyV: number; tyU: number; lyU: number }> = {}
    catData.forEach(r => {
      if (!map[r.manufacturer]) map[r.manufacturer] = { tyV: 0, lyV: 0, tyU: 0, lyU: 0 }
      const m = map[r.manufacturer]!
      m.tyV += r.tyValue; m.tyU += r.tyUnits
      m.lyV += r.lyValue; m.lyU += r.lyUnits
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
  }, [selectedCat, state.ethSkus])

  // Monthly trend for selected category (requires lazy-loaded monthly data)
  const monthlyTrend = useMemo(() => {
    if (!selectedCat || !state.ethMonthly) return []
    const catData = state.ethMonthly.filter(r => r.category === selectedCat)
    const map: Record<number, { sales: number; units: number }> = {}
    catData.forEach(r => {
      if (!map[r.monthId]) map[r.monthId] = { sales: 0, units: 0 }
      map[r.monthId]!.sales += r.sales
      map[r.monthId]!.units += r.units
    })
    return Object.entries(map)
      .map(([id, d]) => ({ monthId: parseInt(id, 10), month: `${id.slice(4)}/${id.slice(2, 4)}`, sales: d.sales, units: d.units }))
      .sort((a, b) => a.monthId - b.monthId)
  }, [selectedCat, state.ethMonthly])

  // Top molecules for selected category (from SKU data — TY values)
  const topMolecules = useMemo(() => {
    if (!selectedCat) return []
    const catData = state.ethSkus.filter(r => r.category === selectedCat)
    const map: Record<string, number> = {}
    catData.forEach(r => { map[r.molecule] = (map[r.molecule] || 0) + r.tyValue })
    return Object.entries(map).map(([molecule, sales]) => ({ molecule, sales })).sort((a, b) => b.sales - a.sales).slice(0, 10)
  }, [selectedCat, state.ethSkus])

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

  // Growth drivers — which manufacturers are driving category movement
  const growthDrivers = useMemo(() => {
    if (!selectedCat || mfrBreakdown.length === 0) return { gainers: [], decliners: [] }
    const withChange = mfrBreakdown.map(m => ({ ...m, absChange: m.tyValue - m.lyValue }))
    return {
      gainers: withChange.filter(m => m.absChange > 0).sort((a, b) => b.absChange - a.absChange).slice(0, 5),
      decliners: withChange.filter(m => m.absChange < 0).sort((a, b) => a.absChange - b.absChange).slice(0, 5),
    }
  }, [selectedCat, mfrBreakdown])

  // SKU breakdown for selected manufacturer within selected category (from SKU data)
  const skuBreakdown = useMemo(() => {
    if (!selectedCat || !selectedMfr) return []
    return state.ethSkus
      .filter(r => r.category === selectedCat && r.manufacturer === selectedMfr)
      .map(r => ({ sku: r.sku, molecule: r.molecule, tyValue: r.tyValue, lyValue: r.lyValue, growth: r.lyValue ? ((r.tyValue - r.lyValue) / r.lyValue) * 100 : 0 }))
      .sort((a, b) => b.tyValue - a.tyValue)
  }, [selectedCat, selectedMfr, state.ethSkus])

  // ── Market-wide SKU Intelligence (from pre-aggregated SKU data) ──
  const skuInsights = useMemo(() => {
    const all = state.ethSkus.map(r => ({
      sku: r.sku, category: r.category, manufacturer: r.manufacturer, molecule: r.molecule,
      tyValue: r.tyValue, lyValue: r.lyValue, tyUnits: r.tyUnits, lyUnits: r.lyUnits,
      growth: r.lyValue ? ((r.tyValue - r.lyValue) / r.lyValue) * 100 : 999,
      absChange: r.tyValue - r.lyValue,
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
  }, [state.ethSkus])

  const activeSkuList = skuTab === 'value' ? skuInsights.byValue : skuTab === 'growing' ? skuInsights.growing : skuInsights.declining

  // Drill from SKU Intelligence → category + manufacturer context
  const drillToSku = (category: string, manufacturer: string) => {
    skipMfrReset.current = true
    setSelectedCat(category)
    setSelectedMfr(manufacturer)
    setTimeout(() => drillRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300)
  }

  // Per-SKU monthly trend (requires lazy-loaded monthly data)
  const skuMonthlyTrend = useMemo(() => {
    if (!selectedCat || !selectedMfr || !selectedSku || !state.ethMonthly) return []
    const skuData = state.ethMonthly.filter(r => r.sku === selectedSku && r.category === selectedCat)
    const map: Record<number, { sales: number; units: number }> = {}
    skuData.forEach(r => {
      if (!map[r.monthId]) map[r.monthId] = { sales: 0, units: 0 }
      map[r.monthId]!.sales += r.sales
      map[r.monthId]!.units += r.units
    })
    return Object.entries(map)
      .map(([id, d]) => ({ monthId: parseInt(id, 10), month: `${id.slice(4)}/${id.slice(2, 4)}`, sales: d.sales, units: d.units }))
      .sort((a, b) => a.monthId - b.monthId)
  }, [selectedCat, selectedMfr, selectedSku, state.ethMonthly])

  return (
    <div className="space-y-4 sm:space-y-6 page-enter">
      <div>
        <div className="flex items-center gap-2 mb-0.5 sm:hidden">
          <span className="text-base font-extrabold tracking-tight"><span className="text-primary">SOTI</span></span>
          <span className="text-[7px] text-slate-400 font-medium uppercase tracking-wider">Dispense</span>
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

      {/* ── Category Landscape ── */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <div className="px-3 sm:px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-blue-50/60 to-indigo-50/40">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Target className="w-4 h-4 text-primary shrink-0" />
            <h3 className="text-[11px] sm:text-xs font-bold text-slate-800">Category Landscape</h3>
            <span className="text-[7px] sm:text-[8px] bg-blue-100 text-blue-700 font-semibold px-1 sm:px-1.5 py-0.5 rounded">{ethCategories.length} categories</span>
          </div>
        </div>
        <div className="flex border-b border-slate-100">
          {([
            { key: 'leaders' as const, label: 'Leaders', fullLabel: 'Market Leaders', icon: <Award className="w-3 h-3" /> },
            { key: 'gainers' as const, label: '$ Gains', fullLabel: 'Biggest $ Gains', icon: <TrendingUp className="w-3 h-3" /> },
            { key: 'decliners' as const, label: '$ Losses', fullLabel: 'Biggest $ Losses', icon: <TrendingDown className="w-3 h-3" /> },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setCatTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1 sm:gap-1.5 py-3 text-[9px] sm:text-[10px] font-semibold transition-colors ${
                catTab === tab.key
                  ? 'text-primary border-b-2 border-primary bg-blue-50/40'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.icon} <span className="sm:hidden">{tab.label}</span><span className="hidden sm:inline">{tab.fullLabel}</span>
            </button>
          ))}
        </div>
        <div className="p-3 sm:p-5">
          <div className="space-y-1">
            {activeCatList.map((c, i) => {
              const isGainerTab = catTab === 'gainers'
              const isDeclinerTab = catTab === 'decliners'
              const maxVal = activeCatList[0]?.tyValue || 1
              const barWidth = (c.tyValue / maxVal) * 100
              return (
                <button
                  key={c.category}
                  onClick={() => { setSelectedCat(c.category); setTimeout(() => drillRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300) }}
                  className={`w-full text-left rounded-lg p-2 sm:p-2.5 transition-colors cursor-pointer group ${
                    selectedCat === c.category ? 'bg-blue-50 ring-1 ring-blue-200' : 'hover:bg-slate-50 active:bg-blue-50/50'
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-[10px] font-bold text-slate-400 w-4 shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] sm:text-[11px] font-semibold text-slate-800 truncate group-hover:text-primary">{c.category}</span>
                        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                          {(isGainerTab || isDeclinerTab) && (
                            <span className={`text-[10px] sm:text-[11px] font-bold ${c.absChange >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                              {c.absChange >= 0 ? '+' : ''}{formatCompactDollar(c.absChange)}
                            </span>
                          )}
                          <span className="text-[9px] sm:text-[10px] font-semibold text-slate-600 hidden sm:inline">{formatCompactDollar(c.tyValue)}</span>
                          <span className="text-[9px] sm:text-[10px] font-semibold text-slate-600 sm:hidden">{formatCompactDollar(c.tyValue)}</span>
                          <span className={`text-[9px] font-bold w-12 text-right ${c.valueGrowth >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {c.valueGrowth >= 0 ? '+' : ''}{c.valueGrowth.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${barWidth}%`,
                              backgroundColor: isDeclinerTab ? '#DC2626' : isGainerTab ? '#059669' : COLORS[i % COLORS.length],
                            }}
                          />
                        </div>
                        <span className="text-[8px] text-slate-400 w-10 text-right shrink-0">{c.shareOfMarket.toFixed(1)}%</span>
                      </div>
                    </div>
                    <ChevronRight className="w-3 h-3 text-slate-300 shrink-0 group-hover:text-primary transition-colors" />
                  </div>
                </button>
              )
            })}
          </div>
          <p className="mt-2 text-[8px] text-blue-400 italic">Tap any category to drill into manufacturer & SKU drivers</p>
        </div>
      </div>

      {/* ── SKU Intelligence ── */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-fade-in-up" style={{ animationDelay: '300ms' }}>
        <div className="px-3 sm:px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-violet-50/60 to-indigo-50/40">
          <div className="flex items-center justify-between flex-wrap gap-1.5">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <BarChart3 className="w-4 h-4 text-violet-600 shrink-0" />
              <h3 className="text-[11px] sm:text-xs font-bold text-slate-800">SKU Intelligence</h3>
              <span className="text-[7px] sm:text-[8px] bg-violet-100 text-violet-600 font-semibold px-1 sm:px-1.5 py-0.5 rounded">{formatCompact(skuInsights.total)} SKUs</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5">
              <span className="text-[8px] text-slate-400 hidden sm:inline">Pareto:</span>
              <span className="text-[8px] sm:text-[9px] font-bold text-violet-600">{skuInsights.pareto80.count} SKUs = 80%</span>
              <span className="text-[7px] sm:text-[8px] text-slate-400 hidden sm:inline">({skuInsights.pareto80.pct.toFixed(1)}%)</span>
            </div>
          </div>
        </div>
        {/* Tab buttons */}
        <div className="flex border-b border-slate-100">
          {([
            { key: 'value' as const, label: 'Top Value', fullLabel: 'Highest Value', icon: <Award className="w-3 h-3" /> },
            { key: 'growing' as const, label: 'Growing', fullLabel: 'Fastest Growing', icon: <TrendingUp className="w-3 h-3" /> },
            { key: 'declining' as const, label: 'At Risk', fullLabel: 'At Risk', icon: <AlertTriangle className="w-3 h-3" /> },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setSkuTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1 sm:gap-1.5 py-3 text-[9px] sm:text-[10px] font-semibold transition-colors ${
                skuTab === tab.key
                  ? 'text-violet-700 border-b-2 border-violet-600 bg-violet-50/40'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.icon} <span className="sm:hidden">{tab.label}</span><span className="hidden sm:inline">{tab.fullLabel}</span>
            </button>
          ))}
        </div>
        {/* SKU table */}
        <div className="p-3 sm:p-5 overflow-x-auto">
          <table className="w-full text-[9px] sm:text-[10px]">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2 text-slate-500 font-medium w-5 sm:w-6">#</th>
                <th className="text-left py-2 text-slate-500 font-medium">SKU</th>
                <th className="text-left py-2 text-slate-500 font-medium w-20 hidden sm:table-cell">Molecule</th>
                <th className="text-left py-2 text-slate-500 font-medium w-24 hidden md:table-cell">Manufacturer</th>
                <th className="text-left py-2 text-slate-500 font-medium w-20 hidden lg:table-cell">Category</th>
                <th className="text-right py-2 text-slate-500 font-medium w-16 sm:w-18">Value</th>
                <th className="text-right py-2 text-slate-500 font-medium w-18 hidden sm:table-cell">LY Value</th>
                <th className="text-right py-2 text-slate-500 font-medium w-14 sm:w-16">Chg</th>
              </tr>
            </thead>
            <tbody>
              {activeSkuList.map((s, i) => (
                <tr key={s.sku} onClick={() => drillToSku(s.category, s.manufacturer)} className="border-b border-slate-50 hover:bg-violet-50/60 active:bg-violet-100/60 transition-colors cursor-pointer group" title={`Drill into ${s.category} → ${s.manufacturer}`}>
                  <td className="py-2.5 sm:py-2 text-slate-400 font-bold">{i + 1}</td>
                  <td className="py-2.5 sm:py-2 text-slate-700 truncate max-w-[120px] sm:max-w-[200px] font-medium group-hover:text-violet-700">{s.sku}</td>
                  <td className="py-2.5 sm:py-2 text-slate-500 truncate hidden sm:table-cell text-[9px]">{s.molecule}</td>
                  <td className="py-2.5 sm:py-2 text-slate-500 truncate hidden md:table-cell text-[9px]">{s.manufacturer}</td>
                  <td className="py-2.5 sm:py-2 text-slate-400 truncate hidden lg:table-cell text-[9px]">{s.category}</td>
                  <td className="text-right py-2.5 sm:py-2 font-semibold text-slate-700">{formatCompactDollar(s.tyValue)}</td>
                  <td className="text-right py-2.5 sm:py-2 text-slate-500 hidden sm:table-cell">{formatCompactDollar(s.lyValue)}</td>
                  <td className={`text-right py-2.5 sm:py-2 font-bold ${s.growth >= 0 && s.growth < 900 ? 'text-emerald-600' : s.growth >= 900 ? 'text-blue-500' : 'text-red-500'}`}>
                    {s.growth >= 900 ? 'New' : `${s.growth >= 0 ? '+' : ''}${s.growth.toFixed(0)}%`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-[8px] text-violet-400 italic">Tap any row to drill into its category & manufacturer</p>
          {skuTab === 'declining' && activeSkuList.length > 0 && (
            <div className="mt-2 flex items-start gap-2 bg-red-50/60 rounded-lg p-2.5">
              <AlertTriangle className="w-3 h-3 text-red-500 shrink-0 mt-0.5" />
              <p className="text-[9px] text-red-600/80 leading-relaxed">
                These SKUs are losing the most absolute value YoY. Consider portfolio rationalisation, promotional intervention, or competitive displacement analysis.
              </p>
            </div>
          )}
          {skuTab === 'growing' && activeSkuList.length > 0 && (
            <div className="mt-2 flex items-start gap-2 bg-emerald-50/60 rounded-lg p-2.5">
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

      {/* Category cards with inline drill-in */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredCats.map((cat) => {
          const isSelected = selectedCat === cat.category
          return (
            <React.Fragment key={cat.category}>
            <button
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
            {/* Inline drill-in panel — appears directly below selected category */}
            {isSelected && mfrBreakdown.length > 0 && (
            <div ref={drillRef} className="col-span-1 sm:col-span-2 lg:col-span-3 bg-white rounded-xl border border-slate-200 overflow-hidden animate-fade-in-up">
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

          {/* Growth Drivers — which manufacturers are driving the movement */}
          {(growthDrivers.gainers.length > 0 || growthDrivers.decliners.length > 0) && (
            <div className="px-4 sm:px-5 py-3 border-b border-slate-100">
              <div className="flex items-center gap-1.5 mb-2">
                <DollarSign className="w-3 h-3 text-primary" />
                <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-wide">Value Drivers</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {growthDrivers.gainers.length > 0 && (
                  <div>
                    <p className="text-[8px] font-semibold text-emerald-600 uppercase tracking-wider mb-1.5">Growth Contributors</p>
                    <div className="space-y-1">
                      {growthDrivers.gainers.map(m => (
                        <button key={m.manufacturer} onClick={() => setSelectedMfr(m.manufacturer)} className="w-full flex items-center gap-1.5 text-left hover:bg-emerald-50 active:bg-emerald-100/50 rounded p-1 -mx-1 transition-colors">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          <span className="text-[9px] text-slate-600 flex-1 truncate">{m.manufacturer}</span>
                          <span className="text-[9px] font-bold text-emerald-600">+{formatCompactDollar(m.absChange)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {growthDrivers.decliners.length > 0 && (
                  <div>
                    <p className="text-[8px] font-semibold text-red-500 uppercase tracking-wider mb-1.5">Value Erosion</p>
                    <div className="space-y-1">
                      {growthDrivers.decliners.map(m => (
                        <button key={m.manufacturer} onClick={() => setSelectedMfr(m.manufacturer)} className="w-full flex items-center gap-1.5 text-left hover:bg-red-50 active:bg-red-100/50 rounded p-1 -mx-1 transition-colors">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                          <span className="text-[9px] text-slate-600 flex-1 truncate">{m.manufacturer}</span>
                          <span className="text-[9px] font-bold text-red-500">{formatCompactDollar(m.absChange)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
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
              <div className="space-y-0.5 max-h-[280px] overflow-y-auto scrollbar-thin">
                {mfrBreakdown.slice(0, 12).map((m, i) => {
                  const isSel = selectedMfr === m.manufacturer
                  const absChange = m.tyValue - m.lyValue
                  return (
                    <button
                      key={m.manufacturer}
                      onClick={() => setSelectedMfr(isSel ? null : m.manufacturer)}
                      className={`w-full flex items-center gap-1.5 sm:gap-2 rounded-lg py-2.5 sm:py-1.5 px-1.5 -mx-1 transition-colors cursor-pointer ${isSel ? 'bg-blue-50 ring-1 ring-blue-200' : 'hover:bg-slate-50 active:bg-slate-100'}`}
                    >
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-[9px] sm:text-[10px] text-slate-600 flex-1 truncate text-left">{m.manufacturer}</span>
                      <span className="text-[8px] sm:text-[9px] font-semibold text-slate-500 w-12 text-right hidden sm:block">{formatCompactDollar(m.tyValue)}</span>
                      <span className={`text-[8px] sm:text-[9px] font-bold w-14 text-right hidden sm:block ${absChange >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {absChange >= 0 ? '+' : ''}{formatCompactDollar(absChange)}
                      </span>
                      <div className="w-10 h-1.5 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(m.share, 100)}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                      </div>
                      <span className="text-[9px] sm:text-[10px] font-bold text-slate-700 w-10 text-right">{m.share.toFixed(1)}%</span>
                      <span className={`text-[8px] sm:text-[9px] font-bold w-10 sm:w-11 text-right ${m.valueGrowth >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
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
                      <th className="text-left py-1.5 text-slate-500 font-medium w-24 hidden sm:table-cell">Molecule</th>
                      <th className="text-right py-1.5 text-slate-500 font-medium w-16 sm:w-20">Value</th>
                      <th className="text-right py-1.5 text-slate-500 font-medium w-20 hidden sm:table-cell">LY Value</th>
                      <th className="text-right py-1.5 text-slate-500 font-medium w-18 hidden sm:table-cell">$ Change</th>
                      <th className="text-right py-1.5 text-slate-500 font-medium w-14 sm:w-16">Chg</th>
                    </tr>
                  </thead>
                  <tbody>
                    {skuBreakdown.slice(0, 20).map((s) => {
                      const absChange = s.tyValue - s.lyValue
                      return (
                      <tr
                        key={s.sku}
                        onClick={() => setSelectedSku(selectedSku === s.sku ? null : s.sku)}
                        className={`border-b border-slate-50 transition-colors cursor-pointer ${selectedSku === s.sku ? 'bg-blue-50 ring-1 ring-blue-200' : 'hover:bg-slate-50/50 active:bg-blue-50/50'}`}
                        title="Tap to view monthly trend"
                      >
                        <td className="py-2.5 sm:py-1.5 text-slate-700 truncate max-w-[140px] sm:max-w-[220px] text-[9px] sm:text-[10px]">{s.sku}</td>
                        <td className="py-2.5 sm:py-1.5 text-slate-500 truncate hidden sm:table-cell">{s.molecule}</td>
                        <td className="text-right py-2.5 sm:py-1.5 font-semibold text-slate-700">{formatCompactDollar(s.tyValue)}</td>
                        <td className="text-right py-2.5 sm:py-1.5 text-slate-500 hidden sm:table-cell">{formatCompactDollar(s.lyValue)}</td>
                        <td className={`text-right py-2.5 sm:py-1.5 font-bold hidden sm:table-cell ${absChange >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {absChange >= 0 ? '+' : ''}{formatCompactDollar(absChange)}
                        </td>
                        <td className={`text-right py-2.5 sm:py-1.5 font-bold ${s.growth >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {s.growth >= 0 ? '+' : ''}{s.growth.toFixed(0)}%
                        </td>
                      </tr>
                      )
                    })}
                  </tbody>
                </table>
                <p className="mt-2 text-[8px] text-slate-400 italic">Click any SKU to view its monthly trend</p>
              </div>

              {/* Per-SKU Monthly Trend */}
              {selectedSku && skuMonthlyTrend.length > 0 && (
                <div className="mt-4 border-t border-slate-100 pt-4 animate-fade-in-up">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-xs font-semibold text-blue-700">{selectedSku}</h4>
                      <p className="text-[9px] text-slate-400 mt-0.5">Monthly dispensing trend — {skuMonthlyTrend.length} months</p>
                    </div>
                    <button onClick={() => setSelectedSku(null)} className="text-[9px] text-primary hover:underline">Close</button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                    <div className="bg-blue-50/50 rounded-lg p-2.5 text-center">
                      <p className="text-[8px] text-slate-500 uppercase tracking-wide">TY Value</p>
                      <p className="text-sm font-bold text-slate-800">{formatCompactDollar(skuMonthlyTrend.reduce((s, m) => s + m.sales, 0))}</p>
                    </div>
                    <div className="bg-blue-50/50 rounded-lg p-2.5 text-center">
                      <p className="text-[8px] text-slate-500 uppercase tracking-wide">Avg Monthly</p>
                      <p className="text-sm font-bold text-slate-800">{formatCompactDollar(skuMonthlyTrend.reduce((s, m) => s + m.sales, 0) / skuMonthlyTrend.length)}</p>
                    </div>
                    <div className="bg-blue-50/50 rounded-lg p-2.5 text-center">
                      <p className="text-[8px] text-slate-500 uppercase tracking-wide">Total Units</p>
                      <p className="text-sm font-bold text-slate-800">{formatCompact(skuMonthlyTrend.reduce((s, m) => s + m.units, 0))}</p>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={skuMonthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="month" tick={{ fontSize: 8 }} stroke="#94a3b8" />
                      <YAxis tick={{ fontSize: 8 }} stroke="#94a3b8" tickFormatter={(v: number) => formatCompact(v)} />
                      <Tooltip formatter={(v) => formatCurrency(Number(v ?? 0))} />
                      <Line type="monotone" dataKey="sales" stroke="#2563EB" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 5, strokeWidth: 2 }} animationDuration={800} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      </React.Fragment>
          )
        })}
      </div>

      {/* Footer */}
      <div className="text-center py-4 mt-2">
        <p className="text-xs text-slate-400 font-medium">Powered by <span className="font-bold text-primary/70">NostraData</span></p>
      </div>
    </div>
  )
}
