import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  Pill, ChevronDown, ChevronRight, Sparkles, Target, Flame, ShieldAlert, Eye,
  TrendingUp, TrendingDown, ArrowRight, Search, BarChart3, Factory,
} from 'lucide-react'
import { useData } from '../../data/DataProvider'
import { KPICard } from '../../components/ui/KPICard'
import { formatCompact, formatCompactDollar } from '../../lib/formatters'
import { MetricToggle, type MetricMode } from '../../components/ui/MetricToggle'

interface SkuItem {
  sku: string
  category: string
  manufacturer: string
  molecule: string
  tyValue: number
  lyValue: number
  tyUnits: number
  lyUnits: number
  absChange: number
  growth: number
  unitAbsChange: number
  unitGrowth: number
}

interface WatchCategory {
  category: string
  tyValue: number
  lyValue: number
  tyUnits: number
  lyUnits: number
  valueGrowth: number
  unitGrowth: number
  manufacturerCount: number
  skuCount: number
  absChange: number
  rising: SkuItem[]
  declining: SkuItem[]
  newProducts: SkuItem[]
}

function generateRxWatchNarrative(
  totalTY: number, growth: number,
  topRisers: SkuItem[], topDecliners: SkuItem[], newEntrants: SkuItem[],
  catGrowers: WatchCategory[], _catDecliners: WatchCategory[],
): string[] {
  const lines: string[] = []

  const dir = growth >= 0 ? 'expanded' : 'contracted'
  lines.push(`The prescription market ${dir} ${Math.abs(growth).toFixed(1)}% YoY to ${formatCompactDollar(totalTY)}. Product-level analysis reveals significant value migration — identifying rising stars and products under pressure is critical for portfolio strategy and resource allocation.`)

  if (topRisers[0]) {
    const top3Value = topRisers.slice(0, 3).reduce((s, r) => s + r.absChange, 0)
    lines.push(`Growth momentum: The top 3 rising products collectively added ${formatCompactDollar(top3Value)} in incremental value. ${topRisers[0].sku} (${topRisers[0].manufacturer}) leads with +${formatCompactDollar(topRisers[0].absChange)} in ${topRisers[0].category}. These products represent first-mover advantages in high-growth therapeutic areas.`)
  }

  if (topDecliners[0]) {
    const top3AtRisk = topDecliners.slice(0, 3).reduce((s, d) => s + Math.abs(d.absChange), 0)
    lines.push(`Value at risk: The top 3 declining products shed ${formatCompactDollar(top3AtRisk)} combined. ${topDecliners[0].sku} lost ${formatCompactDollar(Math.abs(topDecliners[0].absChange))} — likely driven by generic entry, 60-day dispensing reform, or competitive displacement. Suppliers should assess defensive strategies including patient support programs, pharmacy incentives, and portfolio rebalancing.`)
  }

  if (catGrowers.length > 0 && catGrowers[0]) {
    lines.push(`Category opportunity: ${catGrowers[0].category} grew ${catGrowers[0].valueGrowth.toFixed(1)}% to ${formatCompactDollar(catGrowers[0].tyValue)}, adding ${formatCompactDollar(catGrowers[0].absChange)} in incremental revenue across ${catGrowers[0].manufacturerCount} suppliers.`)
  }

  if (newEntrants.length > 0) {
    lines.push(`${newEntrants.length} new product${newEntrants.length > 1 ? 's' : ''} entered the market with material value — early-stage monitoring and distribution expansion recommended to capture momentum.`)
  }

  return lines
}

export function RxWatchPage() {
  const { ethCategories, ethTotalTY, ethTotalLY, state } = useData()
  const navigate = useNavigate()
  const [selectedCat, setSelectedCat] = useState<string | null>(null)
  const [narrativeOpen, setNarrativeOpen] = useState(true)
  const [viewMode, setViewMode] = useState<'risers' | 'decliners' | 'all'>('all')
  const [search, setSearch] = useState('')
  const [metricMode, setMetricMode] = useState<MetricMode>('value')
  const isValue = metricMode === 'value'
  const fmt = isValue ? formatCompactDollar : formatCompact

  const ethGrowth = ethTotalLY ? ((ethTotalTY - ethTotalLY) / ethTotalLY) * 100 : 0

  // Full SKU-level data — already pre-aggregated
  const watchData = useMemo(() => {
    const allSkus: SkuItem[] = state.ethSkus.map(r => ({
      sku: r.sku, category: r.category, manufacturer: r.manufacturer, molecule: r.molecule,
      tyValue: r.tyValue, lyValue: r.lyValue,
      tyUnits: r.tyUnits, lyUnits: r.lyUnits,
      absChange: r.tyValue - r.lyValue,
      growth: r.lyValue > 0 ? ((r.tyValue - r.lyValue) / r.lyValue) * 100 : (r.tyValue > 0 ? 999 : 0),
      unitAbsChange: r.tyUnits - r.lyUnits,
      unitGrowth: r.lyUnits > 0 ? ((r.tyUnits - r.lyUnits) / r.lyUnits) * 100 : 0,
    }))

    // Build category-level with product drill-down
    const catMap: Record<string, SkuItem[]> = {}
    allSkus.forEach(s => {
      if (!catMap[s.category]) catMap[s.category] = []
      catMap[s.category]!.push(s)
    })

    const categories: WatchCategory[] = ethCategories.map(c => {
      const skus = catMap[c.category] || []
      const rising = [...skus].filter(s => s.absChange > 0 && s.lyValue > 1000).sort((a, b) => b.absChange - a.absChange).slice(0, 8)
      const declining = [...skus].filter(s => s.absChange < 0 && s.lyValue > 1000).sort((a, b) => a.absChange - b.absChange).slice(0, 8)
      const newProducts = [...skus].filter(s => s.growth >= 900 && s.tyValue > 5000).sort((a, b) => b.tyValue - a.tyValue).slice(0, 5)
      return { ...c, absChange: c.tyValue - c.lyValue, rising, declining, newProducts }
    })

    const chgKey = isValue ? 'absChange' : 'unitAbsChange' as const
    const topRisers = [...allSkus].filter(s => s[chgKey] > 0 && s.lyValue > 5000).sort((a, b) => b[chgKey] - a[chgKey]).slice(0, 15)
    const topDecliners = [...allSkus].filter(s => s[chgKey] < 0 && s.lyValue > 5000).sort((a, b) => a[chgKey] - b[chgKey]).slice(0, 15)
    const newEntrants = [...allSkus].filter(s => s.growth >= 900 && s.tyValue > 10000).sort((a, b) => b.tyValue - a.tyValue).slice(0, 8)

    return { categories, topRisers, topDecliners, newEntrants, allSkus }
  }, [state.ethSkus, ethCategories, isValue])

  // Derived
  const catGrowers = useMemo(() => watchData.categories.filter(c => c.absChange > 0 && c.lyValue > 10000).sort((a, b) => b.absChange - a.absChange), [watchData])
  const catDecliners = useMemo(() => watchData.categories.filter(c => c.absChange < 0 && c.lyValue > 10000).sort((a, b) => a.absChange - b.absChange), [watchData])
  const totalGrowing = watchData.topRisers.reduce((s, r) => s + (isValue ? r.absChange : r.unitAbsChange), 0)
  const totalDeclining = watchData.topDecliners.reduce((s, d) => s + Math.abs(isValue ? d.absChange : d.unitAbsChange), 0)
  const mfrCount = useMemo(() => new Set(state.ethSkus.map(r => r.manufacturer)).size, [state.ethSkus])

  // Chart data — top category movers
  const catChartData = useMemo(() => {
    return [...watchData.categories]
      .filter(c => c.lyValue > 10000)
      .sort((a, b) => (isValue ? b.absChange - a.absChange : (b.tyUnits - b.lyUnits) - (a.tyUnits - a.lyUnits)))
      .slice(0, 12)
      .map(c => ({
        name: c.category,
        fullName: c.category,
        value: isValue ? c.absChange : (c.tyUnits - c.lyUnits),
        growth: isValue ? c.valueGrowth : c.unitGrowth,
        tyValue: isValue ? c.tyValue : c.tyUnits,
      }))
  }, [watchData, isValue])

  // Waterfall chart — value migration
  const waterfallData = useMemo(() => {
    const chg = (c: WatchCategory) => isValue ? c.absChange : (c.tyUnits - c.lyUnits)
    const sorted = [...watchData.categories].filter(c => c.lyValue > 10000).sort((a, b) => chg(b) - chg(a))
    const topGainers = sorted.slice(0, 5).map(c => ({
      name: c.category,
      gain: chg(c),
      loss: 0,
    }))
    const topLosers = sorted.slice(-5).reverse().map(c => ({
      name: c.category,
      gain: 0,
      loss: chg(c),
    }))
    return [...topGainers, ...topLosers]
  }, [watchData, isValue])

  // Narrative
  const narrative = useMemo(() => generateRxWatchNarrative(
    ethTotalTY, ethGrowth, watchData.topRisers, watchData.topDecliners, watchData.newEntrants, catGrowers, catDecliners,
  ), [ethTotalTY, ethGrowth, watchData, catGrowers, catDecliners])

  // Selected category detail
  const catDetail = useMemo(() => {
    if (!selectedCat) return null
    return watchData.categories.find(c => c.category === selectedCat) || null
  }, [selectedCat, watchData])

  // Filtered categories for browse
  const filteredCats = useMemo(() => {
    let cats = watchData.categories.filter(c => c.lyValue > 5000)
    if (search) {
      const q = search.toLowerCase()
      cats = cats.filter(c => c.category.toLowerCase().includes(q))
    }
    if (viewMode === 'risers') cats = cats.filter(c => c.absChange > 0).sort((a, b) => b.absChange - a.absChange)
    else if (viewMode === 'decliners') cats = cats.filter(c => c.absChange < 0).sort((a, b) => a.absChange - b.absChange)
    else cats = [...cats].sort((a, b) => Math.abs(b.absChange) - Math.abs(a.absChange))
    return cats.slice(0, 20)
  }, [watchData, search, viewMode])

  return (
    <div className="space-y-4 sm:space-y-6 page-enter">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-0.5 sm:hidden">
          <span className="text-base font-extrabold tracking-tight"><span className="text-primary">SOTI</span></span>
          <span className="text-[7px] text-slate-400 font-medium uppercase tracking-wider">Rx Watch</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 hidden sm:block">
          <span className="text-blue-600">Rx Watch</span>
          <span className="text-sm font-medium text-slate-400 ml-2">Prescription Product Monitor</span>
        </h1>
        <div className="flex items-center justify-between mt-0.5 sm:mt-1">
          <p className="text-xs sm:text-sm text-slate-500">
            Products driving significant growth and those under pressure — category-level analysis with product drill-down
          </p>
          <MetricToggle mode={metricMode} onChange={setMetricMode} />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 stagger-children">
        <KPICard title="Rx Market" value={isValue ? formatCompactDollar(ethTotalTY) : formatCompact(state.ethSkus.reduce((s, r) => s + r.tyUnits, 0))} delta={ethGrowth} deltaLabel="YoY" icon={<Pill className="w-4 h-4" />} />
        <KPICard title={isValue ? 'Value Growth' : 'Volume Growth'} value={fmt(totalGrowing)} icon={<TrendingUp className="w-4 h-4 text-emerald-500" />} />
        <KPICard title={isValue ? 'Value at Risk' : 'Volume at Risk'} value={fmt(totalDeclining)} icon={<TrendingDown className="w-4 h-4 text-red-500" />} />
        <KPICard title="Suppliers" value={`${mfrCount}`} icon={<Factory className="w-4 h-4" />} />
      </div>

      {/* Auto-Narrative */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-xl overflow-hidden animate-fade-in-up animate-narrative-glow">
        <button onClick={() => setNarrativeOpen(v => !v)} className="w-full p-3 sm:p-4 flex items-start gap-3 text-left cursor-pointer">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-[9px] font-semibold uppercase tracking-widest text-amber-400/80">Rx Watch Intelligence</span>
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

      {/* Value Migration Chart — Waterfall */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-fade-in-up">
        <div className="px-3 sm:px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-blue-50/60 to-indigo-50/40">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600 shrink-0" />
            <h3 className="text-[11px] sm:text-xs font-bold text-slate-800">Value Migration</h3>
            <span className="text-[7px] sm:text-[8px] bg-blue-100 text-blue-600 font-semibold px-1 sm:px-1.5 py-0.5 rounded">Top Gainers vs Losers</span>
          </div>
          <p className="text-[9px] text-slate-500 mt-1">Absolute {isValue ? '$ value' : 'unit'} change by category — green = growth, red = decline</p>
        </div>
        <div className="p-3 sm:p-5">
          <ResponsiveContainer width="100%" height={380}>
            <BarChart data={waterfallData} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 10 }} stroke="#94a3b8" tickFormatter={(v: number) => fmt(v)} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#475569' }} stroke="#e2e8f0" width={160} />
              <Tooltip formatter={(v) => fmt(v as number)} />
              <Bar dataKey="gain" name={isValue ? 'Value Gained' : 'Units Gained'} fill="#059669" radius={[0, 4, 4, 0]} animationDuration={800} />
              <Bar dataKey="loss" name={isValue ? 'Value Lost' : 'Units Lost'} fill="#DC2626" radius={[0, 4, 4, 0]} animationDuration={800} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category $ Movers — horizontal bar */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <div className="px-3 sm:px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-blue-50/60 to-indigo-50/40">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Target className="w-4 h-4 text-blue-600 shrink-0" />
            <h3 className="text-[11px] sm:text-xs font-bold text-slate-800">Category {isValue ? 'Value' : 'Volume'} Change {isValue ? '($)' : '(Units)'}</h3>
            <span className="text-[7px] sm:text-[8px] bg-blue-100 text-blue-600 font-semibold px-1 sm:px-1.5 py-0.5 rounded">YoY {isValue ? '$' : 'Unit'} Change</span>
          </div>
        </div>
        <div className="p-3 sm:p-5">
          <ResponsiveContainer width="100%" height={420}>
            <BarChart data={catChartData} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 10 }} stroke="#94a3b8" tickFormatter={(v: number) => fmt(v)} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#475569' }} stroke="#e2e8f0" width={170} />
              <Tooltip
                formatter={(v) => fmt(v as number)}
                labelFormatter={(label) => {
                  const item = catChartData.find(c => c.name === label)
                  return item ? `${item.fullName} (TY: ${fmt(item.tyValue)})` : String(label)
                }}
              />
              <Bar dataKey="value" name={isValue ? '$ Change' : 'Unit Change'} radius={[0, 4, 4, 0]} animationDuration={800}>
                {catChartData.map((c, i) => <Cell key={i} fill={c.value >= 0 ? '#059669' : '#DC2626'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Rising Stars & Value at Risk — Split Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Rising Stars */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <div className="px-3 sm:px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-emerald-50/60 to-green-50/40">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Flame className="w-4 h-4 text-emerald-500 shrink-0" />
              <h3 className="text-[11px] sm:text-xs font-bold text-emerald-800">Rising Stars</h3>
              <span className="text-[7px] sm:text-[8px] bg-emerald-100 text-emerald-700 font-semibold px-1 sm:px-1.5 py-0.5 rounded">Top {watchData.topRisers.length} by {isValue ? '$ Gain' : 'Unit Gain'}</span>
            </div>
          </div>
          <div className="p-3 sm:p-5">
            <div className="space-y-1">
              {watchData.topRisers.map((s, i) => (
                <button key={s.sku + i} onClick={() => navigate('/dispense', { state: { selectedCategory: s.category } })} className="w-full flex items-center gap-1.5 text-left hover:bg-emerald-50 rounded-lg p-2 -mx-1 transition-colors group">
                  <span className="text-[9px] font-bold text-emerald-400 w-5 shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] sm:text-[10px] text-slate-700 truncate group-hover:text-emerald-700 font-medium">{s.sku}</p>
                    <p className="text-[8px] text-slate-400 truncate">{s.manufacturer} · {s.category}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] font-bold text-emerald-600">+{fmt(isValue ? s.absChange : s.unitAbsChange)}</p>
                    <p className="text-[8px] text-slate-400">{fmt(isValue ? s.tyValue : s.tyUnits)} TY</p>
                  </div>
                  <ChevronRight className="w-3 h-3 text-slate-300 shrink-0 group-hover:text-emerald-500" />
                </button>
              ))}
            </div>
            <div className="mt-3 p-2.5 bg-emerald-50/60 rounded-lg">
              <p className="text-[9px] text-emerald-700/80 leading-relaxed">
                Combined {isValue ? 'value' : 'volume'} addition: <span className="font-bold">{fmt(totalGrowing)}</span>. These products represent growth engines — prioritise distribution, promotional support, and pharmacist education programs.
              </p>
            </div>
          </div>
        </div>

        {/* Value at Risk */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-fade-in-up" style={{ animationDelay: '250ms' }}>
          <div className="px-3 sm:px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-red-50/60 to-rose-50/40">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
              <h3 className="text-[11px] sm:text-xs font-bold text-red-800">Value at Risk</h3>
              <span className="text-[7px] sm:text-[8px] bg-red-100 text-red-700 font-semibold px-1 sm:px-1.5 py-0.5 rounded">Top {watchData.topDecliners.length} by {isValue ? '$ Loss' : 'Unit Loss'}</span>
            </div>
          </div>
          <div className="p-3 sm:p-5">
            <div className="space-y-1">
              {watchData.topDecliners.map((s, i) => (
                <button key={s.sku + i} onClick={() => navigate('/dispense', { state: { selectedCategory: s.category } })} className="w-full flex items-center gap-1.5 text-left hover:bg-red-50 rounded-lg p-2 -mx-1 transition-colors group">
                  <span className="text-[9px] font-bold text-red-400 w-5 shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] sm:text-[10px] text-slate-700 truncate group-hover:text-red-700 font-medium">{s.sku}</p>
                    <p className="text-[8px] text-slate-400 truncate">{s.manufacturer} · {s.category}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] font-bold text-red-500">{fmt(isValue ? s.absChange : s.unitAbsChange)}</p>
                    <p className="text-[8px] text-slate-400">{fmt(isValue ? s.tyValue : s.tyUnits)} TY</p>
                  </div>
                  <ChevronRight className="w-3 h-3 text-slate-300 shrink-0 group-hover:text-red-500" />
                </button>
              ))}
            </div>
            <div className="mt-3 p-2.5 bg-red-50/60 rounded-lg">
              <p className="text-[9px] text-red-600/80 leading-relaxed">
                Combined {isValue ? 'value' : 'volume'} erosion: <span className="font-bold">{fmt(totalDeclining)}</span>. Investigate generic entry, 60-day dispensing impact, and competitive displacement. Defensive strategies recommended.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* New Entrants */}
      {watchData.newEntrants.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <div className="px-3 sm:px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-blue-50/60 to-indigo-50/40">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600 shrink-0" />
              <h3 className="text-[11px] sm:text-xs font-bold text-slate-800">New Entrants</h3>
              <span className="text-[7px] sm:text-[8px] bg-blue-100 text-blue-600 font-semibold px-1 sm:px-1.5 py-0.5 rounded">{watchData.newEntrants.length} products</span>
            </div>
            <p className="text-[9px] text-slate-500 mt-1">Products with no/minimal prior year value — new launches or significant NPD</p>
          </div>
          <div className="p-3 sm:p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {watchData.newEntrants.map(n => (
                <button key={n.sku} onClick={() => navigate('/dispense', { state: { selectedCategory: n.category } })} className="bg-blue-50/40 rounded-lg border border-blue-100 p-3 hover:border-blue-300 hover:shadow-sm transition-all text-left group">
                  <p className="text-[10px] font-semibold text-slate-700 truncate group-hover:text-blue-700">{n.sku}</p>
                  <p className="text-[8px] text-slate-400 truncate mt-0.5">{n.manufacturer}</p>
                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-blue-100">
                    <span className="text-[10px] font-bold text-blue-600">{fmt(isValue ? n.tyValue : n.tyUnits)}</span>
                    <span className="text-[8px] text-slate-400">{n.category.length > 15 ? n.category.slice(0, 13) + '...' : n.category}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Category Drill-Down Browser */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-fade-in-up" style={{ animationDelay: '350ms' }}>
        <div className="px-3 sm:px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-blue-50/60 to-indigo-50/40">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Eye className="w-4 h-4 text-blue-600 shrink-0" />
            <h3 className="text-[11px] sm:text-xs font-bold text-slate-800">Category Drill-Down</h3>
            <span className="text-[7px] sm:text-[8px] bg-blue-100 text-blue-600 font-semibold px-1 sm:px-1.5 py-0.5 rounded">Select to explore products</span>
          </div>
        </div>

        {/* Filters */}
        <div className="px-3 sm:px-5 py-2.5 border-b border-slate-100 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search categories..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white text-[10px] sm:text-xs focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
            />
          </div>
          <div className="flex gap-1">
            {([
              { key: 'all' as const, label: 'All Movers' },
              { key: 'risers' as const, label: 'Growing' },
              { key: 'decliners' as const, label: 'Declining' },
            ]).map(f => (
              <button
                key={f.key}
                onClick={() => setViewMode(f.key)}
                className={`text-[8px] sm:text-[9px] px-2.5 py-1.5 rounded-lg border transition-colors font-semibold ${
                  viewMode === f.key
                    ? 'bg-blue-100 border-blue-300 text-blue-700'
                    : 'bg-white border-slate-200 text-slate-500 hover:border-blue-200 hover:bg-blue-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-3 sm:p-5">
          <div className="space-y-1">
            {filteredCats.map((c, i) => {
              const isSelected = selectedCat === c.category
              const maxAbsChange = filteredCats[0] ? Math.abs(filteredCats[0].absChange) : 1
              const barWidth = Math.min((Math.abs(c.absChange) / maxAbsChange) * 100, 100)
              return (
                <button
                  key={c.category}
                  onClick={() => setSelectedCat(isSelected ? null : c.category)}
                  className={`w-full text-left rounded-lg p-2 sm:p-2.5 transition-colors cursor-pointer group ${
                    isSelected ? 'bg-blue-50 ring-1 ring-blue-200' : 'hover:bg-slate-50 active:bg-blue-50/50'
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-[10px] font-bold text-slate-400 w-5 shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] sm:text-[11px] font-semibold text-slate-800 truncate group-hover:text-blue-700">{c.category}</span>
                        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                          <span className={`text-[10px] sm:text-[11px] font-bold ${(isValue ? c.absChange : (c.tyUnits - c.lyUnits)) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {(isValue ? c.absChange : (c.tyUnits - c.lyUnits)) >= 0 ? '+' : ''}{fmt(isValue ? c.absChange : (c.tyUnits - c.lyUnits))}
                          </span>
                          <span className="text-[9px] sm:text-[10px] font-semibold text-slate-600">{fmt(isValue ? c.tyValue : c.tyUnits)}</span>
                          <span className={`text-[9px] font-bold w-12 text-right ${(isValue ? c.valueGrowth : c.unitGrowth) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {(isValue ? c.valueGrowth : c.unitGrowth) >= 0 ? '+' : ''}{(isValue ? c.valueGrowth : c.unitGrowth).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${barWidth}%`,
                              backgroundColor: c.absChange >= 0 ? '#059669' : '#DC2626',
                            }}
                          />
                        </div>
                        <span className="text-[8px] text-slate-400 w-16 text-right shrink-0">{c.manufacturerCount} suppliers</span>
                      </div>
                    </div>
                    <ChevronDown className={`w-3 h-3 text-slate-300 shrink-0 transition-transform ${isSelected ? 'rotate-180 text-blue-500' : 'group-hover:text-blue-400'}`} />
                  </div>
                </button>
              )
            })}
          </div>

          {/* Selected category detail panel */}
          {catDetail && (
            <div className="mt-4 bg-slate-50 rounded-xl border border-slate-200 overflow-hidden animate-fade-in-up">
              <div className="px-4 sm:px-5 py-3 border-b border-slate-200 bg-blue-50/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">{catDetail.category}</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {fmt(isValue ? catDetail.tyValue : catDetail.tyUnits)} TY · <span className={(isValue ? catDetail.valueGrowth : catDetail.unitGrowth) >= 0 ? 'text-emerald-600' : 'text-red-500'}>{(isValue ? catDetail.valueGrowth : catDetail.unitGrowth) >= 0 ? '+' : ''}{(isValue ? catDetail.valueGrowth : catDetail.unitGrowth).toFixed(1)}%</span> · {fmt(Math.abs(isValue ? catDetail.absChange : (catDetail.tyUnits - catDetail.lyUnits)))} {(isValue ? catDetail.absChange : (catDetail.tyUnits - catDetail.lyUnits)) >= 0 ? 'gained' : 'lost'} · {catDetail.manufacturerCount} suppliers · {formatCompact(catDetail.skuCount)} SKUs
                    </p>
                  </div>
                  <button onClick={() => navigate('/dispense', { state: { selectedCategory: catDetail.category } })} className="text-[9px] text-blue-600 font-semibold flex items-center gap-0.5 hover:underline shrink-0">
                    Full analysis <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Auto-narrative for this category */}
              <div className="px-4 sm:px-5 py-3 bg-gradient-to-r from-blue-50/30 to-indigo-50/20 border-b border-slate-100">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-3 h-3 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-slate-600 leading-relaxed">
                    {catDetail.category} {(isValue ? catDetail.valueGrowth : catDetail.unitGrowth) >= 0 ? 'grew' : 'declined'} {Math.abs(isValue ? catDetail.valueGrowth : catDetail.unitGrowth).toFixed(1)}% to {fmt(isValue ? catDetail.tyValue : catDetail.tyUnits)}, {(isValue ? catDetail.absChange : (catDetail.tyUnits - catDetail.lyUnits)) >= 0 ? 'adding' : 'losing'} {fmt(Math.abs(isValue ? catDetail.absChange : (catDetail.tyUnits - catDetail.lyUnits)))} in absolute {isValue ? 'value' : 'volume'} across {catDetail.manufacturerCount} suppliers and {formatCompact(catDetail.skuCount)} SKUs.
                    {catDetail.rising.length > 0 && catDetail.rising[0] ? ` Growth is led by ${catDetail.rising[0].sku} (+${fmt(isValue ? catDetail.rising[0].absChange : catDetail.rising[0].unitAbsChange)}).` : ''}
                    {catDetail.declining.length > 0 && catDetail.declining[0] ? ` Biggest decliner: ${catDetail.declining[0].sku} (${fmt(isValue ? catDetail.declining[0].absChange : catDetail.declining[0].unitAbsChange)}).` : ''}
                    {catDetail.absChange >= 0
                      ? ' Suppliers should increase investment in this category to capture growth momentum.'
                      : ' Defensive strategies recommended — assess generic entry, channel dynamics, and promotional ROI.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 sm:p-5">
                {/* Rising products */}
                {catDetail.rising.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Flame className="w-3.5 h-3.5 text-emerald-500" />
                      <p className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider">Growing Products</p>
                    </div>
                    <div className="space-y-0.5">
                      {catDetail.rising.map((s, i) => (
                        <div key={s.sku} className="flex items-center gap-1.5 py-1 hover:bg-emerald-50/60 rounded px-1 -mx-1">
                          <span className="text-[8px] font-bold text-emerald-400 w-3">{i + 1}</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          <span className="text-[9px] text-slate-600 flex-1 truncate">{s.sku}</span>
                          <span className="text-[9px] font-bold text-emerald-600">+{fmt(isValue ? s.absChange : s.unitAbsChange)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Declining products */}
                {catDetail.declining.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
                      <p className="text-[9px] font-bold text-red-600 uppercase tracking-wider">Declining Products</p>
                    </div>
                    <div className="space-y-0.5">
                      {catDetail.declining.map((s, i) => (
                        <div key={s.sku} className="flex items-center gap-1.5 py-1 hover:bg-red-50/60 rounded px-1 -mx-1">
                          <span className="text-[8px] font-bold text-red-400 w-3">{i + 1}</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                          <span className="text-[9px] text-slate-600 flex-1 truncate">{s.sku}</span>
                          <span className="text-[9px] font-bold text-red-500">{fmt(isValue ? s.absChange : s.unitAbsChange)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* New entrants in this category */}
              {catDetail.newProducts.length > 0 && (
                <div className="px-4 sm:px-5 pb-4 sm:pb-5">
                  <div className="p-2.5 bg-blue-50/50 rounded-lg">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <TrendingUp className="w-3 h-3 text-blue-600" />
                      <p className="text-[9px] font-bold text-blue-700 uppercase tracking-wide">New Products</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {catDetail.newProducts.map(n => (
                        <div key={n.sku} className="bg-white rounded-lg border border-blue-100 px-2.5 py-1.5 text-left">
                          <p className="text-[9px] font-medium text-slate-700 truncate max-w-[180px]">{n.sku}</p>
                          <p className="text-[8px] text-blue-600 font-bold">{fmt(isValue ? n.tyValue : n.tyUnits)} <span className="text-slate-400 font-normal">· {n.manufacturer}</span></p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-4 mt-2">
        <p className="text-xs text-slate-400 font-medium">Powered by <span className="font-bold text-primary/70">NostraData</span></p>
      </div>
    </div>
  )
}
