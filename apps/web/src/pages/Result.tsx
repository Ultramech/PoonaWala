import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSessionStore } from '../store/session'
import { Share2, RefreshCcw, ChevronRight, ChevronDown, ChevronUp, Info } from 'lucide-react'
import { clsx } from 'clsx'

// ── Animated counter ──────────────────────────────────────────────────────────
function AnimatedNumber({ target, prefix = '', suffix = '', duration = 1200 }: {
  target: number; prefix?: string; suffix?: string; duration?: number
}) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    const start = performance.now()
    const frame = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setVal(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
  }, [target, duration])
  return <>{prefix}{val.toLocaleString('en-IN')}{suffix}</>
}

// ── Routing config ────────────────────────────────────────────────────────────
const ROUTING = {
  INSTANT: {
    label: 'Instant Pre-Approval',
    emoji: '⚡',
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/25',
    action: 'Sign & Book Doorstep Pickup',
    actionColor: 'btn-gold',
    desc: 'Your jewelry meets all criteria for instant approval. An agent will visit within 2 hours.',
  },
  AGENT: {
    label: 'Agent Visit Required',
    emoji: '👤',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/25',
    action: 'Schedule Agent Visit',
    actionColor: 'btn-outline-gold',
    desc: 'A physical XRF assay is required. Our agent will visit at your convenience.',
  },
  RECAPTURE: {
    label: 'Better Photo Needed',
    emoji: '📷',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/25',
    action: 'Retake Photos',
    actionColor: 'btn-outline-gold',
    desc: 'Some captures were unclear. Better photos will improve our confidence.',
  },
  REJECT: {
    label: 'Unable to Pre-Qualify',
    emoji: '⚠️',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/25',
    action: 'Visit Nearest Branch',
    actionColor: 'btn-ghost',
    desc: 'We couldn\'t build enough confidence for pre-qualification. In-branch verification is recommended.',
  },
}

// ── SHAP bar component ────────────────────────────────────────────────────────
function SHAPBar({ feature, contribution }: { feature: string; contribution: number }) {
  const pct = Math.abs(contribution) * 200 // scale to %
  const pos = contribution > 0
  const labels: Record<string, string> = {
    huid_verified: 'BIS Hallmark',
    plated_solid_score: 'Solid/Plated',
    weight_consistency: 'Weight match',
    audio_solid_prob: 'Acoustic test',
    hallmark_quality: 'Hallmark quality',
    plated_probability: 'Plating risk',
    vlm_confidence: 'Visual AI',
  }
  return (
    <div className="flex items-center gap-3 py-1.5">
      <p className="text-xs text-white/60 w-24 flex-shrink-0">{labels[feature] || feature}</p>
      <div className="flex-1 flex items-center gap-1">
        <div className="flex-1 h-2 rounded-full bg-surface-4 relative overflow-hidden">
          <div
            className={clsx('absolute top-0 h-full rounded-full transition-all duration-700', pos ? 'bg-green-500 right-1/2' : 'bg-red-400 left-1/2')}
            style={{ width: `${Math.min(pct, 50)}%` }}
          />
        </div>
      </div>
      <span className={clsx('text-xs font-mono w-12 text-right', pos ? 'text-green-400' : 'text-red-400')}>
        {pos ? '+' : ''}{(contribution * 100).toFixed(0)}%
      </span>
    </div>
  )
}

// ── Confidence ring SVG ───────────────────────────────────────────────────────
function ConfidenceRing({ score }: { score: number }) {
  const r = 42, circ = 2 * Math.PI * r
  const [pct, setPct] = useState(0)
  useEffect(() => { setTimeout(() => setPct(score), 300) }, [score])
  const color = score >= 0.75 ? '#22c55e' : score >= 0.55 ? '#eab308' : '#f97316'
  const label = score >= 0.75 ? 'High' : score >= 0.55 ? 'Medium' : 'Low'

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
          <circle
            cx="50" cy="50" r={r}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - pct)}
            className="transition-all duration-[1.2s] ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display font-black text-xl text-white">
            {Math.round(pct * 100)}%
          </span>
        </div>
      </div>
      <span className={clsx('text-xs font-semibold mt-1', color === '#22c55e' ? 'text-green-400' : color === '#eab308' ? 'text-yellow-400' : 'text-orange-400')}>
        {label} confidence
      </span>
      <span className="text-[10px] text-white/30 mt-0.5">90% coverage guarantee</span>
    </div>
  )
}

// ── Main Result page ──────────────────────────────────────────────────────────
export function Result() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { state, reset } = useSessionStore()
  const [showXAI, setShowXAI] = useState(false)

  const result = state.result
  if (!result) {
    navigate('/'); return null
  }

  const routing = ROUTING[result.routing]
  const isFail = result.routing === 'REJECT' || result.routing === 'RECAPTURE'

  const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`

  return (
    <div className="page overflow-y-auto no-scrollbar animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <button id="result-home" onClick={() => { reset(); navigate('/home') }} className="btn-icon">
          <ChevronRight className="w-5 h-5 rotate-180 text-white/60" />
        </button>
        <span className="font-display font-semibold text-sm text-white/70">Poonawala GoldEye Result</span>
        <button id="result-share" onClick={() => navigator.share?.({ title: 'Poonawala GoldEye Result', text: 'My gold loan pre-qualification' })} className="btn-icon">
          <Share2 className="w-4 h-4 text-white/50" />
        </button>
      </div>

      {/* Routing status banner */}
      <div className={clsx('mx-5 mb-5 p-4 rounded-2xl border flex items-start gap-3', routing.bg, routing.border)}>
        <span className="text-2xl flex-shrink-0">{routing.emoji}</span>
        <div>
          <h2 className={clsx('font-display font-bold text-base', routing.color)}>{routing.label}</h2>
          <p className="text-xs text-white/50 mt-0.5">{routing.desc}</p>
        </div>
      </div>

      {/* ── HAPPY PATH ── */}
      {!isFail && (
        <>
          {/* Main value cards */}
          <div className="px-5 mb-4 grid grid-cols-2 gap-3">
            {/* Purity */}
            <div className="card-red p-4">
              <p className="label mb-2">{t('result_purity')}</p>
              <div className="font-display font-black text-3xl text-poonawala-red">
                <AnimatedNumber target={result.purity.point_estimate_karat} suffix="K" />
              </div>
              <p className="text-xs text-white/40 mt-1">
                {result.purity.band_low_karat}K – {result.purity.band_high_karat}K band
              </p>
              {result.purity.huid_verified && (
                <span className="badge-green mt-2 text-[10px]">✓ BIS Verified</span>
              )}
            </div>

            {/* Weight */}
            <div className="card p-4">
              <p className="label mb-2">{t('result_weight')}</p>
              <div className="font-display font-black text-3xl text-white">
                <AnimatedNumber target={result.weight.estimated_g} suffix="g" />
              </div>
              <p className="text-xs text-white/40 mt-1">
                {result.weight.band_low_g.toFixed(1)}g – {result.weight.band_high_g.toFixed(1)}g band
              </p>
              <span className="text-[10px] text-white/25 mt-2 block">
                {result.weight.method === 'hybrid' ? 'Scale + AI estimate' : 'AI depth estimate'}
              </span>
            </div>
          </div>

          {/* Value band */}
          <div className="mx-5 mb-4">
            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="label">{t('result_value')}</p>
                <span className="text-xs text-white/30">IBJA ref price</span>
              </div>
              <div className="font-display font-black text-4xl text-poonawala-red mb-1">
                <AnimatedNumber target={result.value_inr.band_low} prefix="₹" />
                <span className="text-white/30 text-2xl mx-2">–</span>
                <AnimatedNumber target={result.value_inr.band_high} prefix="₹" />
              </div>
              <div className="band-track mt-3">
                <div className="band-fill" style={{ background: '#e31d25', width: '100%' }} />
              </div>
              <p className="text-xs text-white/30 mt-2">
                Stone weight ({result.value_inr.stone_weight_excluded_g}g) excluded from calculation
              </p>
            </div>
          </div>

          {/* Loan offer — the hero number */}
          <div className="mx-5 mb-4">
            <div className="relative card-red p-6 overflow-hidden border border-poonawala-red/20 rounded-3xl bg-surface-2">
              <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-poonawala-red/5 blur-xl" />
              <p className="label mb-2">{t('result_loan')}</p>
              <div className="font-display font-black text-5xl text-poonawala-red mb-1 leading-none">
                <AnimatedNumber target={result.loan_offer.band_low_inr} prefix="₹" duration={1400} />
              </div>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-white/40 text-xl">–</span>
                <span className="font-display font-bold text-2xl text-gold-300">
                  <AnimatedNumber target={result.loan_offer.band_high_inr} prefix="₹" duration={1400} />
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="badge-red">{result.loan_offer.ltv_applied_pct}% LTV</span>
                <span className="badge-red">{result.loan_offer.tier === 'under_2_5L' ? 'Under ₹2.5L tier' : 'Above ₹2.5L tier'}</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── FAIL PATH ── */}
      {isFail && (
        <div className="mx-5 mb-4">
          <div className="card p-6 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="font-display font-bold text-xl text-white mb-2">
              {t('fail_heading')}
            </h2>
            <p className="text-sm text-white/50 leading-relaxed mb-4">
              {t('fail_body', { score: Math.round(result.confidence.score * 100) })}
            </p>
            <ConfidenceRing score={result.confidence.score} />
          </div>
        </div>
      )}

      {/* Confidence ring + reasoning (happy path) */}
      {!isFail && (
        <div className="mx-5 mb-4">
          <div className="card p-5">
            <div className="flex items-center gap-6">
              <ConfidenceRing score={result.confidence.score} />
              <div className="flex-1">
                <p className="text-xs font-semibold text-white mb-2 uppercase tracking-wider">Why this estimate</p>
                <p className="text-xs text-white/60 leading-relaxed">{result.reasoning_text.text}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* XAI accordion */}
      <div className="mx-5 mb-4">
        <button
          id="result-xai-toggle"
          onClick={() => setShowXAI(!showXAI)}
          className="w-full card flex items-center justify-between p-4"
        >
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-gold-400" />
            <span className="text-sm font-medium text-white">{t('xai_heading')}</span>
          </div>
          {showXAI ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
        </button>

        {showXAI && (
          <div className="card mt-1 p-4 animate-slide-down">
            <p className="text-xs text-white/30 mb-4 uppercase tracking-wider">SHAP Feature Attribution</p>
            {result.xai.shap_top_features.map(f => (
              <SHAPBar key={f.feature} feature={f.feature} contribution={f.contribution} />
            ))}

            {/* 4-layer XAI legend */}
            <div className="mt-4 pt-4 border-t border-white/5">
              <p className="text-xs text-white/30 mb-3 uppercase tracking-wider">4-Layer Explainability</p>
              {[
                { n: 1, label: 'Visual heatmap', status: 'Grad-CAM++ (pilot release)' },
                { n: 2, label: 'Feature attribution', status: 'SHAP values ↑ above' },
                { n: 3, label: 'Customer text', status: result.reasoning_text.text.slice(0, 60) + '…' },
                { n: 4, label: 'Counterfactual', status: result.xai.counterfactual || 'No improvements needed' },
              ].map(row => (
                <div key={row.n} className="flex items-start gap-3 mb-3">
                  <div className="w-5 h-5 rounded-full bg-gold-500/15 flex items-center justify-center flex-shrink-0">
                    <span className="text-[9px] font-bold text-gold-400">{row.n}</span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-white">{row.label}</p>
                    <p className="text-[10px] text-white/35 mt-0.5">{row.status}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Audit */}
            <div className="mt-2 pt-3 border-t border-white/5">
              <p className="text-[10px] text-white/20 font-mono break-all">
                trace: {result.audit.trace_id}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Fraud signal summary */}
      {result.fraud_signals.triggers.length > 0 && (
        <div className="mx-5 mb-4">
          <div className="card p-4 border border-orange-500/20">
            <p className="text-xs font-semibold text-orange-400 mb-2 flex items-center gap-2">
              ⚠️ Fraud signals detected
            </p>
            {result.fraud_signals.triggers.map(t => (
              <span key={t} className="badge-orange mr-2 mb-1 text-[10px]">{t.replace(/_/g, ' ')}</span>
            ))}
          </div>
        </div>
      )}

      {/* CTA buttons */}
      <div className="mx-5 mb-4 space-y-3">
        <button
          id="result-primary-action"
          onClick={() => navigate('/home')}
          className={routing.actionColor === 'btn-gold' ? 'btn-gold w-full' : 'btn-outline-gold w-full'}
        >
          {routing.action}
          <ChevronRight className="w-5 h-5" />
        </button>
        <button
          id="result-retry"
          onClick={() => { reset(); navigate('/setup') }}
          className="btn-ghost w-full text-sm flex items-center justify-center gap-2"
        >
          <RefreshCcw className="w-4 h-4" />
          {t('result_retry')}
        </button>
      </div>

      {/* Footer */}
      <div className="px-5 pb-8">
        <div className="divider mb-5" />
        <div className="flex items-center justify-center gap-4">
          <span className="badge-red">{t('footer_rbi')}</span>
          <span className="badge-blue">{t('footer_dpdp')}</span>
        </div>
        <p className="text-center text-xs text-white/20 mt-4">{t('powered_by')}</p>
      </div>
    </div>
  )
}
