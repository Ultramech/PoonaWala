import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Shield, Zap, TrendingUp, ChevronRight } from 'lucide-react'
import { DemoQR } from '../components/DemoQR'

const STATS = [
  { valKey: 'welcome_stat1_val', labelKey: 'welcome_stat1_label' },
  { valKey: 'welcome_stat2_val', labelKey: 'welcome_stat2_label' },
  { valKey: 'welcome_stat3_val', labelKey: 'welcome_stat3_label' },
]

const FEATURES = [
  { icon: Zap, title: '12 AI Signals', body: 'Hallmark OCR, depth estimation, acoustic test, fraud detection — all fused.' },
  { icon: Shield, title: 'RBI 2025 Ready', body: 'Calibrated bands with 90% statistical coverage guarantee. Audit-ready by design.' },
  { icon: TrendingUp, title: '60–70% Lower Cost', body: 'Pre-qualify thousands without dispatching a single agent.' },
]

export function Welcome() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <div className="page animate-fade-in">
      <DemoQR />
      {/* Hero */}
      <div className="relative px-5 pt-12 pb-6 overflow-hidden">
        {/* Background glow */}
        <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-poonawala-red/10 blur-3xl pointer-events-none" />
        <div className="absolute top-32 -left-16 w-48 h-48 rounded-full bg-poonawala-red/5 blur-2xl pointer-events-none" />

        {/* Logo row */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-poonawala-red flex items-center justify-center shadow-lg shadow-red-900/20">
              <span className="text-xl">👁</span>
            </div>
            <span className="font-display font-bold text-lg text-white">Poonawala <span className="text-poonawala-red">GoldEye</span></span>
          </div>
          <button
            id="change-language"
            onClick={() => navigate('/language')}
            className="text-xs text-white/40 hover:text-white/70 transition-colors px-3 py-1.5 rounded-xl bg-white/5"
          >
            🌐 Language
          </button>
        </div>

        {/* Hero text */}
        <h1 className="font-display font-black text-4xl leading-[1.1] text-white mb-4">
          {t('welcome_heading')}
        </h1>
        <p className="text-base text-white/60 leading-relaxed mb-6">
          {t('welcome_body')}
        </p>

        <p className="text-xs text-center text-white/30 mb-6">{t('welcome_trusted')}</p>
      </div>

      {/* Stats strip + CTA (seamless) */}
      <div className="px-5 mb-6 space-y-3">
        <div className="card-glass p-4 grid grid-cols-3 divide-x divide-white/5">
          {STATS.map(({ valKey, labelKey }) => (
            <div key={valKey} className="text-center px-3">
              <div className="font-display font-bold text-xl text-poonawala-red mb-0.5">
                {t(valKey)}
              </div>
              <div className="text-[10px] text-white/40 uppercase tracking-wide leading-tight">
                {t(labelKey)}
              </div>
            </div>
          ))}
        </div>

        {/* CTA below stats */}
        <button
          id="welcome-cta"
          onClick={() => navigate('/consent')}
          className="btn-gold w-full text-lg py-5 animate-pulse-gold"
        >
          {t('welcome_cta')}
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Features */}
      <div className="px-5 mb-8 space-y-3">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <div key={title} className="card flex items-start gap-4 p-4">
            <div className="w-10 h-10 rounded-xl bg-poonawala-red/10 flex items-center justify-center flex-shrink-0">
              <Icon className="w-5 h-5 text-poonawala-red" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-sm text-white mb-0.5">{title}</h3>
              <p className="text-xs text-white/50 leading-relaxed">{body}</p>
            </div>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="px-5 mb-8">
        <h2 className="font-display font-bold text-lg text-white mb-4">How it works</h2>
          { [
            { n: '1', label: 'Set up your jewelry', sub: 'Place on a surface with a ₹10 coin' },
            { n: '2', label: 'Take 7 guided captures', sub: 'Photos, a short video, optional audio' },
            { n: '3', label: 'Get instant estimate', sub: 'Purity + weight + loan band in seconds' },
          ].map(step => (
            <div key={step.n} className="flex items-center gap-4 mb-4">
              <div className="w-8 h-8 rounded-full bg-poonawala-red/15 border border-poonawala-red/30 flex items-center justify-center flex-shrink-0">
                <span className="font-display font-bold text-sm text-poonawala-red">{step.n}</span>
              </div>
            <div className="flex-1">
              <p className="font-medium text-sm text-white">{step.label}</p>
              <p className="text-xs text-white/40">{step.sub}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-white/20" />
          </div>
        ))}
      </div>

      {/* Footer trust badges */}
      <div className="px-5 pb-8">
        <div className="divider mb-6" />
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <span className="badge-gold">{t('footer_rbi')}</span>
          <span className="badge-blue">{t('footer_dpdp')}</span>
          <span className="text-xs text-white/30">{t('footer_nbfc')}</span>
        </div>
      </div>
    </div>
  )
}
