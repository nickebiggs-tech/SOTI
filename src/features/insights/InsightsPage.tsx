import { useState, useMemo } from 'react'
import {
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  BookOpen, ChevronDown, Pill, ShoppingBag,
  TrendingUp, TrendingDown, Stethoscope, Building2,
  BarChart3, Sparkles, Shield, Zap,
} from 'lucide-react'
import { useData } from '../../data/DataProvider'
import { KPICard } from '../../components/ui/KPICard'
import { formatCompact, formatCompactDollar, formatCurrency } from '../../lib/formatters'

const COLORS = ['#2563EB', '#7C3AED', '#D97706', '#0D9488', '#DC2626', '#DB2777', '#EA580C', '#0891B2', '#4F46E5', '#65A30D']

interface ThemeCard {
  id: string
  icon: React.ReactNode
  title: string
  subtitle: string
  color: string
  content: string[]
}

const STRATEGIC_THEMES: ThemeCard[] = [
  {
    id: 'post-60dd',
    icon: <Pill className="w-5 h-5" />,
    title: 'Post-60DD Market Dynamics',
    subtitle: 'The new dispensing landscape',
    color: '#2563EB',
    content: [
      'The introduction of 60-Day Dispensing (60DD) has fundamentally altered the pharmacy dispensing landscape, reducing script volumes while increasing individual script values.',
      'Pharmacies are adapting by shifting focus from volume-driven models toward value-added services, clinical consultations, and expanded scope of practice.',
      'The net impact on total dispensary revenue has been partially offset by growth in high-value specialty medicines and biologics that fall outside 60DD eligibility.',
    ],
  },
  {
    id: 'specialty',
    icon: <Stethoscope className="w-5 h-5" />,
    title: 'Specialty Medicines Surge',
    subtitle: 'Biologics reshaping the dispensary',
    color: '#7C3AED',
    content: [
      'Specialty and biologic medicines continue to drive prescription market value growth, with categories like immunosuppressants, oncology, and metabolic therapies posting double-digit value increases.',
      'These high-cost therapies are increasingly being dispensed through community pharmacy channels, creating new revenue streams but also requiring enhanced cold-chain, compliance, and patient support capabilities.',
      'The top 5 growing Rx categories by value are overwhelmingly specialty-driven, underscoring a structural shift toward personalised medicine.',
    ],
  },
  {
    id: 'otc-evolution',
    icon: <ShoppingBag className="w-5 h-5" />,
    title: 'OTC Market Evolution',
    subtitle: 'Post-pandemic normalisation',
    color: '#0D9488',
    content: [
      'The OTC market is undergoing a period of correction following pandemic-driven demand surges. Categories like cough & cold, vitamins, and hand sanitiser are contracting as consumer behaviour normalises.',
      'Condition-specific categories — allergy, digestive health, sleep aids — are outperforming as consumers shift from reactive to proactive health management.',
      'Pharmacy-exclusive product lines and pharmacist-recommended brands maintain stronger margins and loyalty versus mass-market alternatives available through grocery and online channels.',
    ],
  },
  {
    id: 'footfall',
    icon: <Building2 className="w-5 h-5" />,
    title: 'Footfall & Basket Dynamics',
    subtitle: 'Fewer visits, higher value',
    color: '#D97706',
    content: [
      'With 60DD reducing prescription-driven footfall frequency, pharmacies are seeing fewer but higher-value shopping occasions. Average basket value has increased as patients combine prescription pickups with front-of-shop purchases.',
      'Cross-selling and adjacency strategies are becoming critical. Pharmacies that effectively link dispensary and retail are outperforming those with siloed operations.',
      'Digital engagement (loyalty apps, click-and-collect, telehealth) is emerging as a compensatory traffic driver, particularly among younger demographics.',
    ],
  },
  {
    id: 'channel',
    icon: <BarChart3 className="w-5 h-5" />,
    title: 'Channel Competition',
    subtitle: 'Pharmacy vs online & grocery',
    color: '#DC2626',
    content: [
      'Pharmacy channel share in OTC is under pressure from online marketplaces and supermarket health aisles. Categories with low pharmacist interaction (vitamins, skincare, personal care) face the strongest online headwinds.',
      'However, categories requiring pharmacist consultation (Schedule 3 medicines, compounding, specialty diagnostics) remain defensible moats for community pharmacy.',
      'Banner group pharmacy networks with centralised buying, private label, and omnichannel strategies are gaining share relative to independent operators.',
    ],
  },
  {
    id: 'data-driven',
    icon: <Zap className="w-5 h-5" />,
    title: 'Data-Driven Pharmacy',
    subtitle: 'Intelligence as competitive advantage',
    color: '#4F46E5',
    content: [
      'The most successful pharmacy groups are leveraging granular sales data, supplier analytics, and AI-driven insights to optimise range, pricing, and promotions.',
      'Category management powered by manufacturer-level and SKU-level trend analysis is replacing intuition-based buying decisions, particularly in high-turnover OTC segments.',
      'Platforms like SOTI are enabling pharmacists, suppliers, and industry executives to identify opportunities, benchmark performance, and make evidence-based strategic decisions in real-time.',
    ],
  },
]

export function InsightsPage() {
  const { ethCategories, otcCategories, ethTotalTY, ethTotalLY, otcTotalTY, otcTotalLY, state } = useData()
  const [expanded, setExpanded] = useState<string | null>(null)

  const ethGrowth = ethTotalLY ? ((ethTotalTY - ethTotalLY) / ethTotalLY) * 100 : 0
  const otcGrowth = otcTotalLY ? ((otcTotalTY - otcTotalLY) / otcTotalLY) * 100 : 0
  const totalMarket = ethTotalTY + otcTotalTY
  const totalMarketLY = ethTotalLY + otcTotalLY
  const totalGrowth = totalMarketLY ? ((totalMarket - totalMarketLY) / totalMarketLY) * 100 : 0

  // Rx vs OTC comparison
  const marketComparison = [
    { name: 'Dispense (Rx)', ty: Math.round(ethTotalTY), ly: Math.round(ethTotalLY) },
    { name: 'OTC / FoS', ty: Math.round(otcTotalTY), ly: Math.round(otcTotalLY) },
  ]

  // Top growing categories combined
  const topGrowing = useMemo(() => {
    const all = [
      ...ethCategories.filter(c => c.lyValue > 10000).map(c => ({ ...c, segment: 'Rx' as const })),
      ...otcCategories.filter(c => c.lyValue > 50000).map(c => ({ ...c, segment: 'OTC' as const })),
    ]
    return all.sort((a, b) => b.valueGrowth - a.valueGrowth).slice(0, 8)
  }, [ethCategories, otcCategories])

  const topDeclining = useMemo(() => {
    const all = [
      ...ethCategories.filter(c => c.lyValue > 10000).map(c => ({ ...c, segment: 'Rx' as const })),
      ...otcCategories.filter(c => c.lyValue > 50000).map(c => ({ ...c, segment: 'OTC' as const })),
    ]
    return all.sort((a, b) => a.valueGrowth - b.valueGrowth).slice(0, 8)
  }, [ethCategories, otcCategories])

  // Auto-narrative — commercial framing
  const heroNarrative = useMemo(() => {
    const dir = totalGrowth >= 0 ? 'grew' : 'contracted'
    const rxDir = ethGrowth >= 0 ? 'expanding' : 'declining'
    const otcDir = otcGrowth >= 0 ? 'recovering' : 'softening'
    const totalDelta = Math.abs(totalMarket - (ethTotalLY + otcTotalLY))
    return `The Australian pharmacy industry ${dir} ${Math.abs(totalGrowth).toFixed(1)}% to ${formatCompactDollar(totalMarket)} (${totalGrowth >= 0 ? '+' : '-'}${formatCompactDollar(totalDelta)} net), with prescription sales ${rxDir} at ${ethGrowth >= 0 ? '+' : ''}${ethGrowth.toFixed(1)}% (${formatCompactDollar(ethTotalTY)}) and OTC ${otcDir} at ${otcGrowth >= 0 ? '+' : ''}${otcGrowth.toFixed(1)}% (${formatCompactDollar(otcTotalTY)}). This intelligence platform synthesises ${formatCompact(state.eth.length + state.otc.length)} product-level records into commercially actionable insights for pharma executives, suppliers, and pharmacy groups.`
  }, [totalGrowth, totalMarket, ethGrowth, ethTotalTY, ethTotalLY, otcGrowth, otcTotalTY, otcTotalLY, state.eth.length, state.otc.length])

  return (
    <div className="space-y-4 sm:space-y-6 page-enter">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-0.5 sm:hidden">
          <span className="text-base font-extrabold tracking-tight"><span className="text-primary">SOTI</span></span>
          <span className="text-[8px] text-slate-400 font-semibold uppercase tracking-widest border border-slate-200 rounded px-1.5 py-0.5">Insights</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 hidden sm:block">Market Insights</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">Strategic themes & industry intelligence</p>
      </div>

      {/* Hero narrative */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl p-5 sm:p-8 text-white overflow-hidden animate-fade-in-up">
        {/* Animated background dots */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-white/10"
              style={{
                left: `${10 + (i * 7.5) % 90}%`,
                top: `${15 + (i * 13) % 70}%`,
                animation: `float-gentle ${3 + (i % 3)}s ease-in-out infinite`,
                animationDelay: `${i * 0.4}s`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-amber-400/80">State of the Industry Report</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold mb-3 leading-snug">
            Australian Pharmacy Market <span className="text-gradient">FY 2024-25</span>
          </h2>
          <p className="text-sm sm:text-base text-white/75 leading-relaxed max-w-3xl">
            {heroNarrative}
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 stagger-children">
        <KPICard title="Total Market" value={formatCompactDollar(totalMarket)} delta={totalGrowth} deltaLabel="YoY" icon={<BarChart3 className="w-4 h-4" />} />
        <KPICard title="Dispense (Rx)" value={formatCompactDollar(ethTotalTY)} delta={ethGrowth} deltaLabel="YoY" icon={<Pill className="w-4 h-4" />} />
        <KPICard title="OTC / FoS" value={formatCompactDollar(otcTotalTY)} delta={otcGrowth} deltaLabel="YoY" icon={<ShoppingBag className="w-4 h-4" />} />
        <KPICard title="Data Points" value={formatCompact(state.eth.length + state.otc.length)} icon={<Sparkles className="w-4 h-4" />} />
      </div>

      {/* Market Comparison Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 chart-card animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Rx vs OTC — Year-on-Year</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={marketComparison} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" tickFormatter={(v: number) => formatCompact(v)} />
              <Tooltip formatter={(v) => formatCurrency(Number(v ?? 0))} />
              <Bar dataKey="ly" name="Last Year" fill="#94a3b8" radius={[4, 4, 0, 0]} animationDuration={1200} animationEasing="ease-out" />
              <Bar dataKey="ty" name="This Year" fill="#2563EB" radius={[4, 4, 0, 0]} animationDuration={1200} animationEasing="ease-out" animationBegin={300} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Growth leaders */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 chart-card animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Cross-Market Growth Leaders</h3>
          <div className="space-y-2">
            {topGrowing.map((c, i) => (
              <div key={c.category} className="flex items-center gap-2 animate-fade-in-up" style={{ animationDelay: `${250 + i * 50}ms` }}>
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${c.segment === 'Rx' ? 'bg-blue-50 text-blue-600' : 'bg-teal-50 text-teal-600'}`}>{c.segment}</span>
                <span className="text-[10px] text-slate-600 flex-1 truncate">{c.category}</span>
                <span className="text-[10px] font-bold text-emerald-600">+{c.valueGrowth.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Strategic Themes */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-primary" />
          <h2 className="text-sm sm:text-base font-bold text-slate-800">Strategic Themes</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {STRATEGIC_THEMES.map((theme, i) => {
            const isExpanded = expanded === theme.id
            return (
              <div
                key={theme.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden transition-all animate-fade-in-up"
                style={{ animationDelay: `${100 + i * 80}ms` }}
              >
                <button
                  onClick={() => setExpanded(isExpanded ? null : theme.id)}
                  className="w-full text-left p-4 sm:p-5 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform"
                      style={{ backgroundColor: `${theme.color}15`, color: theme.color }}
                    >
                      {theme.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs sm:text-sm font-bold text-slate-800 leading-tight">{theme.title}</h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">{theme.subtitle}</p>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5 animate-fade-in">
                    <div className="border-t border-slate-100 pt-3 space-y-2.5">
                      {theme.content.map((para, j) => (
                        <p key={j} className="text-[11px] sm:text-xs text-slate-600 leading-relaxed">{para}</p>
                      ))}
                    </div>
                    <div className="mt-3 h-0.5 rounded-full" style={{ backgroundColor: `${theme.color}20` }}>
                      <div className="h-full rounded-full animate-width-grow" style={{ backgroundColor: theme.color, width: '60%' }} />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Categories Under Pressure */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 chart-card animate-fade-in-up" style={{ animationDelay: '400ms' }}>
        <div className="flex items-center gap-2 mb-4">
          <TrendingDown className="w-4 h-4 text-red-500" />
          <h3 className="text-sm font-semibold text-slate-700">Categories Under Pressure</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
          {topDeclining.map((c) => (
            <div key={c.category} className="flex items-center gap-2 py-1.5 border-b border-slate-50">
              <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${c.segment === 'Rx' ? 'bg-blue-50 text-blue-600' : 'bg-teal-50 text-teal-600'}`}>{c.segment}</span>
              <span className="text-[10px] text-slate-600 flex-1 truncate">{c.category}</span>
              <span className="text-[10px] font-semibold text-slate-500">{formatCompactDollar(c.tyValue)}</span>
              <span className="text-[10px] font-bold text-red-500">{c.valueGrowth.toFixed(1)}%</span>
              <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-red-400 transition-all duration-1000"
                  style={{ width: `${Math.min(Math.abs(c.valueGrowth) * 2, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CEO Questions */}
      <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-xl border border-primary/10 p-4 sm:p-6 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
        <h3 className="text-sm font-bold text-slate-800 mb-1">Key Questions for Industry Leaders</h3>
        <p className="text-[10px] text-slate-500 mb-4">Strategic considerations derived from the data</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { q: 'How will 60DD reshape supplier-pharmacy commercial models?', insight: `${formatCompactDollar(ethTotalTY)} Rx market shifting from volume to value — trade terms need renegotiation` },
            { q: 'Where should suppliers allocate trade spend in OTC?', insight: `${formatCompactDollar(otcTotalTY)} OTC market — condition-specific segments delivering superior ROI vs general wellness` },
            { q: 'Is specialty pharma the $-growth engine for pharmacy?', insight: `Rx growth at +${ethGrowth.toFixed(1)}% driven by high-cost biologics — disproportionate value per script` },
            { q: 'What is the commercial risk of channel leakage?', insight: `Online and grocery eroding pharmacy share in OTC — pharmacist-advised categories remain defensible moats` },
          ].map((item, i) => (
            <div key={i} className="bg-white/80 rounded-lg p-3 border border-slate-100">
              <p className="text-[11px] font-semibold text-slate-700 mb-1">{item.q}</p>
              <p className="text-[10px] text-slate-500 italic flex items-start gap-1">
                <TrendingUp className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                {item.insight}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-2">
        <p className="text-[9px] text-slate-300">Powered by <span className="font-semibold text-slate-400">NostraData</span></p>
      </div>
    </div>
  )
}
