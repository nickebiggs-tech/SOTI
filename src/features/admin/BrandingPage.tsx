import { useTheme } from '../../theme/ThemeProvider'
import { Palette, Check } from 'lucide-react'

export function BrandingPage() {
  const { livery, setLivery, liveryOptions } = useTheme()

  return (
    <div className="space-y-5 sm:space-y-6 page-enter">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">
          Configure theme and branding
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <Palette className="w-5 h-5 text-primary" />
          <h2 className="text-sm font-semibold text-slate-700">Theme</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {liveryOptions.map((l) => (
            <button
              key={l.id}
              onClick={() => setLivery(l.id)}
              className={`relative flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${
                livery.id === l.id
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ backgroundColor: l.colors['theme-primary'] }}
              >
                {l.logoShort}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{l.name}</p>
                <p className="text-xs text-slate-500">{l.tagline}</p>
              </div>
              {livery.id === l.id && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
