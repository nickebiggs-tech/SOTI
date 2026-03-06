import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { Lock, ArrowRight, BarChart3, TrendingUp, Shield } from 'lucide-react'

/* ---- Data particles background ---- */
function DataParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-white/20"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `float-gentle ${3 + Math.random() * 4}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        />
      ))}
    </div>
  )
}

/* ---- Hero visual — dashboard preview ---- */
function HeroVisual() {
  return (
    <div className="relative" style={{ animation: 'hero-fade-in 1s ease-out both', animationDelay: '0.3s' }}>
      {/* Floating cards */}
      <div className="space-y-4">
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/10"
             style={{ animation: 'hero-fade-in 0.6s ease-out both', animationDelay: '0.5s' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-primary/30 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white text-sm font-semibold">Analytics Dashboard</p>
              <p className="text-white/50 text-xs">Real-time intelligence</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[{ v: '2.4K', l: 'Active' }, { v: '$142', l: 'Avg Value' }, { v: '94.2%', l: 'Accuracy' }].map(s => (
              <div key={s.l} className="bg-white/5 rounded-lg p-2.5 text-center">
                <p className="text-white text-base font-bold" style={{ animation: 'hero-number-in 0.5s ease-out both', animationDelay: '0.8s' }}>{s.v}</p>
                <p className="text-white/40 text-[9px] mt-0.5">{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-1 bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10"
               style={{ animation: 'hero-fade-in 0.6s ease-out both', animationDelay: '0.7s' }}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-white/70 text-xs">Growth</span>
            </div>
            <p className="text-2xl font-bold text-white">+18.3%</p>
            <p className="text-emerald-400/70 text-[10px] mt-1">vs last quarter</p>
          </div>

          <div className="flex-1 bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10"
               style={{ animation: 'hero-fade-in 0.6s ease-out both', animationDelay: '0.9s' }}>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-blue-400" />
              <span className="text-white/70 text-xs">Confidence</span>
            </div>
            <p className="text-2xl font-bold text-white">97.1%</p>
            <p className="text-blue-400/70 text-[10px] mt-1">model accuracy</p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---- Mobile hero (compact) ---- */
function MobileHero() {
  return (
    <div className="lg:hidden bg-gradient-to-br from-hero-from via-hero-mid to-hero-to px-6 pt-12 pb-8 text-center relative overflow-hidden">
      <DataParticles />
      <div className="relative z-10">
        <h1 className="text-2xl font-extrabold text-white mb-1">
          <span className="text-white">SOTI</span>
        </h1>
        <p className="text-white/60 text-sm">Intelligence Platform</p>
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
        <div className="relative z-10 flex flex-col justify-between p-10 xl:p-16 w-full">
          {/* Top branding */}
          <div>
            <h1 className="text-3xl xl:text-4xl font-extrabold text-white tracking-tight">
              SOTI
            </h1>
            <p className="text-white/50 text-sm mt-1 font-medium">Intelligence Platform</p>
          </div>

          {/* Center — hero visual */}
          <div className="flex-1 flex items-center justify-center max-w-lg mx-auto w-full">
            <HeroVisual />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-white/30">
              Powered by <span className="font-semibold text-white/50">NostraData</span>
            </p>
          </div>
        </div>
      </div>

      {/* Mobile hero */}
      <MobileHero />

      {/* Right — Login form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-white">
        <div className="w-full max-w-sm">
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
                  placeholder="••••"
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
