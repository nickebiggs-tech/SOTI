import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import {
  Lock, ArrowRight, Database,
  Lightbulb, Target, LineChart, BarChart3,
} from 'lucide-react'

/* ---- Value proposition card ---- */
interface ValuePropProps {
  icon: React.ReactNode
  title: string
  desc: string
  delay: string
}

function ValueProp({ icon, title, desc, delay }: ValuePropProps) {
  return (
    <div
      className="flex items-start gap-3.5"
      style={{ animation: 'hero-fade-in 0.6s ease-out both', animationDelay: delay }}
    >
      <div className="w-10 h-10 rounded-xl bg-white/[0.08] border border-white/[0.10] flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-white/90">{title}</p>
        <p className="text-xs text-white/50 leading-relaxed mt-0.5">{desc}</p>
      </div>
    </div>
  )
}

/* ---- Market stat pill ---- */
interface StatPillProps {
  value: string
  label: string
  color: string
  delay: string
}

function StatPill({ value, label, color, delay }: StatPillProps) {
  return (
    <div
      className="flex items-center gap-2.5 bg-white/[0.06] backdrop-blur-sm rounded-xl px-4 py-3 border border-white/[0.08]"
      style={{ animation: 'hero-fade-in 0.5s ease-out both', animationDelay: delay }}
    >
      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
      <span
        className="text-lg font-bold text-white tracking-tight"
        style={{ animation: 'hero-number-in 0.4s ease-out both', animationDelay: delay }}
      >
        {value}
      </span>
      <span className="text-[10px] text-white/45 font-medium">{label}</span>
    </div>
  )
}

/* ---- Background grid decoration ---- */
function GridDecoration() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Subtle radial glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blue-500/[0.07] blur-[120px]" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-violet-500/[0.05] blur-[100px]" />
      {/* Grid lines */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="login-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#login-grid)" />
      </svg>
    </div>
  )
}

/* ---- Mobile hero ---- */
function MobileHero() {
  return (
    <div className="lg:hidden bg-gradient-to-br from-hero-from via-hero-mid to-hero-to px-6 pt-14 pb-8 text-center relative overflow-hidden">
      <div className="relative z-10">
        <div className="mb-5">
          <h1 className="text-4xl font-extrabold text-white mb-1.5 tracking-tight">SOTI</h1>
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/60 font-semibold">State of the Industry</p>
          <p className="text-xs text-white/45 mt-2 max-w-[260px] mx-auto leading-relaxed">
            Market intelligence and decision support for Australian pharmacy.
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2 max-w-[340px] mx-auto"
             style={{ animation: 'hero-fade-in 0.5s ease-out 0.3s both' }}>
          {[
            { v: '$20.4B', l: 'Rx Market' },
            { v: '$9.3B', l: 'OTC' },
            { v: '178K+', l: 'Products' },
            { v: '+10.8%', l: 'Growth' },
          ].map((s, i) => (
            <div key={s.l} className="bg-white/[0.08] rounded-xl p-2.5 border border-white/[0.06]"
                 style={{ animation: 'hero-fade-in 0.4s ease-out both', animationDelay: `${0.5 + i * 0.1}s` }}>
              <p className="text-white text-sm font-bold">{s.v}</p>
              <p className="text-white/40 text-[8px] mt-0.5">{s.l}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ---- Login page ---- */
export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const ok = await login(username, pin)
    setLoading(false)
    if (ok) {
      navigate('/dashboard', { replace: true })
    } else {
      setError('Invalid username or PIN')
    }
  }

  return (
    <div className="min-h-[100dvh] flex flex-col lg:flex-row">
      {/* Left — Hero (desktop) */}
      <div className="hidden lg:flex lg:w-[55%] xl:w-[60%] bg-gradient-to-br from-hero-from via-hero-mid to-hero-to relative overflow-hidden">
        <GridDecoration />

        <div className="relative z-10 flex flex-col justify-between p-10 xl:p-16 w-full">
          {/* Top — Branding + headline */}
          <div>
            <div style={{ animation: 'hero-fade-in 0.8s ease-out both' }}>
              <h1 className="text-4xl xl:text-5xl font-extrabold text-white tracking-tight">SOTI</h1>
              <p className="text-xs uppercase tracking-[0.25em] text-white/60 font-semibold mt-1.5">State of the Industry</p>
            </div>

            <div className="mt-8 xl:mt-10 max-w-md" style={{ animation: 'hero-fade-in 0.7s ease-out both', animationDelay: '0.2s' }}>
              <h2 className="text-xl xl:text-2xl font-bold text-white/95 leading-snug">
                Know the market before<br />you make the call
              </h2>
              <p className="text-sm text-white/50 mt-3 leading-relaxed max-w-sm">
                Every category. Every brand. Every molecule. The data behind the decisions that shape Australian pharmacy — all in one place.
              </p>
            </div>
          </div>

          {/* Middle — Value propositions */}
          <div className="space-y-5 my-10 xl:my-12 max-w-md">
            <ValueProp
              icon={<Lightbulb className="w-5 h-5 text-amber-400/80" />}
              title="Your Competitive Edge"
              desc="The brands winning share, the categories in decline, the molecules reshaping therapy — see it all before your competitors do."
              delay="0.5s"
            />
            <ValueProp
              icon={<Target className="w-5 h-5 text-blue-400/80" />}
              title="Trusted by Industry Leaders"
              desc="15 years of pharmacy intelligence trusted by suppliers, wholesalers, and pharmacy groups to inform strategy worth millions."
              delay="0.7s"
            />
            <ValueProp
              icon={<BarChart3 className="w-5 h-5 text-emerald-400/80" />}
              title="The Complete Picture"
              desc="$30B+ across 178K+ products — Rx, OTC, and consumer health in one place. No other platform covers Australian pharmacy like this."
              delay="0.9s"
            />
          </div>

          {/* Bottom — Market stats */}
          <div>
            <div className="flex flex-wrap gap-2.5 mb-4">
              <StatPill value="$20.4B" label="Rx Market" color="#3B82F6" delay="1.0s" />
              <StatPill value="$9.3B" label="OTC Market" color="#0D9488" delay="1.1s" />
              <StatPill value="178K+" label="Products" color="#7C3AED" delay="1.2s" />
              <StatPill value="+10.8%" label="Rx Growth" color="#10B981" delay="1.3s" />
            </div>

            <div className="flex items-center gap-3 mt-2" style={{ animation: 'hero-fade-in 0.6s ease-out both', animationDelay: '1.4s' }}>
              <Database className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[11px] text-white/45 font-medium">The must-have intelligence platform for Australian pharmacy</span>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/[0.06]"
                 style={{ animation: 'hero-fade-in 0.6s ease-out both', animationDelay: '1.5s' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                  <Database className="w-4 h-4 text-white/50" />
                </div>
                <div>
                  <p className="text-[13px] text-white/60 font-medium">
                    Powered by <span className="font-bold text-white/80">NostraData</span>
                  </p>
                  <p className="text-[9px] text-white/30">Australia&apos;s leading pharmacy data intelligence</p>
                </div>
              </div>
              <p className="text-[10px] text-white/20">v1.0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile hero */}
      <MobileHero />

      {/* Right — Login form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-white">
        <div className="w-full max-w-sm" style={{ animation: 'fade-in-up 0.5s ease-out both', animationDelay: '0.2s' }}>
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
            <p className="text-slate-500 text-sm mt-1">Enter your credentials to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                autoFocus
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">PIN</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="&&&&"
                  maxLength={4}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-xs px-4 py-2.5 rounded-lg animate-fade-in">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !username || !pin}
              className="w-full flex items-center justify-center gap-2 bg-primary text-white font-semibold py-3 rounded-xl hover:brightness-110 active:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-[11px] text-slate-400 mt-8 font-medium">
            SOTI &middot; State of the Industry<br />
            <span className="text-[10px]">Powered by <span className="font-bold text-primary/60">NostraData</span></span>
          </p>
        </div>
      </div>
    </div>
  )
}
