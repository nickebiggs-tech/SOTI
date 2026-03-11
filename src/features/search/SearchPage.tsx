import React, { useMemo, useState, useCallback, useEffect } from 'react'
import {
  BarChart, Bar, Cell, LineChart, Line, Legend,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts'
import {
  Search, X, Plus, Pill, ShoppingBag, GitCompareArrows,
  TrendingUp, TrendingDown, ChevronDown, ChevronRight, Sparkles, ArrowUpDown, Layers, Calendar, ListPlus, HelpCircle,
} from 'lucide-react'
import { useData } from '../../data/DataProvider'
import { KPICard } from '../../components/ui/KPICard'
import { formatCompactDollar, formatCompact, formatDelta } from '../../lib/formatters'
import { MetricToggle, type MetricMode } from '../../components/ui/MetricToggle'

const COLORS = ['#2563EB', '#7C3AED', '#D97706', '#0D9488', '#DC2626', '#DB2777', '#EA580C', '#0891B2', '#4F46E5', '#65A30D', '#0369A1', '#BE185D', '#B45309', '#059669', '#6D28D9', '#E11D48', '#0E7490', '#C2410C', '#7C2D12', '#4338CA']
const MAX_SELECTIONS = 20

type MarketType = 'rx' | 'otc'
type SortField = 'name' | 'tyValue' | 'growth' | 'absChange'
type SortDir = 'asc' | 'desc'

interface SearchItem {
  id: string
  name: string
  category: string
  manufacturer: string
  molecule?: string
  tyValue: number
  lyValue: number
  tyUnits: number
  lyUnits: number
  absChange: number
  growth: number
  unitGrowth: number
  skuCount?: number          // populated when grouped
  skuNames?: string[]        // list of individual SKU names in this group
}

/** Extract brand name from a SKU name for grouping.
 *  Strategy: take leading words that are NOT a dosage form, strength, or pack size.
 *  e.g. "MOUNJARO KWIKPEN PREFILLED PEN 15 MG 2.4 ML" → "MOUNJARO"
 *  e.g. "OZEMPIC PREFILLED PEN 0.25 MG 1.5 ML" → "OZEMPIC"
 *  e.g. "NUROFEN ZAVANCE CAPLET 256 MG 24" → "NUROFEN ZAVANCE"
 */
function extractBrandName(name: string): string {
  const upper = name.toUpperCase()
  // Common dosage form words that signal end of brand name
  const formWords = new Set([
    'TABLET', 'TABLETS', 'TAB', 'CAPSULE', 'CAPSULES', 'CAP', 'CAPLET', 'CAPLETS',
    'AMPOULE', 'AMPOULES', 'VIAL', 'VIALS', 'PREFILLED', 'PEN', 'KWIKPEN',
    'INJECTION', 'SOLUTION', 'SUSPENSION', 'SYRUP', 'CREAM', 'OINTMENT', 'GEL',
    'INHALER', 'SPRAY', 'DROPS', 'PATCH', 'SUPPOSITORY', 'POWDER',
    'SACHET', 'SACHETS', 'LIQUID', 'ORAL', 'IV', 'INFUSION',
    'BOTTLE', 'PACK', 'BOX', 'STRIP', 'BLISTER',
    'MODIFIED', 'RELEASE', 'EXTENDED', 'SUSTAINED', 'DELAYED',
    'FILMCOATED', 'FILM-COATED', 'COATED', 'CHEWABLE', 'DISPERSIBLE',
    'EFFERVESCENT', 'SOLUBLE', 'SOFTGEL',
  ])

  const words = upper.split(/\s+/)
  const brand: string[] = []

  for (const w of words) {
    // Stop at form words, numeric values (strengths), or "MG/ML/MCG/G"
    if (formWords.has(w)) break
    if (/^\d/.test(w)) break
    if (/^(MG|ML|MCG|G|IU|UNIT|UNITS|X)$/i.test(w)) break
    brand.push(w)
  }

  // Return at least the first word
  if (brand.length === 0) return words[0] || name
  return brand.join(' ')
}

export function SearchPage() {
  const { state, ethCategories, otcCategories, ethTotalTY, otcTotalTY, loadMonthlyData } = useData()
  const [market, setMarket] = useState<MarketType>('rx')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<SearchItem[]>([])
  const [narrativeOpen, setNarrativeOpen] = useState(true)
  const [sortField, setSortField] = useState<SortField>('tyValue')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [groupByBrand, setGroupByBrand] = useState(false)
  const [radarHelpOpen, setRadarHelpOpen] = useState(false)
  const [expandedBrands, setExpandedBrands] = useState<Set<string>>(new Set())
  const [metricMode, setMetricMode] = useState<MetricMode>('value')
  const isValue = metricMode === 'value'
  const fmt = isValue ? formatCompactDollar : formatCompact

  // Load monthly data when Rx products are selected (for trend chart)
  useEffect(() => {
    if (market === 'rx' && selected.length > 0) {
      loadMonthlyData()
    }
  }, [market, selected.length, loadMonthlyData])

  // Build unified search items from data
  const allItems = useMemo((): SearchItem[] => {
    if (market === 'rx') {
      return state.ethSkus.map(r => {
        const absChange = r.tyValue - r.lyValue
        const growth = r.lyValue > 0 ? ((r.tyValue - r.lyValue) / r.lyValue) * 100 : (r.tyValue > 0 ? 999 : 0)
        const unitGrowth = r.lyUnits > 0 ? ((r.tyUnits - r.lyUnits) / r.lyUnits) * 100 : 0
        return {
          id: `rx-${r.sku}`,
          name: r.sku,
          category: r.category,
          manufacturer: r.manufacturer,
          molecule: r.molecule,
          tyValue: r.tyValue,
          lyValue: r.lyValue,
          tyUnits: r.tyUnits,
          lyUnits: r.lyUnits,
          absChange,
          growth,
          unitGrowth,
        }
      })
    } else {
      return state.otc.map(r => {
        const absChange = r.tyValue - r.lyValue
        const growth = r.lyValue > 0 ? ((r.tyValue - r.lyValue) / r.lyValue) * 100 : (r.tyValue > 0 ? 999 : 0)
        const unitGrowth = r.lyUnits > 0 ? ((r.tyUnits - r.lyUnits) / r.lyUnits) * 100 : 0
        return {
          id: `otc-${r.packName}`,
          name: r.packName,
          category: r.market,
          manufacturer: r.manufacturer,
          tyValue: r.tyValue,
          lyValue: r.lyValue,
          tyUnits: r.tyUnits,
          lyUnits: r.lyUnits,
          absChange,
          growth,
          unitGrowth,
        }
      })
    }
  }, [market, state.ethSkus, state.otc])

  // Grouped items — aggregate SKUs by brand name
  const groupedItems = useMemo((): SearchItem[] => {
    if (!groupByBrand) return allItems
    const groups = new Map<string, { items: SearchItem[]; brand: string }>()
    for (const item of allItems) {
      const brand = extractBrandName(item.name)
      const existing = groups.get(brand)
      if (existing) {
        existing.items.push(item)
      } else {
        groups.set(brand, { items: [item], brand })
      }
    }
    return Array.from(groups.values()).map(({ items, brand }) => {
      const tyValue = items.reduce((s, i) => s + i.tyValue, 0)
      const lyValue = items.reduce((s, i) => s + i.lyValue, 0)
      const tyUnits = items.reduce((s, i) => s + i.tyUnits, 0)
      const lyUnits = items.reduce((s, i) => s + i.lyUnits, 0)
      const absChange = tyValue - lyValue
      const growth = lyValue > 0 ? ((tyValue - lyValue) / lyValue) * 100 : (tyValue > 0 ? 999 : 0)
      const unitGrowth = lyUnits > 0 ? ((tyUnits - lyUnits) / lyUnits) * 100 : 0
      return {
        id: `grp-${brand}`,
        name: `${brand} (${items.length} SKU${items.length > 1 ? 's' : ''})`,
        category: items[0]!.category,
        manufacturer: items[0]!.manufacturer,
        molecule: items[0]!.molecule,
        tyValue, lyValue, tyUnits, lyUnits,
        absChange, growth, unitGrowth,
        skuCount: items.length,
        skuNames: items.map(i => i.name),
      }
    })
  }, [allItems, groupByBrand])

  // Filtered + sorted results
  const results = useMemo(() => {
    if (!search || search.length < 2) return []
    const q = search.toLowerCase()
    const tokens = q.split(/\s+/).filter(Boolean)

    let filtered = groupedItems.filter(item => {
      const searchable = `${item.name} ${item.category} ${item.manufacturer} ${item.molecule || ''} ${(item.skuNames || []).join(' ')}`.toLowerCase()
      return tokens.every(t => searchable.includes(t))
    })

    filtered.sort((a, b) => {
      let cmp = 0
      switch (sortField) {
        case 'name': cmp = a.name.localeCompare(b.name); break
        case 'tyValue': cmp = a.tyValue - b.tyValue; break
        case 'growth': cmp = a.growth - b.growth; break
        case 'absChange': cmp = a.absChange - b.absChange; break
      }
      return sortDir === 'desc' ? -cmp : cmp
    })

    return filtered.slice(0, 50)
  }, [search, groupedItems, sortField, sortDir])

  // Look up individual SKUs for a grouped brand
  const getSkusForBrand = useCallback((item: SearchItem): SearchItem[] => {
    if (!item.skuNames || item.skuNames.length <= 1) return []
    const nameSet = new Set(item.skuNames.map(n => n.toUpperCase()))
    return allItems
      .filter(a => nameSet.has(a.name.toUpperCase()))
      .sort((a, b) => b.tyValue - a.tyValue)
  }, [allItems])

  const toggleBrandExpand = useCallback((id: string) => {
    setExpandedBrands(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleSelect = useCallback((item: SearchItem) => {
    setSelected(prev => {
      const exists = prev.find(s => s.id === item.id)
      if (exists) return prev.filter(s => s.id !== item.id)
      if (prev.length >= MAX_SELECTIONS) return prev
      return [...prev, item]
    })
    // In group-by-brand mode, clear search after selecting so user can immediately search for next brand
    if (groupByBrand) {
      setTimeout(() => setSearch(''), 150)
    }
  }, [groupByBrand])

  const removeSelected = useCallback((id: string) => {
    setSelected(prev => prev.filter(s => s.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setSelected([])
  }, [])

  const addAllResults = useCallback(() => {
    setSelected(prev => {
      const remaining = MAX_SELECTIONS - prev.length
      if (remaining <= 0) return prev
      const existingIds = new Set(prev.map(s => s.id))
      const toAdd = results.filter(r => !existingIds.has(r.id)).slice(0, remaining)
      if (toAdd.length === 0) return prev
      return [...prev, ...toAdd]
    })
  }, [results])

  const handleSort = useCallback((field: SortField) => {
    setSortField(prev => {
      if (prev === field) {
        setSortDir(d => d === 'desc' ? 'asc' : 'desc')
        return prev
      }
      setSortDir('desc')
      return field
    })
  }, [])

  // Switch market clears selection and search
  const switchMarket = useCallback((m: MarketType) => {
    setMarket(m)
    setSelected([])
    setSearch('')
  }, [])

  // Toggle group by brand — clears selection since IDs change
  const toggleGroupByBrand = useCallback(() => {
    setGroupByBrand(prev => !prev)
    setSelected([])
  }, [])

  // Comparison data
  const comparisonChart = useMemo(() => {
    if (selected.length === 0) return []
    return selected.map((s, i) => ({
      name: s.name.length > 25 ? s.name.slice(0, 23) + '...' : s.name,
      fullName: s.name,
      tyValue: isValue ? s.tyValue : s.tyUnits,
      lyValue: isValue ? s.lyValue : s.lyUnits,
      color: COLORS[i % COLORS.length],
    }))
  }, [selected, isValue])

  const growthChart = useMemo(() => {
    if (selected.length === 0) return []
    return selected.map((s, i) => ({
      name: s.name.length > 25 ? s.name.slice(0, 23) + '...' : s.name,
      fullName: s.name,
      absChange: isValue ? s.absChange : (s.tyUnits - s.lyUnits),
      color: COLORS[i % COLORS.length],
    }))
  }, [selected, isValue])

  // Monthly trend data (Rx only) — build from ethMonthly when loaded
  const trendData = useMemo(() => {
    if (market !== 'rx' || selected.length === 0 || !state.ethMonthly) return []

    // Build a set of SKU names we need to match
    const skuSets = selected.map(s => {
      if (s.skuNames && s.skuNames.length > 0) {
        return new Set(s.skuNames.map(n => n.toUpperCase()))
      }
      return new Set([s.name.toUpperCase()])
    })

    // Gather all months
    const monthMap = new Map<number, Record<string, number>>()
    const monthLabels = new Map<number, string>()

    for (const rec of state.ethMonthly) {
      const skuUpper = rec.sku.toUpperCase()
      for (let si = 0; si < skuSets.length; si++) {
        if (skuSets[si]!.has(skuUpper)) {
          if (!monthMap.has(rec.monthId)) {
            monthMap.set(rec.monthId, {})
            monthLabels.set(rec.monthId, rec.date)
          }
          const entry = monthMap.get(rec.monthId)!
          entry[`p${si}`] = (entry[`p${si}`] || 0) + rec.sales
        }
      }
    }

    // Sort by monthId
    const sorted = Array.from(monthMap.entries()).sort((a, b) => a[0] - b[0])
    return sorted.map(([monthId, values]) => {
      const dateStr = monthLabels.get(monthId) || ''
      // Parse "1/04/2023" → "Apr 23"
      let label = dateStr
      try {
        const parts = dateStr.split('/')
        if (parts.length === 3) {
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
          const m = parseInt(parts[1]!, 10)
          const y = parts[2]!.slice(-2)
          label = `${months[m - 1]} ${y}`
        }
      } catch { /* use raw */ }
      return { month: label, monthId, ...values }
    })
  }, [market, selected, state.ethMonthly])

  // Radar chart for multi-dimensional comparison (normalised 0-100)
  const radarData = useMemo(() => {
    if (selected.length < 2) return []
    const maxTyValue = Math.max(...selected.map(s => s.tyValue), 1)
    const maxUnits = Math.max(...selected.map(s => s.tyUnits), 1)
    const maxAbsGrowth = Math.max(...selected.map(s => Math.abs(s.absChange)), 1)
    const maxGrowthPct = Math.max(...selected.map(s => Math.abs(s.growth)), 1)

    const dimensions = [
      { metric: 'TY Value', key: 'value' },
      { metric: 'Volume', key: 'volume' },
      { metric: '$ Change', key: 'change' },
      { metric: 'Growth %', key: 'growthPct' },
    ]

    return dimensions.map(d => {
      const point: Record<string, string | number> = { metric: d.metric }
      selected.forEach((s, i) => {
        switch (d.key) {
          case 'value': point[`p${i}`] = (s.tyValue / maxTyValue) * 100; break
          case 'volume': point[`p${i}`] = (s.tyUnits / maxUnits) * 100; break
          case 'change': point[`p${i}`] = (Math.abs(s.absChange) / maxAbsGrowth) * 100; break
          case 'growthPct': point[`p${i}`] = (Math.abs(s.growth) / maxGrowthPct) * 100; break
        }
      })
      return point
    })
  }, [selected])

  // Generate comparison narrative
  const narrative = useMemo(() => {
    if (selected.length === 0) return []
    const label = groupByBrand ? 'brand' : (market === 'rx' ? 'SKU' : 'item')
    if (selected.length === 1) {
      const s = selected[0]!
      const dir = s.growth >= 0 ? 'grew' : 'declined'
      const skuNote = s.skuCount && s.skuCount > 1 ? ` (aggregated across ${s.skuCount} SKUs)` : ''
      return [
        `${s.name}${skuNote} ${dir} ${Math.abs(s.growth).toFixed(1)}% YoY to ${formatCompactDollar(s.tyValue)}, ${s.absChange >= 0 ? 'adding' : 'losing'} ${formatCompactDollar(Math.abs(s.absChange))} in absolute value. It sits in the ${s.category} category under ${s.manufacturer}.`,
      ]
    }

    const lines: string[] = []
    const totalTY = selected.reduce((s, p) => s + p.tyValue, 0)
    const sorted = [...selected].sort((a, b) => b.tyValue - a.tyValue)
    const leader = sorted[0]!
    const fastestGrower = [...selected].sort((a, b) => b.growth - a.growth)[0]!

    lines.push(
      `Comparing ${selected.length} ${label}s${groupByBrand ? ' (aggregated)' : ''} with combined TY value of ${formatCompactDollar(totalTY)}. ${leader.name} leads by value at ${formatCompactDollar(leader.tyValue)}.`
    )

    if (fastestGrower.id !== leader.id) {
      lines.push(
        `${fastestGrower.name} is the fastest grower at ${formatDelta(fastestGrower.growth)} YoY, while ${leader.name} leads in absolute value.`
      )
    }

    const growers = selected.filter(s => s.absChange > 0)
    const decliners = selected.filter(s => s.absChange < 0)
    if (growers.length > 0 && decliners.length > 0) {
      lines.push(
        `${growers.length} of the selected products are growing while ${decliners.length} ${decliners.length === 1 ? 'is' : 'are'} declining — signalling competitive displacement and value migration within these therapeutic areas.`
      )
    }

    return lines
  }, [selected, market, groupByBrand])

  const marketLabel = market === 'rx' ? 'Rx' : 'OTC'
  const itemLabel = groupByBrand ? 'Brand' : (market === 'rx' ? 'SKU' : 'Item')
  const catCount = market === 'rx' ? ethCategories.length : otcCategories.length
  const totalMarket = market === 'rx' ? ethTotalTY : otcTotalTY
  const totalItems = groupedItems.length

  return (
    <div className="space-y-4 sm:space-y-6 page-enter">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-0.5 sm:hidden">
          <span className="text-base font-extrabold tracking-tight"><span className="text-primary">SOTI</span></span>
          <span className="text-[7px] text-slate-400 font-medium uppercase tracking-wider">Search & Compare</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 hidden sm:block">
          <span className="text-blue-600">Search & Compare</span>
          <span className="text-sm font-medium text-slate-400 ml-2">Product Intelligence</span>
        </h1>
        <div className="flex items-center justify-between mt-0.5 sm:mt-1">
          <p className="text-xs sm:text-sm text-slate-500">
            Search by {market === 'rx' ? 'SKU, molecule, or manufacturer' : 'item name, category, or manufacturer'} — select up to {MAX_SELECTIONS} products to compare side-by-side
          </p>
          <MetricToggle mode={metricMode} onChange={setMetricMode} />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 stagger-children">
        <KPICard title={`${marketLabel} Market`} value={isValue ? formatCompactDollar(totalMarket) : formatCompact(market === 'rx' ? state.ethSkus.reduce((s, r) => s + r.tyUnits, 0) : state.otc.reduce((s, r) => s + r.tyUnits, 0))} icon={market === 'rx' ? <Pill className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />} />
        <KPICard title="Categories" value={`${catCount}`} icon={<Search className="w-4 h-4" />} />
        <KPICard title={`${itemLabel}s`} value={formatCompact(totalItems)} icon={market === 'rx' ? <Pill className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />} />
        <KPICard title="Comparing" value={`${selected.length}`} icon={<GitCompareArrows className="w-4 h-4" />} />
      </div>

      {/* Market Toggle + Search */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-3 sm:px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-blue-50/60 to-indigo-50/40">
          <div className="flex items-center gap-2 sm:gap-3">
            <Search className="w-4 h-4 text-blue-600 shrink-0" />
            <h3 className="text-[11px] sm:text-xs font-bold text-slate-800">Find Products</h3>
          </div>
        </div>

        <div className="px-3 sm:px-5 py-3 space-y-3">
          {/* Market toggle + Group toggle */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => switchMarket('rx')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg border text-xs font-semibold transition-all ${
                market === 'rx'
                  ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                  : 'bg-white border-slate-200 text-slate-500 hover:border-blue-200 hover:bg-blue-50'
              }`}
            >
              <Pill className="w-3.5 h-3.5" />
              Prescription (Rx)
            </button>
            <button
              onClick={() => switchMarket('otc')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg border text-xs font-semibold transition-all ${
                market === 'otc'
                  ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                  : 'bg-white border-slate-200 text-slate-500 hover:border-blue-200 hover:bg-blue-50'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Consumer Health (OTC)
            </button>

            <div className="h-5 w-px bg-slate-200 mx-1" />

            <button
              onClick={toggleGroupByBrand}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${
                groupByBrand
                  ? 'bg-violet-600 border-violet-600 text-white shadow-sm'
                  : 'bg-white border-slate-200 text-slate-500 hover:border-violet-200 hover:bg-violet-50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Group by Brand
            </button>
          </div>

          {groupByBrand && (
            <p className="text-[10px] text-violet-600 bg-violet-50 rounded-lg px-2.5 py-1.5 border border-violet-100">
              SKUs are aggregated by brand name — e.g. all Mounjaro strengths combined into one entry. Compare brands head-to-head.
            </p>
          )}

          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={market === 'rx'
                ? (groupByBrand
                    ? 'Search brands... e.g. "Mounjaro" or "Ozempic" (all SKUs aggregated)'
                    : 'Search by SKU, molecule, manufacturer, or category... e.g. "Ozempic" or "semaglutide"')
                : (groupByBrand
                    ? 'Search brands... e.g. "Nurofen" or "Panadol" (all packs aggregated)'
                    : 'Search by item name, manufacturer, or category... e.g. "Nurofen" or "Panadol"')
              }
              className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-slate-200 bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Prompt to search for more when items are selected but search is empty */}
          {selected.length > 0 && selected.length < MAX_SELECTIONS && search.length < 2 && (
            <div className="flex items-center gap-2 bg-emerald-50 rounded-lg px-3 py-2 border border-emerald-100">
              <Plus className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <p className="text-[10px] text-emerald-700 font-medium">
                {selected.length} {groupByBrand ? 'brand' : itemLabel.toLowerCase()}{selected.length > 1 ? 's' : ''} selected.
                Search for more to compare side-by-side (up to {MAX_SELECTIONS}).
                {groupByBrand && selected.length === 1 && <span className="text-emerald-600"> Try searching &ldquo;{selected[0]!.name.includes('OZEMPIC') ? 'Mounjaro' : 'Ozempic'}&rdquo; to compare brands.</span>}
              </p>
            </div>
          )}

          {search.length >= 2 && (
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] text-slate-400">{results.length} result{results.length !== 1 ? 's' : ''} found{results.length === 50 ? ' (showing first 50)' : ''}</p>
              {results.length > 0 && (
                <button
                  onClick={addAllResults}
                  disabled={selected.length >= MAX_SELECTIONS || results.every(r => selected.some(s => s.id === r.id))}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[10px] font-semibold transition-all
                    bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100 hover:border-blue-300
                    disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-blue-50 disabled:hover:border-blue-200"
                >
                  <ListPlus className="w-3 h-3" />
                  Add All ({Math.min(results.filter(r => !selected.some(s => s.id === r.id)).length, MAX_SELECTIONS - selected.length)})
                </button>
              )}
            </div>
          )}
        </div>

        {/* Brand grouping hint — show when multiple SKUs of same brand are visible and not already grouped */}
        {results.length > 1 && !groupByBrand && (() => {
          const brands = new Map<string, number>()
          for (const r of results) {
            const b = extractBrandName(r.name)
            brands.set(b, (brands.get(b) || 0) + 1)
          }
          const multiBrands = Array.from(brands.entries()).filter(([, c]) => c > 1)
          if (multiBrands.length === 0) return null
          const example = multiBrands[0]!
          return (
            <div className="mx-3 sm:mx-5 mb-1">
              <button
                onClick={toggleGroupByBrand}
                className="w-full text-left text-[10px] text-blue-600 bg-blue-50 rounded-lg px-2.5 py-2 border border-blue-100 hover:bg-blue-100 transition-colors flex items-center gap-1.5"
              >
                <Layers className="w-3 h-3 shrink-0" />
                <span>
                  <strong>Tip:</strong> {example[1]} SKUs found for {example[0]}{multiBrands.length > 1 ? ` and ${multiBrands.length - 1} other brand${multiBrands.length > 2 ? 's' : ''}` : ''}.
                  Click here to <strong>Group by Brand</strong> and compare aggregated brand totals (e.g. all Mounjaro vs all Ozempic).
                </span>
              </button>
            </div>
          )
        })()}

        {/* Results table */}
        {results.length > 0 && (
          <div className="border-t border-slate-100">
            {/* Sort headers */}
            <div className="px-3 sm:px-5 py-2 bg-slate-50 flex items-center gap-2 text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-wider">
              <div className="w-8 shrink-0" />
              <button onClick={() => handleSort('name')} className="flex-1 min-w-0 flex items-center gap-0.5 hover:text-blue-600 text-left">
                {itemLabel} {sortField === 'name' && <ArrowUpDown className="w-2.5 h-2.5" />}
              </button>
              <button onClick={() => handleSort('tyValue')} className="w-20 sm:w-24 text-right flex items-center justify-end gap-0.5 hover:text-blue-600">
                {isValue ? 'TY Value' : 'TY Units'} {sortField === 'tyValue' && <ArrowUpDown className="w-2.5 h-2.5" />}
              </button>
              <button onClick={() => handleSort('absChange')} className="w-20 sm:w-24 text-right flex items-center justify-end gap-0.5 hover:text-blue-600">
                {isValue ? '$ Change' : 'Unit Chg'} {sortField === 'absChange' && <ArrowUpDown className="w-2.5 h-2.5" />}
              </button>
              <button onClick={() => handleSort('growth')} className="w-14 sm:w-16 text-right flex items-center justify-end gap-0.5 hover:text-blue-600">
                Growth {sortField === 'growth' && <ArrowUpDown className="w-2.5 h-2.5" />}
              </button>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {results.map(item => {
                const isSelected = selected.some(s => s.id === item.id)
                return (
                  <button
                    key={item.id}
                    onClick={() => toggleSelect(item)}
                    className={`w-full px-3 sm:px-5 py-2 flex items-center gap-2 text-left transition-colors border-b border-slate-50 ${
                      isSelected
                        ? 'bg-blue-50 hover:bg-blue-100/60'
                        : 'hover:bg-slate-50 active:bg-blue-50/50'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                      isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300'
                    }`}>
                      {isSelected && <Plus className="w-3 h-3 text-white rotate-45" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-[10px] sm:text-[11px] text-slate-800 font-medium truncate">{item.name}</p>
                        {item.skuCount && item.skuCount > 1 && (
                          <span className="text-[7px] bg-violet-100 text-violet-600 font-bold px-1 py-0.5 rounded shrink-0">{item.skuCount} SKUs</span>
                        )}
                      </div>
                      <p className="text-[8px] sm:text-[9px] text-slate-400 truncate">{item.manufacturer} · {item.category}{item.molecule ? ` · ${item.molecule}` : ''}</p>
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-semibold text-slate-700 w-20 sm:w-24 text-right shrink-0">{isValue ? formatCompactDollar(item.tyValue) : formatCompact(item.tyUnits)}</span>
                    <span className={`text-[10px] sm:text-[11px] font-bold w-20 sm:w-24 text-right shrink-0 ${(isValue ? item.absChange : (item.tyUnits - item.lyUnits)) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {(isValue ? item.absChange : (item.tyUnits - item.lyUnits)) >= 0 ? '+' : ''}{isValue ? formatCompactDollar(item.absChange) : formatCompact(item.tyUnits - item.lyUnits)}
                    </span>
                    <span className={`text-[9px] sm:text-[10px] font-bold w-14 sm:w-16 text-right shrink-0 ${(isValue ? item.growth : item.unitGrowth) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {item.growth >= 900 ? 'NEW' : formatDelta(isValue ? item.growth : item.unitGrowth)}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {search.length >= 2 && results.length === 0 && (
          <div className="px-5 py-8 text-center border-t border-slate-100">
            <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-400">No {market === 'rx' ? 'SKUs' : 'items'} matching &ldquo;{search}&rdquo;</p>
            <p className="text-[10px] text-slate-300 mt-1">Try a different term or switch market</p>
          </div>
        )}
      </div>

      {/* Selected items chips */}
      {selected.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <GitCompareArrows className="w-4 h-4 text-blue-600" />
              <span className="text-[11px] sm:text-xs font-bold text-slate-800">Comparing {selected.length} {itemLabel.toLowerCase()}{selected.length > 1 ? 's' : ''}</span>
            </div>
            <button onClick={clearAll} className="text-[9px] text-red-500 font-semibold hover:underline">Clear all</button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {selected.map((s, i) => (
              <div key={s.id} className="flex items-center gap-1 bg-slate-100 rounded-lg pl-2 pr-1 py-1 group">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-[9px] sm:text-[10px] font-medium text-slate-700 max-w-[200px] truncate">{s.name}</span>
                <button onClick={() => removeSelected(s.id)} className="ml-0.5 p-0.5 rounded hover:bg-slate-200 text-slate-400 hover:text-red-500 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comparison narrative */}
      {narrative.length > 0 && (
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-xl overflow-hidden">
          <button onClick={() => setNarrativeOpen(v => !v)} className="w-full p-3 sm:p-4 flex items-start gap-3 text-left cursor-pointer">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-[9px] font-semibold uppercase tracking-widest text-amber-400/80">Comparison Intelligence</span>
              <p className="text-[11px] sm:text-xs text-white/75 leading-relaxed mt-1 line-clamp-2">{narrative[0]}</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-white/40 shrink-0 mt-0.5 transition-transform duration-200 ${narrativeOpen ? 'rotate-180' : ''}`} />
          </button>
          {narrativeOpen && narrative.length > 1 && (
            <div className="px-3 sm:px-4 pb-3 sm:pb-4 space-y-2 border-t border-white/10 pt-3 ml-[26px] sm:ml-[30px]">
              {narrative.slice(1).map((line, i) => (
                <p key={i} className="text-[11px] text-white/60 leading-relaxed">{line}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Monthly Trend Chart (Rx only) */}
      {market === 'rx' && selected.length > 0 && trendData.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-fade-in-up">
          <div className="px-3 sm:px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-blue-50/60 to-indigo-50/40">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
              <h3 className="text-[11px] sm:text-xs font-bold text-slate-800">Monthly Trend</h3>
              <span className="text-[7px] sm:text-[8px] bg-blue-100 text-blue-600 font-semibold px-1 sm:px-1.5 py-0.5 rounded">Sales $</span>
            </div>
            <p className="text-[9px] text-slate-500 mt-1">Month-by-month sales value for selected {groupByBrand ? 'brands' : 'SKUs'}</p>
          </div>
          <div className="p-3 sm:p-5">
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={trendData} margin={{ left: 10, right: 20, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 9 }} stroke="#94a3b8" tickFormatter={(v: number) => formatCompactDollar(v)} />
                <Tooltip
                  formatter={(v) => formatCompactDollar(v as number)}
                  labelStyle={{ fontSize: 11, fontWeight: 600 }}
                  contentStyle={{ fontSize: 10, borderRadius: 8, border: '1px solid #e2e8f0' }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 9, paddingTop: 8 }}
                  iconType="circle"
                  iconSize={8}
                />
                {selected.map((s, i) => (
                  <Line
                    key={s.id}
                    dataKey={`p${i}`}
                    name={s.name.length > 30 ? s.name.slice(0, 28) + '...' : s.name}
                    stroke={COLORS[i % COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 2, fill: COLORS[i % COLORS.length] }}
                    activeDot={{ r: 4 }}
                    animationDuration={800}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Monthly trend loading state */}
      {market === 'rx' && selected.length > 0 && state.monthlyLoading && trendData.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 text-center animate-fade-in-up">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-[10px] text-slate-400">Loading monthly trend data...</p>
        </div>
      )}

      {/* Value Comparison Chart */}
      {selected.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-fade-in-up">
          <div className="px-3 sm:px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-blue-50/60 to-indigo-50/40">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600 shrink-0" />
              <h3 className="text-[11px] sm:text-xs font-bold text-slate-800">{isValue ? 'Value' : 'Volume'} Comparison</h3>
              <span className="text-[7px] sm:text-[8px] bg-blue-100 text-blue-600 font-semibold px-1 sm:px-1.5 py-0.5 rounded">TY vs LY</span>
            </div>
            <p className="text-[9px] text-slate-500 mt-1">Side-by-side {isValue ? 'value' : 'volume'} comparison across selected {groupByBrand ? 'brands' : 'products'}</p>
          </div>
          <div className="p-3 sm:p-5">
            <ResponsiveContainer width="100%" height={Math.max(200, selected.length * 50 + 40)}>
              <BarChart data={comparisonChart} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 9 }} stroke="#94a3b8" tickFormatter={(v: number) => fmt(v)} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} stroke="#94a3b8" width={160} />
                <Tooltip formatter={(v) => fmt(v as number)} />
                <Bar dataKey="tyValue" name="This Year" fill="#2563EB" radius={[0, 4, 4, 0]} animationDuration={800} />
                <Bar dataKey="lyValue" name="Last Year" fill="#94a3b8" radius={[0, 4, 4, 0]} animationDuration={800} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Growth Comparison Chart */}
      {selected.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <div className="px-3 sm:px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-blue-50/60 to-indigo-50/40">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <TrendingDown className="w-4 h-4 text-blue-600 shrink-0" />
              <h3 className="text-[11px] sm:text-xs font-bold text-slate-800">{isValue ? 'Value Change ($)' : 'Unit Change'}</h3>
              <span className="text-[7px] sm:text-[8px] bg-blue-100 text-blue-600 font-semibold px-1 sm:px-1.5 py-0.5 rounded">Absolute YoY</span>
            </div>
          </div>
          <div className="p-3 sm:p-5">
            <ResponsiveContainer width="100%" height={Math.max(200, selected.length * 50 + 40)}>
              <BarChart data={growthChart} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 9 }} stroke="#94a3b8" tickFormatter={(v: number) => fmt(v)} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} stroke="#94a3b8" width={160} />
                <Tooltip formatter={(v) => fmt(v as number)} />
                <Bar dataKey="absChange" name={isValue ? '$ Change' : 'Unit Change'} radius={[0, 4, 4, 0]} animationDuration={800}>
                  {growthChart.map((c, i) => <Cell key={i} fill={c.absChange >= 0 ? '#059669' : '#DC2626'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Radar Chart for multi-product comparison */}
      {selected.length >= 2 && radarData.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <div className="px-3 sm:px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-blue-50/60 to-indigo-50/40">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <GitCompareArrows className="w-4 h-4 text-blue-600 shrink-0" />
                  <h3 className="text-[11px] sm:text-xs font-bold text-slate-800">Multi-Dimensional Comparison</h3>
                  <span className="text-[7px] sm:text-[8px] bg-blue-100 text-blue-600 font-semibold px-1 sm:px-1.5 py-0.5 rounded">Normalised</span>
                </div>
                <p className="text-[9px] text-slate-500 mt-1">Relative comparison across value, volume, $ change, and growth rate (normalised to 100)</p>
              </div>
              <button
                onClick={() => setRadarHelpOpen(v => !v)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-semibold transition-all shrink-0 ${
                  radarHelpOpen
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white border-slate-200 text-slate-500 hover:border-blue-200 hover:bg-blue-50'
                }`}
              >
                <HelpCircle className="w-3 h-3" />
                How to read
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${radarHelpOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>
            {radarHelpOpen && (
              <div className="mt-3 bg-white rounded-lg border border-slate-200 p-3 space-y-2 text-[10px] text-slate-600 leading-relaxed">
                <p className="font-bold text-slate-800 text-[11px]">How to read the radar chart</p>
                <p>
                  Each product is drawn as a coloured shape on four axes. The <strong>larger the shape</strong>, the stronger that product performs across all dimensions. Values are <strong>normalised to 100</strong> — the best performer on each axis reaches the outer edge.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                  <div className="bg-slate-50 rounded-lg px-2.5 py-2 border border-slate-100">
                    <p className="font-bold text-slate-700">TY Value</p>
                    <p className="text-[9px] text-slate-500 mt-0.5">This Year sales value ($). Higher = more total revenue in the current period.</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg px-2.5 py-2 border border-slate-100">
                    <p className="font-bold text-slate-700">Volume</p>
                    <p className="text-[9px] text-slate-500 mt-0.5">Total units dispensed/sold this year. Higher = more packs moving through pharmacy.</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg px-2.5 py-2 border border-slate-100">
                    <p className="font-bold text-slate-700">$ Change</p>
                    <p className="text-[9px] text-slate-500 mt-0.5">Absolute dollar change year-on-year. Larger shape = bigger absolute gain (or loss).</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg px-2.5 py-2 border border-slate-100">
                    <p className="font-bold text-slate-700">Growth %</p>
                    <p className="text-[9px] text-slate-500 mt-0.5">Percentage growth year-on-year. A small product can score high here with strong relative growth.</p>
                  </div>
                </div>
                <p className="text-[9px] text-slate-400 italic mt-1">
                  Tip: A product dominating all four corners is a market leader with strong momentum. A product strong on Growth % but weak on TY Value is a fast-growing challenger. Compare shapes to spot relative strengths.
                </p>
              </div>
            )}
          </div>
          <div className="p-3 sm:p-5 flex justify-center">
            <ResponsiveContainer width="100%" height={350}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10 }} stroke="#64748b" />
                <PolarRadiusAxis tick={{ fontSize: 8 }} stroke="#cbd5e1" domain={[0, 100]} />
                {selected.map((s, i) => (
                  <Radar
                    key={s.id}
                    name={s.name.length > 20 ? s.name.slice(0, 18) + '...' : s.name}
                    dataKey={`p${i}`}
                    stroke={COLORS[i % COLORS.length]}
                    fill={COLORS[i % COLORS.length]}
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                ))}
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="px-3 sm:px-5 pb-3 sm:pb-4 flex flex-wrap gap-3 justify-center">
            {selected.map((s, i) => (
              <div key={s.id} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-[9px] text-slate-600 font-medium max-w-[150px] truncate">{s.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed comparison table */}
      {selected.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <div className="px-3 sm:px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-blue-50/60 to-indigo-50/40">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Search className="w-4 h-4 text-blue-600 shrink-0" />
              <h3 className="text-[11px] sm:text-xs font-bold text-slate-800">Detail Table</h3>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[9px] sm:text-[10px]">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-3 sm:px-5 py-2 font-bold text-slate-500 uppercase tracking-wider">{itemLabel}</th>
                  <th className="px-2 py-2 font-bold text-slate-500 uppercase tracking-wider">Category</th>
                  <th className="px-2 py-2 font-bold text-slate-500 uppercase tracking-wider">Manufacturer</th>
                  <th className="px-2 py-2 font-bold text-slate-500 uppercase tracking-wider text-right">TY Value</th>
                  <th className="px-2 py-2 font-bold text-slate-500 uppercase tracking-wider text-right">LY Value</th>
                  <th className="px-2 py-2 font-bold text-slate-500 uppercase tracking-wider text-right">$ Change</th>
                  <th className="px-2 py-2 font-bold text-slate-500 uppercase tracking-wider text-right">Growth</th>
                  <th className="px-2 py-2 font-bold text-slate-500 uppercase tracking-wider text-right">TY Units</th>
                  <th className="px-2 py-2 font-bold text-slate-500 uppercase tracking-wider text-right">Unit Growth</th>
                </tr>
              </thead>
              <tbody>
                {selected.map((s, i) => {
                  const hasSubs = s.skuNames && s.skuNames.length > 1
                  const isExpanded = expandedBrands.has(s.id)
                  const subSkus = hasSubs && isExpanded ? getSkusForBrand(s) : []
                  return (
                    <React.Fragment key={s.id}>
                      <tr
                        className={`border-t border-slate-100 hover:bg-slate-50 ${hasSubs ? 'cursor-pointer' : ''}`}
                        onClick={hasSubs ? () => toggleBrandExpand(s.id) : undefined}
                      >
                        <td className="px-3 sm:px-5 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                            <span className="font-semibold text-slate-800 max-w-[200px] truncate">{s.name}</span>
                            {hasSubs && (
                              <ChevronRight className={`w-3 h-3 text-slate-400 transition-transform duration-200 shrink-0 ${isExpanded ? 'rotate-90' : ''}`} />
                            )}
                          </div>
                        </td>
                        <td className="px-2 py-2.5 text-slate-500 max-w-[120px] truncate">{s.category}</td>
                        <td className="px-2 py-2.5 text-slate-500 max-w-[120px] truncate">{s.manufacturer}</td>
                        <td className="px-2 py-2.5 text-right font-semibold text-slate-800">{formatCompactDollar(s.tyValue)}</td>
                        <td className="px-2 py-2.5 text-right text-slate-500">{formatCompactDollar(s.lyValue)}</td>
                        <td className={`px-2 py-2.5 text-right font-bold ${s.absChange >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {s.absChange >= 0 ? '+' : ''}{formatCompactDollar(s.absChange)}
                        </td>
                        <td className={`px-2 py-2.5 text-right font-bold ${s.growth >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {s.growth >= 900 ? 'NEW' : formatDelta(s.growth)}
                        </td>
                        <td className="px-2 py-2.5 text-right text-slate-600">{formatCompact(s.tyUnits)}</td>
                        <td className={`px-2 py-2.5 text-right font-semibold ${s.unitGrowth >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {formatDelta(s.unitGrowth)}
                        </td>
                      </tr>
                      {/* SKU drill-down rows */}
                      {isExpanded && subSkus.map(sub => (
                        <tr key={sub.id} className="bg-slate-50/50 border-t border-slate-50">
                          <td className="pl-8 sm:pl-12 pr-2 py-1.5">
                            <span className="text-[8px] sm:text-[9px] text-slate-600 truncate block max-w-[200px]">{sub.name}</span>
                          </td>
                          <td className="px-2 py-1.5 text-[8px] sm:text-[9px] text-slate-400 truncate">{sub.category}</td>
                          <td className="px-2 py-1.5 text-[8px] sm:text-[9px] text-slate-400 truncate">{sub.manufacturer}</td>
                          <td className="px-2 py-1.5 text-right text-[8px] sm:text-[9px] text-slate-600">{formatCompactDollar(sub.tyValue)}</td>
                          <td className="px-2 py-1.5 text-right text-[8px] sm:text-[9px] text-slate-400">{formatCompactDollar(sub.lyValue)}</td>
                          <td className={`px-2 py-1.5 text-right text-[8px] sm:text-[9px] font-semibold ${sub.absChange >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {sub.absChange >= 0 ? '+' : ''}{formatCompactDollar(sub.absChange)}
                          </td>
                          <td className={`px-2 py-1.5 text-right text-[8px] sm:text-[9px] font-semibold ${sub.growth >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {sub.growth >= 900 ? 'NEW' : formatDelta(sub.growth)}
                          </td>
                          <td className="px-2 py-1.5 text-right text-[8px] sm:text-[9px] text-slate-500">{formatCompact(sub.tyUnits)}</td>
                          <td className={`px-2 py-1.5 text-right text-[8px] sm:text-[9px] ${sub.unitGrowth >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {formatDelta(sub.unitGrowth)}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  )
                })}
                {/* Totals row */}
                {selected.length > 1 && (
                  <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold">
                    <td className="px-3 sm:px-5 py-2.5 text-slate-800">TOTAL</td>
                    <td className="px-2 py-2.5" />
                    <td className="px-2 py-2.5" />
                    <td className="px-2 py-2.5 text-right text-slate-800">{formatCompactDollar(selected.reduce((s, p) => s + p.tyValue, 0))}</td>
                    <td className="px-2 py-2.5 text-right text-slate-500">{formatCompactDollar(selected.reduce((s, p) => s + p.lyValue, 0))}</td>
                    <td className={`px-2 py-2.5 text-right ${selected.reduce((s, p) => s + p.absChange, 0) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {selected.reduce((s, p) => s + p.absChange, 0) >= 0 ? '+' : ''}{formatCompactDollar(selected.reduce((s, p) => s + p.absChange, 0))}
                    </td>
                    <td className="px-2 py-2.5" />
                    <td className="px-2 py-2.5 text-right text-slate-600">{formatCompact(selected.reduce((s, p) => s + p.tyUnits, 0))}</td>
                    <td className="px-2 py-2.5" />
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {selected.length === 0 && !search && (
        <div className="bg-white rounded-xl border border-slate-200 p-8 sm:p-12 text-center">
          <GitCompareArrows className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-600 mb-1">Search and Compare Products</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            Start by searching for {market === 'rx' ? 'an Rx SKU (e.g. "Ozempic", "semaglutide", or "Novo Nordisk")' : 'an OTC item (e.g. "Nurofen", "Panadol", or "Voltaren")'}.
            Select multiple products to compare values, growth, and market position side-by-side.
            {' '}Use <strong>Group by Brand</strong> to aggregate all SKUs under a brand name.
          </p>
          <div className="flex flex-wrap gap-2 justify-center mt-4">
            {(market === 'rx'
              ? ['Ozempic', 'Mounjaro', 'Humira', 'Entresto', 'Dupixent']
              : ['Nurofen', 'Panadol', 'Voltaren', 'Telfast', 'Centrum']
            ).map(term => (
              <button
                key={term}
                onClick={() => setSearch(term)}
                className="text-[10px] px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 font-semibold border border-blue-100 hover:bg-blue-100 transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center py-4 mt-2">
        <p className="text-xs text-slate-400 font-medium">Powered by <span className="font-bold text-primary/70">NostraData</span></p>
      </div>
    </div>
  )
}
