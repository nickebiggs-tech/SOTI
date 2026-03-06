import Papa from 'papaparse'
import type { EthRecord, OTCRecord } from './types'

const BASE = import.meta.env.BASE_URL

function parseCsv<T>(url: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(url, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data as T[]),
      error: (err: Error) => reject(err),
    })
  })
}

export async function loadEthData(): Promise<EthRecord[]> {
  const raw = await parseCsv<Record<string, string>>(`${BASE}data/SOTI_Eth_Month.csv`)
  return raw.map(r => ({
    period: r['Period'] ?? '',
    date: r['Date'] ?? '',
    monthId: parseInt(r['MonthID'] ?? '0', 10),
    category: r['Category'] ?? '',
    manufacturer: r['Manufacturer'] ?? '',
    molecule: r['MOLECULE'] ?? '',
    sku: r['SKU'] ?? '',
    units: parseFloat(r['Units'] ?? '0') || 0,
    sales: parseFloat(r['Sales'] ?? '0') || 0,
  }))
}

export async function loadOTCData(): Promise<OTCRecord[]> {
  const raw = await parseCsv<Record<string, string>>(`${BASE}data/SOTI_OTC_Monthly.csv`)
  return raw.map(r => ({
    market: r['MKT1_NAME'] ?? '',
    manufacturer: r['MFR_Name'] ?? '',
    packName: r['PACK_NAME'] ?? '',
    lyUnits: parseFloat(r['LY_TotalUnits'] ?? '0') || 0,
    lyValue: parseFloat(r['LY_Value'] ?? '0') || 0,
    tyUnits: parseFloat(r['TY_TotalUnits'] ?? '0') || 0,
    tyValue: parseFloat(r['TY_Value'] ?? '0') || 0,
  }))
}
