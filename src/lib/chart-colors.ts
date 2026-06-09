const SOTI_COLORS = [
  '#5EDDFF', '#6BFFB8', '#FF6B47', '#C4B5FD', '#FBBF24',
  '#F472B6', '#FB923C', '#22D3EE', '#818CF8', '#A3E635',
]

const DEFAULT_COLORS = [
  '#2563EB', '#7C3AED', '#D97706', '#0D9488', '#DC2626',
  '#DB2777', '#EA580C', '#0891B2', '#4F46E5', '#65A30D',
]

const SOTI_COLORS_20 = [
  '#5EDDFF', '#6BFFB8', '#FF6B47', '#C4B5FD', '#FBBF24',
  '#F472B6', '#FB923C', '#22D3EE', '#818CF8', '#A3E635',
  '#67E8F9', '#86EFAC', '#FDBA74', '#DDD6FE', '#FDE68A',
  '#F9A8D4', '#FED7AA', '#A5F3FC', '#A5B4FC', '#BEF264',
]

const DEFAULT_COLORS_20 = [
  '#2563EB', '#7C3AED', '#D97706', '#0D9488', '#DC2626',
  '#DB2777', '#EA580C', '#0891B2', '#4F46E5', '#65A30D',
  '#0369A1', '#BE185D', '#B45309', '#059669', '#6D28D9',
  '#E11D48', '#0E7490', '#C2410C', '#7C2D12', '#4338CA',
]

function isSotiTheme(): boolean {
  return document.documentElement.dataset.theme === 'soti'
}

export function getChartColors(): string[] {
  return isSotiTheme() ? SOTI_COLORS : DEFAULT_COLORS
}

export function getChartColors20(): string[] {
  return isSotiTheme() ? SOTI_COLORS_20 : DEFAULT_COLORS_20
}

export function getGrowthColor(): string {
  return isSotiTheme() ? '#6BFFB8' : '#059669'
}

export function getDeclineColor(): string {
  return isSotiTheme() ? '#FF6B47' : '#DC2626'
}

export function getGridColor(): string {
  return isSotiTheme() ? '#1F2934' : '#f1f5f9'
}

export function getAxisColor(): string {
  return isSotiTheme() ? '#5A6573' : '#94a3b8'
}

export function getTooltipStyle(): { backgroundColor: string; border: string; color: string } {
  return isSotiTheme()
    ? { backgroundColor: '#06090C', border: '1px solid #1F2934', color: '#E8F4FF' }
    : { backgroundColor: '#ffffff', border: '1px solid #e2e8f0', color: '#1e293b' }
}
