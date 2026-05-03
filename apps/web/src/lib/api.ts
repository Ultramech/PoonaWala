import type { AssessmentResult } from '../store/session'

export const apiBase = (import.meta.env.VITE_API_URL as string | undefined) ?? ''
const BASE = apiBase

async function post<T>(path: string, body: unknown, timeoutMs = 25000): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText)
      throw new Error(`${path} → ${res.status}: ${text}`)
    }
    return res.json() as Promise<T>
  } finally {
    clearTimeout(timer)
  }
}

export interface SessionInitResponse {
  session_id: string
  created_at: string
  upload_url_prefix: string
}

export function initSessionAPI(lang: string, phone?: string): Promise<SessionInitResponse> {
  return post('/session/init', { lang, phone })
}

export function recordConsentAPI(sessionId: string): Promise<unknown> {
  return post('/session/consent', { session_id: sessionId, version: 'v1.0' })
}

export interface AssessRequest {
  session_id: string
  frames: string[]
  video?: string
  audio?: string
  selfie?: string
  weight_g?: number
  reference_object?: string
  lang?: string
  device_metadata?: Record<string, unknown>
}

export function assessAPI(req: AssessRequest): Promise<AssessmentResult> {
  return post('/api/assess', {
    reference_object: 'rs10_coin',
    ...req,
  })
}

export interface FrameEvalResult {
  approved: boolean
  quality_score: number
  feedback: string
  issues: string[]
  detected: Record<string, unknown>
}

// WebSocket-based evaluation (primary — avoids HTTP proxy timeouts)
function evaluateFrameWS(frameType: string, imageDataUrl: string): Promise<FrameEvalResult> {
  return new Promise((resolve, reject) => {
    const originUrl = BASE ? BASE : window.location.origin
    const wsUrl = new URL(originUrl)
    wsUrl.protocol = wsUrl.protocol === 'https:' ? 'wss:' : 'ws:'
    wsUrl.pathname = '/api/ws/evaluate-frame'

    let settled = false
    const ws = new WebSocket(wsUrl.toString())

    const timer = setTimeout(() => {
      if (!settled) { settled = true; ws.close(); reject(new Error('ws_timeout')) }
    }, 35000)

    ws.onopen = () => {
      ws.send(JSON.stringify({ frame_type: frameType, image_data_url: imageDataUrl }))
    }

    ws.onmessage = (event) => {
      clearTimeout(timer)
      if (settled) return
      settled = true
      try {
        resolve(JSON.parse(event.data) as FrameEvalResult)
      } catch { reject(new Error('ws_parse')) }
      ws.close()
    }

    ws.onerror = () => {
      clearTimeout(timer)
      if (!settled) { settled = true; reject(new Error('ws_error')) }
    }

    ws.onclose = () => {
      clearTimeout(timer)
      if (!settled) { settled = true; reject(new Error('ws_closed')) }
    }
  })
}

// HTTP POST fallback (works everywhere, slightly slower)
function evaluateFrameHTTP(frameType: string, imageDataUrl: string): Promise<FrameEvalResult> {
  return post('/api/evaluate-frame', {
    frame_type: frameType,
    image_data_url: imageDataUrl,
  }, 35000)
}

// Primary export: tries WS, falls back to HTTP
export async function evaluateFrameAPI(frameType: string, imageDataUrl: string): Promise<FrameEvalResult> {
  try {
    return await evaluateFrameWS(frameType, imageDataUrl)
  } catch {
    console.warn('[evaluateFrame] WebSocket failed, falling back to HTTP POST')
    return evaluateFrameHTTP(frameType, imageDataUrl)
  }
}

// ─── 2Factor.in OTP API ──────────────────────────────────
export interface OtpSendResponse {
  success: boolean
  message: string
  session_id?: string
  error?: string
}

export interface OtpVerifyResponse {
  success: boolean
  valid: boolean
  message: string
  error?: string
}

async function otpPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.json() as Promise<T>
}

export function sendOtpAPI(phone: string): Promise<OtpSendResponse> {
  return otpPost('/otp/send-otp', { phone })
}

export function verifyOtpAPI(sessionId: string, otp: string): Promise<OtpVerifyResponse> {
  return otpPost('/otp/verify-otp', { session_id: sessionId, otp })
}
