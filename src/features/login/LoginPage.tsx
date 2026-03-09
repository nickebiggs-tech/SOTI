import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import {
  Lock, ArrowRight, Database,
  Lightbulb, Target, BarChart3,
} from 'lucide-react'

/* ---- Animated counter hook ---- */
function useCountUp(end: number, duration = 1800, delay = 0, decimals = 0) {
  const [value, setValue] = useState(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const timeout = setTimeout(() => {
      const start = performance.now()
      const tick = (now: number) => {
        const elapsed = now - start
        const progress = Math.min(elapsed / duration, 1)
        // Ease-out cubic for satisfying deceleration
        const eased = 1 - Math.pow(1 - progress, 3)
        setValue(parseFloat((eased * end).toFixed(decimals)))
        if (progress < 1) rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
    }, delay)
    return () => { clearTimeout(timeout); if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [end, duration, delay, decimals])

  return value
}

/* ---- Hero stat — big, bold, animated ---- */
interface HeroStatProps {
  numericValue: number
  prefix?: string
  suffix?: string
  label: string
  sublabel?: string
  color: string
  delay: number        // ms delay for stagger
  decimals?: number
}

function HeroStat({ numericValue, prefix = '', suffix = '', label, sublabel, color, delay, decimals = 0 }: HeroStatProps) {
  const count = useCountUp(numericValue, 2200, delay, decimals)

  return (
    <div
      className="hero-stat-card relative bg-white/[0.04] backdrop-blur-sm rounded-2xl px-6 py-6 border border-white/[0.10] overflow-hidden group"
      style={{ animation: 'hero-stat-in 0.7s cubic-bezier(0.16, 1, 0.3, 1) both', animationDelay: `${delay}ms` }}
    >
      {/* Colored glow bar at top */}
      <div className="absolute top-0 left-0 right-0 h-[3px] hero-stat-bar" style={{ background: `linear-gradient(90deg, ${color}, ${color}88)` }} />
      {/* Background glow */}
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" style={{ backgroundColor: color }} />

      <p className="text-[11px] uppercase tracking-[0.15em] font-semibold mb-3" style={{ color: `${color}CC` }}>{label}</p>
      <p className="hero-stat-value text-5xl xl:text-6xl font-black text-white tracking-tighter leading-none">
        {prefix}{decimals > 0 ? count.toFixed(decimals) : count}<span className="text-3xl xl:text-4xl text-white/70">{suffix}</span>
      </p>
      {sublabel && (
        <p className="text-[11px] text-white/65 mt-3 font-medium">{sublabel}</p>
      )}
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
function MobileHeroStat({ numericValue, prefix = '', suffix = '', label, color, delay, decimals = 0 }: { numericValue: number; prefix?: string; suffix?: string; label: string; color: string; delay: number; decimals?: number }) {
  const count = useCountUp(numericValue, 1600, delay, decimals)
  return (
    <div
      className="relative bg-white/[0.06] rounded-xl p-4 border border-white/[0.10] text-center overflow-hidden"
      style={{ animation: 'hero-stat-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) both', animationDelay: `${delay}ms` }}
    >
      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: color }} />
      <p className="text-[9px] uppercase tracking-[0.12em] font-semibold mb-1.5" style={{ color: `${color}CC` }}>{label}</p>
      <p className="text-white text-3xl sm:text-4xl font-black tracking-tighter leading-none hero-stat-value">
        {prefix}{decimals > 0 ? count.toFixed(decimals) : count}<span className="text-xl text-white/60">{suffix}</span>
      </p>
    </div>
  )
}

function MobileHero() {
  return (
    <div className="lg:hidden bg-gradient-to-br from-hero-from via-hero-mid to-hero-to px-5 pt-14 pb-8 text-center relative overflow-hidden">
      <GridDecoration />
      <div className="relative z-10">
        <div className="mb-6" style={{ animation: 'hero-fade-in 0.6s ease-out both' }}>
          <h1 className="text-4xl font-extrabold text-white mb-1.5 tracking-tight">SOTI</h1>
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/80 font-semibold">State of the Industry</p>
          <p className="text-xs text-white/70 mt-2 max-w-[260px] mx-auto leading-relaxed">
            Market intelligence for Australian pharmacy.
          </p>
        </div>

        {/* Stats grid — 2×2 for impact */}
        <div className="grid grid-cols-2 gap-3 max-w-[360px] mx-auto">
          <MobileHeroStat numericValue={20.4} prefix="$" suffix="B" label="Rx Market" color="#3B82F6" delay={400} decimals={1} />
          <MobileHeroStat numericValue={9.3} prefix="$" suffix="B" label="OTC Market" color="#0D9488" delay={500} decimals={1} />
          <MobileHeroStat numericValue={178} suffix="K+" label="Products" color="#7C3AED" delay={600} />
          <MobileHeroStat numericValue={10.8} prefix="+" suffix="%" label="Rx Growth" color="#10B981" delay={700} decimals={1} />
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

        <div className="relative z-10 flex flex-col justify-between p-10 xl:p-14 w-full">
          {/* Top — Branding + compact headline */}
          <div>
            <div style={{ animation: 'hero-fade-in 0.8s ease-out both' }}>
              <h1 className="text-4xl xl:text-5xl font-extrabold text-white tracking-tight">SOTI</h1>
              <p className="text-xs uppercase tracking-[0.25em] text-white/80 font-semibold mt-1.5">State of the Industry</p>
            </div>

            <div className="mt-6 xl:mt-8 max-w-lg" style={{ animation: 'hero-fade-in 0.7s ease-out both', animationDelay: '0.2s' }}>
              <h2 className="text-xl xl:text-2xl font-bold text-white leading-snug">
                Know the market before you make the call
              </h2>
              <p className="text-sm text-white/75 mt-2 leading-relaxed max-w-md">
                Every category. Every brand. Every molecule — all in one place.
              </p>
            </div>
          </div>

          {/* Centre — MASSIVE market stats — the hero of the hero */}
          <div className="my-8 xl:my-10">
            <div className="grid grid-cols-2 gap-4">
              <HeroStat numericValue={20.4} prefix="$" suffix="B" label="Rx Market" sublabel="Prescription dispensing" color="#3B82F6" delay={600} decimals={1} />
              <HeroStat numericValue={9.3} prefix="$" suffix="B" label="OTC Market" sublabel="Front of shop" color="#0D9488" delay={750} decimals={1} />
              <HeroStat numericValue={178} suffix="K+" label="Products" sublabel="SKUs tracked" color="#7C3AED" delay={900} />
              <HeroStat numericValue={10.8} prefix="+" suffix="%" label="Rx Growth" sublabel="Year on year" color="#10B981" delay={1050} decimals={1} />
            </div>
          </div>

          {/* Bottom — Compact value props + footer */}
          <div>
            <div className="flex gap-5 mb-6" style={{ animation: 'hero-fade-in 0.6s ease-out both', animationDelay: '1.2s' }}>
              {[
                { icon: <Lightbulb className="w-3.5 h-3.5 text-amber-400" />, text: 'Competitive edge' },
                { icon: <Target className="w-3.5 h-3.5 text-blue-400" />, text: '15 years trusted' },
                { icon: <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />, text: 'Complete picture' },
              ].map((p) => (
                <div key={p.text} className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center shrink-0">
                    {p.icon}
                  </div>
                  <span className="text-[11px] text-white/80 font-medium">{p.text}</span>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-5 border-t border-white/[0.06]"
                 style={{ animation: 'hero-fade-in 0.6s ease-out both', animationDelay: '1.4s' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                  <Database className="w-4 h-4 text-white/50" />
                </div>
                <div>
                  <p className="text-[13px] text-white/80 font-medium">
                    Powered by <span className="font-bold text-white">NostraData</span>
                  </p>
                  <p className="text-[9px] text-white/50">Australia&apos;s leading pharmacy data intelligence</p>
                </div>
              </div>
              <p className="text-[10px] text-white/40">v1.0</p>
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
