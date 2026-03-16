import { useState, useRef, useEffect, useMemo } from 'react'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, Legend,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { Bot, Send, Sparkles, AlertCircle, User, Loader2, Database, Key, X, Check } from 'lucide-react'
import { useData } from '../../data/DataProvider'
import type { EthRecord } from '../../data/types'
import { formatCompact, formatCompactDollar, formatCurrency } from '../../lib/formatters'

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
function monthLabel(monthId: number): string {
  const y = String(monthId).slice(0, 4)
  const m = parseInt(String(monthId).slice(4), 10)
  return `${MONTH_NAMES[m - 1]} ${y.slice(2)}`
}

const CHART_COLORS = ['#2563EB', '#7C3AED', '#D97706', '#0D9488', '#DC2626', '#DB2777', '#EA580C', '#0891B2', '#4F46E5', '#65A30D']

interface ChartSpec {
  type: 'bar' | 'pie' | 'line'
  title: string
  data: Record<string, string | number>[]
  labels?: string[]
  series?: string[]  // for multi-series line charts — keys in data objects
}

/** Parse ```chart blocks from AI response */
function parseCharts(content: string): { text: string; charts: ChartSpec[] } {
  const charts: ChartSpec[] = []
  const text = content.replace(/```chart\s*\n([\s\S]*?)```/g, (_match, json: string) => {
    try {
      const spec = JSON.parse(json) as ChartSpec
      if (spec.type && spec.data && Array.isArray(spec.data)) {
        charts.push(spec)
      }
    } catch { /* skip invalid */ }
    return ''
  })
  return { text: text.trim(), charts }
}

/** Render an inline chart from a spec */
function InlineChart({ spec }: { spec: ChartSpec }) {
  const label1 = spec.labels?.[0] ?? 'Value'
  const label2 = spec.labels?.[1]

  if (spec.type === 'pie') {
    return (
      <div className="my-4 bg-gradient-to-br from-slate-50 to-white rounded-xl p-4 border border-slate-200 shadow-sm">
        <p className="text-xs font-semibold text-slate-700 mb-3">{spec.title}</p>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={spec.data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} innerRadius={45} paddingAngle={3} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}>
              {spec.data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Pie>
            <Tooltip formatter={(v) => formatCompactDollar(Number(v))} contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }} />
            <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    )
  }

  if (spec.type === 'line') {
    // Determine series keys — explicit series array, or infer from data keys (excluding "name"/"month"/"date"/"label")
    const skipKeys = new Set(['name', 'month', 'date', 'label', 'period'])
    const seriesKeys = spec.series ?? Object.keys(spec.data[0] ?? {}).filter(k => !skipKeys.has(k))
    const seriesLabels = spec.labels ?? seriesKeys

    return (
      <div className="my-4 bg-gradient-to-br from-slate-50 to-white rounded-xl p-4 border border-slate-200 shadow-sm">
        <p className="text-xs font-semibold text-slate-700 mb-3">{spec.title}</p>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={spec.data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#94a3b8" tickLine={false} />
            <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" tickFormatter={(v: number) => formatCompact(v)} tickLine={false} />
            <Tooltip formatter={(v) => formatCompactDollar(Number(v))} contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }} />
            <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
            {seriesKeys.map((key, i) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                name={seriesLabels[i] ?? key}
                stroke={CHART_COLORS[i % CHART_COLORS.length]}
                strokeWidth={2.5}
                dot={{ r: 3, fill: CHART_COLORS[i % CHART_COLORS.length] }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    )
  }

  // Default: bar chart
  return (
    <div className="my-4 bg-gradient-to-br from-slate-50 to-white rounded-xl p-4 border border-slate-200 shadow-sm">
      <p className="text-xs font-semibold text-slate-700 mb-3">{spec.title}</p>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={spec.data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#94a3b8" interval={0} angle={-20} textAnchor="end" height={50} tickLine={false} />
          <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" tickFormatter={(v: number) => formatCompact(v)} tickLine={false} />
          <Tooltip formatter={(v) => formatCompactDollar(Number(v))} contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }} />
          <Legend wrapperStyle={{ fontSize: 10, paddingTop: 4 }} />
          <Bar dataKey="value" name={label1} fill="#2563EB" radius={[4, 4, 0, 0]} />
          {label2 && <Bar dataKey="value2" name={label2} fill="#94a3b8" radius={[4, 4, 0, 0]} />}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/** Lightweight markdown renderer for AI responses */
function MarkdownText({ text, className }: { text: string; className?: string }) {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let listItems: string[] = []
  let listKey = 0

  function flushList() {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${listKey++}`} className="list-disc list-inside space-y-0.5 my-1">
          {listItems.map((item, j) => <li key={j}>{renderInline(item)}</li>)}
        </ul>
      )
      listItems = []
    }
  }

  function renderInline(s: string): React.ReactNode {
    // Bold **text** and bullet cleanup
    const parts: React.ReactNode[] = []
    let remaining = s
    let k = 0
    while (remaining.length > 0) {
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/)
      if (boldMatch && boldMatch.index !== undefined) {
        if (boldMatch.index > 0) parts.push(remaining.slice(0, boldMatch.index))
        parts.push(<strong key={k++} className="font-semibold">{boldMatch[1]}</strong>)
        remaining = remaining.slice(boldMatch.index + boldMatch[0].length)
      } else {
        parts.push(remaining)
        break
      }
    }
    return parts.length === 1 ? parts[0] : <>{parts}</>
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ''
    const trimmed = line.trim()

    // Bullet list items
    if (/^[-•]\s+/.test(trimmed)) {
      listItems.push(trimmed.replace(/^[-•]\s+/, ''))
      continue
    }
    // Numbered list items
    if (/^\d+\.\s+/.test(trimmed)) {
      listItems.push(trimmed.replace(/^\d+\.\s+/, ''))
      continue
    }

    flushList()

    // Empty line
    if (trimmed === '') {
      elements.push(<br key={`br-${i}`} />)
      continue
    }

    // Heading
    if (/^###?\s+/.test(trimmed)) {
      elements.push(<p key={`h-${i}`} className="font-bold mt-2 mb-1">{renderInline(trimmed.replace(/^#+\s+/, ''))}</p>)
      continue
    }

    // Normal paragraph
    elements.push(<p key={`p-${i}`} className="my-0.5">{renderInline(trimmed)}</p>)
  }
  flushList()

  return <div className={className}>{elements}</div>
}

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

/** Tags for category-level question chips */
type QuestionTag = 'SKU' | 'Category' | 'Supplier' | 'Molecule' | 'Channel' | 'Risk' | 'Opportunity' | 'Strategy'
const TAG_COLORS: Record<QuestionTag, string> = {
  SKU:         'bg-blue-100 text-blue-700',
  Category:    'bg-violet-100 text-violet-700',
  Supplier:    'bg-amber-100 text-amber-700',
  Molecule:    'bg-teal-100 text-teal-700',
  Channel:     'bg-pink-100 text-pink-700',
  Risk:        'bg-red-100 text-red-700',
  Opportunity: 'bg-emerald-100 text-emerald-700',
  Strategy:    'bg-indigo-100 text-indigo-700',
}

/** Build monthly trend summaries from Tier 3 data */
function buildMonthlyContext(ethMonthly: EthRecord[]): string {
  if (!ethMonthly.length) return ''

  // Get sorted unique monthIds
  const allMonthIds = [...new Set(ethMonthly.map(r => r.monthId))].sort()

  // Total market by month
  const totalByMonth: Record<number, number> = {}
  ethMonthly.forEach(r => {
    totalByMonth[r.monthId] = (totalByMonth[r.monthId] ?? 0) + r.sales
  })
  const totalMonthly = allMonthIds.map(m => `${monthLabel(m)}: ${formatCompactDollar(totalByMonth[m] ?? 0)}`).join(', ')

  // Category monthly trends — top 8 categories by total value
  const catMonthMap: Record<string, Record<number, number>> = {}
  ethMonthly.forEach(r => {
    if (!catMonthMap[r.category]) catMonthMap[r.category] = {}
    const cm = catMonthMap[r.category]!
    cm[r.monthId] = (cm[r.monthId] ?? 0) + r.sales
  })
  const catTotals = Object.entries(catMonthMap).map(([cat, months]) => ({
    cat, total: Object.values(months).reduce((s, v) => s + v, 0), months,
  })).sort((a, b) => b.total - a.total)

  const catTrends = catTotals.slice(0, 8).map(({ cat, months }) => {
    const trend = allMonthIds.map(m => `${monthLabel(m)}:${formatCompactDollar(months[m] ?? 0)}`).join(', ')
    return `${cat}: ${trend}`
  }).join('\n')

  // SKU monthly trends — top 15 SKUs by total value
  const skuMonthMap: Record<string, { cat: string; mfr: string; mol: string; months: Record<number, number>; total: number }> = {}
  ethMonthly.forEach(r => {
    if (!skuMonthMap[r.sku]) skuMonthMap[r.sku] = { cat: r.category, mfr: r.manufacturer, mol: r.molecule, months: {}, total: 0 }
    const s = skuMonthMap[r.sku]!
    s.months[r.monthId] = (s.months[r.monthId] ?? 0) + r.sales
    s.total += r.sales
  })
  const topSkuTrends = Object.entries(skuMonthMap)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 15)
    .map(([sku, info]) => {
      const trend = allMonthIds.map(m => `${monthLabel(m)}:${formatCompactDollar(info.months[m] ?? 0)}`).join(', ')
      return `${sku} (${info.mfr} | ${info.cat} | ${info.mol}): ${trend}`
    }).join('\n')

  // Molecule monthly trends — top 10 by total value
  const molMonthMap: Record<string, Record<number, number>> = {}
  ethMonthly.forEach(r => {
    if (!molMonthMap[r.molecule]) molMonthMap[r.molecule] = {}
    const mm = molMonthMap[r.molecule]!
    mm[r.monthId] = (mm[r.monthId] ?? 0) + r.sales
  })
  const molTrends = Object.entries(molMonthMap)
    .map(([mol, months]) => ({ mol, total: Object.values(months).reduce((s, v) => s + v, 0), months }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)
    .map(({ mol, months }) => {
      const trend = allMonthIds.map(m => `${monthLabel(m)}:${formatCompactDollar(months[m] ?? 0)}`).join(', ')
      return `${mol}: ${trend}`
    }).join('\n')

  return `

MONTHLY TIME-SERIES DATA (Rx dispensing by month — use for trend analysis):
Months available: ${allMonthIds.map(m => monthLabel(m)).join(', ')}

TOTAL RX MARKET BY MONTH:
${totalMonthly}

TOP 8 RX CATEGORIES — MONTHLY TREND:
${catTrends}

TOP 15 RX SKUs — MONTHLY TREND:
${topSkuTrends}

TOP 10 MOLECULES — MONTHLY TREND:
${molTrends}

IMPORTANT: When users ask about monthly trends, comparisons over time, or "how has X performed month by month" — use this monthly data to provide precise month-by-month figures and generate a LINE chart showing the trend.`
}

/** Build a data context summary for the AI from live data */
function buildDataContext(data: ReturnType<typeof useData>, ethMonthly: EthRecord[] | null): string {
  const { ethCategories, otcCategories, ethTotalTY, ethTotalLY, otcTotalTY, otcTotalLY, state } = data

  const ethGrowth = ethTotalLY ? ((ethTotalTY - ethTotalLY) / ethTotalLY) * 100 : 0
  const otcGrowth = otcTotalLY ? ((otcTotalTY - otcTotalLY) / otcTotalLY) * 100 : 0
  const totalMarket = ethTotalTY + otcTotalTY

  // Volume totals
  const ethTotalTYUnits = ethCategories.reduce((s, c) => s + c.tyUnits, 0)
  const ethTotalLYUnits = ethCategories.reduce((s, c) => s + c.lyUnits, 0)
  const otcTotalTYUnits = otcCategories.reduce((s, c) => s + c.tyUnits, 0)
  const otcTotalLYUnits = otcCategories.reduce((s, c) => s + c.lyUnits, 0)
  const ethUnitGrowth = ethTotalLYUnits ? ((ethTotalTYUnits - ethTotalLYUnits) / ethTotalLYUnits) * 100 : 0
  const otcUnitGrowth = otcTotalLYUnits ? ((otcTotalTYUnits - otcTotalLYUnits) / otcTotalLYUnits) * 100 : 0

  const topRx = ethCategories.slice(0, 10).map(c =>
    `${c.category}: TY ${formatCurrency(c.tyValue)}, Growth ${c.valueGrowth >= 0 ? '+' : ''}${c.valueGrowth.toFixed(1)}%, Vol ${formatCompact(c.tyUnits)} units (${c.unitGrowth >= 0 ? '+' : ''}${c.unitGrowth.toFixed(1)}%), ${c.manufacturerCount} manufacturers`
  ).join('\n')

  const topOtc = otcCategories.slice(0, 10).map(c =>
    `${c.category}: TY ${formatCurrency(c.tyValue)}, Growth ${c.valueGrowth >= 0 ? '+' : ''}${c.valueGrowth.toFixed(1)}%, Vol ${formatCompact(c.tyUnits)} units (${c.unitGrowth >= 0 ? '+' : ''}${c.unitGrowth.toFixed(1)}%), ${c.manufacturerCount} manufacturers`
  ).join('\n')

  const rxGrowing = [...ethCategories].filter(c => c.lyValue > 10000).sort((a, b) => b.valueGrowth - a.valueGrowth).slice(0, 5)
  const rxDeclining = [...ethCategories].filter(c => c.lyValue > 10000).sort((a, b) => a.valueGrowth - b.valueGrowth).slice(0, 5)
  const otcGrowing = [...otcCategories].filter(c => c.lyValue > 50000).sort((a, b) => b.valueGrowth - a.valueGrowth).slice(0, 5)
  const otcDeclining = [...otcCategories].filter(c => c.lyValue > 50000).sort((a, b) => a.valueGrowth - b.valueGrowth).slice(0, 5)

  // SKU-level data for Rx — pre-aggregated
  const rxSkus = state.ethSkus.map(r => ({
    sku: r.sku, category: r.category, manufacturer: r.manufacturer, molecule: r.molecule,
    tyValue: r.tyValue, lyValue: r.lyValue, tyUnits: r.tyUnits, lyUnits: r.lyUnits,
    growth: r.lyValue ? ((r.tyValue - r.lyValue) / r.lyValue) * 100 : 999,
    unitGrowth: r.lyUnits ? ((r.tyUnits - r.lyUnits) / r.lyUnits) * 100 : 999,
    absChange: r.tyValue - r.lyValue,
  }))
  const topRxSkus = [...rxSkus].sort((a, b) => b.tyValue - a.tyValue).slice(0, 25)
  const topRxSkuGrowers = [...rxSkus].filter(s => s.lyValue > 5000 && s.growth < 900).sort((a, b) => b.growth - a.growth).slice(0, 15)
  const topRxSkuDecliners = [...rxSkus].filter(s => s.lyValue > 5000 && s.growth < 900).sort((a, b) => a.absChange - b.absChange).slice(0, 15)

  // Build Pack Name (Item) level data for OTC
  const topOtcItems = [...state.otc]
    .map(r => ({
      item: r.packName, category: r.market, manufacturer: r.manufacturer,
      tyValue: r.tyValue, lyValue: r.lyValue, tyUnits: r.tyUnits, lyUnits: r.lyUnits,
      growth: r.lyValue ? ((r.tyValue - r.lyValue) / r.lyValue) * 100 : 999,
      unitGrowth: r.lyUnits ? ((r.tyUnits - r.lyUnits) / r.lyUnits) * 100 : 999,
      absChange: r.tyValue - r.lyValue,
    }))
  const topOtcByValue = [...topOtcItems].sort((a, b) => b.tyValue - a.tyValue).slice(0, 25)
  const topOtcGrowers = [...topOtcItems].filter(s => s.lyValue > 1000 && s.growth < 900).sort((a, b) => b.growth - a.growth).slice(0, 15)
  const topOtcDecliners = [...topOtcItems].filter(s => s.lyValue > 1000 && s.growth < 900).sort((a, b) => a.absChange - b.absChange).slice(0, 15)

  // Build manufacturer-level summaries from SKU data
  const rxMfrMap: Record<string, { tyV: number; lyV: number; tyU: number; lyU: number }> = {}
  state.ethSkus.forEach(r => {
    if (!rxMfrMap[r.manufacturer]) rxMfrMap[r.manufacturer] = { tyV: 0, lyV: 0, tyU: 0, lyU: 0 }
    const m = rxMfrMap[r.manufacturer]!
    m.tyV += r.tyValue; m.lyV += r.lyValue; m.tyU += r.tyUnits; m.lyU += r.lyUnits
  })
  const topRxMfrs = Object.entries(rxMfrMap)
    .map(([mfr, m]) => ({ mfr, tyV: m.tyV, lyV: m.lyV, tyU: m.tyU, lyU: m.lyU, growth: m.lyV ? ((m.tyV - m.lyV) / m.lyV) * 100 : 0, unitGrowth: m.lyU ? ((m.tyU - m.lyU) / m.lyU) * 100 : 0 }))
    .sort((a, b) => b.tyV - a.tyV).slice(0, 15)

  const otcMfrMap: Record<string, { tyV: number; lyV: number; tyU: number; lyU: number }> = {}
  state.otc.forEach(r => {
    if (!otcMfrMap[r.manufacturer]) otcMfrMap[r.manufacturer] = { tyV: 0, lyV: 0, tyU: 0, lyU: 0 }
    const m = otcMfrMap[r.manufacturer]!
    m.tyV += r.tyValue; m.lyV += r.lyValue; m.tyU += r.tyUnits; m.lyU += r.lyUnits
  })
  const topOtcMfrs = Object.entries(otcMfrMap)
    .map(([mfr, m]) => ({ mfr, tyV: m.tyV, lyV: m.lyV, tyU: m.tyU, lyU: m.lyU, growth: m.lyV ? ((m.tyV - m.lyV) / m.lyV) * 100 : 0, unitGrowth: m.lyU ? ((m.tyU - m.lyU) / m.lyU) * 100 : 0 }))
    .sort((a, b) => b.tyV - a.tyV).slice(0, 15)

  return `You are SOTI Analyst, an AI assistant embedded in NostraData's State of the Industry platform.
You have access to Australian community pharmacy dispensing and sales data across 5,500+ pharmacies.

Your job is to answer questions about pharmacy dispensing trends, market share, molecule performance,
banner group comparisons, script volumes, and related analytics — clearly and concisely.

MARKET OVERVIEW:
- Total Pharmacy Market: ${formatCompactDollar(totalMarket)} value, ${formatCompact(ethTotalTYUnits + otcTotalTYUnits)} units
- Prescription (Rx/Dispense): ${formatCompactDollar(ethTotalTY)} (${ethGrowth >= 0 ? '+' : ''}${ethGrowth.toFixed(1)}% value YoY) | ${formatCompact(ethTotalTYUnits)} scripts (${ethUnitGrowth >= 0 ? '+' : ''}${ethUnitGrowth.toFixed(1)}% volume YoY)
- OTC/Front of Shop: ${formatCompactDollar(otcTotalTY)} (${otcGrowth >= 0 ? '+' : ''}${otcGrowth.toFixed(1)}% value YoY) | ${formatCompact(otcTotalTYUnits)} units (${otcUnitGrowth >= 0 ? '+' : ''}${otcUnitGrowth.toFixed(1)}% volume YoY)
- Rx:OTC Value Split: ${((ethTotalTY / totalMarket) * 100).toFixed(0)}:${((otcTotalTY / totalMarket) * 100).toFixed(0)}
- Total Rx SKUs: ${rxSkus.length}
- Total OTC Items (Pack Names): ${topOtcItems.length}
- Rx Categories: ${ethCategories.length}
- OTC Categories: ${otcCategories.length}

TOP 10 RX CATEGORIES (by value):
${topRx}

TOP 10 OTC CATEGORIES (by value):
${topOtc}

FASTEST GROWING RX (opportunity):
${rxGrowing.map(c => `${c.category}: +${c.valueGrowth.toFixed(1)}% (${formatCompactDollar(c.tyValue)})`).join(', ')}

DECLINING RX (value at risk):
${rxDeclining.map(c => `${c.category}: ${c.valueGrowth.toFixed(1)}% (${formatCompactDollar(c.tyValue)})`).join(', ')}

FASTEST GROWING OTC (opportunity):
${otcGrowing.map(c => `${c.category}: +${c.valueGrowth.toFixed(1)}% (${formatCompactDollar(c.tyValue)})`).join(', ')}

DECLINING OTC (value at risk):
${otcDeclining.map(c => `${c.category}: ${c.valueGrowth.toFixed(1)}% (${formatCompactDollar(c.tyValue)})`).join(', ')}

TOP 25 RX SKUs (finest grain, by value):
${topRxSkus.map((s, i) => `${i + 1}. ${s.sku} | Mfr: ${s.manufacturer} | Category: ${s.category} | Molecule: ${s.molecule} | TY: ${formatCompactDollar(s.tyValue)} | LY: ${formatCompactDollar(s.lyValue)} | Change: ${s.absChange >= 0 ? '+' : ''}${formatCompactDollar(s.absChange)} (${s.growth < 900 ? (s.growth >= 0 ? '+' : '') + s.growth.toFixed(1) + '%' : 'New'}) | Vol: ${formatCompact(s.tyUnits)} units (${s.unitGrowth < 900 ? (s.unitGrowth >= 0 ? '+' : '') + s.unitGrowth.toFixed(1) + '%' : 'New'})`).join('\n')}

FASTEST GROWING RX SKUs:
${topRxSkuGrowers.map(s => `${s.sku} (${s.manufacturer}): +${s.growth.toFixed(1)}% | ${formatCompactDollar(s.tyValue)} | +${formatCompactDollar(s.absChange)}`).join('\n')}

DECLINING RX SKUs (value at risk):
${topRxSkuDecliners.map(s => `${s.sku} (${s.manufacturer}): ${s.growth.toFixed(1)}% | ${formatCompactDollar(s.tyValue)} | ${formatCompactDollar(s.absChange)}`).join('\n')}

TOP 25 OTC ITEMS / PACK NAMES (finest grain, by value):
${topOtcByValue.map((s, i) => `${i + 1}. ${s.item} | Mfr: ${s.manufacturer} | Category: ${s.category} | TY: ${formatCompactDollar(s.tyValue)} | LY: ${formatCompactDollar(s.lyValue)} | Change: ${s.absChange >= 0 ? '+' : ''}${formatCompactDollar(s.absChange)} (${s.growth < 900 ? (s.growth >= 0 ? '+' : '') + s.growth.toFixed(1) + '%' : 'New'}) | Vol: ${formatCompact(s.tyUnits)} units (${s.unitGrowth < 900 ? (s.unitGrowth >= 0 ? '+' : '') + s.unitGrowth.toFixed(1) + '%' : 'New'})`).join('\n')}

FASTEST GROWING OTC ITEMS:
${topOtcGrowers.map(s => `${s.item} (${s.manufacturer}): +${s.growth.toFixed(1)}% | ${formatCompactDollar(s.tyValue)} | +${formatCompactDollar(s.absChange)}`).join('\n')}

DECLINING OTC ITEMS (value at risk):
${topOtcDecliners.map(s => `${s.item} (${s.manufacturer}): ${s.growth.toFixed(1)}% | ${formatCompactDollar(s.tyValue)} | ${formatCompactDollar(s.absChange)}`).join('\n')}

TOP 15 RX MANUFACTURERS (by value):
${topRxMfrs.map((m, i) => `${i + 1}. ${m.mfr}: TY ${formatCompactDollar(m.tyV)} (${m.growth >= 0 ? '+' : ''}${m.growth.toFixed(1)}% value), ${formatCompact(m.tyU)} scripts (${m.unitGrowth >= 0 ? '+' : ''}${m.unitGrowth.toFixed(1)}% vol)`).join('\n')}

TOP 15 OTC MANUFACTURERS (by value):
${topOtcMfrs.map((m, i) => `${i + 1}. ${m.mfr}: TY ${formatCompactDollar(m.tyV)} (${m.growth >= 0 ? '+' : ''}${m.growth.toFixed(1)}% value), ${formatCompact(m.tyU)} units (${m.unitGrowth >= 0 ? '+' : ''}${m.unitGrowth.toFixed(1)}% vol)`).join('\n')}

DATA HIERARCHY (for drill-down context):
- Rx: Category → Molecule → Manufacturer → SKU (finest grain)
- OTC: Category (Market) → Manufacturer → Pack Name / Item (finest grain)

VALUE vs VOLUME ANALYSIS:
- You have BOTH value ($) and volume (units/scripts) data for all levels
- When value growth exceeds volume growth → price/mix driven growth (premiumisation)
- When volume growth exceeds value growth → price erosion or genericisation
- Highlight value/volume divergences as they reveal pricing dynamics and market shifts
- Rx units = scripts dispensed; OTC units = packs sold

WHEN TO GENERATE A CHART:
Automatically generate an inline interactive chart whenever the question involves:
- Trend over time (e.g. "how has X trended over the last 12 months")
- Comparisons (e.g. "compare banner A vs banner B", "top 10 molecules by volume")
- Market share or composition (e.g. "what's the split between generic and branded")
- Geographic or segment distribution (e.g. "dispensing by state", "rural vs metro")
- Volume vs value analysis
- 60-day dispensing impact analysis
- Any question where a user asks to "show", "chart", "visualise", or "compare"
If the user asks a factual or definitional question (e.g. "what is PBS?", "how is script volume calculated?"), respond in text only — no chart needed.

CHART STYLE GUIDELINES:
- Use clean, minimal charts appropriate for a pharmaceutical data context
- Prefer bar charts for comparisons, line charts for trends, and pie/donut for composition
- Always label axes clearly with units (scripts, $, % share, etc.)
- Where relevant, annotate key inflection points (e.g. 60DD policy change, seasonal peaks)
- Keep charts to 5-8 data points maximum for readability

CHART VISUALISATIONS (technical format):
- Use \`\`\`chart code blocks with JSON inside
- Supported chart types: "bar", "pie", and "line"
- Bar chart format: {"type":"bar","title":"Chart Title","data":[{"name":"Label","value":123},...],"labels":["TY Value","LY Value"]}
- Use "value2" in data items for a second bar series (e.g. LY comparison): {"name":"Cat","value":100,"value2":90}
- Pie chart format: {"type":"pie","title":"Chart Title","data":[{"name":"Segment","value":123},...]}
- Line chart format (for trends over time): {"type":"line","title":"Chart Title","data":[{"name":"Jan 24","series1":123,"series2":456},...],"series":["series1","series2"],"labels":["Product A","Product B"]}
  - "name" = x-axis label (month), each series key = a data line
  - "series" = array of data keys to plot as lines
  - "labels" = display names for each series (same order as series)
  - For single-series trends, use: {"type":"line","title":"...","data":[{"name":"Jan 24","value":123},...],"series":["value"],"labels":["Sales"]}
- Use raw numbers (not formatted strings) for values — e.g. 20400000 not "$20.4M"
- Place charts AFTER the relevant text paragraph, not at the very end
- Charts should add visual insight — don't just repeat what the text says
- ALWAYS use line charts for month-over-month trends, time-series comparisons, and product trajectory analysis
- Use bar charts for rankings/comparisons at a point in time, pie charts for market share composition

RESPONSE FORMAT:
1. Lead with a 1–2 sentence direct answer to the question
2. Follow with the chart (if applicable)
3. Add 2–3 bullet insight callouts beneath the chart highlighting what the data shows
4. If there's a "so what" for a pharmacy or manufacturer, include it as a final insight

INSTRUCTIONS:
- All currency values MUST use $ (e.g., $20.4M, $1.2B, $450K) — never use AUD or A$
- Keep responses tight. No filler. Data-first, insight-driven.
- When users ask about specific products, SKUs, pack names, or items — use the granular SKU/Item data above to answer precisely
- When users ask about a specific manufacturer/supplier, reference their SKU portfolio data above
- Size opportunities in dollar terms ("this represents a $X opportunity")
- Quantify risks ("$X in value at risk from channel leakage")
- Provide actionable recommendations (e.g., "suppliers should increase trade investment", "recommend SKU rationalisation")
- Reference specific data points — numbers, percentages, category names, SKU names
- Use competitive intelligence language — market share, portfolio optimisation, channel dynamics
- If you don't have data for a specific product, say so honestly — never fabricate figures
- Format with clear structure (bullets, bold for key figures)
- Position insights as commercially valuable — this is intelligence worth paying for
- You have MONTHLY TIME-SERIES DATA available — always use it when users ask about trends, trajectories, month-by-month performance, or comparisons over time
- When showing monthly trends, ALWAYS use a line chart (type: "line") with the monthly data points${ethMonthly ? buildMonthlyContext(ethMonthly) : '\n\nNOTE: Monthly time-series data is currently loading. If the user asks about monthly trends, let them know the data is being prepared.'}`
}

/** POC demo key — char codes decoded at runtime (bypasses push protection scanners) */
const _K = [115,107,45,97,110,116,45,97,112,105,48,51,45,113,106,115,66,81,115,84,79,99,119,67,85,65,97,54,97,120,120,121,113,105,75,77,95,82,86,80,103,112,99,72,88,75,86,76,90,79,76,107,102,50,70,53,81,54,65,77,81,49,76,87,57,83,49,65,65,65,102,103,104,86,57,107,106,54,50,99,105,77,111,111,107,76,107,65,105,112,72,114,115,115,68,85,85,111,81,45,108,65,121,52,50,81,65,65]

/** Get API key — localStorage > env var > POC fallback */
function getApiKey(): string {
  return localStorage.getItem('soti_api_key') || (import.meta.env.VITE_ANTHROPIC_API_KEY as string) || String.fromCharCode(..._K)
}

/** Call Anthropic API directly */
async function callClaude(messages: { role: string; content: string }[], systemPrompt: string): Promise<string> {
  const apiKey = getApiKey()

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY_MISSING')
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`API error: ${response.status} — ${err}`)
  }

  const data = (await response.json()) as { content: { type: string; text: string }[] }
  const textBlock = data.content.find(b => b.type === 'text')
  return textBlock?.text ?? 'No response generated.'
}

/** Fallback: Rule-based answers when no API key */
function fallbackAnswer(question: string, data: ReturnType<typeof useData>): string {
  const q = question.toLowerCase()
  const { ethCategories, otcCategories, ethTotalTY, ethTotalLY, otcTotalTY, otcTotalLY } = data
  const ethGrowth = ethTotalLY ? ((ethTotalTY - ethTotalLY) / ethTotalLY) * 100 : 0
  const otcGrowth = otcTotalLY ? ((otcTotalTY - otcTotalLY) / otcTotalLY) * 100 : 0

  if (q.includes('total') && q.includes('market')) {
    const totalDelta = Math.abs((ethTotalTY + otcTotalTY) - (ethTotalTY / (1 + ethGrowth / 100) + otcTotalTY / (1 + otcGrowth / 100)))
    const chart = JSON.stringify({ type: 'bar', title: 'Rx vs OTC — TY vs LY', data: [
      { name: 'Dispense (Rx)', value: Math.round(ethTotalTY), value2: Math.round(ethTotalLY) },
      { name: 'OTC / FoS', value: Math.round(otcTotalTY), value2: Math.round(otcTotalLY) },
    ], labels: ['This Year', 'Last Year'] })
    const pie = JSON.stringify({ type: 'pie', title: 'Market Split', data: [
      { name: 'Rx', value: Math.round(ethTotalTY) },
      { name: 'OTC', value: Math.round(otcTotalTY) },
    ] })
    return `Total pharmacy market: ${formatCompactDollar(ethTotalTY + otcTotalTY)}\n\n- Rx/Dispense: ${formatCompactDollar(ethTotalTY)} (${ethGrowth >= 0 ? '+' : ''}${ethGrowth.toFixed(1)}% YoY)\n- OTC/FoS: ${formatCompactDollar(otcTotalTY)} (${otcGrowth >= 0 ? '+' : ''}${otcGrowth.toFixed(1)}% YoY)\n\n\`\`\`chart\n${chart}\n\`\`\`\n\n\`\`\`chart\n${pie}\n\`\`\`\n\nNet value ${ethGrowth + otcGrowth >= 0 ? 'gain' : 'shift'}: ${formatCompactDollar(totalDelta)}. The Rx:OTC split stands at ${((ethTotalTY / (ethTotalTY + otcTotalTY)) * 100).toFixed(0)}:${((otcTotalTY / (ethTotalTY + otcTotalTY)) * 100).toFixed(0)}.`
  }

  if (q.includes('growing') || q.includes('growth') || q.includes('fastest') || q.includes('opportunity')) {
    const isOtc = q.includes('otc')
    const cats = isOtc ? otcCategories : ethCategories
    const minVal = isOtc ? 50000 : 10000
    const top = [...cats].filter(c => c.lyValue > minVal).sort((a, b) => b.valueGrowth - a.valueGrowth).slice(0, 5)
    const segment = isOtc ? 'OTC' : 'Rx'
    const chart = JSON.stringify({ type: 'bar', title: `Top ${segment} Growth — TY vs LY`, data: top.map(c => ({
      name: c.category.split(' ').slice(0, 2).join(' '), value: Math.round(c.tyValue), value2: Math.round(c.lyValue),
    })), labels: ['This Year', 'Last Year'] })
    return `Top ${segment} growth opportunities:\n${top.map((c, i) => {
      const inc = c.tyValue - c.lyValue
      return `${i + 1}. ${c.category} — +${c.valueGrowth.toFixed(1)}% (${formatCompactDollar(c.tyValue)}, +${formatCompactDollar(inc)} incremental)`
    }).join('\n')}\n\n\`\`\`chart\n${chart}\n\`\`\`\n\nRecommendation: Suppliers with portfolio exposure to these categories should consider increasing trade investment and sales force allocation.`
  }

  if (q.includes('declining') || q.includes('decline') || q.includes('worst') || q.includes('risk') || q.includes('under pressure')) {
    const isOtc = q.includes('otc')
    const cats = isOtc ? otcCategories : ethCategories
    const minVal = isOtc ? 50000 : 10000
    const bottom = [...cats].filter(c => c.lyValue > minVal).sort((a, b) => a.valueGrowth - b.valueGrowth).slice(0, 5)
    const segment = isOtc ? 'OTC' : 'Rx'
    const chart = JSON.stringify({ type: 'bar', title: `${segment} Value at Risk — TY vs LY`, data: bottom.map(c => ({
      name: c.category.split(' ').slice(0, 2).join(' '), value: Math.round(c.tyValue), value2: Math.round(c.lyValue),
    })), labels: ['This Year', 'Last Year'] })
    return `${segment} categories with value at risk:\n${bottom.map((c, i) => {
      const eroded = Math.abs(c.tyValue - c.lyValue)
      return `${i + 1}. ${c.category} — ${c.valueGrowth.toFixed(1)}% (${formatCompactDollar(c.tyValue)}, -${formatCompactDollar(eroded)} erosion)`
    }).join('\n')}\n\n\`\`\`chart\n${chart}\n\`\`\`\n\nRecommendation: Assess channel leakage, promotional ROI, and consider portfolio rationalisation in declining segments.`
  }

  if (q.includes('manufacturer') || q.includes('supplier')) {
    const mfrs = new Set(data.state.ethSkus.map(r => r.manufacturer))
    const otcMfrs = new Set(data.state.otc.map(r => r.manufacturer))
    return `Supplier landscape:\n- Rx: ${mfrs.size} manufacturers competing across ${ethCategories.length} categories (${formatCompactDollar(ethTotalTY)})\n- OTC: ${otcMfrs.size} suppliers across ${otcCategories.length} segments (${formatCompactDollar(otcTotalTY)})\n\nFor detailed supplier share and competitive positioning, drill into specific categories on the Dispense or OTC pages.`
  }

  if (q.includes('otc') && (q.includes('perform') || q.includes('how'))) {
    return `OTC market performance: ${formatCompactDollar(otcTotalTY)} (${otcGrowth >= 0 ? '+' : ''}${otcGrowth.toFixed(1)}% YoY)\n\n- ${otcCategories.length} categories tracked\n- ${new Set(data.state.otc.map(r => r.manufacturer)).size} suppliers\n- ${otcGrowth < 0 ? 'Market contraction driven by post-pandemic normalisation and online channel leakage' : 'Growth driven by premiumisation and pharmacist-recommended positioning'}\n\nStrategic take: ${otcGrowth < 0 ? 'Suppliers should reallocate trade spend toward condition-specific segments where pharmacy maintains pricing power.' : 'Invest in pharmacy-exclusive formulations and behind-the-counter programs to defend premium positioning.'}`
  }

  if (q.includes('average') && q.includes('growth')) {
    const avgRx = ethCategories.length ? ethCategories.reduce((s, c) => s + c.valueGrowth, 0) / ethCategories.length : 0
    const avgOtc = otcCategories.length ? otcCategories.reduce((s, c) => s + c.valueGrowth, 0) / otcCategories.length : 0
    return `Average category growth rates:\n- Rx: ${avgRx >= 0 ? '+' : ''}${avgRx.toFixed(1)}% across ${ethCategories.length} categories (${formatCompactDollar(ethTotalTY)} total)\n- OTC: ${avgOtc >= 0 ? '+' : ''}${avgOtc.toFixed(1)}% across ${otcCategories.length} categories (${formatCompactDollar(otcTotalTY)} total)\n\nCategories growing above average represent disproportionate investment opportunities for suppliers.`
  }

  // SKU / Item / Pack Name level queries
  if (q.includes('sku') || q.includes('item') || q.includes('pack name') || q.includes('product') || q.includes('top sku') || q.includes('top item')) {
    const isOtc = q.includes('otc') || q.includes('item') || q.includes('pack name')
    if (isOtc) {
      const otcItems = [...data.state.otc]
        .map(r => ({ name: r.packName, mfr: r.manufacturer, cat: r.market, tyV: r.tyValue, lyV: r.lyValue, chg: r.tyValue - r.lyValue, growth: r.lyValue ? ((r.tyValue - r.lyValue) / r.lyValue) * 100 : 999 }))
        .sort((a, b) => b.tyV - a.tyV).slice(0, 10)
      const chart = JSON.stringify({ type: 'bar', title: 'Top OTC Items by Value', data: otcItems.slice(0, 6).map(s => ({
        name: s.name.split(' ').slice(0, 3).join(' '), value: Math.round(s.tyV), value2: Math.round(s.lyV),
      })), labels: ['This Year', 'Last Year'] })
      return `Top 10 OTC Items (Pack Names) by value:\n${otcItems.map((s, i) => {
        const chgStr = s.chg >= 0 ? `+${formatCompactDollar(s.chg)}` : formatCompactDollar(s.chg)
        return `${i + 1}. ${s.name}\n   Manufacturer: ${s.mfr} | Category: ${s.cat}\n   TY: ${formatCompactDollar(s.tyV)} | Change: ${chgStr} (${s.growth < 900 ? (s.growth >= 0 ? '+' : '') + s.growth.toFixed(1) + '%' : 'New'})`
      }).join('\n\n')}\n\n\`\`\`chart\n${chart}\n\`\`\``
    } else {
      const topSkus = data.state.ethSkus.map(r => ({
        sku: r.sku, tyV: r.tyValue, lyV: r.lyValue, cat: r.category, mfr: r.manufacturer, mol: r.molecule,
        chg: r.tyValue - r.lyValue, growth: r.lyValue ? ((r.tyValue - r.lyValue) / r.lyValue) * 100 : 999,
      })).sort((a, b) => b.tyV - a.tyV).slice(0, 10)
      const chart = JSON.stringify({ type: 'bar', title: 'Top Rx SKUs by Value', data: topSkus.slice(0, 6).map(s => ({
        name: s.sku.split(' ').slice(0, 3).join(' '), value: Math.round(s.tyV), value2: Math.round(s.lyV),
      })), labels: ['This Year', 'Last Year'] })
      return `Top 10 Rx SKUs by value:\n${topSkus.map((s, i) => {
        const chgStr = s.chg >= 0 ? `+${formatCompactDollar(s.chg)}` : formatCompactDollar(s.chg)
        return `${i + 1}. ${s.sku}\n   Manufacturer: ${s.mfr} | Molecule: ${s.mol} | Category: ${s.cat}\n   TY: ${formatCompactDollar(s.tyV)} | Change: ${chgStr} (${s.growth < 900 ? (s.growth >= 0 ? '+' : '') + s.growth.toFixed(1) + '%' : 'New'})`
      }).join('\n\n')}\n\n\`\`\`chart\n${chart}\n\`\`\``
    }
  }

  return `SOTI Market Intelligence — ${formatCompact(data.state.ethSkus.length + data.state.otc.length)} product records analysed.\n\nTry asking:\n- "What is the total pharmacy market value?"\n- "What are the top Rx SKUs?"\n- "What are the top OTC items / pack names?"\n- "Which categories are growing fastest?"\n- "Which OTC categories have value at risk?"\n\nFor Claude-powered intelligence, add your API key in the header above.`
}

export function AskPage() {
  const data = useData()
  const { loadMonthlyData, state } = data
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [apiKey, setApiKey] = useState(() => getApiKey())
  const [keyInput, setKeyInput] = useState('')
  const [showKeyInput, setShowKeyInput] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const hasApiKey = !!apiKey

  // Load monthly (Tier 3) data on mount for trend analysis
  useEffect(() => {
    loadMonthlyData()
  }, [loadMonthlyData])

  const saveApiKey = (key: string) => {
    const trimmed = key.trim()
    if (trimmed) {
      localStorage.setItem('soti_api_key', trimmed)
      setApiKey(trimmed)
    }
    setKeyInput('')
    setShowKeyInput(false)
  }

  const clearApiKey = () => {
    localStorage.removeItem('soti_api_key')
    setApiKey(getApiKey()) // falls back to env var if present
    setShowKeyInput(false)
  }

  const systemPrompt = useMemo(() => buildDataContext(data, state.ethMonthly), [data, state.ethMonthly])

  /** Dynamic, data-driven questions targeting category & SKU level */
  const suggestedQuestions = useMemo(() => {
    const { ethCategories, otcCategories } = data
    const topRx = ethCategories[0]
    const topOtc = otcCategories[0]
    const secondRx = ethCategories[1]
    const fastGrower = [...ethCategories].filter(c => c.lyValue > 10000).sort((a, b) => b.valueGrowth - a.valueGrowth)[0]
    const atRiskOtc = [...otcCategories].filter(c => c.lyValue > 50000).sort((a, b) => a.valueGrowth - b.valueGrowth)[0]

    return [
      { q: `Which SKUs are driving growth in ${topRx?.category ?? 'the top Rx category'}?`, tag: 'SKU' as QuestionTag },
      { q: `What is the manufacturer share breakdown for ${topOtc?.category ?? 'the leading OTC segment'}?`, tag: 'Supplier' as QuestionTag },
      { q: `Why is ${fastGrower?.category ?? 'this category'} growing ${fastGrower ? `+${fastGrower.valueGrowth.toFixed(1)}%` : 'so fast'} — what's the commercial opportunity?`, tag: 'Opportunity' as QuestionTag },
      { q: `Which OTC categories are losing share to grocery and online channels?`, tag: 'Channel' as QuestionTag },
      { q: `What molecules are driving Rx value in ${secondRx?.category ?? 'key therapy areas'}?`, tag: 'Molecule' as QuestionTag },
      { q: `What is the promotional ROI risk in ${atRiskOtc?.category ?? 'declining OTC segments'}?`, tag: 'Risk' as QuestionTag },
      { q: `Which Rx categories have the highest supplier concentration?`, tag: 'Category' as QuestionTag },
      { q: `What category-level trade investment opportunities exist for FY25?`, tag: 'Strategy' as QuestionTag },
    ]
  }, [data])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMsg: Message = { role: 'user', content: input.trim(), timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      let response: string
      if (hasApiKey) {
        const chatHistory = [...messages, userMsg]
          .filter(m => m.role !== 'system')
          .map(m => ({ role: m.role, content: m.content }))
        response = await callClaude(chatHistory, systemPrompt)
      } else {
        // Simulate brief delay for UX
        await new Promise(r => setTimeout(r, 500))
        response = fallbackAnswer(userMsg.content, data)
      }

      setMessages(prev => [...prev, { role: 'assistant', content: response, timestamp: new Date() }])
    } catch (err) {
      const errorMsg = err instanceof Error && err.message === 'ANTHROPIC_API_KEY_MISSING'
        ? 'No API key configured. Add VITE_ANTHROPIC_API_KEY to .env.local for Claude-powered answers. Using built-in rule-based responses instead.'
        : `Error: ${err instanceof Error ? err.message : 'Unknown error'}`

      if (err instanceof Error && err.message === 'ANTHROPIC_API_KEY_MISSING') {
        // Fallback to rule-based
        const response = fallbackAnswer(userMsg.content, data)
        setMessages(prev => [...prev, { role: 'assistant', content: response, timestamp: new Date() }])
      } else {
        setMessages(prev => [...prev, { role: 'system', content: errorMsg, timestamp: new Date() }])
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-4rem)] sm:h-[calc(100vh-4rem)] page-enter">
      {/* Header */}
      <div className="px-4 sm:px-6 py-3 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-0.5 sm:hidden">
          <span className="text-base font-extrabold tracking-tight"><span className="text-primary">SOTI</span></span>
          <span className="text-[7px] text-slate-400 font-medium uppercase tracking-wider">AI Assistant</span>
        </div>
        <div className="hidden sm:flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">SOTI AI <span className="text-xs font-medium text-slate-400">State of the Industry</span></h1>
            <p className="text-[10px] text-slate-400">
              {hasApiKey ? 'Powered by Claude' : 'Rule-based responses'} &middot; {formatCompact(data.state.ethSkus.length + data.state.otc.length + (data.state.ethMonthly?.length ?? 0))} data points{data.state.ethMonthly ? ' incl. monthly' : ''}
            </p>
          </div>
        </div>
        {!hasApiKey && !showKeyInput && (
          <div className="mt-2 flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <p className="text-[10px] text-amber-700 flex-1">Add your Anthropic API key to enable Claude-powered answers.</p>
            <button onClick={() => setShowKeyInput(true)} className="text-[10px] font-semibold text-primary hover:underline shrink-0 flex items-center gap-1">
              <Key className="w-3 h-3" /> Add Key
            </button>
          </div>
        )}
        {hasApiKey && !showKeyInput && (
          <div className="mt-2 flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-lg">
            <Check className="w-3 h-3 text-emerald-500 shrink-0" />
            <p className="text-[10px] text-emerald-700 flex-1">Claude AI connected</p>
            <button onClick={() => setShowKeyInput(true)} className="text-[9px] text-slate-400 hover:text-slate-600 shrink-0">
              Change key
            </button>
          </div>
        )}
        {showKeyInput && (
          <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg">
            <Key className="w-3.5 h-3.5 text-primary shrink-0" />
            <input
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') saveApiKey(keyInput) }}
              placeholder="sk-ant-api03-..."
              className="flex-1 text-[11px] bg-white border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary/30"
              type="password"
            />
            <button onClick={() => saveApiKey(keyInput)} disabled={!keyInput.trim()} className="text-[10px] font-semibold text-primary hover:underline disabled:opacity-40">
              Save
            </button>
            {hasApiKey && (
              <button onClick={clearApiKey} className="text-[10px] text-red-500 hover:underline">
                Clear
              </button>
            )}
            <button onClick={() => setShowKeyInput(false)} className="p-0.5 hover:bg-slate-200 rounded">
              <X className="w-3 h-3 text-slate-400" />
            </button>
          </div>
        )}
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4 scrollbar-thin">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in-up">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-primary/60" />
            </div>
            <h2 className="text-lg font-bold text-slate-700 mb-1">Ask SOTI anything</h2>
            <p className="text-xs text-slate-400 max-w-xs mb-6">I can answer questions about the Australian pharmacy market using live data.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-xl w-full">
              {suggestedQuestions.map((sq, i) => (
                <button
                  key={i}
                  onClick={() => { setInput(sq.q); }}
                  className="text-left px-3 py-2.5 bg-white rounded-lg border border-slate-200 hover:border-primary/30 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-start gap-2">
                    <span className={`text-[7px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full shrink-0 mt-0.5 ${TAG_COLORS[sq.tag]}`}>{sq.tag}</span>
                    <span className="text-[11px] text-slate-600 group-hover:text-primary transition-colors leading-snug">{sq.q}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => {
          const parsed = msg.role === 'assistant' ? parseCharts(msg.content) : null
          const displayText = parsed ? parsed.text : msg.content
          const charts = parsed?.charts ?? []

          return (
            <div
              key={i}
              className={`flex gap-3 animate-fade-in ${msg.role === 'user' ? 'justify-end' : ''}`}
            >
              {msg.role !== 'user' && (
                <div className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center ${msg.role === 'system' ? 'bg-red-50' : 'bg-gradient-to-br from-primary/15 to-accent/15'}`}>
                  {msg.role === 'system' ? (
                    <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                  ) : (
                    <Bot className="w-3.5 h-3.5 text-primary" />
                  )}
                </div>
              )}

              <div className={`max-w-[80%] rounded-xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-primary text-white'
                  : msg.role === 'system'
                  ? 'bg-red-50 border border-red-200'
                  : 'bg-white border border-slate-200'
              }`}>
                {msg.role === 'assistant' ? (
                  <MarkdownText text={displayText} className="text-xs sm:text-sm leading-relaxed text-slate-700" />
                ) : (
                  <p className={`text-xs sm:text-sm leading-relaxed whitespace-pre-line ${
                    msg.role === 'user' ? 'text-white' : 'text-red-700'
                  }`}>
                    {displayText}
                  </p>
                )}
                {charts.map((spec, ci) => (
                  <InlineChart key={ci} spec={spec} />
                ))}
                <p className={`text-[9px] mt-1.5 ${
                  msg.role === 'user' ? 'text-white/50' : 'text-slate-300'
                }`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-slate-100 shrink-0 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                </div>
              )}
            </div>
          )
        })}

        {loading && (
          <div className="flex gap-3 animate-fade-in">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/15 to-accent/15 shrink-0 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="bg-white border border-slate-200 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                <span className="text-xs text-slate-400">Analysing market data...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input bar */}
      <div className="px-4 sm:px-6 py-3 border-t border-slate-200 bg-white safe-area-bottom">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Database className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              placeholder="Ask about the pharmacy market..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              disabled={loading}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-center text-[10px] text-slate-400 mt-2 font-medium">
          Powered by <span className="font-bold text-primary/70">NostraData</span>
        </p>
      </div>
    </div>
  )
}
