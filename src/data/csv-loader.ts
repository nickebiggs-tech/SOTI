import type { EthRecord, EthSkuRecord, OTCRecord, CategorySummary } from './types'

const BASE = import.meta.env.BASE_URL

// ── Interned JSON format helpers ──

interface InternedData {
  h: string[]
  d: Record<string, string[]>
  r: (string | number)[][]
}

function dict(d: Record<string, string[]>, key: string): string[] {
  return d[key] ?? []
}

// ── Tier 1: Category summaries (tiny, <1KB) ──

export async function loadEthCategories(): Promise<CategorySummary[]> {
  const resp = await fetch(`${BASE}data/eth-categories.json`)
  return resp.json()
}

export async function loadOTCCategories(): Promise<CategorySummary[]> {
  const resp = await fetch(`${BASE}data/otc-categories.json`)
  return resp.json()
}

// ── Tier 2: SKU-level aggregates (small, ~3MB total) ──

export async function loadEthSkuData(): Promise<EthSkuRecord[]> {
  const resp = await fetch(`${BASE}data/eth-skus.json`)
  const data: InternedData = await resp.json()
  const cat = dict(data.d, 'cat'), mfr = dict(data.d, 'mfr'), mol = dict(data.d, 'mol')
  return data.r.map(row => ({
    sku: row[0] as string,
    category: cat[row[1] as number] ?? '',
    manufacturer: mfr[row[2] as number] ?? '',
    molecule: mol[row[3] as number] ?? '',
    tyValue: row[4] as number,
    lyValue: row[5] as number,
    tyUnits: row[6] as number,
    lyUnits: row[7] as number,
  }))
}

export async function loadOTCSkuData(): Promise<OTCRecord[]> {
  const resp = await fetch(`${BASE}data/otc-skus.json`)
  const data: InternedData = await resp.json()
  const market = dict(data.d, 'market'), mfr = dict(data.d, 'mfr')
  return data.r.map(row => ({
    market: market[row[0] as number] ?? '',
    manufacturer: mfr[row[1] as number] ?? '',
    packName: row[2] as string,
    lyUnits: row[3] as number,
    lyValue: row[4] as number,
    tyUnits: row[5] as number,
    tyValue: row[6] as number,
  }))
}

// ── Tier 3: Monthly data (large, ~7MB — lazy loaded) ──

export async function loadEthMonthlyData(): Promise<EthRecord[]> {
  const resp = await fetch(`${BASE}data/eth-monthly.json`)
  const data: InternedData = await resp.json()
  const period = dict(data.d, 'period'), cat = dict(data.d, 'cat')
  const mfr = dict(data.d, 'mfr'), mol = dict(data.d, 'mol'), sku = dict(data.d, 'sku')
  return data.r.map(row => ({
    period: period[row[0] as number] ?? '',
    date: row[1] as string,
    monthId: row[2] as number,
    category: cat[row[3] as number] ?? '',
    manufacturer: mfr[row[4] as number] ?? '',
    molecule: mol[row[5] as number] ?? '',
    sku: sku[row[6] as number] ?? '',
    units: row[7] as number,
    sales: row[8] as number,
  }))
}
