import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Camera, Info, RefreshCw } from 'lucide-react'
import { fetchGoldPrice, calcLoanBand, type GoldPriceData } from '../lib/goldPrice'
import { BottomNav } from '../components/BottomNav'
import { clsx } from 'clsx'

const PURITIES = [
  { karat: 24, label: '24K', purity: '99.9%', color: 'text-gold-300' },
  { karat: 22, label: '22K', purity: '91.6%', color: 'text-gold-400' },
  { karat: 18, label: '18K', purity: '75%', color: 'text-gold-500' },
  { karat: 14, label: '14K', purity: '58.5%', color: 'text-gold-600' },
]

function AnimatedCounter({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(value)
  useEffect(() => {
    let frame: number
    const start = performance.now()
    const from = display
    const tick = (now: number) => {
      const t = Math.min((now - start) / 500, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(Math.round(from + (value - from) * eased))
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value])
  return <>{prefix}{display.toLocaleString('en-IN')}{suffix}</>
}

export function LoanEstimator() {
  const navigate = useNavigate()
  const [gold, setGold] = useState<GoldPriceData | null>(null)
  const [weight, setWeight] = useState(10)
  const [karat, setKarat] = useState(22)
  const [weightInput, setWeightInput] = useState('10')

  useEffect(() => {
    fetchGoldPrice().then(setGold).catch(() => {})
  }, [])

  const loan = gold ? calcLoanBand(weight, karat, gold.pricePerGram24k) : null

  const handleWeightInput = useCallback((val: string) => {
    setWeightInput(val)
    const n = parseFloat(val)
    if (!isNaN(n) && n > 0 && n <= 500) setWeight(n)
  }, [])

  return (
    <div className="min-h-screen bg-[#080C18] text-white pb-28 overflow-y-auto no-scrollbar">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#080C18]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-md mx-auto flex items-center gap-3 px-5 py-4">
          <button onClick={() => navigate('/home')} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center active:scale-95 transition-transform">
            <ChevronLeft className="w-5 h-5 text-white/60" />
          </button>
          <div>
            <p className="font-display font-bold text-white">Loan Estimator</p>
            <p className="text-xs text-white/40">Quick gold loan calculation</p>
          </div>
          <div className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-500/10">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] text-green-400 font-medium">Live</span>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-5 pt-5 space-y-4">
        {/* Live price strip */}
        {gold ? (
          <div className="flex items-center justify-between bg-[#141824] border border-white/6 rounded-2xl px-4 py-3">
            <div>
              <p className="text-[10px] text-white/40 uppercase tracking-wider">24K Gold Price</p>
              <p className="font-display font-bold text-gold-400 text-xl">₹{gold.pricePerGram24k.toLocaleString('en-IN')}/gm</p>
            </div>
            <button onClick={() => fetchGoldPrice().then(setGold)} className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center">
              <RefreshCw className="w-3.5 h-3.5 text-white/40" />
            </button>
          </div>
        ) : (
          <div className="h-16 bg-white/5 rounded-2xl animate-pulse" />
        )}

        {/* Weight input */}
        <div className="bg-[#141824] border border-white/6 rounded-2xl p-5">
          <label className="block text-xs text-white/40 uppercase tracking-wider mb-3">Gold Weight (grams)</label>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 relative">
              <input
                type="number"
                value={weightInput}
                onChange={e => handleWeightInput(e.target.value)}
                className="w-full bg-surface-3 border border-white/10 rounded-xl px-4 py-3 text-white text-xl font-display font-bold outline-none focus:border-gold-500/60 transition-colors"
                placeholder="10"
                min="0.1"
                max="500"
                step="0.1"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 text-sm">gm</span>
            </div>
            <div className="flex flex-col gap-1">
              {[5, 10, 20, 50].map(w => (
                <button
                  key={w}
                  onClick={() => { setWeight(w); setWeightInput(String(w)) }}
                  className={clsx(
                    'px-3 py-1 rounded-lg text-xs font-medium transition-all',
                    weight === w
                      ? 'bg-poonawala-red text-white'
                      : 'bg-white/5 text-white/50 hover:bg-white/10'
                  )}
                >
                  {w}g
                </button>
              ))}
            </div>
          </div>

          <input
            type="range"
            min="1"
            max="200"
            step="0.5"
            value={Math.min(weight, 200)}
            onChange={e => { const v = parseFloat(e.target.value); setWeight(v); setWeightInput(String(v)) }}
            className="w-full accent-poonawala-red"
          />
          <div className="flex justify-between text-[10px] text-white/30 mt-1">
            <span>1g</span>
            <span>50g</span>
            <span>100g</span>
            <span>200g</span>
          </div>
        </div>

        {/* Purity selector */}
        <div className="bg-[#141824] border border-white/6 rounded-2xl p-5">
          <label className="block text-xs text-white/40 uppercase tracking-wider mb-3">Gold Purity</label>
          <div className="grid grid-cols-4 gap-2">
            {PURITIES.map(p => (
              <button
                key={p.karat}
                onClick={() => setKarat(p.karat)}
                className={clsx(
                  'flex flex-col items-center gap-1 py-3 rounded-xl border transition-all',
                  karat === p.karat
                    ? 'bg-poonawala-red/15 border-poonawala-red/50 shadow-[0_0_12px_rgba(227,29,37,0.2)]'
                    : 'bg-white/3 border-white/8 hover:bg-white/6'
                )}
              >
                <span className={clsx('font-display font-bold text-base', karat === p.karat ? 'text-poonawala-red' : p.color)}>
                  {p.label}
                </span>
                <span className="text-[9px] text-white/40">{p.purity}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Loan estimate result */}
        {loan && (
          <div className="relative rounded-2xl overflow-hidden border border-poonawala-red/20 bg-gradient-to-br from-poonawala-red/10 to-[#141824]">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-poonawala-red/8 blur-2xl pointer-events-none" />
            <div className="p-5">
              <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Estimated Loan Amount</p>

              <div className="mb-4">
                <div className="font-display font-black text-4xl text-poonawala-red leading-none">
                  <AnimatedCounter value={loan.loanHigh} prefix="₹" />
                </div>
                <p className="text-sm text-white/40 mt-1">
                  Up to · <AnimatedCounter value={loan.loanLow} prefix="₹" /> – <AnimatedCounter value={loan.loanHigh} prefix="₹" /> range
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 bg-white/4 rounded-xl p-3">
                <div className="text-center">
                  <p className="text-[10px] text-white/30 mb-0.5">Gold Value</p>
                  <p className="text-sm font-semibold text-white">
                    ₹{loan.goldValue.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="text-center border-x border-white/8">
                  <p className="text-[10px] text-white/30 mb-0.5">LTV Applied</p>
                  <p className="text-sm font-semibold text-gold-400">{loan.ltv}%</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-white/30 mb-0.5">Purity</p>
                  <p className="text-sm font-semibold text-white">{karat}K</p>
                </div>
              </div>

              <div className="mt-3 flex items-start gap-2 bg-white/4 rounded-xl p-3">
                <Info className="w-4 h-4 text-white/30 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-white/40 leading-relaxed">
                  This is an estimate using live IBJA gold prices. Final loan amount is determined after physical verification by our agent. LTV is {loan.ltv === 65 ? '65% for loans under ₹2.5L' : '75% for loans above ₹2.5L'}.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Apply CTA */}
        <button
          onClick={() => navigate('/consent')}
          className="w-full bg-poonawala-red rounded-2xl py-4 flex items-center justify-center gap-2 font-display font-semibold text-white shadow-[0_4px_24px_rgba(227,29,37,0.35)] active:scale-[0.97] transition-transform"
        >
          <Camera className="w-5 h-5" />
          Apply for Actual Assessment
        </button>

        <p className="text-center text-xs text-white/30">
          Get an accurate AI-powered assessment by photographing your gold jewelry
        </p>
      </div>

      <BottomNav />
    </div>
  )
}
