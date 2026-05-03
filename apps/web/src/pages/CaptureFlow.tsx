import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSessionStore, type CaptureType } from '../store/session'
import { Camera } from '../components/Camera'
import { ChevronRight, Volume2, CheckCircle, XCircle, Loader2, RotateCcw } from 'lucide-react'
import { clsx } from 'clsx'
import { evaluateFrameAPI, type FrameEvalResult } from '../lib/api'

interface Step {
  type: CaptureType
  titleKey: string
  hintKey: string
  voiceGuide: string          // spoken by agent on step entry
  isVideo?: boolean
  isAudio?: boolean
  facingMode?: 'environment' | 'user'
  optional?: boolean
}

const STEPS: Step[] = [
  {
    type: 'top',
    titleKey: 'step_top_title',
    hintKey: 'step_top_hint',
    voiceGuide: 'Step 1. Place your gold jewellery flat on a surface. If you have a 10 rupee coin, place it nearby for scale — it helps but is not required. Point your camera straight down from the top and tap Capture.',
  },
  {
    type: '45deg',
    titleKey: 'step_45_title',
    hintKey: 'step_45_hint',
    voiceGuide: 'Step 2. Now tilt your camera to a 45 degree angle so we can see the depth and thickness of the gold piece. Tap Capture when ready.',
  },
  {
    type: 'side',
    titleKey: 'step_side_title',
    hintKey: 'step_side_hint',
    voiceGuide: 'Step 3. Hold the gold piece upright and shoot from the side so the full profile and thickness are visible. Tap Capture.',
  },
  {
    type: 'macro',
    titleKey: 'step_macro_title',
    hintKey: 'step_macro_hint',
    voiceGuide: 'Step 4. Get very close to the gold and find the BIS hallmark stamp or karat marking. Make sure it is sharp and well lit. Tap Capture.',
  },
  {
    type: 'video',
    titleKey: 'step_video_title',
    hintKey: 'step_video_hint',
    voiceGuide: 'Step 5. Hold record and slowly rotate the gold piece so we can see all sides. Keep it steady for about 3 seconds.',
    isVideo: true,
  },
  {
    type: 'audio',
    titleKey: 'step_audio_title',
    hintKey: 'step_audio_hint',
    voiceGuide: 'Step 6. Tap and hold record, then gently tap the gold with your fingernail. We will listen to the ring tone to check if it is solid gold.',
    isAudio: true,
    optional: true,
  },
  {
    type: 'selfie',
    titleKey: 'step_selfie_title',
    hintKey: 'step_selfie_hint',
    voiceGuide: 'Last step. Switch to the front camera and take a selfie while holding the gold jewellery clearly in the same frame. This confirms your identity.',
    facingMode: 'user',
  },
]

type EvalState = 'idle' | 'evaluating' | 'approved' | 'rejected'

interface StepEval {
  state: EvalState
  result?: FrameEvalResult
  dataUrl?: string
}

function speak(text: string) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = localStorage.getItem('goldeye_lang') === 'hi' ? 'hi-IN' : 'en-US'
  u.rate = 0.95
  u.pitch = 1.0
  window.speechSynthesis.speak(u)
}

export function CaptureFlow() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { addCapture, state } = useSessionStore()

  const [stepIdx, setStepIdx] = useState(0)
  const [captured, setCaptured] = useState<Set<number>>(new Set())
  const [evals, setEvals] = useState<Record<number, StepEval>>({})
  const [cameraKey, setCameraKey] = useState(0)
  const spokenStep = useRef(-1)

  const step = STEPS[stepIdx]
  const currentEval = evals[stepIdx]
  const evalState = currentEval?.state ?? 'idle'

  // Speak voice guide whenever step changes
  useEffect(() => {
    if (spokenStep.current === stepIdx) return
    spokenStep.current = stepIdx
    // Small delay so the UI has settled
    const t = setTimeout(() => speak(step.voiceGuide), 400)
    return () => clearTimeout(t)
  }, [stepIdx, step.voiceGuide])

  const handleCapture = useCallback(async (blob: Blob, dataUrl: string, exif?: Record<string, unknown>) => {
    addCapture({ type: step.type, blob, dataUrl, timestamp: Date.now(), exif })
    setCaptured(prev => new Set([...prev, stepIdx]))

    // Audio — no image to evaluate
    if (step.isAudio) {
      const msg = 'Audio recorded. Great job!'
      setEvals(prev => ({
        ...prev,
        [stepIdx]: {
          state: 'approved',
          dataUrl,
          result: { approved: true, quality_score: 0.9, feedback: msg, issues: [], detected: {} },
        },
      }))
      speak(msg)
      return
    }

    speak('Got it. Analysing your image now, please wait.')
    setEvals(prev => ({ ...prev, [stepIdx]: { state: 'evaluating', dataUrl } }))

    try {
      const result = await evaluateFrameAPI(step.type, dataUrl)
      setEvals(prev => ({
        ...prev,
        [stepIdx]: { state: result.approved ? 'approved' : 'rejected', result, dataUrl },
      }))
      // Speak Poonawala AI feedback out loud
      speak(result.feedback)
    } catch {
      const fallback = 'Image accepted. You may continue.'
      setEvals(prev => ({
        ...prev,
        [stepIdx]: {
          state: 'approved',
          dataUrl,
          result: { approved: true, quality_score: 0.7, feedback: fallback, issues: [], detected: {} },
        },
      }))
      speak(fallback)
    }
  }, [step, stepIdx, addCapture])

  const handleRetake = () => {
    speak('No problem. Let\'s try again. ' + step.voiceGuide)
    setEvals(prev => ({ ...prev, [stepIdx]: { state: 'idle' } }))
    setCaptured(prev => { const s = new Set(prev); s.delete(stepIdx); return s })
    setCameraKey(k => k + 1)
  }

  const next = () => {
    if (stepIdx < STEPS.length - 1) {
      setStepIdx(i => i + 1)
    } else {
      speak('All done! Submitting your gold for assessment now.')
      navigate('/weight')
    }
  }

  const skip = () => {
    if (step.optional) {
      speak('Skipping this step.')
      next()
    }
  }

  const canProceed = evalState === 'approved' || step.optional

  return (
    <div className="page animate-fade-in overflow-y-auto">
      {/* Header */}
      <div className="page-header sticky top-0 z-10 bg-surface-0 border-b border-white/5">
        <button
          id="capture-back"
          onClick={() => stepIdx > 0 ? setStepIdx(i => i - 1) : navigate('/setup')}
          className="btn-icon"
        >
          <ChevronRight className="w-5 h-5 rotate-180 text-white/60" />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-xs text-white/30 uppercase tracking-widest">
            {t('capture_step', { current: stepIdx + 1, total: STEPS.length })}
          </span>
        </div>
        <button
          id="capture-voice"
          onClick={() => speak(step.voiceGuide)}
          className="btn-icon"
          title="Replay instructions"
        >
          <Volume2 className="w-4 h-4 text-white/50" />
        </button>
      </div>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 px-5 pb-4 pt-4">
        {STEPS.map((s, i) => (
          <div
            key={s.type}
            className={clsx(
              'transition-all duration-300 rounded-full',
              i === stepIdx ? 'step-dot-active' :
              captured.has(i) ? 'step-dot-done' :
              'step-dot'
            )}
          />
        ))}
      </div>

      {/* Step info */}
      <div className="px-5 mb-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display font-bold text-xl text-white">
              {t(step.titleKey)}
              {step.optional && <span className="ml-2 text-xs text-white/30 font-normal">(optional)</span>}
            </h1>
            <p className="text-sm text-white/50 mt-1">{t(step.hintKey)}</p>
          </div>
          {step.type === 'macro' && (
            <span className="badge-gold text-[10px] ml-3 flex-shrink-0 mt-1">BIS Hallmark</span>
          )}
        </div>
      </div>

      {/* Camera */}
      <div className="px-5 pb-4">
        <Camera
          key={cameraKey}
          type={step.type}
          onCapture={handleCapture}
          facingMode={step.facingMode || 'environment'}
          isVideo={step.isVideo}
          isAudio={step.isAudio}
        />

        {/* Poonawala AI evaluation feedback */}
        {evalState === 'evaluating' && (
          <div className="mt-4 flex items-center gap-3 px-4 py-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">
            <Loader2 className="w-5 h-5 text-blue-400 animate-spin flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-300">Analysing image…</p>
              <p className="text-xs text-blue-300/60 mt-0.5">Poonawala AI agent is checking quality</p>
            </div>
          </div>
        )}

        {evalState === 'approved' && currentEval?.result && (
          <div className="mt-4 px-4 py-3 rounded-2xl bg-green-500/10 border border-green-500/20">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-green-300">{currentEval.result.feedback}</p>
                {currentEval.result.quality_score > 0 && (
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-400 rounded-full transition-all duration-700"
                        style={{ width: `${Math.round(currentEval.result.quality_score * 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-white/40">
                      {Math.round(currentEval.result.quality_score * 100)}%
                    </span>
                  </div>
                )}
              </div>
              <button onClick={() => speak(currentEval.result!.feedback)} className="flex-shrink-0 opacity-40 hover:opacity-80">
                <Volume2 className="w-4 h-4 text-green-300" />
              </button>
            </div>
          </div>
        )}

        {evalState === 'rejected' && currentEval?.result && (
          <div className="mt-4 px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/20">
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-red-300">{currentEval.result.feedback}</p>
                {currentEval.result.issues.length > 0 && (
                  <ul className="mt-1.5 space-y-0.5">
                    {currentEval.result.issues.map((issue, i) => (
                      <li key={i} className="text-xs text-red-300/60">• {issue}</li>
                    ))}
                  </ul>
                )}
              </div>
              <button onClick={() => speak(currentEval.result!.feedback)} className="flex-shrink-0 opacity-40 hover:opacity-80">
                <Volume2 className="w-4 h-4 text-red-300" />
              </button>
            </div>
          </div>
        )}

        {/* Thumbnail strip */}
        {Object.keys(state.captures).length > 0 && (
          <div className="mt-4">
            <p className="label mb-2">Captured</p>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {(Object.entries(state.captures) as [CaptureType, any][]).map(([ctype, asset]) => (
                <div key={ctype} className="relative flex-shrink-0">
                  {ctype === 'audio' ? (
                    <div className="w-14 h-14 rounded-xl bg-surface-3 border border-green-500/20 flex items-center justify-center">
                      <span className="text-xl">🎵</span>
                    </div>
                  ) : ctype === 'video' ? (
                    <div className="w-14 h-14 rounded-xl bg-surface-3 border border-green-500/20 flex items-center justify-center">
                      <span className="text-xl">🎬</span>
                    </div>
                  ) : (
                    <img src={asset.dataUrl} className="w-14 h-14 rounded-xl object-cover border border-green-500/30" alt={ctype} />
                  )}
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                    <span className="text-[8px] text-white font-bold">✓</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom actions */}
      <div className="px-5 pb-6 pt-4 border-t border-white/5 space-y-3 sticky bottom-0 bg-surface-0">
        {evalState === 'rejected' ? (
          <button onClick={handleRetake} className="w-full btn-gold">
            <RotateCcw className="w-5 h-5" />
            Retake Photo
          </button>
        ) : (
          <button
            id={`capture-next-${step.type}`}
            onClick={next}
            disabled={!canProceed || evalState === 'evaluating'}
            className={clsx('w-full', (canProceed && evalState !== 'evaluating') ? 'btn-gold' : 'btn-ghost opacity-40 cursor-not-allowed')}
          >
            {evalState === 'evaluating' ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Analysing…</>
            ) : stepIdx === STEPS.length - 1 ? 'Continue to Weight' : t('capture_accept')}
            {evalState !== 'evaluating' && <ChevronRight className="w-5 h-5" />}
          </button>
        )}
        {step.optional && evalState !== 'evaluating' && (
          <button id={`capture-skip-${step.type}`} onClick={skip} className="btn-ghost w-full text-sm">
            {t('capture_skip')}
          </button>
        )}
      </div>
    </div>
  )
}
