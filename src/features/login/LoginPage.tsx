import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import {
  Lock, ArrowRight, Pill, Heart,
  Activity, TrendingUp, BarChart3, Database,
  Factory,
} from 'lucide-react'

/* ---- Centre node: Patient ---- */
function CentreNode() {
  return (
    <div className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center"
         style={{ animation: 'hero-fade-in 0.8s ease-out 0.3s both' }}>
      {/* Outer pulse ring */}
      <div className="absolute w-24 h-24 rounded-full animate-pulse-glow" />
      {/* Glow circle */}
      <div className="w-[72px] h-[72px] rounded-full bg-gradient-to-br from-white/20 to-white/[0.06] backdrop-blur-sm border-2 border-white/25 flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.15)]"
           style={{ animation: 'breathe 3s ease-in-out infinite' }}>
        <Heart className="w-8 h-8 text-white/90" />
      </div>
      <p className="text-[10px] font-bold text-white/70 tracking-[0.25em] uppercase mt-2.5">Patient</p>
    </div>
  )
}

/* ---- Reusable triangle node ---- */
interface TriangleNodeProps {
  icon: React.ReactNode
  label: string
  sublabel: string
  color: string
  className: string
  delay: string
}

function TriangleNode({ icon, label, sublabel, color, className, delay }: TriangleNodeProps) {
  return (
    <div className={`absolute z-10 flex flex-col items-center ${className}`}
         style={{ animation: `hero-fade-in 0.8s ease-out both`, animationDelay: delay }}>
      <div className="w-14 h-14 rounded-2xl bg-white/[0.08] backdrop-blur-sm border border-white/[0.12] flex items-center justify-center transition-transform hover:scale-105"
           style={{ boxShadow: `0 0 24px ${color}25` }}>
        {icon}
      </div>
      <p className="text-[10px] font-bold tracking-[0.2em] uppercase mt-2" style={{ color: `${color}CC` }}>
        {label}
      </p>
      <p className="text-[8px] text-white/30 mt-0.5">{sublabel}</p>
    </div>
  )
}

/* ---- SVG connection lines with animated dashes ---- */
function ConnectionLines() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-[5]" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid meet">
      <defs>
        <style>{`
          .flow-line { stroke-dasharray: 8 6; animation: dash-flow 2s linear infinite; }
          @keyframes dash-flow { to { stroke-dashoffset: -28; } }
        `}</style>
      </defs>

      {/* Supplier → Patient centre */}
      <path d="M85,90 Q140,155 200,165" className="flow-line" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
      {/* Patient centre → Pharmacy */}
      <path d="M200,165 Q260,155 315,90" className="flow-line" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" style={{ animationDelay: '-0.7s' }} />
      {/* Patient centre → Data */}
      <path d="M200,175 Q200,260 200,330" className="flow-line" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="1.5" style={{ animationDelay: '-1.2s' }} />
      {/* Supplier → Data (outer) */}
      <path d="M85,100 Q80,220 200,330" className="flow-line" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" style={{ animationDelay: '-0.4s' }} />
      {/* Pharmacy → Data (outer) */}
      <path d="M315,100 Q320,220 200,330" className="flow-line" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" style={{ animationDelay: '-1.5s' }} />
      {/* Supplier ↔ Pharmacy (top edge) */}
      <path d="M95,78 Q200,55 305,78" className="flow-line" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" style={{ animationDelay: '-0.9s' }} />
    </svg>
  )
}

/* ---- Flowing data particles along paths ---- */
function FlowingParticles() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-[6]" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid meet">
      {/* Supplier → Centre (blue) */}
      <circle r="2.5" fill="rgba(59,130,246,0.7)">
        <animateMotion dur="3.5s" repeatCount="indefinite" path="M85,90 Q140,155 200,165" />
      </circle>
      {/* Centre → Pharmacy (teal) */}
      <circle r="2.5" fill="rgba(13,148,136,0.7)">
        <animateMotion dur="3s" repeatCount="indefinite" path="M200,165 Q260,155 315,90" begin="0.8s" />
      </circle>
      {/* Centre → Data (purple) */}
      <circle r="2" fill="rgba(124,58,237,0.6)">
        <animateMotion dur="3s" repeatCount="indefinite" path="M200,175 Q200,260 200,330" begin="0.4s" />
      </circle>
      {/* Data → Centre (green) */}
      <circle r="2" fill="rgba(16,185,129,0.6)">
        <animateMotion dur="3.5s" repeatCount="indefinite" path="M200,330 Q200,260 200,175" begin="1.5s" />
      </circle>
      {/* Pharmacy → Centre (teal) */}
      <circle r="2" fill="rgba(13,148,136,0.5)">
        <animateMotion dur="4s" repeatCount="indefinite" path="M315,90 Q260,155 200,165" begin="2s" />
      </circle>
      {/* Supplier outer → Data (blue) */}
      <circle r="1.5" fill="rgba(59,130,246,0.4)">
        <animateMotion dur="5s" repeatCount="indefinite" path="M85,100 Q80,220 200,330" begin="1s" />
      </circle>
      {/* Pharmacy outer → Data (amber) */}
      <circle r="1.5" fill="rgba(217,119,6,0.5)">
        <animateMotion dur="5s" repeatCount="indefinite" path="M315,100 Q320,220 200,330" begin="2.5s" />
      </circle>
      {/* Supplier ↔ Pharmacy (top, small) */}
      <circle r="1.5" fill="rgba(255,255,255,0.3)">
        <animateMotion dur="4s" repeatCount="indefinite" path="M95,78 Q200,55 305,78" begin="0.5s" />
      </circle>
    </svg>
  )
}

/* ---- Triangle infographic composition ---- */
function TriangleInfographic() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="relative w-full max-w-[420px] aspect-square mx-auto">
        <ConnectionLines />
        <FlowingParticles />

        {/* Supplier — top-left */}
        <TriangleNode
          icon={<Factory className="w-6 h-6 text-blue-400/80" />}
          label="Supplier"
          sublabel="Manufacturers & brands"
          color="#3B82F6"
          className="left-[8%] top-[10%]"
          delay="0.5s"
        />

        {/* Pharmacy — top-right */}
        <TriangleNode
          icon={<Pill className="w-6 h-6 text-teal-400/80" />}
          label="Pharmacy"
          sublabel="Dispensing & retail"
          color="#0D9488"
          className="right-[8%] top-[10%]"
          delay="0.7s"
        />

        {/* Data/Intelligence — bottom */}
        <TriangleNode
          icon={<BarChart3 className="w-6 h-6 text-violet-400/80" />}
          label="Intelligence"
          sublabel="Data-driven insights"
          color="#7C3AED"
          className="left-1/2 -translate-x-1/2 bottom-[4%]"
          delay="0.9s"
        />

        {/* Patient — centre */}
        <CentreNode />
      </div>
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
    <div className="grid grid-cols-4 gap-2 max-w-md mx-auto w-full">
      {stats.map((s, i) => (
        <div
          key={s.label}
          className="bg-white/[0.06] backdrop-blur-md rounded-lg p-2.5 border border-white/[0.06] text-center"
          style={{ animation: 'hero-fade-in 0.5s ease-out both', animationDelay: `${1.0 + i * 0.12}s` }}
        >
          <div className="w-6 h-6 rounded-md flex items-center justify-center mx-auto mb-1.5" style={{ backgroundColor: `${s.color}25`, color: s.color }}>
            {s.icon}
          </div>
          <p className="text-sm font-bold text-white tracking-tight" style={{ animation: 'hero-number-in 0.4s ease-out both', animationDelay: `${1.2 + i * 0.12}s` }}>
            {s.value}
          </p>
          <p className="text-[8px] text-white/35 mt-0.5">{s.label}</p>
        </div>
      ))}
    </div>
  )
}

/* ---- Growth pulse indicator ---- */
function GrowthPulse() {
  return (
    <div className="flex items-center gap-3 bg-white/[0.06] backdrop-blur-sm rounded-full px-4 py-2 border border-white/[0.08] mx-auto"
         style={{ animation: 'hero-fade-in 0.6s ease-out both', animationDelay: '1.5s' }}>
      <Activity className="w-3.5 h-3.5 text-emerald-400" />
      <span className="text-[11px] text-white/60">Live market intelligence</span>
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
    </div>
  )
}

/* ---- Mobile hero (compact triangle + stats) ---- */
function MobileHero() {
  return (
    <div className="lg:hidden bg-gradient-to-br from-hero-from via-hero-mid to-hero-to px-6 pt-14 pb-8 text-center relative overflow-hidden">
      <div className="relative z-10">
        <div className="mb-5">
          <h1 className="text-3xl font-extrabold text-white mb-1 tracking-tight">SOTI</h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-medium">State of the Industry</p>
        </div>

        {/* Compact triangle: Supplier — Patient — Pharmacy */}
        <div className="flex items-center justify-center gap-4 mb-6"
             style={{ animation: 'hero-fade-in 0.5s ease-out 0.3s both' }}>
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-xl bg-white/[0.08] flex items-center justify-center border border-white/[0.08]">
              <Factory className="w-4 h-4 text-blue-400/70" />
            </div>
            <span className="text-[7px] text-white/35 mt-1 uppercase tracking-wider">Supplier</span>
          </div>
          <div className="h-px w-5 bg-white/15" />
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-white/[0.12] flex items-center justify-center border-2 border-white/25 animate-pulse-glow">
              <Heart className="w-5 h-5 text-white/85" />
            </div>
            <span className="text-[8px] text-white/50 mt-1 uppercase tracking-wider font-bold">Patient</span>
          </div>
          <div className="h-px w-5 bg-white/15" />
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-xl bg-white/[0.08] flex items-center justify-center border border-white/[0.08]">
              <Pill className="w-4 h-4 text-teal-400/70" />
            </div>
            <span className="text-[7px] text-white/35 mt-1 uppercase tracking-wider">Pharmacy</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-1.5 max-w-[300px] mx-auto">
          {[
            { v: '$20.4B', l: 'Rx Market' },
            { v: '$9.3B', l: 'OTC' },
            { v: '178K+', l: 'Products' },
            { v: '+10.8%', l: 'Growth' },
          ].map((s, i) => (
            <div key={s.l} className="bg-white/[0.08] rounded-lg p-1.5 border border-white/[0.06]"
                 style={{ animation: 'hero-fade-in 0.4s ease-out both', animationDelay: `${0.5 + i * 0.1}s` }}>
              <p className="text-white text-xs font-bold">{s.v}</p>
              <p className="text-white/30 text-[7px]">{s.l}</p>
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
        {/* Triangle infographic */}
        <TriangleInfographic />

        <div className="relative z-10 flex flex-col justify-between p-10 xl:p-16 w-full">
          {/* Top branding */}
          <div style={{ animation: 'hero-fade-in 0.8s ease-out both' }}>
            <h1 className="text-3xl xl:text-4xl font-extrabold text-white tracking-tight">SOTI</h1>
            <p className="text-[10px] uppercase tracking-[0.25em] text-white/40 font-semibold mt-1">State of the Industry</p>
            <p className="text-white/30 text-xs mt-3 max-w-xs leading-relaxed">
              Connecting suppliers, pharmacies, and patients through data intelligence.
            </p>
          </div>

          {/* Spacer — triangle fills the centre */}
          <div className="flex-1" />

          {/* Bottom — market stats + pulse */}
          <div className="space-y-3">
            <MarketStats />
            <GrowthPulse />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-6" style={{ animation: 'hero-fade-in 0.6s ease-out both', animationDelay: '1.6s' }}>
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
