import { useRef, useState, useCallback, useEffect } from 'react'
import { clsx } from 'clsx'
import type { CaptureType } from '../store/session'

export interface QualityResult {
  ok: boolean
  reasons: string[]
  score: number
}

// Simplified on-device quality check without OpenCV (pure canvas math)
// Phase 2 will swap in OpenCV.js
function evaluateSharpness(ctx: CanvasRenderingContext2D, w: number, h: number): number {
  const d = ctx.getImageData(0, 0, w, h).data
  let sum = 0, mean = 0
  for (let i = 0; i < d.length; i += 4) mean += d[i]
  mean /= (d.length / 4)
  for (let i = 0; i < d.length; i += 4) sum += Math.abs(d[i] - mean)
  return sum / (d.length / 4)
}

function evaluateExposure(ctx: CanvasRenderingContext2D, w: number, h: number): { mean: number; blown: number } {
  const d = ctx.getImageData(0, 0, w, h).data
  let sum = 0, blown = 0
  const n = d.length / 4
  for (let i = 0; i < d.length; i += 4) {
    const l = (d[i] + d[i + 1] + d[i + 2]) / 3
    sum += l
    if (l > 245) blown++
  }
  return { mean: sum / n, blown: blown / n }
}

function quickQualityCheck(canvas: HTMLCanvasElement): QualityResult {
  const ctx = canvas.getContext('2d')!
  const w = Math.min(canvas.width, 320)
  const h = Math.min(canvas.height, 240)
  // Draw scaled for perf
  const tmp = document.createElement('canvas')
  tmp.width = w; tmp.height = h
  tmp.getContext('2d')!.drawImage(canvas, 0, 0, w, h)
  const ctx2 = tmp.getContext('2d')!

  const reasons: string[] = []
  const sharpness = evaluateSharpness(ctx2, w, h)
  const { mean, blown } = evaluateExposure(ctx2, w, h)

  if (sharpness < 8) reasons.push('blurry')
  if (mean < 35)     reasons.push('dark')
  if (mean > 220)    reasons.push('bright')
  if (blown > 0.05)  reasons.push('bright')

  const score = Math.min(100, Math.round((sharpness / 25) * 80 + (blown < 0.01 ? 20 : 0)))

  return { ok: reasons.length === 0, reasons, score }
}

interface CameraProps {
  type: CaptureType
  onCapture: (blob: Blob, dataUrl: string) => void
  onError?: (err: string) => void
  facingMode?: 'environment' | 'user'
  isVideo?: boolean
  isAudio?: boolean
}

export function Camera({ type, onCapture, onError, facingMode = 'environment', isVideo, isAudio }: CameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mediaRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const [status, setStatus] = useState<'idle' | 'starting' | 'live' | 'recording' | 'done' | 'error'>('idle')
  const [quality, setQuality] = useState<QualityResult>({ ok: false, reasons: [], score: 0 })
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const qualityRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startCamera = useCallback(async () => {
    setStatus('starting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: isAudio || isVideo ? true : false,
      })
      mediaRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setStatus('live')

      // Start real-time quality checks every 500ms (photo modes only)
      if (!isVideo && !isAudio) {
        qualityRef.current = setInterval(() => {
          if (!videoRef.current || !canvasRef.current) return
          const v = videoRef.current
          const c = canvasRef.current
          c.width = v.videoWidth || 640
          c.height = v.videoHeight || 480
          c.getContext('2d')!.drawImage(v, 0, 0)
          setQuality(quickQualityCheck(c))
        }, 500)
      }
    } catch (e: any) {
      setStatus('error')
      onError?.('Camera access denied. Allow camera in browser settings.')
    }
  }, [facingMode, isVideo, isAudio, onError])

  const stopCamera = useCallback(() => {
    if (qualityRef.current) clearInterval(qualityRef.current)
    mediaRef.current?.getTracks().forEach(t => t.stop())
    mediaRef.current = null
  }, [])

  const capture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return
    const v = videoRef.current
    const c = canvasRef.current
    c.width = v.videoWidth; c.height = v.videoHeight
    c.getContext('2d')!.drawImage(v, 0, 0)
    c.toBlob(blob => {
      if (!blob) return
      const url = c.toDataURL('image/jpeg', 0.92)
      setCapturedUrl(url)
      setStatus('done')
      stopCamera()
      onCapture(blob, url)
    }, 'image/jpeg', 0.92)
  }, [stopCamera, onCapture])

  const startRecording = useCallback(() => {
    if (!mediaRef.current) return
    chunksRef.current = []
    const recorder = new MediaRecorder(mediaRef.current, {
      mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm'
    })
    recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' })
      const url = URL.createObjectURL(blob)
      setCapturedUrl(url)
      setStatus('done')
      stopCamera()
      onCapture(blob, url)
    }
    recorder.start(100)
    recorderRef.current = recorder
    setStatus('recording')
    setRecordingSeconds(0)
    const timer = setInterval(() => setRecordingSeconds(s => {
      if (s >= (isAudio ? 3 : 5) - 1) {
        clearInterval(timer)
        recorder.stop()
      }
      return s + 1
    }), 1000)
  }, [stopCamera, onCapture, isAudio])

  const retake = useCallback(() => {
    setCapturedUrl(null)
    setStatus('idle')
  }, [])

  // Demo mode: synthesize a mock capture (for hackathon demo without physical camera)
  const useDemoCapture = useCallback(() => {
    const tmp = document.createElement('canvas')
    tmp.width = 640; tmp.height = 853
    const ctx = tmp.getContext('2d')!

    // Background — white surface
    ctx.fillStyle = '#f5f0e8'
    ctx.fillRect(0, 0, 640, 853)

    // Shadow
    ctx.shadowColor = 'rgba(0,0,0,0.15)'
    ctx.shadowBlur = 30
    ctx.shadowOffsetY = 8

    // Gold bangle (ellipse)
    const grd = ctx.createRadialGradient(320, 420, 60, 320, 420, 160)
    grd.addColorStop(0, '#F5C842')
    grd.addColorStop(0.5, '#D4A017')
    grd.addColorStop(1, '#8B6300')
    ctx.strokeStyle = grd
    ctx.lineWidth = 38
    ctx.beginPath()
    ctx.ellipse(320, 420, 155, 110, 0, 0, Math.PI * 2)
    ctx.stroke()

    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0

    // Hallmark text on bangle
    ctx.fillStyle = '#1a0c00'
    ctx.font = 'bold 13px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('22K916', 320, 340)
    ctx.font = '11px monospace'
    ctx.fillText('BIS A3F2K1', 320, 356)

    // ₹10 coin (reference object)
    const coinX = 530, coinY = 700
    ctx.beginPath()
    ctx.arc(coinX, coinY, 42, 0, Math.PI * 2)
    ctx.fillStyle = '#c0c0c0'
    ctx.fill()
    ctx.strokeStyle = '#888'
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.fillStyle = '#555'
    ctx.font = 'bold 14px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('₹10', coinX, coinY + 5)

    // "27mm" label
    ctx.fillStyle = '#888'
    ctx.font = '10px sans-serif'
    ctx.fillText('27mm', coinX, coinY + 55)

    tmp.toBlob(blob => {
      if (!blob) return
      const url = tmp.toDataURL('image/jpeg', 0.92)
      setCapturedUrl(url)
      setStatus('done')
      onCapture(blob, url)
    }, 'image/jpeg', 0.92)
  }, [onCapture])

  // Stop camera on unmount
  useEffect(() => () => stopCamera(), [stopCamera])

  const maxSec = isAudio ? 3 : 5

  return (
    <div className="w-full">
      <canvas ref={canvasRef} className="hidden" />

      {status === 'idle' && (
        <div className="space-y-3">
          <button
            id={`camera-start-${type}`}
            onClick={startCamera}
            className="w-full camera-viewport flex flex-col items-center justify-center gap-4 cursor-pointer bg-surface-3 border border-white/10 rounded-3xl hover:border-gold-500/30 transition-all"
          >
            <div className="w-16 h-16 rounded-2xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
              <span className="text-3xl">{isAudio ? '🎤' : isVideo ? '🎬' : '📷'}</span>
            </div>
            <div className="text-center">
              <p className="font-display font-semibold text-white">Tap to {isAudio || isVideo ? 'record' : 'open camera'}</p>
              <p className="text-xs text-white/40 mt-1">{isVideo ? '5 second video' : isAudio ? '3 second audio' : 'Photo'}</p>
            </div>
          </button>
          {/* Demo mode — bypass camera for hackathon judges / testing */}
          {!isVideo && !isAudio && (
            <button
              id={`demo-capture-${type}`}
              onClick={useDemoCapture}
              className="w-full py-2.5 text-xs text-white/30 hover:text-white/60 transition-colors text-center border border-white/5 rounded-2xl hover:border-white/10"
            >
              📋 Use demo image (no camera needed)
            </button>
          )}
        </div>
      )}

      {(status === 'starting') && (
        <div className="camera-viewport flex items-center justify-center bg-black rounded-3xl">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-gold-400 border-t-transparent animate-spin" />
            <p className="text-sm text-white/50">Starting camera…</p>
          </div>
        </div>
      )}

      {(status === 'live' || status === 'recording') && (
        <div className="relative">
          <div className="camera-viewport rounded-3xl overflow-hidden">
            <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
            {/* Corner guides */}
            <div className="cam-overlay">
              <div className="cam-corner cam-corner-tl" />
              <div className="cam-corner cam-corner-tr" />
              <div className="cam-corner cam-corner-bl" />
              <div className="cam-corner cam-corner-br" />
            </div>
            {/* Recording indicator */}
            {status === 'recording' && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/80 backdrop-blur-sm">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span className="text-xs font-semibold text-white">
                  {recordingSeconds}/{maxSec}s
                </span>
              </div>
            )}
            {/* Progress bar during recording */}
            {status === 'recording' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                <div
                  className="h-full bg-red-500 transition-all duration-1000"
                  style={{ width: `${(recordingSeconds / maxSec) * 100}%` }}
                />
              </div>
            )}
          </div>

          {/* Quality indicator */}
          {!isVideo && !isAudio && (
            <div className={clsx(
              'absolute -bottom-1 left-4 right-4 py-2 px-4 rounded-b-2xl flex items-center justify-between text-xs font-medium',
              quality.ok
                ? 'bg-green-500/15 text-green-400 border border-green-500/20'
                : 'bg-red-500/15 text-red-400 border border-red-500/20'
            )}>
              <span>{quality.ok ? '✓ ' + 'Perfect shot' : '✗ ' + quality.reasons[0]}</span>
              <span>Score: {quality.score}/100</span>
            </div>
          )}

          {/* Capture / Record button */}
          <div className="flex justify-center mt-6">
            {isVideo || isAudio ? (
              status === 'live' ? (
                <button
                  id={`record-start-${type}`}
                  onClick={startRecording}
                  className="w-20 h-20 rounded-full bg-red-500 border-4 border-white/20 flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                >
                  <div className="w-7 h-7 rounded-sm bg-white" />
                </button>
              ) : (
                <div className="w-20 h-20 rounded-full bg-red-500 border-4 border-white/20 flex items-center justify-center shadow-lg">
                  <div className="w-5 h-5 rounded-full bg-white animate-pulse" />
                </div>
              )
            ) : (
              <button
                id={`capture-${type}`}
                onClick={capture}
                disabled={!quality.ok}
                className={clsx(
                  'w-20 h-20 rounded-full border-4 flex items-center justify-center shadow-lg transition-all',
                  quality.ok
                    ? 'bg-white border-gold-400/40 active:scale-90 shadow-gold'
                    : 'bg-surface-3 border-white/10 opacity-50 cursor-not-allowed'
                )}
              >
                <div className={clsx('w-14 h-14 rounded-full', quality.ok ? 'bg-white' : 'bg-surface-4')} />
              </button>
            )}
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="camera-viewport flex flex-col items-center justify-center gap-4 bg-red-500/5 border border-red-500/20 rounded-3xl">
          <span className="text-4xl">🚫</span>
          <div className="text-center px-4">
            <p className="font-semibold text-white mb-1">Camera unavailable</p>
            <p className="text-xs text-white/40">Allow camera access in browser settings, then tap retry.</p>
          </div>
          <button id={`camera-retry-${type}`} onClick={startCamera} className="btn-outline-gold">Retry</button>
        </div>
      )}

      {status === 'done' && capturedUrl && (
        <div className="relative">
          {isVideo ? (
            <video src={capturedUrl} controls className="w-full rounded-3xl" playsInline />
          ) : isAudio ? (
            <div className="camera-viewport flex flex-col items-center justify-center gap-4 bg-surface-2 rounded-3xl border border-green-500/20">
              <span className="text-4xl">🎵</span>
              <p className="font-semibold text-white">Audio recorded</p>
              <audio src={capturedUrl} controls className="w-48" />
            </div>
          ) : (
            <img src={capturedUrl} className="w-full rounded-3xl object-cover" style={{ aspectRatio: '3/4' }} alt="Captured" />
          )}
          <div className="absolute top-3 right-3">
            <span className="badge-green">✓ Captured</span>
          </div>
          <button
            id={`retake-${type}`}
            onClick={retake}
            className="mt-3 w-full btn-ghost text-sm"
          >
            Retake
          </button>
        </div>
      )}
    </div>
  )
}
