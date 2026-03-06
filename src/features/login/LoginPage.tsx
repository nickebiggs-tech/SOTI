import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import {
  Lock, ArrowRight, Pill, Heart, Sparkles,
  Sun, FlaskConical, Eye, ShieldCheck, Activity,
  TrendingUp, BarChart3, Database,
} from 'lucide-react'

/* ---- Orbiting pharmacy icons ---- */
const ORBIT_ICONS = [
  { Icon: Pill, delay: '0s' },
  { Icon: Heart, delay: '-3.5s' },
  { Icon: Sparkles, delay: '-7s' },
  { Icon: Sun, delay: '-10.5s' },
  { Icon: FlaskConical, delay: '-14s' },
  { Icon: Eye, delay: '-17.5s' },
  { Icon: ShieldCheck, delay: '-21s' },
]

function OrbitingIcons() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {/* Outer ring */}
      <div className="absolute w-[340px] h-[340px] rounded-full border border-white/[0.06]" />
      {/* Inner ring */}
      <div className="absolute w-[220px] h-[220px] rounded-full border border-white/[0.04]" />

      {/* Orbiting icons — outer */}
      {ORBIT_ICONS.slice(0, 4).map(({ Icon, delay }, i) => (
        <div
          key={`outer-${i}`}
          className="absolute w-[340px] h-[340px]"
          style={{ animation: `orbit 24s linear infinite`, animationDelay: delay }}
        >
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white/[0.08] backdrop-blur-sm flex items-center justify-center border border-white/[0.08]">
            <Icon className="w-3.5 h-3.5 text-white/40" />
          </div>
        </div>
      ))}

      {/* Orbiting icons — inner */}
      {ORBIT_ICONS.slice(4).map(({ Icon, delay }, i) => (
        <div
          key={`inner-${i}`}
          className="absolute w-[220px] h-[220px]"
          style={{ animation: `orbit-reverse 20s linear infinite`, animationDelay: delay }}
        >
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-white/[0.06] backdrop-blur-sm flex items-center justify-center border border-white/[0.06]">
            <Icon className="w-3 h-3 text-white/30" />
          </div>
        </div>
      ))}
    </div>
  )
}

/* ---- Data particles background ---- */
function DataParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-white/15"
          style={{
            left: `${5 + (i * 4.7) % 90}%`,
            top: `${5 + (i * 3.9) % 90}%`,
            animation: `float-gentle ${3 + (i % 4)}s ease-in-out infinite`,
            animationDelay: `${i * 0.3}s`,
          }}
        />
      ))}
    </div>
  )
}

/* ---- Market stat widgets ---- */
function MarketStats() {
  const stats = [
    { icon: <Pill className="w-4 h-4" />, value: '$20.4B', label: 'Rx Market', color: '#3B82F6' },
    { icon: <BarChart3 className="w-4 h-4" />, value: '$9.3B', label: 'OTC Market', color: '#0D9488' },
    { icon: <Database className="w-4 h-4" />, value: '178K+', label: 'Products', color: '#7C3AED' },
    { icon: <TrendingUp className="w-4 h-4" />, value: '+10.8%', label: 'Rx Growth', color: '#10B981' },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto w-full">
      {stats.map((s, i) => (
        <div
          key={s.label}
          className="bg-white/[0.07] backdrop-blur-md rounded-xl p-3.5 border border-white/[0.08] group hover:bg-white/[0.12] transition-all duration-300"
          style={{ animation: 'hero-fade-in 0.6s ease-out both', animationDelay: `${0.6 + i * 0.15}s` }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${s.color}30`, color: s.color }}>
              {s.icon}
            </div>
          </div>
          <p className="text-lg font-bold text-white tracking-tight" style={{ animation: 'hero-number-in 0.5s ease-out both', animationDelay: `${0.8 + i * 0.15}s` }}>
            {s.value}
          </p>
          <p className="text-[10px] text-white/40 mt-0.5">{s.label}</p>
        </div>
      ))}
    </div>
  )
}

/* ---- Growth pulse indicator ---- */
function GrowthPulse() {
  return (
    <div className="flex items-center gap-3 bg-white/[0.06] backdrop-blur-sm rounded-full px-4 py-2 border border-white/[0.08] mx-auto"
         style={{ animation: 'hero-fade-in 0.6s ease-out both', animationDelay: '1.2s' }}>
      <Activity className="w-3.5 h-3.5 text-emerald-400" />
      <span className="text-[11px] text-white/60">Live market intelligence</span>
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
    </div>
  )
}

/* ---- Mobile hero (compact) ---- */
function MobileHero() {
  return (
    <div className="lg:hidden bg-gradient-to-br from-hero-from via-hero-mid to-hero-to px-6 pt-14 pb-10 text-center relative overflow-hidden">
      <DataParticles />
      <div className="relative z-10">
        <div className="mb-4">
          <h1 className="text-3xl font-extrabold text-white mb-1 tracking-tight">SOTI</h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-medium">State of the Industry</p>
        </div>
        <div className="grid grid-cols-2 gap-2 max-w-[250px] mx-auto">
          {[
            { v: '$20.4B', l: 'Rx Market' },
            { v: '$9.3B', l: 'OTC Market' },
            { v: '178K+', l: 'Products' },
            { v: '+10.8%', l: 'Rx Growth' },
          ].map((s, i) => (
            <div key={s.l} className="bg-white/[0.08] rounded-lg p-2 border border-white/[0.06]"
                 style={{ animation: 'hero-fade-in 0.4s ease-out both', animationDelay: `${0.3 + i * 0.1}s` }}>
              <p className="text-white text-sm font-bold">{s.v}</p>
              <p className="text-white/35 text-[8px]">{s.l}</p>
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
        <DataParticles />
        <OrbitingIcons />

        <div className="relative z-10 flex flex-col justify-between p-10 xl:p-16 w-full">
          {/* Top branding */}
          <div style={{ animation: 'hero-fade-in 0.8s ease-out both' }}>
            <h1 className="text-3xl xl:text-4xl font-extrabold text-white tracking-tight">SOTI</h1>
            <p className="text-[10px] uppercase tracking-[0.25em] text-white/40 font-semibold mt-1">State of the Industry</p>
            <p className="text-white/30 text-xs mt-3 max-w-xs leading-relaxed">
              Comprehensive pharmacy market intelligence — Dispense & OTC analytics for industry leaders.
            </p>
          </div>

          {/* Center — market stats + orbit */}
          <div className="flex-1 flex flex-col items-center justify-center gap-8">
            <MarketStats />
            <GrowthPulse />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between" style={{ animation: 'hero-fade-in 0.6s ease-out both', animationDelay: '1.4s' }}>
            <p className="text-[11px] text-white/30">
              Powered by <span className="font-semibold text-white/50">NostraData</span>
            </p>
            <p className="text-[10px] text-white/20">v1.0</p>
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

          <p className="text-center text-[10px] text-slate-300 mt-8">
            SOTI v1.0 &middot; NostraData Pty Ltd
          </p>
        </div>
      </div>
    </div>
  )
}
