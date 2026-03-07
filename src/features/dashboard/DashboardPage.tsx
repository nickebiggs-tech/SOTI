import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import {
  Pill, ShoppingBag, ArrowRight, ChevronDown,
  DollarSign, Package, Factory, FlaskConical, Sparkles, Target, AlertTriangle,
  BarChart3, TrendingUp, Flame, ShieldAlert, Eye,
} from 'lucide-react'
import { useData } from '../../data/DataProvider'
import { KPICard } from '../../components/ui/KPICard'
import { formatCompact, formatCompactDollar, formatCurrency } from '../../lib/formatters'

const COLORS = ['#2563EB', '#7C3AED', '#D97706', '#0D9488', '#DC2626', '#DB2777', '#EA580C', '#0891B2', '#4F46E5', '#65A30D']

/** IQVIA-grade narrative — opportunity sizing, competitive intelligence, actionable */
function generateMarketNarrative(
  ethTotalTY: number, ethGrowth: number,
  otcTotalTY: number, otcGrowth: number,
  totalMarket: number, totalGrowth: number,
  ethTop: { category: string; tyValue: number; lyValue: number; valueGrowth: number; manufacturerCount: number }[],
  otcTop: { category: string; tyValue: number; lyValue: number; valueGrowth: number; manufacturerCount: number }[],
): string[] {
  const lines: string[] = []

  // Headline — market sizing
  const dir = totalGrowth >= 0 ? 'expanded' : 'contracted'
  const absDelta = Math.abs(totalMarket - (ethTotalTY + otcTotalTY - (totalMarket - (ethTotalTY + otcTotalTY))))
  lines.push(`The Australian pharmacy market ${dir} ${Math.abs(totalGrowth).toFixed(1)}% YoY to ${formatCompactDollar(totalMarket)}, representing a ${totalGrowth >= 0 ? 'net value gain' : 'net value erosion'} of ${formatCompactDollar(absDelta > 0 ? Math.abs((ethTotalTY + otcTotalTY) - (ethTotalTY / (1 + ethGrowth / 100) + otcTotalTY / (1 + otcGrowth / 100))) : 0)}. The Rx:OTC split stands at ${((ethTotalTY / totalMarket) * 100).toFixed(0)}:${((otcTotalTY / totalMarket) * 100).toFixed(0)}.`)

  // Rx — commercial framing
  if (ethGrowth >= 0) {
    lines.push(`Prescription revenue grew ${ethGrowth.toFixed(1)}% to ${formatCompactDollar(ethTotalTY)}, with value growth outpacing volume — a clear indicator that high-cost specialty therapies and biologics are the primary growth engine. Suppliers with portfolios weighted toward specialty categories are capturing disproportionate share gains.`)
  } else {
    lines.push(`Prescription revenue declined ${Math.abs(ethGrowth).toFixed(1)}% to ${formatCompactDollar(ethTotalTY)}, driven by 60-day dispensing policy impacts and generic substitution. Suppliers with volume-dependent portfolios face margin compression — strategic pivot toward specialty and value-added services is recommended.`)
  }

  // OTC — competitive intelligence
  if (otcGrowth >= 0) {
    lines.push(`OTC/consumer health returned to growth at +${otcGrowth.toFixed(1)}% (${formatCompactDollar(otcTotalTY)}). Condition-specific segments are outperforming general wellness, presenting a clear opportunity for manufacturers to invest in pharmacy-exclusive formulations and pharmacist-recommended positioning.`)
  } else {
    lines.push(`OTC softened ${Math.abs(otcGrowth).toFixed(1)}% to ${formatCompactDollar(otcTotalTY)} as pandemic-era categories normalised. However, this headline figure masks pockets of growth — manufacturers should reallocate trade spend toward condition-specific categories where pharmacy channel maintains pricing power.`)
  }

  // Opportunity sizing
  const topRxGrower = [...ethTop].filter(c => c.valueGrowth > 5).sort((a, b) => b.valueGrowth - a.valueGrowth)[0]
  if (topRxGrower) {
    const incrementalValue = topRxGrower.tyValue - topRxGrower.lyValue
    lines.push(`Key opportunity: ${topRxGrower.category} grew +${topRxGrower.valueGrowth.toFixed(1)}%, adding ${formatCompactDollar(incrementalValue)} in incremental revenue across ${topRxGrower.manufacturerCount} suppliers. First-mover advantage in this therapy area represents a significant commercial opportunity.`)
  }

  // Risk callout
  const topOtcDecliner = [...otcTop].filter(c => c.valueGrowth < -5).sort((a, b) => a.valueGrowth - b.valueGrowth)[0]
  if (topOtcDecliner) {
    const valueAtRisk = Math.abs(topOtcDecliner.tyValue - topOtcDecliner.lyValue)
    lines.push(`Risk signal: ${topOtcDecliner.category} eroded ${formatCompactDollar(valueAtRisk)} in value (${topOtcDecliner.valueGrowth.toFixed(1)}%). Suppliers in this segment should assess channel leakage to online and consider promotional intensity, pack-size innovation, or portfolio rationalisation.`)
  }

  return lines
}

export function DashboardPage() {
  const { ethCategories, otcCategories, ethTotalTY, ethTotalLY, otcTotalTY, otcTotalLY, state } = useData()
  const navigate = useNavigate()
  const [narrativeOpen, setNarrativeOpen] = useState(false)

  const ethGrowth = ethTotalLY ? ((ethTotalTY - ethTotalLY) / ethTotalLY) * 100 : 0
  const otcGrowth = otcTotalLY ? ((otcTotalTY - otcTotalLY) / otcTotalLY) * 100 : 0
  const totalMarket = ethTotalTY + otcTotalTY
  const totalMarketLY = ethTotalLY + otcTotalLY
  const totalGrowth = totalMarketLY ? ((totalMarket - totalMarketLY) / totalMarketLY) * 100 : 0

  const ethSkuCount = useMemo(() => new Set(state.eth.map(r => r.sku)).size, [state.eth])
  const otcSkuCount = useMemo(() => new Set(state.otc.map(r => r.packName)).size, [state.otc])
  const ethMfrCount = useMemo(() => new Set(state.eth.map(r => r.manufacturer)).size, [state.eth])
  const otcMfrCount = useMemo(() => new Set(state.otc.map(r => r.manufacturer)).size, [state.otc])

  // Top 10 categories for each
  const ethTop10 = ethCategories.slice(0, 10).map(c => ({ name: c.category.length > 25 ? c.category.slice(0, 22) + '...' : c.category, fullName: c.category, value: Math.round(c.tyValue), growth: Math.round(c.valueGrowth * 10) / 10 }))
  const otcTop10 = otcCategories.slice(0, 10).map(c => ({ name: c.category.length > 25 ? c.category.slice(0, 22) + '...' : c.category, fullName: c.category, value: Math.round(c.tyValue), growth: Math.round(c.valueGrowth * 10) / 10 }))

  // Market split donut
  const marketSplit = [
    { name: 'Dispense (Rx)', value: Math.round(ethTotalTY) },
    { name: 'OTC / Front of Shop', value: Math.round(otcTotalTY) },
  ]

  // Auto-narrative
  const narrative = useMemo(() => generateMarketNarrative(
    ethTotalTY, ethGrowth, otcTotalTY, otcGrowth, totalMarket, totalGrowth,
    ethCategories, otcCategories,
  ), [ethTotalTY, ethGrowth, otcTotalTY, otcGrowth, totalMarket, totalGrowth, ethCategories, otcCategories])

  // Growth movers — with $ opportunity sizing
  const rxGrowers = useMemo(() => ethCategories.filter(c => c.lyValue > 10000).sort((a, b) => b.valueGrowth - a.valueGrowth).slice(0, 4), [ethCategories])
  const rxDecliners = useMemo(() => ethCategories.filter(c => c.lyValue > 10000).sort((a, b) => a.valueGrowth - b.valueGrowth).slice(0, 4), [ethCategories])
  const otcGrowers = useMemo(() => otcCategories.filter(c => c.lyValue > 50000).sort((a, b) => b.valueGrowth - a.valueGrowth).slice(0, 4), [otcCategories])
  const otcDecliners = useMemo(() => otcCategories.filter(c => c.lyValue > 50000).sort((a, b) => a.valueGrowth - b.valueGrowth).slice(0, 4), [otcCategories])

  const [dashSkuTab, setDashSkuTab] = useState<'rx' | 'otc'>('rx')
  const [rxWatchCat, setRxWatchCat] = useState<string | null>(null)
  const [otcWatchCat, setOtcWatchCat] = useState<string | null>(null)

  // Top SKUs (Rx) aggregated
  const topRxSkus = useMemo(() => {
    const map: Record<string, { tyV: number; lyV: number; cat: string; mfr: string; mol: string }> = {}
    state.eth.forEach(r => {
      if (!map[r.sku]) map[r.sku] = { tyV: 0, lyV: 0, cat: r.category, mfr: r.manufacturer, mol: r.molecule }
      const s = map[r.sku]!
      if (r.period === 'APR24-MAR25') s.tyV += r.sales; else s.lyV += r.sales
    })
    return Object.entries(map).map(([sku, s]) => ({
      name: sku, category: s.cat, manufacturer: s.mfr, molecule: s.mol,
      tyValue: s.tyV, lyValue: s.lyV,
      growth: s.lyV ? ((s.tyV - s.lyV) / s.lyV) * 100 : 999,
      absChange: s.tyV - s.lyV,
    })).sort((a, b) => b.tyValue - a.tyValue).slice(0, 10)
  }, [state.eth])

  // Top OTC Items
  const topOtcItems = useMemo(() => {
    return [...state.otc].map(r => ({
      name: r.packName, category: r.market, manufacturer: r.manufacturer,
      tyValue: r.tyValue, lyValue: r.lyValue,
      growth: r.lyValue ? ((r.tyValue - r.lyValue) / r.lyValue) * 100 : 999,
      absChange: r.tyValue - r.lyValue,
    })).sort((a, b) => b.tyValue - a.tyValue).slice(0, 10)
  }, [state.otc])

  const activeSkuList = dashSkuTab === 'rx' ? topRxSkus : topOtcItems

  // ── Rx Watch: category-level growth/decline with product drill-down ──
  const rxWatchData = useMemo(() => {
    // Per-SKU aggregation across all categories
    const skuMap: Record<string, { tyV: number; lyV: number; cat: string; mfr: string; mol: string }> = {}
    state.eth.forEach(r => {
      if (!skuMap[r.sku]) skuMap[r.sku] = { tyV: 0, lyV: 0, cat: r.category, mfr: r.manufacturer, mol: r.molecule }
      const s = skuMap[r.sku]!
      if (r.period === 'APR24-MAR25') s.tyV += r.sales; else s.lyV += r.sales
    })
    const allSkus = Object.entries(skuMap).map(([sku, s]) => ({
      sku, category: s.cat, manufacturer: s.mfr, molecule: s.mol,
      tyValue: s.tyV, lyValue: s.lyV,
      absChange: s.tyV - s.lyV,
      growth: s.lyV > 0 ? ((s.tyV - s.lyV) / s.lyV) * 100 : (s.tyV > 0 ? 999 : 0),
    }))

    // Categories with their top rising & declining products
    const catMap: Record<string, typeof allSkus> = {}
    allSkus.forEach(s => {
      if (!catMap[s.category]) catMap[s.category] = []
      catMap[s.category]!.push(s)
    })

    const categories = ethCategories.map(c => {
      const skus = catMap[c.category] || []
      const rising = [...skus].filter(s => s.absChange > 0 && s.lyValue > 1000).sort((a, b) => b.absChange - a.absChange).slice(0, 5)
      const declining = [...skus].filter(s => s.absChange < 0 && s.lyValue > 1000).sort((a, b) => a.absChange - b.absChange).slice(0, 5)
      const newProducts = [...skus].filter(s => s.growth >= 900 && s.tyValue > 5000).sort((a, b) => b.tyValue - a.tyValue).slice(0, 3)
      return { ...c, rising, declining, newProducts }
    })

    // Overall top risers and decliners (min base value for significance)
    const topRisers = [...allSkus].filter(s => s.absChange > 0 && s.lyValue > 5000).sort((a, b) => b.absChange - a.absChange).slice(0, 8)
    const topDecliners = [...allSkus].filter(s => s.absChange < 0 && s.lyValue > 5000).sort((a, b) => a.absChange - b.absChange).slice(0, 8)
    const newEntrants = [...allSkus].filter(s => s.growth >= 900 && s.tyValue > 10000).sort((a, b) => b.tyValue - a.tyValue).slice(0, 5)

    return { categories, topRisers, topDecliners, newEntrants }
  }, [state.eth, ethCategories])

  // Selected Rx Watch category details
  const rxWatchCatDetail = useMemo(() => {
    if (!rxWatchCat) return null
    return rxWatchData.categories.find(c => c.category === rxWatchCat) || null
  }, [rxWatchCat, rxWatchData])

  // ── OTC Watch: same pattern for OTC ──
  const otcWatchData = useMemo(() => {
    const allItems = state.otc.map(r => ({
      sku: r.packName, category: r.market, manufacturer: r.manufacturer, molecule: '',
      tyValue: r.tyValue, lyValue: r.lyValue,
      absChange: r.tyValue - r.lyValue,
      growth: r.lyValue > 0 ? ((r.tyValue - r.lyValue) / r.lyValue) * 100 : (r.tyValue > 0 ? 999 : 0),
    }))

    const catMap: Record<string, typeof allItems> = {}
    allItems.forEach(s => {
      if (!catMap[s.category]) catMap[s.category] = []
      catMap[s.category]!.push(s)
    })

    const categories = otcCategories.map(c => {
      const skus = catMap[c.category] || []
      const rising = [...skus].filter(s => s.absChange > 0 && s.lyValue > 500).sort((a, b) => b.absChange - a.absChange).slice(0, 5)
      const declining = [...skus].filter(s => s.absChange < 0 && s.lyValue > 500).sort((a, b) => a.absChange - b.absChange).slice(0, 5)
      const newProducts = [...skus].filter(s => s.growth >= 900 && s.tyValue > 2000).sort((a, b) => b.tyValue - a.tyValue).slice(0, 3)
      return { ...c, rising, declining, newProducts }
    })

    const topRisers = [...allItems].filter(s => s.absChange > 0 && s.lyValue > 2000).sort((a, b) => b.absChange - a.absChange).slice(0, 8)
    const topDecliners = [...allItems].filter(s => s.absChange < 0 && s.lyValue > 2000).sort((a, b) => a.absChange - b.absChange).slice(0, 8)
    const newEntrants = [...allItems].filter(s => s.growth >= 900 && s.tyValue > 5000).sort((a, b) => b.tyValue - a.tyValue).slice(0, 5)

    return { categories, topRisers, topDecliners, newEntrants }
  }, [state.otc, otcCategories])

  const otcWatchCatDetail = useMemo(() => {
    if (!otcWatchCat) return null
    return otcWatchData.categories.find(c => c.category === otcWatchCat) || null
  }, [otcWatchCat, otcWatchData])

  // Auto-narrative generators for Watch sections
  const rxWatchNarrative = useMemo(() => {
    const r = rxWatchData
    const lines: string[] = []
    if (r.topRisers[0]) {
      lines.push(`Fastest-growing Rx product by absolute value: ${r.topRisers[0].sku} (${r.topRisers[0].manufacturer}) adding ${formatCompactDollar(r.topRisers[0].absChange)} in ${r.topRisers[0].category}. ${r.topRisers.length > 1 ? `Followed by ${r.topRisers[1]?.sku} (+${formatCompactDollar(r.topRisers[1]?.absChange ?? 0)}).` : ''}`)
    }
    if (r.topDecliners[0]) {
      lines.push(`Biggest Rx value erosion: ${r.topDecliners[0].sku} lost ${formatCompactDollar(Math.abs(r.topDecliners[0].absChange))} — likely driven by generic entry, 60-day dispensing, or competitive displacement. ${r.topDecliners.slice(0, 3).length > 1 ? `Top 3 decliners combined represent ${formatCompactDollar(Math.abs(r.topDecliners.slice(0, 3).reduce((s, d) => s + d.absChange, 0)))} in value at risk.` : ''}`)
    }
    if (r.newEntrants.length > 0) {
      lines.push(`${r.newEntrants.length} new product${r.newEntrants.length > 1 ? 's' : ''} entered the market with material value: ${r.newEntrants.map(n => `${n.sku} (${formatCompactDollar(n.tyValue)})`).join(', ')}. Early-stage monitoring recommended.`)
    }
    return lines
  }, [rxWatchData])

  const otcWatchNarrative = useMemo(() => {
    const r = otcWatchData
    const lines: string[] = []
    if (r.topRisers[0]) {
      lines.push(`OTC momentum leader: ${r.topRisers[0].sku} (${r.topRisers[0].manufacturer}) gained ${formatCompactDollar(r.topRisers[0].absChange)} in ${r.topRisers[0].category}. Consumer demand signals suggest sustained growth in condition-specific categories.`)
    }
    if (r.topDecliners[0]) {
      lines.push(`Largest OTC value decline: ${r.topDecliners[0].sku} shed ${formatCompactDollar(Math.abs(r.topDecliners[0].absChange))}. Channel leakage to online and grocery remains the primary threat — defensive promotional strategy advised.`)
    }
    return lines
  }, [otcWatchData])

  return (
    <div className="space-y-4 sm:space-y-6 page-enter">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-0.5 sm:hidden">
          <span className="text-base font-extrabold tracking-tight"><span className="text-primary">SOTI</span></span>
          <span className="text-[7px] text-slate-400 font-medium uppercase tracking-wider">State of the Industry</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 hidden sm:block">State of the Industry <span className="text-sm font-medium text-slate-400">(SOTI)</span></h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">
          Australian pharmacy market — Dispense & OTC combined view
        </p>
      </div>

      {/* Macro KPIs — all $ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 stagger-children">
        <KPICard title="Total Market" value={formatCompactDollar(totalMarket)} delta={totalGrowth} deltaLabel="YoY" icon={<DollarSign className="w-4 h-4" />} />
        <KPICard title="Dispense (Rx)" value={formatCompactDollar(ethTotalTY)} delta={ethGrowth} deltaLabel="YoY" icon={<Pill className="w-4 h-4" />} />
        <KPICard title="OTC / FoS" value={formatCompactDollar(otcTotalTY)} delta={otcGrowth} deltaLabel="YoY" icon={<ShoppingBag className="w-4 h-4" />} />
        <KPICard title="Total SKUs" value={formatCompact(ethSkuCount + otcSkuCount)} icon={<Package className="w-4 h-4" />} />
        <KPICard title="Manufacturers" value={formatCompact(ethMfrCount + otcMfrCount)} icon={<Factory className="w-4 h-4" />} />
        <KPICard title="Rx Categories" value={`${ethCategories.length}`} icon={<FlaskConical className="w-4 h-4" />} />
      </div>

      {/* Opportunity & Risk — with $ value */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 stagger-fast">
        <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4">
          <h3 className="text-[10px] font-semibold text-emerald-700 mb-2 flex items-center gap-1.5 uppercase tracking-wide">
            <Target className="w-3 h-3" /> Rx Opportunity
          </h3>
          <div className="space-y-1.5">
            {rxGrowers.map((c) => (
              <button key={c.category} onClick={() => navigate('/dispense', { state: { selectedCategory: c.category } })} className="w-full flex items-center gap-2 hover:bg-slate-50 rounded p-1 -m-1 transition-colors cursor-pointer">
                <span className="text-[10px] text-slate-700 flex-1 truncate text-left">{c.category}</span>
                <span className="text-[9px] text-slate-400">{formatCompactDollar(c.tyValue)}</span>
                <span className="text-[10px] font-bold text-emerald-600">+{c.valueGrowth.toFixed(1)}%</span>
              </button>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4">
          <h3 className="text-[10px] font-semibold text-red-600 mb-2 flex items-center gap-1.5 uppercase tracking-wide">
            <AlertTriangle className="w-3 h-3" /> Rx Value at Risk
          </h3>
          <div className="space-y-1.5">
            {rxDecliners.map((c) => (
              <button key={c.category} onClick={() => navigate('/dispense', { state: { selectedCategory: c.category } })} className="w-full flex items-center gap-2 hover:bg-slate-50 rounded p-1 -m-1 transition-colors cursor-pointer">
                <span className="text-[10px] text-slate-700 flex-1 truncate text-left">{c.category}</span>
                <span className="text-[9px] text-slate-400">{formatCompactDollar(c.tyValue)}</span>
                <span className="text-[10px] font-bold text-red-500">{c.valueGrowth.toFixed(1)}%</span>
              </button>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4">
          <h3 className="text-[10px] font-semibold text-emerald-700 mb-2 flex items-center gap-1.5 uppercase tracking-wide">
            <Target className="w-3 h-3" /> OTC Opportunity
          </h3>
          <div className="space-y-1.5">
            {otcGrowers.map((c) => (
              <button key={c.category} onClick={() => navigate('/otc', { state: { selectedCategory: c.category } })} className="w-full flex items-center gap-2 hover:bg-slate-50 rounded p-1 -m-1 transition-colors cursor-pointer">
                <span className="text-[10px] text-slate-700 flex-1 truncate text-left">{c.category}</span>
                <span className="text-[9px] text-slate-400">{formatCompactDollar(c.tyValue)}</span>
                <span className="text-[10px] font-bold text-emerald-600">+{c.valueGrowth.toFixed(1)}%</span>
              </button>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4">
          <h3 className="text-[10px] font-semibold text-red-600 mb-2 flex items-center gap-1.5 uppercase tracking-wide">
            <AlertTriangle className="w-3 h-3" /> OTC Value at Risk
          </h3>
          <div className="space-y-1.5">
            {otcDecliners.map((c) => (
              <button key={c.category} onClick={() => navigate('/otc', { state: { selectedCategory: c.category } })} className="w-full flex items-center gap-2 hover:bg-slate-50 rounded p-1 -m-1 transition-colors cursor-pointer">
                <span className="text-[10px] text-slate-700 flex-1 truncate text-left">{c.category}</span>
                <span className="text-[9px] text-slate-400">{formatCompactDollar(c.tyValue)}</span>
                <span className="text-[10px] font-bold text-red-500">{c.valueGrowth.toFixed(1)}%</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quick nav cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <button onClick={() => navigate('/dispense')} className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 text-left hover:shadow-md hover:border-slate-300 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Pill className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Dispense Analytics</h3>
                <p className="text-xs text-slate-500">Category, supplier & molecule intelligence</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <div className="flex items-center gap-4 text-[10px]">
            <span className="text-slate-500">{ethCategories.length} categories &middot; {formatCompactDollar(ethTotalTY)}</span>
            <span className={ethGrowth >= 0 ? 'text-emerald-600 font-semibold' : 'text-red-500 font-semibold'}>
              {ethGrowth >= 0 ? '+' : ''}{ethGrowth.toFixed(1)}% YoY
            </span>
          </div>
        </button>

        <button onClick={() => navigate('/otc')} className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 text-left hover:shadow-md hover:border-slate-300 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">OTC / Front of Shop</h3>
                <p className="text-xs text-slate-500">Consumer health market intelligence</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <div className="flex items-center gap-4 text-[10px]">
            <span className="text-slate-500">{otcCategories.length} categories &middot; {formatCompactDollar(otcTotalTY)}</span>
            <span className={otcGrowth >= 0 ? 'text-emerald-600 font-semibold' : 'text-red-500 font-semibold'}>
              {otcGrowth >= 0 ? '+' : ''}{otcGrowth.toFixed(1)}% YoY
            </span>
          </div>
        </button>
      </div>

      {/* Market Split + Top Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 stagger-fast">
        {/* Market split donut */}
        <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-5 chart-card">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Market Split</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={marketSplit} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={4} dataKey="value" cornerRadius={4} animationDuration={1200} animationBegin={200} animationEasing="ease-out">
                <Cell fill="#2563EB" />
                <Cell fill="#0D9488" />
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Rx categories */}
        <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-5 chart-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-700">Top Rx by Value</h3>
            <button onClick={() => navigate('/dispense')} className="text-[10px] text-primary font-medium flex items-center gap-0.5">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {ethTop10.slice(0, 7).map((c, i) => (
              <button key={c.name} onClick={() => navigate('/dispense', { state: { selectedCategory: c.fullName } })} className="w-full flex items-center gap-2 hover:bg-slate-50 rounded p-1 -m-1 transition-colors cursor-pointer">
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-[10px] text-slate-600 flex-1 truncate text-left">{c.name}</span>
                <span className="text-[10px] font-semibold text-slate-700">{formatCompactDollar(c.value)}</span>
                <span className={`text-[9px] font-bold w-12 text-right ${c.growth >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {c.growth >= 0 ? '+' : ''}{c.growth}%
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Top OTC categories */}
        <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-5 chart-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-700">Top OTC by Value</h3>
            <button onClick={() => navigate('/otc')} className="text-[10px] text-primary font-medium flex items-center gap-0.5">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {otcTop10.slice(0, 7).map((c, i) => (
              <button key={c.name} onClick={() => navigate('/otc', { state: { selectedCategory: c.fullName } })} className="w-full flex items-center gap-2 hover:bg-slate-50 rounded p-1 -m-1 transition-colors cursor-pointer">
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-[10px] text-slate-600 flex-1 truncate text-left">{c.name}</span>
                <span className="text-[10px] font-semibold text-slate-700">{formatCompactDollar(c.value)}</span>
                <span className={`text-[9px] font-bold w-12 text-right ${c.growth >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {c.growth >= 0 ? '+' : ''}{c.growth}%
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Full-width category value bars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 stagger-fast">
        <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-5 chart-card">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Dispense — Category Value ($)</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={ethTop10} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 10 }} stroke="#94a3b8" tickFormatter={(v: number) => formatCompactDollar(v)} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} stroke="#94a3b8" width={130} />
              <Tooltip formatter={(v) => formatCurrency(Number(v ?? 0))} />
              <Bar dataKey="value" name="TY Value" radius={[0, 4, 4, 0]} animationDuration={1000} animationEasing="ease-out">
                {ethTop10.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-5 chart-card">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">OTC — Category Value ($)</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={otcTop10} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 10 }} stroke="#94a3b8" tickFormatter={(v: number) => formatCompactDollar(v)} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} stroke="#94a3b8" width={130} />
              <Tooltip formatter={(v) => formatCurrency(Number(v ?? 0))} />
              <Bar dataKey="value" name="TY Value" radius={[0, 4, 4, 0]} animationDuration={1000} animationEasing="ease-out">
                {otcTop10.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Top SKUs & Items ── */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-chart-card" style={{ animationDelay: '200ms' }}>
        <div className="px-3 sm:px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-violet-50/60 to-indigo-50/40">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <BarChart3 className="w-4 h-4 text-violet-600 shrink-0" />
            <h3 className="text-[11px] sm:text-xs font-bold text-slate-800">Top SKUs & Items</h3>
            <span className="text-[7px] sm:text-[8px] bg-violet-100 text-violet-600 font-semibold px-1 sm:px-1.5 py-0.5 rounded">By Value</span>
          </div>
        </div>
        <div className="flex border-b border-slate-100">
          {([
            { key: 'rx' as const, label: 'Rx SKUs', icon: <Pill className="w-3 h-3" /> },
            { key: 'otc' as const, label: 'OTC Items', icon: <ShoppingBag className="w-3 h-3" /> },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setDashSkuTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1 sm:gap-1.5 py-3 text-[9px] sm:text-[10px] font-semibold transition-colors ${
                dashSkuTab === tab.key
                  ? 'text-violet-700 border-b-2 border-violet-600 bg-violet-50/40'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
        <div className="p-3 sm:p-5 overflow-x-auto">
          <table className="w-full text-[9px] sm:text-[10px]">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2 text-slate-500 font-medium w-5 sm:w-6">#</th>
                <th className="text-left py-2 text-slate-500 font-medium">{dashSkuTab === 'rx' ? 'SKU' : 'Item'}</th>
                <th className="text-left py-2 text-slate-500 font-medium w-24 hidden md:table-cell">Manufacturer</th>
                <th className="text-left py-2 text-slate-500 font-medium w-24 hidden lg:table-cell">Category</th>
                <th className="text-right py-2 text-slate-500 font-medium w-16 sm:w-18">Value</th>
                <th className="text-right py-2 text-slate-500 font-medium w-16 sm:w-18">$ Change</th>
                <th className="text-right py-2 text-slate-500 font-medium w-14 sm:w-16">Growth</th>
              </tr>
            </thead>
            <tbody>
              {activeSkuList.map((s, i) => (
                <tr
                  key={s.name + i}
                  onClick={() => navigate(dashSkuTab === 'rx' ? '/dispense' : '/otc', { state: { selectedCategory: s.category } })}
                  className="border-b border-slate-50 hover:bg-violet-50/60 active:bg-violet-100/60 transition-colors cursor-pointer group"
                  title={`Drill into ${s.category}`}
                >
                  <td className="py-2.5 sm:py-2 text-slate-400 font-bold">{i + 1}</td>
                  <td className="py-2.5 sm:py-2 text-slate-700 truncate max-w-[120px] sm:max-w-[220px] font-medium group-hover:text-violet-700">{s.name}</td>
                  <td className="py-2.5 sm:py-2 text-slate-500 truncate hidden md:table-cell text-[9px]">{s.manufacturer}</td>
                  <td className="py-2.5 sm:py-2 text-slate-400 truncate hidden lg:table-cell text-[9px]">{s.category}</td>
                  <td className="text-right py-2.5 sm:py-2 font-semibold text-slate-700">{formatCompactDollar(s.tyValue)}</td>
                  <td className={`text-right py-2.5 sm:py-2 font-bold ${s.absChange >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {s.absChange >= 0 ? '+' : ''}{formatCompactDollar(s.absChange)}
                  </td>
                  <td className={`text-right py-2.5 sm:py-2 font-bold ${s.growth >= 0 && s.growth < 900 ? 'text-emerald-600' : s.growth >= 900 ? 'text-blue-500' : 'text-red-500'}`}>
                    {s.growth >= 900 ? 'New' : `${s.growth >= 0 ? '+' : ''}${s.growth.toFixed(0)}%`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-[8px] text-violet-400 italic">Tap any row to drill into its category</p>
        </div>
      </div>

      {/* ── Rx Watch ── */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-chart-card" style={{ animationDelay: '250ms' }}>
        <div className="px-3 sm:px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-blue-50/60 to-indigo-50/40">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Eye className="w-4 h-4 text-blue-600 shrink-0" />
            <h3 className="text-[11px] sm:text-xs font-bold text-slate-800">Rx Watch</h3>
            <span className="text-[7px] sm:text-[8px] bg-blue-100 text-blue-600 font-semibold px-1 sm:px-1.5 py-0.5 rounded">Prescription Movers</span>
          </div>
          <p className="text-[9px] text-slate-500 mt-1">Products driving significant value change — rising stars and declining products</p>
        </div>

        {/* Auto-narrative */}
        {rxWatchNarrative.length > 0 && (
          <div className="px-3 sm:px-5 py-2.5 bg-gradient-to-r from-blue-50/30 to-indigo-50/20 border-b border-slate-100">
            <div className="flex items-start gap-2">
              <Sparkles className="w-3 h-3 text-blue-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                {rxWatchNarrative.map((line, i) => (
                  <p key={i} className="text-[10px] text-slate-600 leading-relaxed">{line}</p>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="p-3 sm:p-5">
          {/* Rising / Declining split */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {/* Rising */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Flame className="w-3.5 h-3.5 text-emerald-500" />
                <h4 className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">Rising Stars</h4>
              </div>
              <div className="space-y-1">
                {rxWatchData.topRisers.map((s, i) => (
                  <button key={s.sku + i} onClick={() => navigate('/dispense', { state: { selectedCategory: s.category } })} className="w-full flex items-center gap-1.5 text-left hover:bg-emerald-50 rounded p-1.5 -mx-1 transition-colors group">
                    <span className="text-[9px] font-bold text-emerald-400 w-4">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] sm:text-[10px] text-slate-700 truncate group-hover:text-emerald-700 font-medium">{s.sku}</p>
                      <p className="text-[8px] text-slate-400 truncate">{s.manufacturer} · {s.category}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[9px] font-bold text-emerald-600">+{formatCompactDollar(s.absChange)}</p>
                      <p className="text-[8px] text-slate-400">{formatCompactDollar(s.tyValue)}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            {/* Declining */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
                <h4 className="text-[10px] font-bold text-red-600 uppercase tracking-wide">Value at Risk</h4>
              </div>
              <div className="space-y-1">
                {rxWatchData.topDecliners.map((s, i) => (
                  <button key={s.sku + i} onClick={() => navigate('/dispense', { state: { selectedCategory: s.category } })} className="w-full flex items-center gap-1.5 text-left hover:bg-red-50 rounded p-1.5 -mx-1 transition-colors group">
                    <span className="text-[9px] font-bold text-red-400 w-4">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] sm:text-[10px] text-slate-700 truncate group-hover:text-red-700 font-medium">{s.sku}</p>
                      <p className="text-[8px] text-slate-400 truncate">{s.manufacturer} · {s.category}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[9px] font-bold text-red-500">{formatCompactDollar(s.absChange)}</p>
                      <p className="text-[8px] text-slate-400">{formatCompactDollar(s.tyValue)}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* New entrants */}
          {rxWatchData.newEntrants.length > 0 && (
            <div className="mb-4 p-2.5 bg-blue-50/50 rounded-lg">
              <div className="flex items-center gap-1.5 mb-1.5">
                <TrendingUp className="w-3 h-3 text-blue-600" />
                <h4 className="text-[9px] font-bold text-blue-700 uppercase tracking-wide">New Entrants</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {rxWatchData.newEntrants.map(n => (
                  <button key={n.sku} onClick={() => navigate('/dispense', { state: { selectedCategory: n.category } })} className="bg-white rounded-lg border border-blue-100 px-2.5 py-1.5 hover:border-blue-300 transition-colors text-left">
                    <p className="text-[9px] font-medium text-slate-700 truncate max-w-[180px]">{n.sku}</p>
                    <p className="text-[8px] text-blue-600 font-bold">{formatCompactDollar(n.tyValue)} <span className="text-slate-400 font-normal">· {n.category}</span></p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Category drill-down selector */}
          <div className="border-t border-slate-100 pt-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Target className="w-3 h-3 text-blue-600" />
              <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-wide">Drill by Category</h4>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {rxWatchData.categories.filter(c => c.lyValue > 10000).sort((a, b) => Math.abs(b.tyValue - b.lyValue) - Math.abs(a.tyValue - a.lyValue)).slice(0, 12).map(c => (
                <button
                  key={c.category}
                  onClick={() => setRxWatchCat(rxWatchCat === c.category ? null : c.category)}
                  className={`text-[8px] sm:text-[9px] px-2 py-1 rounded-lg border transition-colors ${
                    rxWatchCat === c.category
                      ? 'bg-blue-100 border-blue-300 text-blue-700 font-bold'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-blue-200 hover:bg-blue-50'
                  }`}
                >
                  {c.category.length > 20 ? c.category.slice(0, 18) + '...' : c.category}
                  <span className={`ml-1 font-bold ${c.valueGrowth >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {c.valueGrowth >= 0 ? '+' : ''}{c.valueGrowth.toFixed(0)}%
                  </span>
                </button>
              ))}
            </div>

            {/* Selected category detail */}
            {rxWatchCatDetail && (
              <div className="bg-slate-50 rounded-lg p-3 animate-fade-in-up">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h5 className="text-[11px] font-bold text-slate-800">{rxWatchCatDetail.category}</h5>
                    <p className="text-[9px] text-slate-500">
                      {formatCompactDollar(rxWatchCatDetail.tyValue)} · {rxWatchCatDetail.valueGrowth >= 0 ? '+' : ''}{rxWatchCatDetail.valueGrowth.toFixed(1)}% · {rxWatchCatDetail.manufacturerCount} suppliers
                    </p>
                  </div>
                  <button onClick={() => navigate('/dispense', { state: { selectedCategory: rxWatchCatDetail.category } })} className="text-[8px] text-blue-600 font-semibold flex items-center gap-0.5 hover:underline">
                    Full analysis <ArrowRight className="w-2.5 h-2.5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {rxWatchCatDetail.rising.length > 0 && (
                    <div>
                      <p className="text-[8px] font-semibold text-emerald-600 uppercase tracking-wider mb-1">Rising in {rxWatchCatDetail.category}</p>
                      {rxWatchCatDetail.rising.map(s => (
                        <div key={s.sku} className="flex items-center gap-1.5 py-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          <span className="text-[9px] text-slate-600 flex-1 truncate">{s.sku}</span>
                          <span className="text-[9px] font-bold text-emerald-600">+{formatCompactDollar(s.absChange)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {rxWatchCatDetail.declining.length > 0 && (
                    <div>
                      <p className="text-[8px] font-semibold text-red-500 uppercase tracking-wider mb-1">Declining in {rxWatchCatDetail.category}</p>
                      {rxWatchCatDetail.declining.map(s => (
                        <div key={s.sku} className="flex items-center gap-1.5 py-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                          <span className="text-[9px] text-slate-600 flex-1 truncate">{s.sku}</span>
                          <span className="text-[9px] font-bold text-red-500">{formatCompactDollar(s.absChange)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── OTC Watch ── */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-chart-card" style={{ animationDelay: '300ms' }}>
        <div className="px-3 sm:px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-teal-50/60 to-emerald-50/40">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Eye className="w-4 h-4 text-teal-600 shrink-0" />
            <h3 className="text-[11px] sm:text-xs font-bold text-slate-800">OTC Watch</h3>
            <span className="text-[7px] sm:text-[8px] bg-teal-100 text-teal-700 font-semibold px-1 sm:px-1.5 py-0.5 rounded">Consumer Health Movers</span>
          </div>
          <p className="text-[9px] text-slate-500 mt-1">Products driving significant value change in OTC / front of shop</p>
        </div>

        {/* Auto-narrative */}
        {otcWatchNarrative.length > 0 && (
          <div className="px-3 sm:px-5 py-2.5 bg-gradient-to-r from-teal-50/30 to-emerald-50/20 border-b border-slate-100">
            <div className="flex items-start gap-2">
              <Sparkles className="w-3 h-3 text-teal-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                {otcWatchNarrative.map((line, i) => (
                  <p key={i} className="text-[10px] text-slate-600 leading-relaxed">{line}</p>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="p-3 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {/* Rising */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Flame className="w-3.5 h-3.5 text-emerald-500" />
                <h4 className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">Rising Stars</h4>
              </div>
              <div className="space-y-1">
                {otcWatchData.topRisers.map((s, i) => (
                  <button key={s.sku + i} onClick={() => navigate('/otc', { state: { selectedCategory: s.category } })} className="w-full flex items-center gap-1.5 text-left hover:bg-emerald-50 rounded p-1.5 -mx-1 transition-colors group">
                    <span className="text-[9px] font-bold text-emerald-400 w-4">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] sm:text-[10px] text-slate-700 truncate group-hover:text-emerald-700 font-medium">{s.sku}</p>
                      <p className="text-[8px] text-slate-400 truncate">{s.manufacturer} · {s.category}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[9px] font-bold text-emerald-600">+{formatCompactDollar(s.absChange)}</p>
                      <p className="text-[8px] text-slate-400">{formatCompactDollar(s.tyValue)}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            {/* Declining */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
                <h4 className="text-[10px] font-bold text-red-600 uppercase tracking-wide">Value at Risk</h4>
              </div>
              <div className="space-y-1">
                {otcWatchData.topDecliners.map((s, i) => (
                  <button key={s.sku + i} onClick={() => navigate('/otc', { state: { selectedCategory: s.category } })} className="w-full flex items-center gap-1.5 text-left hover:bg-red-50 rounded p-1.5 -mx-1 transition-colors group">
                    <span className="text-[9px] font-bold text-red-400 w-4">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] sm:text-[10px] text-slate-700 truncate group-hover:text-red-700 font-medium">{s.sku}</p>
                      <p className="text-[8px] text-slate-400 truncate">{s.manufacturer} · {s.category}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[9px] font-bold text-red-500">{formatCompactDollar(s.absChange)}</p>
                      <p className="text-[8px] text-slate-400">{formatCompactDollar(s.tyValue)}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* New entrants */}
          {otcWatchData.newEntrants.length > 0 && (
            <div className="mb-4 p-2.5 bg-teal-50/50 rounded-lg">
              <div className="flex items-center gap-1.5 mb-1.5">
                <TrendingUp className="w-3 h-3 text-teal-600" />
                <h4 className="text-[9px] font-bold text-teal-700 uppercase tracking-wide">New Entrants</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {otcWatchData.newEntrants.map(n => (
                  <button key={n.sku} onClick={() => navigate('/otc', { state: { selectedCategory: n.category } })} className="bg-white rounded-lg border border-teal-100 px-2.5 py-1.5 hover:border-teal-300 transition-colors text-left">
                    <p className="text-[9px] font-medium text-slate-700 truncate max-w-[180px]">{n.sku}</p>
                    <p className="text-[8px] text-teal-600 font-bold">{formatCompactDollar(n.tyValue)} <span className="text-slate-400 font-normal">· {n.category}</span></p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Category drill-down selector */}
          <div className="border-t border-slate-100 pt-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Target className="w-3 h-3 text-teal-600" />
              <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-wide">Drill by Category</h4>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {otcWatchData.categories.filter(c => c.lyValue > 5000).sort((a, b) => Math.abs(b.tyValue - b.lyValue) - Math.abs(a.tyValue - a.lyValue)).slice(0, 12).map(c => (
                <button
                  key={c.category}
                  onClick={() => setOtcWatchCat(otcWatchCat === c.category ? null : c.category)}
                  className={`text-[8px] sm:text-[9px] px-2 py-1 rounded-lg border transition-colors ${
                    otcWatchCat === c.category
                      ? 'bg-teal-100 border-teal-300 text-teal-700 font-bold'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-teal-200 hover:bg-teal-50'
                  }`}
                >
                  {c.category.length > 20 ? c.category.slice(0, 18) + '...' : c.category}
                  <span className={`ml-1 font-bold ${c.valueGrowth >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {c.valueGrowth >= 0 ? '+' : ''}{c.valueGrowth.toFixed(0)}%
                  </span>
                </button>
              ))}
            </div>

            {/* Selected category detail */}
            {otcWatchCatDetail && (
              <div className="bg-slate-50 rounded-lg p-3 animate-fade-in-up">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h5 className="text-[11px] font-bold text-slate-800">{otcWatchCatDetail.category}</h5>
                    <p className="text-[9px] text-slate-500">
                      {formatCompactDollar(otcWatchCatDetail.tyValue)} · {otcWatchCatDetail.valueGrowth >= 0 ? '+' : ''}{otcWatchCatDetail.valueGrowth.toFixed(1)}% · {otcWatchCatDetail.manufacturerCount} suppliers
                    </p>
                  </div>
                  <button onClick={() => navigate('/otc', { state: { selectedCategory: otcWatchCatDetail.category } })} className="text-[8px] text-teal-600 font-semibold flex items-center gap-0.5 hover:underline">
                    Full analysis <ArrowRight className="w-2.5 h-2.5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {otcWatchCatDetail.rising.length > 0 && (
                    <div>
                      <p className="text-[8px] font-semibold text-emerald-600 uppercase tracking-wider mb-1">Rising in {otcWatchCatDetail.category}</p>
                      {otcWatchCatDetail.rising.map(s => (
                        <div key={s.sku} className="flex items-center gap-1.5 py-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          <span className="text-[9px] text-slate-600 flex-1 truncate">{s.sku}</span>
                          <span className="text-[9px] font-bold text-emerald-600">+{formatCompactDollar(s.absChange)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {otcWatchCatDetail.declining.length > 0 && (
                    <div>
                      <p className="text-[8px] font-semibold text-red-500 uppercase tracking-wider mb-1">Declining in {otcWatchCatDetail.category}</p>
                      {otcWatchCatDetail.declining.map(s => (
                        <div key={s.sku} className="flex items-center gap-1.5 py-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                          <span className="text-[9px] text-slate-600 flex-1 truncate">{s.sku}</span>
                          <span className="text-[9px] font-bold text-red-500">{formatCompactDollar(s.absChange)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Market Intelligence — compact collapsible */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl overflow-hidden">
        <button
          onClick={() => setNarrativeOpen(v => !v)}
          className="w-full p-3 sm:p-4 flex items-start gap-3 text-left cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-[9px] font-semibold uppercase tracking-widest text-amber-400/80">Market Intelligence</span>
            <p className="text-[11px] sm:text-xs text-white/75 leading-relaxed mt-1 line-clamp-2">{narrative[0]}</p>
          </div>
          <ChevronDown className={`w-4 h-4 text-white/40 shrink-0 mt-0.5 transition-transform duration-200 ${narrativeOpen ? 'rotate-180' : ''}`} />
        </button>
        {narrativeOpen && (
          <div className="px-3 sm:px-4 pb-3 sm:pb-4 space-y-2 border-t border-white/10 pt-3 ml-[26px] sm:ml-[30px]">
            {narrative.slice(1).map((line, i) => (
              <p key={i} className="text-[11px] text-white/60 leading-relaxed">{line}</p>
            ))}
            <p className="text-[8px] text-white/25 mt-2">
              Source: {formatCompact(state.eth.length + state.otc.length)} records · NostraData Market Intelligence
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center py-4 mt-2">
        <p className="text-xs text-slate-400 font-medium">Powered by <span className="font-bold text-primary/70">NostraData</span></p>
      </div>
    </div>
  )
}
