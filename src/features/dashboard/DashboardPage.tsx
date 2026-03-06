import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import {
  Pill, ShoppingBag, ArrowRight,
  DollarSign, Package, Factory, FlaskConical, TrendingUp, TrendingDown, Sparkles,
} from 'lucide-react'
import { useData } from '../../data/DataProvider'
import { KPICard } from '../../components/ui/KPICard'
import { formatCompact, formatCurrency } from '../../lib/formatters'

const COLORS = ['#2563EB', '#7C3AED', '#D97706', '#0D9488', '#DC2626', '#DB2777', '#EA580C', '#0891B2', '#4F46E5', '#65A30D']

/** Auto-generate analyst narrative from live data */
function generateMarketNarrative(
  ethTotalTY: number, ethGrowth: number,
  otcTotalTY: number, otcGrowth: number,
  totalMarket: number, totalGrowth: number,
  ethTop: { category: string; valueGrowth: number }[],
  otcTop: { category: string; valueGrowth: number }[],
): string[] {
  const lines: string[] = []

  // Headline
  const dir = totalGrowth >= 0 ? 'expanded' : 'contracted'
  lines.push(`The Australian pharmacy market ${dir} ${Math.abs(totalGrowth).toFixed(1)}% year-on-year to ${formatCurrency(totalMarket)}, with prescription and consumer health segments diverging sharply.`)

  // Rx narrative
  if (ethGrowth >= 0) {
    lines.push(`Prescription sales grew ${ethGrowth.toFixed(1)}% to ${formatCurrency(ethTotalTY)}, driven by high-value specialty medicines and biologics reshaping the dispensary landscape.`)
  } else {
    lines.push(`Prescription sales declined ${Math.abs(ethGrowth).toFixed(1)}% to ${formatCurrency(ethTotalTY)}, reflecting ongoing 60-day dispensing impacts and structural market adjustments.`)
  }

  // OTC narrative
  if (otcGrowth >= 0) {
    lines.push(`The OTC/front-of-shop segment returned to growth at ${otcGrowth.toFixed(1)}%, reaching ${formatCurrency(otcTotalTY)}, with condition-specific categories outperforming general wellness.`)
  } else {
    lines.push(`OTC sales softened ${Math.abs(otcGrowth).toFixed(1)}% to ${formatCurrency(otcTotalTY)} as pandemic-inflated categories normalised and online competition intensified.`)
  }

  // Top growth category callout
  const topEth = ethTop.filter(c => c.valueGrowth > 5).sort((a, b) => b.valueGrowth - a.valueGrowth)
  if (topEth.length > 0 && topEth[0]) {
    lines.push(`Among prescription categories, ${topEth[0].category} led growth at +${topEth[0].valueGrowth.toFixed(1)}%, signalling accelerating demand in specialty and metabolic therapies.`)
  }

  // OTC growth/decline callout
  const decOtc = otcTop.filter(c => c.valueGrowth < -5).sort((a, b) => a.valueGrowth - b.valueGrowth)
  if (decOtc.length > 0 && decOtc[0]) {
    lines.push(`The steepest OTC decline was in ${decOtc[0].category} (${decOtc[0].valueGrowth.toFixed(1)}%), reflecting post-pandemic normalisation and channel shift.`)
  }

  return lines
}

export function DashboardPage() {
  const { ethCategories, otcCategories, ethTotalTY, ethTotalLY, otcTotalTY, otcTotalLY, state } = useData()
  const navigate = useNavigate()

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
  const ethTop10 = ethCategories.slice(0, 10).map(c => ({ name: c.category.length > 25 ? c.category.slice(0, 22) + '...' : c.category, value: Math.round(c.tyValue), growth: Math.round(c.valueGrowth * 10) / 10 }))
  const otcTop10 = otcCategories.slice(0, 10).map(c => ({ name: c.category.length > 25 ? c.category.slice(0, 22) + '...' : c.category, value: Math.round(c.tyValue), growth: Math.round(c.valueGrowth * 10) / 10 }))

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

  // Growth movers
  const rxGrowers = useMemo(() => ethCategories.filter(c => c.lyValue > 10000).sort((a, b) => b.valueGrowth - a.valueGrowth).slice(0, 3), [ethCategories])
  const rxDecliners = useMemo(() => ethCategories.filter(c => c.lyValue > 10000).sort((a, b) => a.valueGrowth - b.valueGrowth).slice(0, 3), [ethCategories])
  const otcGrowers = useMemo(() => otcCategories.filter(c => c.lyValue > 50000).sort((a, b) => b.valueGrowth - a.valueGrowth).slice(0, 3), [otcCategories])
  const otcDecliners = useMemo(() => otcCategories.filter(c => c.lyValue > 50000).sort((a, b) => a.valueGrowth - b.valueGrowth).slice(0, 3), [otcCategories])

  return (
    <div className="space-y-4 sm:space-y-6 page-enter">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-0.5 sm:hidden">
          <span className="text-base font-extrabold tracking-tight"><span className="text-primary">SOTI</span></span>
          <span className="text-[8px] text-slate-400 font-semibold uppercase tracking-widest border border-slate-200 rounded px-1.5 py-0.5">Dashboard</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 hidden sm:block">State of the Industry</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">
          Australian pharmacy market — Dispense & OTC combined view
        </p>
      </div>

      {/* Auto-Generated Market Narrative */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-4 sm:p-6 text-white animate-fade-in-up">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-amber-400/80">Auto-Generated Market Narrative</span>
        </div>
        <div className="space-y-2">
          {narrative.map((line, i) => (
            <p key={i} className="text-xs sm:text-sm text-white/85 leading-relaxed">{line}</p>
          ))}
        </div>
        <p className="text-[9px] text-white/30 mt-3 flex items-center gap-1">
          <span>Generated from {formatCompact(state.eth.length + state.otc.length)} product records</span>
          <span className="text-white/15">·</span>
          <span>Powered by NostraData</span>
        </p>
      </div>

      {/* Macro KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 stagger-children">
        <KPICard title="Total Market" value={formatCompact(totalMarket)} delta={totalGrowth} deltaLabel="YoY" icon={<DollarSign className="w-4 h-4" />} />
        <KPICard title="Dispense (Rx)" value={formatCompact(ethTotalTY)} delta={ethGrowth} deltaLabel="YoY" icon={<Pill className="w-4 h-4" />} />
        <KPICard title="OTC / FoS" value={formatCompact(otcTotalTY)} delta={otcGrowth} deltaLabel="YoY" icon={<ShoppingBag className="w-4 h-4" />} />
        <KPICard title="Total SKUs" value={formatCompact(ethSkuCount + otcSkuCount)} icon={<Package className="w-4 h-4" />} />
        <KPICard title="Manufacturers" value={formatCompact(ethMfrCount + otcMfrCount)} icon={<Factory className="w-4 h-4" />} />
        <KPICard title="Rx Categories" value={`${ethCategories.length}`} icon={<FlaskConical className="w-4 h-4" />} />
      </div>

      {/* Growth Movers — auto-narrative summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 animate-fade-in-up" style={{ animationDelay: '80ms' }}>
          <h3 className="text-[10px] font-semibold text-emerald-700 mb-2 flex items-center gap-1.5 uppercase tracking-wide">
            <TrendingUp className="w-3 h-3" /> Rx Growth Leaders
          </h3>
          <div className="space-y-1.5">
            {rxGrowers.map((c) => (
              <div key={c.category} className="flex items-center gap-2">
                <span className="text-[10px] text-slate-700 flex-1 truncate">{c.category}</span>
                <span className="text-[10px] font-bold text-emerald-600">+{c.valueGrowth.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 animate-fade-in-up" style={{ animationDelay: '120ms' }}>
          <h3 className="text-[10px] font-semibold text-red-600 mb-2 flex items-center gap-1.5 uppercase tracking-wide">
            <TrendingDown className="w-3 h-3" /> Rx Under Pressure
          </h3>
          <div className="space-y-1.5">
            {rxDecliners.map((c) => (
              <div key={c.category} className="flex items-center gap-2">
                <span className="text-[10px] text-slate-700 flex-1 truncate">{c.category}</span>
                <span className="text-[10px] font-bold text-red-500">{c.valueGrowth.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 animate-fade-in-up" style={{ animationDelay: '160ms' }}>
          <h3 className="text-[10px] font-semibold text-emerald-700 mb-2 flex items-center gap-1.5 uppercase tracking-wide">
            <TrendingUp className="w-3 h-3" /> OTC Growth Leaders
          </h3>
          <div className="space-y-1.5">
            {otcGrowers.map((c) => (
              <div key={c.category} className="flex items-center gap-2">
                <span className="text-[10px] text-slate-700 flex-1 truncate">{c.category}</span>
                <span className="text-[10px] font-bold text-emerald-600">+{c.valueGrowth.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <h3 className="text-[10px] font-semibold text-red-600 mb-2 flex items-center gap-1.5 uppercase tracking-wide">
            <TrendingDown className="w-3 h-3" /> OTC Under Pressure
          </h3>
          <div className="space-y-1.5">
            {otcDecliners.map((c) => (
              <div key={c.category} className="flex items-center gap-2">
                <span className="text-[10px] text-slate-700 flex-1 truncate">{c.category}</span>
                <span className="text-[10px] font-bold text-red-500">{c.valueGrowth.toFixed(1)}%</span>
              </div>
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
                <p className="text-xs text-slate-500">Prescription market deep dive</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <div className="flex items-center gap-4 text-[10px]">
            <span className="text-slate-500">{ethCategories.length} categories</span>
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
                <p className="text-xs text-slate-500">Consumer health market</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <div className="flex items-center gap-4 text-[10px]">
            <span className="text-slate-500">{otcCategories.length} categories</span>
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
            <h3 className="text-sm font-semibold text-slate-700">Top Rx Categories</h3>
            <button onClick={() => navigate('/dispense')} className="text-[10px] text-primary font-medium flex items-center gap-0.5">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {ethTop10.slice(0, 7).map((c, i) => (
              <div key={c.name} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-[10px] text-slate-600 flex-1 truncate">{c.name}</span>
                <span className="text-[10px] font-semibold text-slate-700">{formatCompact(c.value)}</span>
                <span className={`text-[9px] font-bold w-12 text-right ${c.growth >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {c.growth >= 0 ? '+' : ''}{c.growth}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top OTC categories */}
        <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-5 chart-card animate-fade-in-up" style={{ animationDelay: '350ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-700">Top OTC Categories</h3>
            <button onClick={() => navigate('/otc')} className="text-[10px] text-primary font-medium flex items-center gap-0.5">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {otcTop10.slice(0, 7).map((c, i) => (
              <div key={c.name} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-[10px] text-slate-600 flex-1 truncate">{c.name}</span>
                <span className="text-[10px] font-semibold text-slate-700">{formatCompact(c.value)}</span>
                <span className={`text-[9px] font-bold w-12 text-right ${c.growth >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {c.growth >= 0 ? '+' : ''}{c.growth}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Full-width category comparison bars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-5 chart-card animate-fade-in-up" style={{ animationDelay: '450ms' }}>
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Dispense — Category Value</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={ethTop10} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 10 }} stroke="#94a3b8" tickFormatter={(v: number) => formatCompact(v)} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} stroke="#94a3b8" width={130} />
              <Tooltip formatter={(v) => formatCurrency(Number(v ?? 0))} />
              <Bar dataKey="value" name="TY Value" radius={[0, 4, 4, 0]} animationDuration={800}>
                {ethTop10.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-5 chart-card animate-fade-in-up" style={{ animationDelay: '550ms' }}>
          <h3 className="text-sm font-semibold text-slate-700 mb-4">OTC — Category Value</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={otcTop10} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 10 }} stroke="#94a3b8" tickFormatter={(v: number) => formatCompact(v)} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} stroke="#94a3b8" width={130} />
              <Tooltip formatter={(v) => formatCurrency(Number(v ?? 0))} />
              <Bar dataKey="value" name="TY Value" radius={[0, 4, 4, 0]} animationDuration={800}>
                {otcTop10.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-2">
        <p className="text-[9px] text-slate-300">Powered by <span className="font-semibold text-slate-400">NostraData</span></p>
      </div>
    </div>
  )
}
