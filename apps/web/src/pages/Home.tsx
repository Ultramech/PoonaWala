import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Calculator, Zap, Shield, Clock, TrendingUp, TrendingDown, RefreshCw, ChevronRight, LogOut } from 'lucide-react'
import { fetchGoldPrice, type GoldPriceData } from '../lib/goldPrice'
import { getUser } from './Login'
import { BottomNav } from '../components/BottomNav'
import { clsx } from 'clsx'

// Inline gold coin SVG
function GoldCoin({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" fill="url(#coinGrad)" />
      <circle cx="50" cy="50" r="42" fill="none" stroke="#F5C842" strokeWidth="1.5" strokeOpacity="0.4" />
      <circle cx="50" cy="50" r="36" fill="none" stroke="#D4A017" strokeWidth="1" strokeOpacity="0.3" />
      <text x="50" y="58" textAnchor="middle" fontSize="28" fontWeight="bold" fill="#92661a" fontFamily="serif">₹</text>
      <defs>
        <radialGradient id="coinGrad" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="40%" stopColor="#F5C842" />
          <stop offset="70%" stopColor="#D4A017" />
          <stop offset="100%" stopColor="#92661a" />
        </radialGradient>
      </defs>
    </svg>
  )
}

function GoldBar() {
  return (
    <svg width="64" height="40" viewBox="0 0 128 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 20 L118 20 L112 60 L16 60 Z" fill="url(#barGrad)" />
      <path d="M10 20 L118 20 L128 10 L0 10 Z" fill="#F5C842" />
      <path d="M10 20 L0 10 L16 60 Z" fill="#92661a" />
      <path d="M118 20 L128 10 L112 60 Z" fill="#92661a" />
      <text x="64" y="48" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#92661a" fontFamily="sans-serif">999.9</text>
      <defs>
        <linearGradient id="barGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="50%" stopColor="#D4A017" />
          <stop offset="100%" stopColor="#92661a" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function AnimatedPrice({ value }: { value: number }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    if (!value) return
    let frame: number
    const start = performance.now()
    const from = display
    const tick = (now: number) => {
      const t = Math.min((now - start) / 900, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(Math.round(from + (value - from) * eased))
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value])
  return <>{display.toLocaleString('en-IN')}</>
}

export function Home() {
  const navigate = useNavigate()
  const user = getUser()
  const [gold, setGold] = useState<GoldPriceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(false)

  const load = (spin = false) => {
    if (spin) setRefreshing(true)
    setError(false)
    fetchGoldPrice()
      .then(d => { setGold(d); setLoading(false); setRefreshing(false) })
      .catch(() => { setError(true); setLoading(false); setRefreshing(false) })
  }

  useEffect(() => { load() }, [])

  const firstName = user?.name?.split(' ')[0] ?? 'there'

  return (
    <div className="min-h-screen bg-[#080C18] text-white pb-28 overflow-y-auto no-scrollbar">
      {/* Ambient glows */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[500px] h-64 rounded-full bg-gold-500/5 blur-[80px] pointer-events-none" />
      <div className="fixed top-60 right-0 w-48 h-48 rounded-full bg-poonawala-red/8 blur-[60px] pointer-events-none" />

      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#080C18]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-md mx-auto flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-[0_0_16px_rgba(212,160,23,0.4)]">
              <span className="text-lg">👁</span>
            </div>
            <div>
              <p className="text-[9px] text-white/30 uppercase tracking-widest">Poonawala Fincorp</p>
              <p className="font-display font-bold text-white text-sm leading-tight">GoldEye</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/profile')}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-poonawala-red/20 to-transparent border border-white/10 flex items-center justify-center"
          >
            <div className="w-6 h-6 rounded-full bg-poonawala-red flex items-center justify-center">
              <span className="text-[10px] font-bold text-white">
                {firstName.charAt(0).toUpperCase()}
              </span>
            </div>
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-5 pt-5 space-y-4">
        {/* Greeting */}
        <div>
          <p className="text-white/40 text-sm">Good {getGreeting()},</p>
          <h1 className="font-display font-black text-2xl text-white">{firstName} 👋</h1>
        </div>

        {/* Live Gold Price Card */}
        <div className="relative rounded-3xl overflow-hidden border border-gold-500/20 bg-gradient-to-br from-[#1A1608] to-[#0F120A]">
          <div className="absolute inset-0 bg-gradient-to-br from-gold-500/8 to-transparent pointer-events-none" />
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-gold-500/8 blur-3xl pointer-events-none" />

          {/* Decorative gold coins */}
          <div className="absolute -right-4 -top-4 opacity-20">
            <GoldCoin size={96} />
          </div>
          <div className="absolute right-10 bottom-2 opacity-10">
            <GoldCoin size={48} />
          </div>

          <div className="relative p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <p className="text-[11px] text-green-400 font-semibold uppercase tracking-wider">Live Gold Rate</p>
                </div>
                {loading ? (
                  <div className="h-12 w-48 bg-white/8 rounded-xl animate-pulse mb-1" />
                ) : error ? (
                  <p className="text-red-400 text-sm">Failed to load price</p>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-gold-400/60 text-xl font-display">₹</span>
                    <span className="font-display font-black text-5xl text-gold-300 tracking-tight leading-none">
                      <AnimatedPrice value={gold?.pricePerGram24k ?? 0} />
                    </span>
                    <span className="text-white/40 text-sm">/gm</span>
                  </div>
                )}
                <p className="text-white/30 text-xs mt-1">24 Karat · 999.9 Fine Gold</p>
              </div>
              <button
                onClick={() => load(true)}
                className={clsx('w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0', refreshing && 'animate-spin')}
              >
                <RefreshCw className="w-3.5 h-3.5 text-white/40" />
              </button>
            </div>

            {/* Purity grid */}
            {gold && (
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: '22K', price: gold.pricePerGram22k },
                  { label: '18K', price: gold.pricePerGram18k },
                  { label: '14K', price: Math.round(gold.pricePerGram24k * 14/24) },
                ].map(({ label, price }) => (
                  <div key={label} className="bg-black/20 border border-gold-500/15 rounded-xl p-2.5 text-center">
                    <p className="text-[10px] text-gold-400/60 font-semibold mb-0.5">{label}</p>
                    <p className="text-sm font-bold text-white/80">₹{price.toLocaleString('en-IN')}</p>
                    <p className="text-[9px] text-white/30">/gm</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Gold bar decorative strip */}
        <div className="flex items-center justify-center gap-4 py-1">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-gold-500/20" />
          <GoldBar />
          <div className="flex-1 h-px bg-gradient-to-l from-transparent to-gold-500/20" />
        </div>

        {/* CTA cards */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/consent')}
            className="relative rounded-2xl bg-gradient-to-br from-poonawala-red to-red-800 p-4 flex flex-col gap-2 shadow-[0_4px_24px_rgba(227,29,37,0.4)] active:scale-[0.97] transition-transform overflow-hidden"
          >
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10 blur-xl" />
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <p className="font-display font-bold text-white text-sm leading-tight">Apply for<br/>Gold Loan</p>
            <div className="flex items-center gap-1 text-white/70 text-xs">
              <Zap className="w-3 h-3" /> Instant approval
            </div>
          </button>

          <button
            onClick={() => navigate('/estimate')}
            className="relative rounded-2xl bg-[#141824] border border-gold-500/25 p-4 flex flex-col gap-2 active:scale-[0.97] transition-transform overflow-hidden"
          >
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-gold-500/8 blur-xl" />
            <div className="w-10 h-10 rounded-xl bg-gold-500/15 flex items-center justify-center">
              <Calculator className="w-5 h-5 text-gold-400" />
            </div>
            <p className="font-display font-bold text-white text-sm leading-tight">Quick<br/>Estimator</p>
            <div className="flex items-center gap-1 text-white/40 text-xs">
              Check loan amount
            </div>
          </button>
        </div>

        {/* Stats */}
        <div className="rounded-2xl bg-[#141824] border border-white/6 p-4">
          <div className="grid grid-cols-3 divide-x divide-white/5">
            {[
              { icon: Zap, val: '2 hrs', label: 'Pickup SLA' },
              { icon: Shield, val: '75%', label: 'Max LTV' },
              { icon: Clock, val: '₹0', label: 'Processing fee' },
            ].map(({ icon: Icon, val, label }) => (
              <div key={label} className="text-center px-3">
                <Icon className="w-4 h-4 text-gold-400 mx-auto mb-1.5" />
                <p className="font-display font-bold text-white text-base">{val}</p>
                <p className="text-[10px] text-white/40 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* How it works */}
        <p className="font-display font-bold text-white">How it works</p>
        <div className="space-y-2">
          {[
            { emoji: '📸', title: 'Photograph your gold', sub: 'Place jewelry on a surface with a ₹10 coin for scale' },
            { emoji: '🤖', title: 'AI analyses purity & weight', sub: '12 AI signals — hallmark OCR, depth map, acoustic test' },
            { emoji: '💰', title: 'Get your loan offer', sub: 'Instant pre-approval with live gold price calculation' },
            { emoji: '🏠', title: 'Agent visits your door', sub: 'Physical pickup & disbursement within 2 hours' },
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-4 bg-[#141824] border border-white/5 rounded-2xl p-4">
              <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center flex-shrink-0 text-xl">
                {step.emoji}
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm text-white">{step.title}</p>
                <p className="text-xs text-white/40 mt-0.5">{step.sub}</p>
              </div>
              <span className="text-[10px] font-bold text-gold-500/40 font-mono">0{i + 1}</span>
            </div>
          ))}
        </div>

        {/* Trust */}
        <div className="rounded-2xl bg-gradient-to-br from-poonawala-red/10 to-transparent border border-poonawala-red/15 p-4">
          <p className="font-display font-semibold text-white text-sm mb-2">Why Poonawala GoldEye?</p>
          {['RBI 2025 compliant — full audit trail', '90% statistical coverage guarantee', 'Zero hidden charges, transparent pricing', 'Trusted NBFC since 1987'].map(item => (
            <p key={item} className="text-xs text-white/50 py-1 border-b border-white/5 last:border-0">✓ {item}</p>
          ))}
        </div>

        {/* Footer badges */}
        <div className="flex items-center justify-center gap-3 flex-wrap pb-2">
          <span className="px-2.5 py-1 rounded-full bg-gold-500/10 border border-gold-500/20 text-[10px] text-gold-400 font-semibold">RBI REGULATED</span>
          <span className="px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] text-blue-400 font-semibold">DPDP 2023</span>
          <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-white/30">ISO 27001</span>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
