import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Phone, User, ChevronLeft, Shield } from 'lucide-react'

export function saveUser(phone: string, name: string) {
  localStorage.setItem('gp_user', JSON.stringify({ phone, name }))
}

export function getUser(): { phone: string; name: string } | null {
  try {
    const s = localStorage.getItem('gp_user')
    return s ? JSON.parse(s) : null
  } catch { return null }
}

type Step = 'phone' | 'name'

export function Login() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const handlePhone = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 10)
    setPhone(digits)
  }

  const submitPhone = () => {
    if (phone.length === 10) setStep('name')
  }

  const submitName = () => {
    if (!name.trim()) return
    setLoading(true)
    saveUser(phone, name.trim())
    setTimeout(() => navigate('/home'), 400)
  }

  return (
    <div className="min-h-screen bg-[#080C18] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-gold-500/6 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-poonawala-red/8 blur-[80px] pointer-events-none" />

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="relative mb-4">
            {/* Gold coin visual */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gold-300 via-gold-500 to-gold-700 flex items-center justify-center shadow-[0_0_40px_rgba(212,160,23,0.4)]">
              <span className="text-4xl">🪙</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-poonawala-red flex items-center justify-center border-2 border-[#080C18]">
              <span className="text-xs">✨</span>
            </div>
          </div>
          <h1 className="font-display font-black text-2xl text-white">Poonawala <span className="text-gold-400">GoldEye</span></h1>
          <p className="text-xs text-white/40 mt-1">AI-powered gold loan pre-qualification</p>
        </div>

        {step === 'phone' && (
          <div className="animate-fade-in">
            <div className="mb-6">
              <h2 className="font-display font-bold text-xl text-white mb-1">Enter your mobile number</h2>
              <p className="text-sm text-white/40">We'll use this to track your loan application</p>
            </div>

            <div className="relative mb-4">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <span className="text-lg">🇮🇳</span>
                <span className="text-white/50 text-sm font-medium">+91</span>
                <span className="text-white/20">|</span>
              </div>
              <input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={e => handlePhone(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submitPhone()}
                placeholder="98765 43210"
                className="w-full bg-[#141824] border border-white/10 rounded-2xl pl-24 pr-4 py-4 text-white text-lg font-display tracking-widest outline-none focus:border-gold-500/50 transition-colors"
                autoFocus
              />
            </div>

            <div className="flex gap-2 mb-6">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 h-1 rounded-full transition-all duration-200 ${
                    i < phone.length ? 'bg-gold-400' : 'bg-white/10'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={submitPhone}
              disabled={phone.length !== 10}
              className="w-full bg-poonawala-red rounded-2xl py-4 flex items-center justify-center gap-2 font-display font-semibold text-white shadow-[0_4px_24px_rgba(227,29,37,0.35)] disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97] transition-all"
            >
              Continue
              <ArrowRight className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-center gap-2 mt-5">
              <Shield className="w-3.5 h-3.5 text-white/30" />
              <p className="text-xs text-white/30">Your data is encrypted & never shared</p>
            </div>
          </div>
        )}

        {step === 'name' && (
          <div className="animate-fade-in">
            <button
              onClick={() => setStep('phone')}
              className="flex items-center gap-1 text-white/40 text-sm mb-6"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>

            <div className="mb-6">
              <h2 className="font-display font-bold text-xl text-white mb-1">What's your name?</h2>
              <p className="text-sm text-white/40">So we can personalise your experience</p>
            </div>

            <div className="relative mb-6">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submitName()}
                placeholder="Your full name"
                className="w-full bg-[#141824] border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white text-lg outline-none focus:border-gold-500/50 transition-colors"
                autoFocus
              />
            </div>

            <button
              onClick={submitName}
              disabled={!name.trim() || loading}
              className="w-full bg-poonawala-red rounded-2xl py-4 flex items-center justify-center gap-2 font-display font-semibold text-white shadow-[0_4px_24px_rgba(227,29,37,0.35)] disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97] transition-all"
            >
              {loading ? 'Getting your dashboard…' : 'Get Started'}
              {!loading && <ArrowRight className="w-5 h-5" />}
            </button>
          </div>
        )}

        <div className="mt-8 flex items-center justify-center gap-4 flex-wrap">
          <span className="px-2.5 py-1 rounded-full bg-gold-500/10 border border-gold-500/20 text-[10px] text-gold-400 font-semibold">RBI REGULATED</span>
          <span className="px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] text-blue-400 font-semibold">DPDP 2023</span>
        </div>
      </div>
    </div>
  )
}
