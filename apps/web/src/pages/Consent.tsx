import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSessionStore } from '../store/session'
import { Shield, Lock, Trash2, Eye, ChevronRight } from 'lucide-react'

const DATA_ITEMS = [
  { icon: Eye, key: 'Photos & video of your jewelry' },
  { icon: Shield, key: 'Optional audio (coin drop test)' },
  { icon: Eye, key: 'One selfie (anti-fraud verification)' },
  { icon: Lock, key: 'Device metadata (camera info)' },
]

export function Consent() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { setConsent, initSession } = useSessionStore()

  const accept = () => {
    setConsent()
    initSession()
    navigate('/otp')
  }

  const decline = () => navigate('/welcome')

  return (
    <div className="page animate-slide-up">
      {/* Top bar */}
      <div className="page-header">
        <button id="consent-back" onClick={() => navigate('/welcome')} className="btn-icon">
          <ChevronRight className="w-5 h-5 rotate-180 text-white/60" />
        </button>
        <span className="text-xs text-white/30 uppercase tracking-widest">Privacy</span>
        <div className="w-12" />
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-6">
        {/* Hero icon */}
        <div className="flex flex-col items-center py-8">
          <div className="w-20 h-20 rounded-3xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center mb-6 shadow-gold-sm">
            <Shield className="w-10 h-10 text-gold-400" />
          </div>
          <h1 className="font-display font-bold text-2xl text-white text-center mb-2">
            {t('consent_heading')}
          </h1>
          <p className="text-sm text-white/50 text-center leading-relaxed">
            {t('consent_body', { days: 90 })}
          </p>
        </div>

        {/* Data collected */}
        <div className="card-gold p-4 mb-4">
          <h2 className="text-xs font-semibold text-gold-400/80 uppercase tracking-wider mb-3">
            Data we collect
          </h2>
          <div className="space-y-3">
            {DATA_ITEMS.map(({ icon: Icon, key }) => (
              <div key={key} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-gold-500/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-3.5 h-3.5 text-gold-400" />
                </div>
                <span className="text-sm text-white/70">{key}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Not shared */}
        <div className="card p-4 mb-4 flex items-start gap-3">
          <Trash2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-white">Auto-deleted after 90 days</p>
            <p className="text-xs text-white/40 mt-0.5">{t('consent_not_shared')}</p>
          </div>
        </div>

        {/* India residency */}
        <div className="card p-4 mb-6 flex items-start gap-3">
          <span className="text-xl flex-shrink-0">🇮🇳</span>
          <div>
            <p className="text-sm font-medium text-white">Data stays in India</p>
            <p className="text-xs text-white/40 mt-0.5">
              Stored on India-resident servers. DPDP Act compliant.
            </p>
          </div>
        </div>

        {/* Consent version */}
        <p className="text-xs text-center text-white/20 mb-6">
          Consent form {t('consent_version')} · Timestamp recorded
        </p>
      </div>

      {/* Actions - sticky bottom */}
      <div className="px-5 pb-6 space-y-3 border-t border-white/5 pt-4">
        <button id="consent-accept" onClick={accept} className="btn-gold w-full">
          {t('consent_accept')}
        </button>
        <button id="consent-decline" onClick={decline} className="btn-ghost w-full text-sm">
          {t('consent_decline')}
        </button>
      </div>
    </div>
  )
}
