import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSessionStore, type CaptureType } from '../store/session'
import { Camera } from '../components/Camera'
import { ChevronRight, Volume2 } from 'lucide-react'
import { clsx } from 'clsx'

interface Step {
  type: CaptureType
  titleKey: string
  hintKey: string
  isVideo?: boolean
  isAudio?: boolean
  facingMode?: 'environment' | 'user'
  optional?: boolean
}

const STEPS: Step[] = [
  { type: 'top',    titleKey: 'step_top_title',    hintKey: 'step_top_hint' },
  { type: '45deg', titleKey: 'step_45_title',     hintKey: 'step_45_hint' },
  { type: 'side',   titleKey: 'step_side_title',   hintKey: 'step_side_hint' },
  { type: 'macro',  titleKey: 'step_macro_title',  hintKey: 'step_macro_hint' },
  { type: 'video',  titleKey: 'step_video_title',  hintKey: 'step_video_hint',  isVideo: true },
  { type: 'audio',  titleKey: 'step_audio_title',  hintKey: 'step_audio_hint',  isAudio: true, optional: true },
  { type: 'selfie', titleKey: 'step_selfie_title', hintKey: 'step_selfie_hint', facingMode: 'user' },
]

export function CaptureFlow() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { addCapture, state } = useSessionStore()

  const [stepIdx, setStepIdx] = useState(0)
  const [captured, setCaptured] = useState<Set<number>>(new Set())

  const step = STEPS[stepIdx]
  const progress = (Object.keys(state.captures).length / STEPS.length) * 100

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.lang = localStorage.getItem('goldeye_lang') === 'hi' ? 'hi-IN' : 'en-IN'
      window.speechSynthesis.speak(u)
    }
  }

  const handleCapture = (blob: Blob, dataUrl: string) => {
    addCapture({ type: step.type, blob, dataUrl, timestamp: Date.now() })
    setCaptured(prev => new Set([...prev, stepIdx]))
  }

  const next = () => {
    if (stepIdx < STEPS.length - 1) {
      setStepIdx(i => i + 1)
      speak(t(STEPS[stepIdx + 1].hintKey))
    } else {
      navigate('/weight')
    }
  }

  const skip = () => {
    if (step.optional) next()
  }

  const canProceed = captured.has(stepIdx) || step.optional

  return (
    <div className="page animate-fade-in">
      {/* Header */}
      <div className="page-header">
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
          onClick={() => speak(t(step.hintKey))}
          className="btn-icon"
        >
          <Volume2 className="w-4 h-4 text-white/50" />
        </button>
      </div>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 px-5 pb-4">
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
            <span className="badge-gold text-[10px] ml-3 flex-shrink-0 mt-1">
              BIS Hallmark
            </span>
          )}
        </div>
      </div>

      {/* Camera */}
      <div className="flex-1 px-5 pb-4 overflow-y-auto no-scrollbar">
        <Camera
          type={step.type}
          onCapture={handleCapture}
          facingMode={step.facingMode || 'environment'}
          isVideo={step.isVideo}
          isAudio={step.isAudio}
        />

        {/* Thumbnail strip — all captured so far */}
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
                    <img
                      src={asset.dataUrl}
                      className="w-14 h-14 rounded-xl object-cover border border-green-500/30"
                      alt={ctype}
                    />
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
      <div className="px-5 pb-6 pt-4 border-t border-white/5 space-y-3">
        <button
          id={`capture-next-${step.type}`}
          onClick={next}
          disabled={!canProceed}
          className={clsx('w-full', canProceed ? 'btn-gold' : 'btn-ghost opacity-40 cursor-not-allowed')}
        >
          {stepIdx === STEPS.length - 1 ? 'Continue to Weight' : t('capture_accept')}
          <ChevronRight className="w-5 h-5" />
        </button>
        {step.optional && (
          <button id={`capture-skip-${step.type}`} onClick={skip} className="btn-ghost w-full text-sm">
            {t('capture_skip')}
          </button>
        )}
      </div>
    </div>
  )
}
