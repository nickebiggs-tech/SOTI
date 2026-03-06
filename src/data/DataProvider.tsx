import { createContext, useContext, useReducer, useEffect, useMemo, type ReactNode } from 'react'
import type { EthRecord, OTCRecord, CategorySummary } from './types'
import { loadEthData, loadOTCData } from './csv-loader'

interface DataState {
  eth: EthRecord[]
  otc: OTCRecord[]
  loading: boolean
  error: string | null
}

type Action =
  | { type: 'SET_ETH'; payload: EthRecord[] }
  | { type: 'SET_OTC'; payload: OTCRecord[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }

const initialState: DataState = { eth: [], otc: [], loading: true, error: null }

function reducer(state: DataState, action: Action): DataState {
  switch (action.type) {
    case 'SET_ETH': return { ...state, eth: action.payload }
    case 'SET_OTC': return { ...state, otc: action.payload }
    case 'SET_LOADING': return { ...state, loading: action.payload }
    case 'SET_ERROR': return { ...state, error: action.payload, loading: false }
    default: return state
  }
}

interface DataContextValue {
  state: DataState
  ethCategories: CategorySummary[]
  otcCategories: CategorySummary[]
  ethTotalTY: number
  ethTotalLY: number
  otcTotalTY: number
  otcTotalLY: number
}

const DataContext = createContext<DataContextValue | null>(null)

/** Build Eth category summaries by aggregating TY (APR24-MAR25) and LY (APR23-MAR24) */
function buildEthCategories(data: EthRecord[]): CategorySummary[] {
  const map: Record<string, { tyV: number; lyV: number; tyU: number; lyU: number; mfrs: Set<string>; skus: Set<string> }> = {}
  data.forEach(r => {
    if (!map[r.category]) map[r.category] = { tyV: 0, lyV: 0, tyU: 0, lyU: 0, mfrs: new Set(), skus: new Set() }
    const c = map[r.category]!
    if (r.period === 'APR24-MAR25') {
      c.tyV += r.sales
      c.tyU += r.units
    } else {
      c.lyV += r.sales
      c.lyU += r.units
    }
    c.mfrs.add(r.manufacturer)
    c.skus.add(r.sku)
  })
  return Object.entries(map)
    .map(([category, c]) => ({
      category,
      tyValue: c.tyV,
      lyValue: c.lyV,
      tyUnits: c.tyU,
      lyUnits: c.lyU,
      valueGrowth: c.lyV ? ((c.tyV - c.lyV) / c.lyV) * 100 : 0,
      unitGrowth: c.lyU ? ((c.tyU - c.lyU) / c.lyU) * 100 : 0,
      manufacturerCount: c.mfrs.size,
      skuCount: c.skus.size,
    }))
    .sort((a, b) => b.tyValue - a.tyValue)
}

/** Build OTC category summaries */
function buildOTCCategories(data: OTCRecord[]): CategorySummary[] {
  const map: Record<string, { tyV: number; lyV: number; tyU: number; lyU: number; mfrs: Set<string>; skus: Set<string> }> = {}
  data.forEach(r => {
    if (!map[r.market]) map[r.market] = { tyV: 0, lyV: 0, tyU: 0, lyU: 0, mfrs: new Set(), skus: new Set() }
    const c = map[r.market]!
    c.tyV += r.tyValue
    c.lyV += r.lyValue
    c.tyU += r.tyUnits
    c.lyU += r.lyUnits
    c.mfrs.add(r.manufacturer)
    c.skus.add(r.packName)
  })
  return Object.entries(map)
    .map(([category, c]) => ({
      category,
      tyValue: c.tyV,
      lyValue: c.lyV,
      tyUnits: c.tyU,
      lyUnits: c.lyU,
      valueGrowth: c.lyV ? ((c.tyV - c.lyV) / c.lyV) * 100 : 0,
      unitGrowth: c.lyU ? ((c.tyU - c.lyU) / c.lyU) * 100 : 0,
      manufacturerCount: c.mfrs.size,
      skuCount: c.skus.size,
    }))
    .sort((a, b) => b.tyValue - a.tyValue)
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    async function load() {
      try {
        const [eth, otc] = await Promise.all([loadEthData(), loadOTCData()])
        dispatch({ type: 'SET_ETH', payload: eth })
        dispatch({ type: 'SET_OTC', payload: otc })
        dispatch({ type: 'SET_LOADING', payload: false })
      } catch (err) {
        dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'Failed to load data' })
      }
    }
    load()
  }, [])

  const ethCategories = useMemo(() => buildEthCategories(state.eth), [state.eth])
  const otcCategories = useMemo(() => buildOTCCategories(state.otc), [state.otc])

  const ethTotalTY = useMemo(() => ethCategories.reduce((s, c) => s + c.tyValue, 0), [ethCategories])
  const ethTotalLY = useMemo(() => ethCategories.reduce((s, c) => s + c.lyValue, 0), [ethCategories])
  const otcTotalTY = useMemo(() => otcCategories.reduce((s, c) => s + c.tyValue, 0), [otcCategories])
  const otcTotalLY = useMemo(() => otcCategories.reduce((s, c) => s + c.lyValue, 0), [otcCategories])

  return (
    <DataContext.Provider value={{ state, ethCategories, otcCategories, ethTotalTY, ethTotalLY, otcTotalTY, otcTotalLY }}>
      {state.loading ? (
        <div className="flex items-center justify-center h-screen bg-slate-50">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-600 text-sm">Loading SOTI data...</p>
            <p className="text-slate-400 text-xs mt-1">Parsing 178K+ product records</p>
          </div>
        </div>
      ) : state.error ? (
        <div className="flex items-center justify-center h-screen bg-slate-50">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
            <p className="text-red-700 font-medium">Failed to load data</p>
            <p className="text-red-500 text-sm mt-1">{state.error}</p>
          </div>
        </div>
      ) : (
        children
      )}
    </DataContext.Provider>
  )
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
