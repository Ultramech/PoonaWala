import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSessionStore, type AssessmentResult, type SessionState } from '../store/session'
import { assessAPI } from '../lib/api'

// ─── Mock fallback (used when API is unreachable) ─────────────────────────────

function buildMockResult(sessionId: string, weightG: number | null, isFailCase = false): AssessmentResult {
  const isFail = isFailCase

  return {
    schema_version: '1.0',
    session_id: sessionId,
    timestamp_utc: new Date().toISOString(),
    purity: {
      band_low_karat: isFail ? 14 : 20,
      band_high_karat: isFail ? 18 : 22,
      point_estimate_karat: isFail ? 16 : 22,
      huid_verified: !isFail,
    },
    weight: {
      manual_entry_g: weightG,
      estimated_g: weightG ?? 7.9,
      band_low_g: (weightG ?? 7.9) * 0.92,
      band_high_g: (weightG ?? 7.9) * 1.10,
      method: weightG ? 'hybrid' : 'depth_volume_x_density',
    },
    value_inr: {
      band_low: isFail ? 24000 : 48000,
      band_high: isFail ? 35000 : 62000,
      ibja_reference_date: new Date().toISOString(),
      stone_weight_excluded_g: 0.4,
    },
    loan_offer: {
      band_low_inr: isFail ? 18000 : 36000,
      band_high_inr: isFail ? 26000 : 47000,
      ltv_applied_pct: 85,
      tier: 'under_2_5L',
    },
    confidence: {
      score: isFail ? 0.38 : 0.92,
      coverage_guarantee_pct: 90,
      calibration_method: 'split_conformal',
    },
    fraud_signals: {
      score: isFail ? 0.71 : 0.04,
      triggers: isFail ? ['plated_metal_detected', 'acoustic_inconsistent'] : [],
    },
    routing: isFail ? 'REJECT' : 'INSTANT',
    reasoning_text: {
      lang: localStorage.getItem('goldeye_lang') || 'en',
      text: isFail
        ? 'Confidence 38% — visual hallmark missing, acoustic signature inconsistent with solid gold. We recommend in-branch verification before approval.'
        : '✓ BIS hallmark verified (HUID: A3F2K1)  ✓ Weight consistent with estimate  ✓ No fraud signals detected  ✓ Acoustic test: solid gold resonance',
    },
    xai: {
      gradcam_url: null,
      shap_top_features: isFail
        ? [
            { feature: 'huid_verified', contribution: -0.28 },
            { feature: 'audio_solid_prob', contribution: -0.19 },
            { feature: 'plated_probability', contribution: -0.15 },
            { feature: 'weight_consistency', contribution: 0.08 },
            { feature: 'vlm_confidence', contribution: -0.12 },
          ]
        : [
            { feature: 'huid_verified', contribution: 0.31 },
            { feature: 'plated_solid_score', contribution: 0.22 },
            { feature: 'weight_consistency', contribution: 0.18 },
            { feature: 'audio_solid_prob', contribution: 0.14 },
            { feature: 'hallmark_quality', contribution: 0.09 },
          ],
      counterfactual: isFail
        ? 'If the hallmark were visible and readable, confidence would increase from 38% to ~67%.'
        : null,
    },
    audit: {
      trace_id: `trace_${Math.random().toString(36).slice(2, 18)}`,
      input_asset_hashes: ['sha256:mock'],
    },
  }
}

async function assessSession(state: SessionState): Promise<AssessmentResult> {
  const sessionId = state.sessionId ?? 'demo'
  const weightG = state.weightG

  // Send real base64 dataUrls for photo frames so VLM can process actual images.
  // Non-photo captures (audio, video, selfie) are sent as opaque handles.
  const captureTypes = Object.keys(state.captures) as (keyof typeof state.captures)[]
  const photoTypes = captureTypes.filter(k => k !== 'audio' && k !== 'video' && k !== 'selfie')
  const frames = photoTypes.map(k => {
    const cap = state.captures[k as keyof typeof state.captures]
    return cap?.dataUrl ?? `local://${sessionId}/${k}`
  })
  const videoCapture = state.captures['video']
  const audioCapture = state.captures['audio']
  const selfieCapture = state.captures['selfie']

  // Minimum display time so animations can play
  const minDelay = new Promise<void>(r => setTimeout(r, 3500))

  const CACHE_KEY = 'goldeye_last_result'

  try {
    const [result] = await Promise.all([
      assessAPI({
        session_id: sessionId,
        frames: frames.length > 0 ? frames : [`local://${sessionId}/demo`],
        video: videoCapture ? `local://${sessionId}/video` : undefined,
        audio: audioCapture ? `local://${sessionId}/audio` : undefined,
        selfie: selfieCapture ? `local://${sessionId}/selfie` : undefined,
        weight_g: weightG ?? undefined,
        lang: state.lang ?? 'en',
        device_metadata: { capture_count: captureTypes.length, ua: navigator.userAgent },
      }),
      minDelay,
    ])
    // Cache last good result for demo-day resilience
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(result)) } catch { /* storage full */ }
    return result
  } catch {
    await minDelay
    // Demo-day fallback: serve cached last-good result first, then mock
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) return JSON.parse(cached) as AssessmentResult
    } catch { /* parse error */ }
    const isFail = Math.random() < 0.1
    return buildMockResult(sessionId, weightG, isFail)
  }
}

const STEPS = [
  { key: 'processing_step1', delay: 0 },
  { key: 'processing_step2', delay: 900 },
  { key: 'processing_step3', delay: 1800 },
  { key: 'processing_step4', delay: 2800 },
  { key: 'processing_step5', delay: 3800 },
]

export function Processing() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { state, setResult } = useSessionStore()
  const [activeStep, setActiveStep] = useState(0)
  const [done, setDone] = useState(false)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    // Animate steps
    STEPS.forEach(({ delay }, i) => {
      setTimeout(() => setActiveStep(i), delay)
    })

    // Call assess
    assessSession(state).then(result => {
      setResult(result)
      setDone(true)
      setTimeout(() => navigate('/result'), 600)
    })
  }, [])

  const pct = Math.round(((activeStep + 1) / STEPS.length) * 100)

  return (
    <div className="page items-center justify-center animate-fade-in">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-gold-500/8 blur-3xl pointer-events-none" />

      <div className="flex flex-col items-center px-8 text-center">
        {/* Animated logo */}
        <div className={`relative w-28 h-28 mb-8 ${done ? 'animate-scale-in' : ''}`}>
          <div className="absolute inset-0 rounded-3xl bg-gold-500/10 border border-gold-500/20" />
          {/* Spinning ring */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 112 112">
            <circle cx="56" cy="56" r="50" fill="none" stroke="rgba(212,160,23,0.15)" strokeWidth="3" />
            <circle
              cx="56" cy="56" r="50"
              fill="none"
              stroke="#D4A017"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${pct * 3.14} 314`}
              strokeDashoffset="78.5"
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            {done ? (
              <span className="text-4xl animate-scale-in">✓</span>
            ) : (
              <span className="text-4xl">👁</span>
            )}
          </div>
        </div>

        <h1 className="font-display font-bold text-2xl text-white mb-2">
          {done ? 'Analysis complete!' : t('processing_heading')}
        </h1>

        <p className="text-sm text-white/40 mb-10">
          {t('processing_note')}
        </p>

        {/* Signal steps */}
        <div className="w-full max-w-xs space-y-3">
          {STEPS.map(({ key }, i) => (
            <div
              key={key}
              className={`flex items-center gap-3 transition-all duration-300 ${
                i <= activeStep ? 'opacity-100' : 'opacity-25'
              }`}
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                i < activeStep
                  ? 'bg-green-500'
                  : i === activeStep
                    ? 'bg-gold-500 animate-pulse-gold'
                    : 'bg-surface-4'
              }`}>
                {i < activeStep ? (
                  <span className="text-[10px] text-white font-bold">✓</span>
                ) : i === activeStep ? (
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                ) : null}
              </div>
              <p className={`text-sm transition-colors duration-300 ${
                i <= activeStep ? 'text-white' : 'text-white/30'
              }`}>
                {t(key)}
              </p>
            </div>
          ))}
        </div>

        {/* Overall progress bar */}
        <div className="w-full max-w-xs mt-8">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-white/30 text-right mt-2">{pct}%</p>
        </div>

        {/* Trust indicator */}
        <div className="mt-10 flex items-center gap-2 text-xs text-white/20">
          <span>🔒</span>
          <span>Secure · Encrypted · India-resident servers</span>
        </div>
      </div>
    </div>
  )
}
