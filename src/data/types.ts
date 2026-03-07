/** Ethical / Prescription (Dispense) — monthly rows (lazy-loaded) */
export interface EthRecord {
  period: string
  date: string
  monthId: number
  category: string
  manufacturer: string
  molecule: string
  sku: string
  units: number
  sales: number
}

/** ETH SKU-level aggregate (TY vs LY) — loaded immediately */
export interface EthSkuRecord {
  sku: string
  category: string
  manufacturer: string
  molecule: string
  tyValue: number
  lyValue: number
  tyUnits: number
  lyUnits: number
}

/** OTC — aggregated LY vs TY */
export interface OTCRecord {
  market: string
  manufacturer: string
  packName: string
  lyUnits: number
  lyValue: number
  tyUnits: number
  tyValue: number
}

/** Aggregated category summary */
export interface CategorySummary {
  category: string
  tyValue: number
  lyValue: number
  tyUnits: number
  lyUnits: number
  valueGrowth: number
  unitGrowth: number
  manufacturerCount: number
  skuCount: number
}

/** Manufacturer summary within a category */
export interface ManufacturerSummary {
  manufacturer: string
  tyValue: number
  lyValue: number
  tyUnits: number
  lyUnits: number
  valueGrowth: number
  share: number
}
