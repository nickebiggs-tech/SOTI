import { createContext, useContext, useReducer, useEffect, useCallback, useRef, type ReactNode } from 'react'
import type { EthRecord, EthSkuRecord, OTCRecord, CategorySummary } from './types'
import {
  loadEthCategories, loadOTCCategories,
  loadEthSkuData, loadOTCSkuData,
  loadEthMonthlyData,
} from './csv-loader'

interface DataState {
  ethSkus: EthSkuRecord[]
  otc: OTCRecord[]
  ethMonthly: EthRecord[] | null  // lazy-loaded
  loading: boolean
  monthlyLoading: boolean
  error: string | null
}

type Action =
  | { type: 'INIT_DONE'; ethSkus: EthSkuRecord[]; otc: OTCRecord[]; ethCats: CategorySummary[]; otcCats: CategorySummary[] }
  | { type: 'SET_MONTHLY'; payload: EthRecord[] }
  | { type: 'SET_MONTHLY_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }

const initialState: DataState = {
  ethSkus: [], otc: [], ethMonthly: null,
  loading: true, monthlyLoading: false, error: null,
}

function reducer(state: DataState, action: Action): DataState {
  switch (action.type) {
    case 'INIT_DONE': return { ...state, ethSkus: action.ethSkus, otc: action.otc, loading: false }
    case 'SET_MONTHLY': return { ...state, ethMonthly: action.payload, monthlyLoading: false }
    case 'SET_MONTHLY_LOADING': return { ...state, monthlyLoading: action.payload }
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
  loadMonthlyData: () => Promise<void>
}

const DataContext = createContext<DataContextValue | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const catsRef = useRef<{ eth: CategorySummary[]; otc: CategorySummary[] }>({ eth: [], otc: [] })
  const monthlyPromiseRef = useRef<Promise<void> | null>(null)

  useEffect(() => {
    async function load() {
      try {
        // Load Tier 1 (categories) + Tier 2 (SKU data) in parallel
        const [ethCats, otcCats, ethSkus, otc] = await Promise.all([
          loadEthCategories(),
          loadOTCCategories(),
          loadEthSkuData(),
          loadOTCSkuData(),
        ])
        catsRef.current = { eth: ethCats, otc: otcCats }
        dispatch({ type: 'INIT_DONE', ethSkus, otc, ethCats, otcCats })
      } catch (err) {
        dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'Failed to load data' })
      }
    }
    load()
  }, [])

  // Lazy-load monthly data (Tier 3) — only when Dispense or Seasonality need it
  const loadMonthlyData = useCallback(async () => {
    if (state.ethMonthly || monthlyPromiseRef.current) return monthlyPromiseRef.current ?? Promise.resolve()
    dispatch({ type: 'SET_MONTHLY_LOADING', payload: true })
    const promise = loadEthMonthlyData().then(data => {
      dispatch({ type: 'SET_MONTHLY', payload: data })
    }).catch(err => {
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'Failed to load monthly data' })
    })
    monthlyPromiseRef.current = promise
    return promise
  }, [state.ethMonthly])

  const ethCategories = catsRef.current.eth
  const otcCategories = catsRef.current.otc

  const ethTotalTY = ethCategories.reduce((s, c) => s + c.tyValue, 0)
  const ethTotalLY = ethCategories.reduce((s, c) => s + c.lyValue, 0)
  const otcTotalTY = otcCategories.reduce((s, c) => s + c.tyValue, 0)
  const otcTotalLY = otcCategories.reduce((s, c) => s + c.lyValue, 0)

  return (
    <DataContext.Provider value={{ state, ethCategories, otcCategories, ethTotalTY, ethTotalLY, otcTotalTY, otcTotalLY, loadMonthlyData }}>
      {state.loading ? (
        <div className="flex items-center justify-center h-screen bg-slate-50">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-600 text-sm">Loading SOTI data...</p>
            <p className="text-slate-400 text-xs mt-1">Preparing market intelligence</p>
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
