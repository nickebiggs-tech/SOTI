import React, { useMemo, useState, useEffect, useRef } from 'react'
import {
  BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { useLocation } from 'react-router-dom'
import { ShoppingBag, ChevronRight, ChevronDown, X, Search, Factory, Package, TrendingUp, TrendingDown, Sparkles, BarChart3, Award, AlertTriangle, Target, DollarSign } from 'lucide-react'
import { useData } from '../../data/DataProvider'
import { KPICard } from '../../components/ui/KPICard'
import { formatCompact, formatCompactDollar, formatCurrency } from '../../lib/formatters'
import type { ManufacturerSummary } from '../../data/types'

const COLORS = ['#0D9488', '#2563EB', '#7C3AED', '#D97706', '#DC2626', '#DB2777', '#EA580C', '#0891B2', '#4F46E5', '#65A30D']

/** IQVIA-grade OTC market narrative — commercial framing, $ denominated */
function generateOTCNarrative(
  totalTY: number, growth: number,
  categories: { category: string; tyValue: number; lyValue: number; valueGrowth: number; manufacturerCount: number; skuCount: number }[],
  totalUnits: number, mfrCount: number,
): string[] {
  const lines: string[] = []

  const dir = growth >= 0 ? 'grew' : 'softened'
  lines.push(`The OTC/consumer health market ${dir} ${Math.abs(growth).toFixed(1)}% YoY to ${formatCompactDollar(totalTY)}, spanning ${formatCompact(totalUnits)} units across ${categories.length} market segments and ${mfrCount} suppliers.`)

  const growers = [...categories].filter(c => c.valueGrowth > 3 && c.lyValue > 50000).sort((a, b) => b.valueGrowth - a.valueGrowth)
  const decliners = [...categories].filter(c => c.valueGrowth < -3 && c.lyValue > 50000).sort((a, b) => a.valueGrowth - b.valueGrowth)

  if (growers.length > 0 && growers[0]) {
    const incremental = growers[0].tyValue - growers[0].lyValue
    lines.push(`Opportunity: ${growers[0].category} added ${formatCompactDollar(incremental)} in incremental value (+${growers[0].valueGrowth.toFixed(1)}%). Suppliers should increase trade investment in pharmacy-exclusive SKUs and pharmacist-recommended positioning within this segment.`)
  }

  if (decliners.length > 0 && decliners[0]) {
    const valueAtRisk = Math.abs(decliners[0].tyValue - decliners[0].lyValue)
    lines.push(`Risk: ${decliners[0].category} eroded ${formatCompactDollar(valueAtRisk)} (${decliners[0].valueGrowth.toFixed(1)}%). Channel leakage to online and grocery is likely — recommend defensive promotional strategy, loyalty programs, and pharmacist recommendation incentives.`)
  }

  if (growth < 0) {
    lines.push(`The overall contraction signals structural channel shift. Suppliers defending pharmacy-channel share should focus on pharmacist-advised categories where consultation creates switching barriers, and invest in condition-specific NPD over general wellness.`)
  } else {
    lines.push(`Growth is driven by premiumisation and pharmacist-recommended brands. Suppliers should leverage pharmacy's trust advantage by investing in behind-the-counter programmes, pharmacist education, and pharmacy-exclusive product lines.`)
  }

  return lines
}

export function OTCPage() {
  const { otcCategories, otcTotalTY, otcTotalLY, state } = useData()
  const [selectedCat, setSelectedCat] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selectedMfr, setSelectedMfr] = useState<string | null>(null)
  const [narrativeOpen, setNarrativeOpen] = useState(false)
  const [skuTab, setSkuTab] = useState<'value' | 'growing' | 'declining'>('value')
  const [catTab, setCatTab] = useState<'leaders' | 'gainers' | 'decliners'>('leaders')
  const location = useLocation()
  const drillRef = useRef<HTMLDivElement>(null)
  const skipMfrReset = useRef(false)

  // Navigation state receiver — from Dashboard click-through
  useEffect(() => {
    const navState = location.state as { selectedCategory?: string } | null
    if (navState?.selectedCategory) {
      setSelectedCat(navState.selectedCategory)
      window.history.replaceState({}, '')
      setTimeout(() => drillRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300)
    }
  }, [location.state])

  // Reset manufacturer when category changes (skip when drilling from SKU Intelligence)
  useEffect(() => {
    if (skipMfrReset.current) { skipMfrReset.current = false; return }
    setSelectedMfr(null)
  }, [selectedCat])

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

  // Top SKUs for selected category (filtered by manufacturer when one is selected)
  const topSkus = useMemo(() => {
    if (!selectedCat) return []
    let catData = state.otc.filter(r => r.market === selectedCat)
    if (selectedMfr) catData = catData.filter(r => r.manufacturer === selectedMfr)
    return catData
      .map(r => ({ name: r.packName, manufacturer: r.manufacturer, tyValue: r.tyValue, lyValue: r.lyValue, growth: r.lyValue ? ((r.tyValue - r.lyValue) / r.lyValue) * 100 : 0 }))
      .sort((a, b) => b.tyValue - a.tyValue)
      .slice(0, 20)
  }, [selectedCat, selectedMfr, state.otc])

  // Growth winners & losers
  // Category landscape — absolute $ movers & market share
  const categoryMovers = useMemo(() => {
    const withMeta = otcCategories
      .filter(c => c.lyValue > 1000)
      .map(c => ({
        ...c,
        absChange: c.tyValue - c.lyValue,
        shareOfMarket: otcTotalTY ? (c.tyValue / otcTotalTY) * 100 : 0,
      }))
    const topByValue = [...withMeta].sort((a, b) => b.tyValue - a.tyValue).slice(0, 10)
    const biggestGainers = [...withMeta].filter(c => c.absChange > 0).sort((a, b) => b.absChange - a.absChange).slice(0, 8)
    const biggestDecliners = [...withMeta].filter(c => c.absChange < 0).sort((a, b) => a.absChange - b.absChange).slice(0, 8)
    return { topByValue, biggestGainers, biggestDecliners }
  }, [otcCategories, otcTotalTY])

  const activeCatList = catTab === 'leaders' ? categoryMovers.topByValue : catTab === 'gainers' ? categoryMovers.biggestGainers : categoryMovers.biggestDecliners

  // Category-specific auto-narrative for drill-in
  const catNarrative = useMemo(() => {
    if (!selectedCat || mfrBreakdown.length === 0) return ''
    const catInfo = otcCategories.find(c => c.category === selectedCat)
    if (!catInfo) return ''
    const topMfr = mfrBreakdown[0]
    if (!topMfr) return ''
    const growthDir = catInfo.valueGrowth >= 0 ? 'grew' : 'declined'
    const incremental = Math.abs(catInfo.tyValue - catInfo.lyValue)
    const topSku = topSkus[0]
    const skuNote = topSku ? ` Top SKU: ${topSku.name} (${formatCompactDollar(topSku.tyValue)}).` : ''
    const action = catInfo.valueGrowth >= 0
      ? `${formatCompactDollar(incremental)} in incremental value creates opportunity for share gains through targeted promotional investment.`
      : `${formatCompactDollar(incremental)} in value erosion — suppliers should assess channel dynamics, promotional ROI, and competitive positioning.`
    return `${selectedCat} ${growthDir} ${Math.abs(catInfo.valueGrowth).toFixed(1)}% to ${formatCompactDollar(catInfo.tyValue)}. ${topMfr.manufacturer} holds ${topMfr.share.toFixed(1)}% share across ${catInfo.manufacturerCount} suppliers.${skuNote} ${action}`
  }, [selectedCat, mfrBreakdown, otcCategories, topSkus])

  // Growth drivers — which manufacturers are driving category movement
  const growthDrivers = useMemo(() => {
    if (!selectedCat || mfrBreakdown.length === 0) return { gainers: [], decliners: [] }
    const withChange = mfrBreakdown.map(m => ({ ...m, absChange: m.tyValue - m.lyValue }))
    return {
      gainers: withChange.filter(m => m.absChange > 0).sort((a, b) => b.absChange - a.absChange).slice(0, 5),
      decliners: withChange.filter(m => m.absChange < 0).sort((a, b) => a.absChange - b.absChange).slice(0, 5),
    }
  }, [selectedCat, mfrBreakdown])

  // ── Market-wide SKU Intelligence ──
  const skuInsights = useMemo(() => {
    const all = state.otc.map(r => ({
      sku: r.packName,
      category: r.market,
      manufacturer: r.manufacturer,
      tyValue: r.tyValue,
      lyValue: r.lyValue,
      tyUnits: r.tyUnits,
      lyUnits: r.lyUnits,
      growth: r.lyValue ? ((r.tyValue - r.lyValue) / r.lyValue) * 100 : 999,
      absChange: r.tyValue - r.lyValue,
    }))
    const byValue = [...all].sort((a, b) => b.tyValue - a.tyValue)
    const growing = [...all].filter(s => s.lyValue > 1000 && s.growth < 900).sort((a, b) => b.growth - a.growth).slice(0, 15)
    const declining = [...all].filter(s => s.lyValue > 1000 && s.growth < 900).sort((a, b) => a.absChange - b.absChange).slice(0, 15)
    // Pareto: how many SKUs account for 80% of value
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
  }, [state.otc])

  const activeOtcSkuList = skuTab === 'value' ? skuInsights.byValue : skuTab === 'growing' ? skuInsights.growing : skuInsights.declining

  // Drill from SKU Intelligence → category + manufacturer context
  const drillToSku = (category: string, manufacturer: string) => {
    skipMfrReset.current = true
    setSelectedCat(category)
    setSelectedMfr(manufacturer)
    setTimeout(() => drillRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300)
  }

  return (
    <div className="space-y-4 sm:space-y-6 page-enter">
      <div>
        <div className="flex items-center gap-2 mb-0.5 sm:hidden">
          <span className="text-base font-extrabold tracking-tight"><span className="text-primary">SOTI</span></span>
          <span className="text-[7px] text-slate-400 font-medium uppercase tracking-wider">OTC</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 hidden sm:block">OTC / Front of Shop</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">Consumer health market — category & manufacturer drill-in</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 stagger-children">
        <KPICard title="OTC Market" value={formatCompactDollar(otcTotalTY)} delta={otcGrowth} deltaLabel="YoY" icon={<ShoppingBag className="w-4 h-4" />} />
        <KPICard title="Total Units" value={formatCompact(totalUnits)} icon={<Package className="w-4 h-4" />} />
        <KPICard title="Manufacturers" value={`${mfrCount}`} icon={<Factory className="w-4 h-4" />} />
        <KPICard title="Categories" value={`${otcCategories.length}`} icon={<TrendingUp className="w-4 h-4" />} />
      </div>

      {/* Market Narrative — compact collapsible */}
      <div className="bg-gradient-to-r from-teal-900 to-emerald-900 rounded-xl overflow-hidden">
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
        <div className="px-3 sm:px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-teal-50/60 to-emerald-50/40">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Target className="w-4 h-4 text-teal-600 shrink-0" />
            <h3 className="text-[11px] sm:text-xs font-bold text-slate-800">Category Landscape</h3>
            <span className="text-[7px] sm:text-[8px] bg-teal-100 text-teal-700 font-semibold px-1 sm:px-1.5 py-0.5 rounded">{otcCategories.length} categories</span>
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
                  ? 'text-teal-700 border-b-2 border-teal-600 bg-teal-50/40'
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
                    selectedCat === c.category ? 'bg-teal-50 ring-1 ring-teal-200' : 'hover:bg-slate-50 active:bg-teal-50/50'
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-[10px] font-bold text-slate-400 w-4 shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] sm:text-[11px] font-semibold text-slate-800 truncate group-hover:text-teal-700">{c.category}</span>
                        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                          {(isGainerTab || isDeclinerTab) && (
                            <span className={`text-[10px] sm:text-[11px] font-bold ${c.absChange >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                              {c.absChange >= 0 ? '+' : ''}{formatCompactDollar(c.absChange)}
                            </span>
                          )}
                          <span className="text-[9px] sm:text-[10px] font-semibold text-slate-600">{formatCompactDollar(c.tyValue)}</span>
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
                    <ChevronRight className="w-3 h-3 text-slate-300 shrink-0 group-hover:text-teal-600 transition-colors" />
                  </div>
                </button>
              )
            })}
          </div>
          <p className="mt-2 text-[8px] text-teal-400 italic">Tap any category to drill into manufacturer & SKU drivers</p>
        </div>
      </div>

      {/* ── SKU Intelligence ── */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-fade-in-up" style={{ animationDelay: '300ms' }}>
        <div className="px-3 sm:px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-teal-50/60 to-emerald-50/40">
          <div className="flex items-center justify-between flex-wrap gap-1.5">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <BarChart3 className="w-4 h-4 text-teal-600 shrink-0" />
              <h3 className="text-[11px] sm:text-xs font-bold text-slate-800">SKU Intelligence</h3>
              <span className="text-[7px] sm:text-[8px] bg-teal-100 text-teal-700 font-semibold px-1 sm:px-1.5 py-0.5 rounded">{formatCompact(skuInsights.total)} SKUs</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5">
              <span className="text-[8px] text-slate-400 hidden sm:inline">Pareto:</span>
              <span className="text-[8px] sm:text-[9px] font-bold text-teal-600">{skuInsights.pareto80.count} SKUs = 80%</span>
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
                  ? 'text-teal-700 border-b-2 border-teal-600 bg-teal-50/40'
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
                <th className="text-left py-2 text-slate-500 font-medium">Product</th>
                <th className="text-left py-2 text-slate-500 font-medium w-24 hidden md:table-cell">Manufacturer</th>
                <th className="text-left py-2 text-slate-500 font-medium w-24 hidden lg:table-cell">Category</th>
                <th className="text-right py-2 text-slate-500 font-medium w-16 sm:w-18">Value</th>
                <th className="text-right py-2 text-slate-500 font-medium w-18 hidden sm:table-cell">LY Value</th>
                <th className="text-right py-2 text-slate-500 font-medium w-14 sm:w-16">Chg</th>
              </tr>
            </thead>
            <tbody>
              {activeOtcSkuList.map((s, i) => (
                <tr key={s.sku + i} onClick={() => drillToSku(s.category, s.manufacturer)} className="border-b border-slate-50 hover:bg-teal-50/60 active:bg-teal-100/60 transition-colors cursor-pointer group" title={`Drill into ${s.category} → ${s.manufacturer}`}>
                  <td className="py-2.5 sm:py-2 text-slate-400 font-bold">{i + 1}</td>
                  <td className="py-2.5 sm:py-2 text-slate-700 truncate max-w-[120px] sm:max-w-[200px] font-medium group-hover:text-teal-700">{s.sku}</td>
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
          <p className="mt-2 text-[8px] text-teal-400 italic">Tap any row to drill into its category & manufacturer</p>
          {skuTab === 'declining' && activeOtcSkuList.length > 0 && (
            <div className="mt-2 flex items-start gap-2 bg-red-50/60 rounded-lg p-2.5">
              <AlertTriangle className="w-3 h-3 text-red-500 shrink-0 mt-0.5" />
              <p className="text-[9px] text-red-600/80 leading-relaxed">
                These products are losing the most absolute value YoY. Investigate channel leakage, promotional fatigue, and competitive displacement. Consider pharmacy-exclusive promotions to defend share.
              </p>
            </div>
          )}
          {skuTab === 'growing' && activeOtcSkuList.length > 0 && (
            <div className="mt-2 flex items-start gap-2 bg-emerald-50/60 rounded-lg p-2.5">
              <TrendingUp className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-[9px] text-emerald-700/80 leading-relaxed">
                High-growth products signal emerging consumer demand. Prioritise distribution expansion, pharmacist recommendation programs, and shelf-space optimisation to capture momentum.
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
          placeholder="Search OTC categories..."
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

          {/* Growth Drivers — which manufacturers are driving the movement */}
          {(growthDrivers.gainers.length > 0 || growthDrivers.decliners.length > 0) && (
            <div className="px-4 sm:px-5 py-3 border-b border-slate-100">
              <div className="flex items-center gap-1.5 mb-2">
                <DollarSign className="w-3 h-3 text-teal-600" />
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

            {/* Manufacturer share & growth — click to filter SKUs */}
            <div>
              <h4 className="text-xs font-semibold text-slate-600 mb-3">Market Share & Growth</h4>
              <div className="space-y-0.5 max-h-[280px] overflow-y-auto scrollbar-thin">
                {mfrBreakdown.slice(0, 15).map((m, i) => {
                  const isSel = selectedMfr === m.manufacturer
                  const absChange = m.tyValue - m.lyValue
                  return (
                    <button
                      key={m.manufacturer}
                      onClick={() => setSelectedMfr(isSel ? null : m.manufacturer)}
                      className={`w-full flex items-center gap-1.5 sm:gap-2 rounded-lg py-2.5 sm:py-1.5 px-1.5 -mx-1 transition-colors cursor-pointer ${isSel ? 'bg-teal-50 ring-1 ring-teal-200' : 'hover:bg-slate-50 active:bg-slate-100'}`}
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

            {/* Top SKUs */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold text-slate-600">
                  {selectedMfr ? `${selectedMfr} — SKUs` : 'Top SKUs'}
                </h4>
                {selectedMfr && (
                  <button onClick={() => setSelectedMfr(null)} className="text-[9px] text-teal-600 hover:underline">
                    Show all manufacturers
                  </button>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left py-1.5 text-slate-500 font-medium">Product</th>
                      {!selectedMfr && <th className="text-left py-1.5 text-slate-500 font-medium w-28">Manufacturer</th>}
                      <th className="text-right py-1.5 text-slate-500 font-medium w-20">TY Value</th>
                      <th className="text-right py-1.5 text-slate-500 font-medium w-20 hidden sm:table-cell">LY Value</th>
                      <th className="text-right py-1.5 text-slate-500 font-medium w-18">$ Change</th>
                      <th className="text-right py-1.5 text-slate-500 font-medium w-16">Growth</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topSkus.map((s) => {
                      const absChange = s.tyValue - s.lyValue
                      return (
                      <tr key={s.name} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="py-1.5 text-slate-700 truncate max-w-[200px]">{s.name}</td>
                        {!selectedMfr && <td className="py-1.5 text-slate-400 truncate text-[9px]">{s.manufacturer}</td>}
                        <td className="text-right py-1.5 font-semibold text-slate-700">{formatCompactDollar(s.tyValue)}</td>
                        <td className="text-right py-1.5 text-slate-500 hidden sm:table-cell">{formatCompactDollar(s.lyValue)}</td>
                        <td className={`text-right py-1.5 font-bold ${absChange >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {absChange >= 0 ? '+' : ''}{formatCompactDollar(absChange)}
                        </td>
                        <td className={`text-right py-1.5 font-bold ${s.growth >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {s.growth >= 0 ? '+' : ''}{s.growth.toFixed(0)}%
                        </td>
                      </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
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
