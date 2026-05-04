import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Calculator, ChevronRight, Shield, Zap, Clock, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react'
import { fetchGoldPrice, type GoldPriceData } from '../lib/goldPrice'
import { BottomNav } from '../components/BottomNav'
import { clsx } from 'clsx'

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    let frame: number
    const start = performance.now()
    const from = display
    const duration = 800
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
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
  const [gold, setGold] = useState<GoldPriceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = (showSpin = false) => {
    if (showSpin) setRefreshing(true)
    fetchGoldPrice()
      .then(d => { setGold(d); setLoading(false); setRefreshing(false) })
      .catch(() => { setLoading(false); setRefreshing(false) })
  }

  useEffect(() => { load() }, [])

  const up = (gold?.changePercent ?? 0) >= 0

  return (
    <div className="min-h-screen bg-[#080C18] text-white pb-28 overflow-y-auto no-scrollbar">
      {/* Background glows */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-poonawala-red/8 blur-[80px] pointer-events-none" />
      <div className="fixed top-40 right-0 w-48 h-48 rounded-full bg-gold-500/5 blur-[60px] pointer-events-none" />

      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#080C18]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-md mx-auto flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-poonawala-red flex items-center justify-center shadow-[0_0_16px_rgba(227,29,37,0.4)]">
              <span className="text-lg">👁</span>
            </div>
            <div>
              <p className="text-[10px] text-white/40 uppercase tracking-widest">Poonawala Fincorp</p>
              <p className="font-display font-bold text-white text-sm leading-tight">GoldEye</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/profile')}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center active:scale-95 transition-transform"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
              <span className="text-[10px] font-bold text-white">GP</span>
            </div>
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-5 pt-5 space-y-4">
        {/* Live Gold Price Card */}
        <div className="relative rounded-3xl overflow-hidden border border-white/8 bg-gradient-to-br from-[#141824] to-[#0F1520]">
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-gold-500/6 blur-3xl pointer-events-none" />
          <div className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs text-white/40 uppercase tracking-widest mb-1">24K Gold · Live Price</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-[10px] text-white/40">₹</span>
                  {loading ? (
                    <div className="h-10 w-40 bg-white/10 rounded-xl animate-pulse" />
                  ) : (
                    <span className="font-display font-black text-4xl text-gold-400 tracking-tight">
                      <AnimatedNumber value={gold?.pricePerGram ?? 0} />
                    </span>
                  )}
                  <span className="text-sm text-white/40">/ gm</span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-500/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[10px] text-green-400 font-medium">LIVE</span>
                </div>
                <button
                  onClick={() => load(true)}
                  className={clsx('w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center transition-all', refreshing && 'animate-spin')}
                >
                  <RefreshCw className="w-3.5 h-3.5 text-white/40" />
                </button>
              </div>
            </div>

            {gold && (
              <div className="flex items-center gap-3">
                <div className={clsx(
                  'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold',
                  up ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'
                )}>
                  {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {up ? '+' : ''}{gold.changePercent.toFixed(2)}% today
                </div>
                <span className="text-xs text-white/30">
                  {up ? '+' : ''}₹{Math.abs(Math.round(gold.change / 31.1035)).toLocaleString('en-IN')} / gm
                </span>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-3 gap-3 text-center">
              {[
                { label: '22K', factor: 22/24 },
                { label: '18K', factor: 18/24 },
                { label: '14K', factor: 14/24 },
              ].map(({ label, factor }) => (
                <div key={label} className="bg-white/3 rounded-xl p-2">
                  <p className="text-[10px] text-white/40 mb-0.5">{label} Gold</p>
                  <p className="text-sm font-semibold text-white/80">
                    {gold ? `₹${Math.round(gold.pricePerGram * factor).toLocaleString('en-IN')}` : '—'}
                    <span className="text-[10px] text-white/30">/gm</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Primary CTAs */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/consent')}
            className="relative rounded-2xl bg-poonawala-red p-4 flex flex-col gap-2 shadow-[0_4px_24px_rgba(227,29,37,0.35)] active:scale-[0.97] transition-transform overflow-hidden"
          >
            <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10 blur-xl" />
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className="font-display font-bold text-white text-sm">Apply for</p>
              <p className="font-display font-bold text-white text-sm">Gold Loan</p>
            </div>
            <div className="flex items-center gap-1 text-white/70 text-xs">
              <Zap className="w-3 h-3" />
              Instant Pre-Approval
            </div>
          </button>

          <button
            onClick={() => navigate('/estimate')}
            className="relative rounded-2xl bg-[#141824] border border-gold-500/25 p-4 flex flex-col gap-2 active:scale-[0.97] transition-transform overflow-hidden"
          >
            <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-gold-500/8 blur-xl" />
            <div className="w-10 h-10 rounded-xl bg-gold-500/15 flex items-center justify-center">
              <Calculator className="w-5 h-5 text-gold-400" />
            </div>
            <div className="text-left">
              <p className="font-display font-bold text-white text-sm">Quick</p>
              <p className="font-display font-bold text-white text-sm">Estimator</p>
            </div>
            <div className="flex items-center gap-1 text-white/40 text-xs">
              <span>Check loan amount</span>
            </div>
          </button>
        </div>

        {/* Features strip */}
        <div className="rounded-2xl bg-[#141824] border border-white/6 p-4">
          <div className="grid grid-cols-3 divide-x divide-white/5">
            {[
              { icon: Zap, val: '2 hrs', label: 'Doorstep pickup' },
              { icon: Shield, val: '75%', label: 'Max LTV' },
              { icon: Clock, val: '₹0', label: 'Processing fee' },
            ].map(({ icon: Icon, val, label }) => (
              <div key={label} className="text-center px-3">
                <Icon className="w-4 h-4 text-poonawala-red mx-auto mb-1.5" />
                <p className="font-display font-bold text-white text-base">{val}</p>
                <p className="text-[10px] text-white/40 leading-tight mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div>
          <p className="font-display font-bold text-white text-base mb-3">How it works</p>
          <div className="space-y-2">
            {[
              { n: '01', title: 'Photograph your gold', sub: 'Place jewelry on a surface with a ₹10 coin for scale', icon: '📸' },
              { n: '02', title: 'AI analyses purity & weight', sub: '12 AI signals — hallmark OCR, depth, acoustic test', icon: '🤖' },
              { n: '03', title: 'Get your loan offer', sub: 'Instant pre-approval with live gold price calculations', icon: '💰' },
              { n: '04', title: 'Agent visits your door', sub: 'Physical pickup & disbursement within 2 hours', icon: '🏠' },
            ].map(step => (
              <div key={step.n} className="flex items-start gap-4 bg-[#141824] border border-white/5 rounded-2xl p-4">
                <div className="w-10 h-10 rounded-xl bg-poonawala-red/10 border border-poonawala-red/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">{step.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-white">{step.title}</p>
                  <p className="text-xs text-white/40 mt-0.5 leading-relaxed">{step.sub}</p>
                </div>
                <span className="text-[10px] font-bold text-poonawala-red/50 font-mono flex-shrink-0">{step.n}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Why Poonawala */}
        <div className="rounded-2xl bg-gradient-to-br from-poonawala-red/10 to-transparent border border-poonawala-red/20 p-4">
          <p className="font-display font-bold text-white text-sm mb-3">Why Poonawala GoldEye?</p>
          <div className="space-y-2">
            {[
              '✓ RBI 2025 compliant — full audit trail',
              '✓ 90% statistical coverage guarantee on estimates',
              '✓ Zero hidden charges, transparent pricing',
              '✓ Funded by Poonawala Fincorp — trusted NBFC',
            ].map(item => (
              <p key={item} className="text-xs text-white/60">{item}</p>
            ))}
          </div>
        </div>

        {/* Recent activity teaser */}
        <button
          onClick={() => navigate('/history')}
          className="w-full flex items-center justify-between bg-[#141824] border border-white/6 rounded-2xl p-4 active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-white">Loan History</p>
              <p className="text-xs text-white/40">View past applications</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-white/30" />
        </button>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-3 flex-wrap py-2">
          <span className="px-2.5 py-1 rounded-full bg-gold-500/10 border border-gold-500/20 text-[10px] text-gold-400 font-semibold">RBI REGULATED</span>
          <span className="px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] text-blue-400 font-semibold">DPDP 2023</span>
          <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-white/40">ISO 27001</span>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
