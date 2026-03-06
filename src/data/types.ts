/** Ethical / Prescription (Dispense) — monthly rows */
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
