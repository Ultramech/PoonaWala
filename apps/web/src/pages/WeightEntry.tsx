import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSessionStore } from '../store/session'
import { Scale, ChevronRight, ArrowRight, Info } from 'lucide-react'

export function WeightEntry() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { setWeight } = useSessionStore()

  const [value, setValue] = useState('')
  const [skipped, setSkipped] = useState(false)

  const grams = parseFloat(value)
  const valid = !isNaN(grams) && grams >= 0.5 && grams <= 500

  const proceed = (w: number | null) => {
    setWeight(w)
    navigate('/processing')
  }

  return (
    <div className="page animate-slide-up">
      <div className="page-header">
        <button id="weight-back" onClick={() => navigate('/capture')} className="btn-icon">
          <ChevronRight className="w-5 h-5 rotate-180 text-white/60" />
        </button>
        <span className="text-xs text-white/30 uppercase tracking-widest">Weight</span>
        <div className="w-12" />
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-6">
        {/* Icon */}
        <div className="flex flex-col items-center pt-6 pb-8">
          <div className="w-20 h-20 rounded-3xl bg-surface-2 border border-white/10 flex items-center justify-center mb-6">
            <Scale className="w-10 h-10 text-gold-400" />
          </div>
          <h1 className="font-display font-bold text-2xl text-white text-center mb-2">
            {t('weight_heading')}
          </h1>
          <p className="text-sm text-white/50 text-center leading-relaxed">
            {t('weight_body')}
          </p>
        </div>

        {/* Weight input */}
        <div className="mb-6">
          <label className="label mb-2 block">{t('weight_label')}</label>
          <div className="relative">
            <input
              id="weight-input"
              type="number"
              value={value}
              onChange={e => { setSkipped(false); setValue(e.target.value) }}
              placeholder={t('weight_placeholder')}
              className="input-field pr-16 text-xl font-mono font-bold"
              step="0.1"
              min="0.5"
              max="500"
              inputMode="decimal"
              autoFocus={!skipped}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-white/40 font-medium">
              grams
            </div>
          </div>

          {/* Validation */}
          {value && !valid && (
            <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
              <Info className="w-3.5 h-3.5" />
              Weight must be between 0.5g and 500g
            </p>
          )}
          {valid && (
            <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
              ✓ {grams}g entered — this improves accuracy significantly
            </p>
          )}
        </div>

        {/* How to weigh tip */}
        <div className="card p-4 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-xl flex-shrink-0">⚖️</span>
            <div>
              <p className="text-sm font-semibold text-white mb-1">Kitchen scale tip</p>
              <p className="text-xs text-white/50 leading-relaxed">
                Place your jewelry on a kitchen scale (₹200–400 online). Remove any clasps or attachments if possible. Write down the value in grams.
              </p>
            </div>
          </div>
        </div>

        {/* Impact on accuracy */}
        <div className="glassmorphism-gold rounded-2xl p-4 mb-8">
          <h3 className="text-xs font-semibold text-gold-400 uppercase tracking-wider mb-3">
            Impact on loan band width
          </h3>
          {[
            { label: 'With scale weight', band: '±8%', color: 'bg-green-500', w: '85%' },
            { label: 'Estimated from video', band: '±22%', color: 'bg-yellow-500', w: '55%' },
            { label: 'No weight data', band: '±35%', color: 'bg-orange-500', w: '30%' },
          ].map(row => (
            <div key={row.label} className="flex items-center gap-3 mb-2">
              <p className="text-xs text-white/50 w-32 flex-shrink-0">{row.label}</p>
              <div className="flex-1 band-track">
                <div
                  className={`${row.color} band-fill`}
                  style={{ width: row.w }}
                />
              </div>
              <span className="text-xs font-mono text-white/60 w-10 text-right">{row.band}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 pb-6 pt-4 border-t border-white/5 space-y-3">
        <button
          id="weight-continue"
          onClick={() => proceed(grams)}
          disabled={!valid}
          className={valid ? 'btn-gold w-full' : 'btn-ghost w-full opacity-40 cursor-not-allowed'}
        >
          {t('weight_continue')}
          <ArrowRight className="w-5 h-5" />
        </button>
        <button
          id="weight-skip"
          onClick={() => proceed(null)}
          className="btn-ghost w-full text-sm"
        >
          {t('weight_skip')}
        </button>
      </div>
    </div>
  )
}
