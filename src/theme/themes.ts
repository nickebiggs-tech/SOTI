export interface Livery {
  id: string
  name: string
  tagline: string
  logoText: string
  logoShort: string
  fontFamily: string
  poweredBy: string
  colors: Record<string, string>
}

export const LIVERIES: Record<string, Livery> = {
  soti: {
    id: 'soti',
    name: 'SOTI',
    tagline: 'Intelligence Platform',
    logoText: 'SOTI',
    logoShort: 'SO',
    fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
    poweredBy: 'NostraData Pty Ltd',
    colors: {
      'theme-primary': '#2563EB',
      'theme-primary-light': '#3B82F6',
      'theme-primary-foreground': '#FFFFFF',
      'theme-accent': '#0D9488',
      'theme-accent-foreground': '#FFFFFF',
      'theme-ring': '#2563EB',
      'theme-sidebar-from': '#0F172A',
      'theme-sidebar-to': '#1E293B',
      'theme-hero-from': '#0F172A',
      'theme-hero-mid': '#2563EB',
      'theme-hero-to': '#0D9488',
      'theme-chart-1': '#2563EB',
      'theme-chart-2': '#0D9488',
      'theme-chart-3': '#D97706',
      'theme-chart-4': '#DC2626',
      'theme-chart-5': '#7C3AED',
    },
  },
  nostradata: {
    id: 'nostradata',
    name: 'NostraData',
    tagline: 'Intelligence Platform',
    logoText: 'SOTI',
    logoShort: 'ND',
    fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
    poweredBy: 'NostraData Pty Ltd',
    colors: {
      'theme-primary': '#0A8BA8',
      'theme-primary-light': '#0FB5D4',
      'theme-primary-foreground': '#FFFFFF',
      'theme-accent': '#10B39B',
      'theme-accent-foreground': '#FFFFFF',
      'theme-ring': '#0A8BA8',
      'theme-sidebar-from': '#0F172A',
      'theme-sidebar-to': '#1E293B',
      'theme-hero-from': '#0F172A',
      'theme-hero-mid': '#0A8BA8',
      'theme-hero-to': '#10B39B',
      'theme-chart-1': '#0A8BA8',
      'theme-chart-2': '#10B39B',
      'theme-chart-3': '#F59E0B',
      'theme-chart-4': '#EF4444',
      'theme-chart-5': '#8B5CF6',
    },
  },
}
