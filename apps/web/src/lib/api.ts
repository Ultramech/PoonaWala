import type { AssessmentResult } from '../store/session'

export const apiBase = (import.meta.env.VITE_API_URL as string | undefined) ?? ''
const BASE = apiBase

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`${path} → ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
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
