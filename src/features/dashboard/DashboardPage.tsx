import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import {
  Pill, ShoppingBag, ArrowRight, ChevronDown,
  DollarSign, Package, Factory, FlaskConical, Sparkles, Target, AlertTriangle,
  BarChart3, TrendingUp, TrendingDown, Award,
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 animate-fade-in-up" style={{ animationDelay: '80ms' }}>
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
        <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 animate-fade-in-up" style={{ animationDelay: '120ms' }}>
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
        <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 animate-fade-in-up" style={{ animationDelay: '160ms' }}>
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
        <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Market split donut */}
        <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-5 chart-card animate-fade-in-up" style={{ animationDelay: '150ms' }}>
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Market Split</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={marketSplit} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={4} dataKey="value" cornerRadius={4} animationDuration={1000}>
                <Cell fill="#2563EB" />
                <Cell fill="#0D9488" />
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Rx categories */}
        <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-5 chart-card animate-fade-in-up" style={{ animationDelay: '250ms' }}>
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
        <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-5 chart-card animate-fade-in-up" style={{ animationDelay: '350ms' }}>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-5 chart-card animate-fade-in-up" style={{ animationDelay: '450ms' }}>
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Dispense — Category Value ($)</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={ethTop10} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 10 }} stroke="#94a3b8" tickFormatter={(v: number) => formatCompactDollar(v)} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} stroke="#94a3b8" width={130} />
              <Tooltip formatter={(v) => formatCurrency(Number(v ?? 0))} />
              <Bar dataKey="value" name="TY Value" radius={[0, 4, 4, 0]} animationDuration={800}>
                {ethTop10.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-5 chart-card animate-fade-in-up" style={{ animationDelay: '550ms' }}>
          <h3 className="text-sm font-semibold text-slate-700 mb-4">OTC — Category Value ($)</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={otcTop10} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 10 }} stroke="#94a3b8" tickFormatter={(v: number) => formatCompactDollar(v)} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} stroke="#94a3b8" width={130} />
              <Tooltip formatter={(v) => formatCurrency(Number(v ?? 0))} />
              <Bar dataKey="value" name="TY Value" radius={[0, 4, 4, 0]} animationDuration={800}>
                {otcTop10.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Top SKUs & Items ── */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-fade-in-up" style={{ animationDelay: '600ms' }}>
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
