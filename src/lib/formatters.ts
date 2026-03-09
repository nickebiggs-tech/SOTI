/** Format as $1,234,567 */
export function formatCurrency(value: number): string {
  if (value < 0) return `-$${Math.abs(Math.round(value)).toLocaleString('en')}`
  return `$${Math.round(value).toLocaleString('en')}`
}

/** Format as $1,234.56 */
export function formatCurrencyDecimal(value: number): string {
  if (value < 0) return `-$${Math.abs(value).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  return `$${value.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/** Format as $20.4B / $9.3M / $450K / $1,234 — handles negatives */
export function formatCompactDollar(value: number): string {
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  if (abs >= 1_000_000_000) return `${sign}$${(abs / 1_000_000_000).toFixed(1)}B`
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}K`
  return `${sign}$${Math.round(abs)}`
}

export function formatPercent(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`
}

export function formatPercentRaw(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

export function formatNumber(value: number): string {
  return value.toLocaleString('en')
}

/** Compact numbers: 20.4M / 9.3K / 1,234 — handles negatives */
export function formatCompact(value: number): string {
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(1)}B`
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(1)}K`
  return `${sign}${Math.round(abs).toLocaleString('en')}`
}

export function formatDelta(value: number, decimals = 1): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(decimals)}%`
}
