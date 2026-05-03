import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Sun, Circle, Coins, ChevronRight, ArrowRight } from 'lucide-react'

const TIPS = [
  { icon: Sun, key: 'setup_tip1' },
  { icon: Circle, key: 'setup_tip2' },
  { icon: Coins, key: 'setup_tip3' },
]

export function Setup() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(text)
      u.lang = localStorage.getItem('goldeye_lang') === 'hi' ? 'hi-IN' : 'en-IN'
      window.speechSynthesis.speak(u)
    }
  }

  return (
    <div className="page animate-slide-up">
      <div className="page-header">
        <button id="setup-back" onClick={() => navigate('/otp')} className="btn-icon">
          <ChevronRight className="w-5 h-5 rotate-180 text-white/60" />
        </button>
        <span className="text-xs text-white/30 uppercase tracking-widest">Setup</span>
        <div className="w-12" />
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-6">
        {/* Illustration */}
        <div className="relative mx-auto w-64 h-48 mb-8 mt-4">
          <div className="absolute inset-0 rounded-3xl bg-surface-2 border border-white/8 flex items-center justify-center overflow-hidden">
            {/* Surface representation */}
            <div className="absolute inset-4 rounded-2xl bg-white/5" />
            {/* Jewelry placeholder */}
            <div className="relative z-10 flex items-end gap-6">
              <div className="text-6xl filter drop-shadow-lg">💍</div>
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-silver-200 border-2 border-white/20 bg-gradient-to-br from-white/30 to-white/10 flex items-center justify-center">
                  <span className="text-[8px] font-bold text-white/60">₹10</span>
                </div>
                <p className="text-[9px] text-white/30 mt-1">27mm</p>
              </div>
            </div>
          </div>
          {/* Corner guides */}
          <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-poonawala-red/60 rounded-tl-lg" />
          <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-poonawala-red/60 rounded-tr-lg" />
          <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-poonawala-red/60 rounded-bl-lg" />
          <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-poonawala-red/60 rounded-br-lg" />
        </div>

        <h1 className="font-display font-bold text-2xl text-white text-center mb-2">
          {t('setup_heading')}
        </h1>
        <p className="text-sm text-white/50 text-center mb-8 leading-relaxed">
          {t('setup_body')}
        </p>

        {/* Voice prompt button */}
        <button
          id="setup-voice"
          onClick={() => speak(t('setup_body'))}
          className="w-full flex items-center justify-center gap-2 mb-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm text-white/50 hover:text-white/70 transition-colors"
        >
          <span>🔊</span>
          <span>Listen in your language</span>
        </button>

        {/* Tips */}
        <div className="space-y-3 mb-8">
          {TIPS.map(({ icon: Icon, key }, i) => (
            <div key={key} className="card flex items-center gap-4 p-4">
              <div className="w-8 h-8 rounded-xl bg-poonawala-red/10 flex items-center justify-center flex-shrink-0">
                <span className="font-bold text-poonawala-red text-sm">{i + 1}</span>
              </div>
              <p className="text-sm text-white/70">{t(key)}</p>
            </div>
          ))}
        </div>

        {/* Coin info callout */}
        <div className="bg-poonawala-red/10 border border-poonawala-red/20 backdrop-blur-md rounded-2xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🪙</span>
            <div>
              <p className="text-sm font-semibold text-poonawala-red mb-1">Why the ₹10 coin?</p>
              <p className="text-xs text-white/50 leading-relaxed">
                The ₹10 coin is exactly 27mm across. Our AI uses it as a scale reference, white-balance anchor, and fraud check — solving three problems with one object.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 pb-6 pt-4 border-t border-white/5">
        <button id="setup-ready" onClick={() => navigate('/capture')} className="btn-gold w-full text-lg py-5">
          {t('setup_ready')}
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
