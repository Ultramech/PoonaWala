import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSessionStore } from '../store/session'
import { ChevronRight, Phone, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react'
import { clsx } from 'clsx'
import { sendOtpAPI, verifyOtpAPI } from '../lib/api'

export function OTP() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { setPhone } = useSessionStore()

  const [phone, setPhoneLocal] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [step, setStep] = useState<'phone' | 'otp' | 'verified'>('phone')
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [error, setError] = useState('')
  const [sessionId, setSessionId] = useState('')   // 2Factor session
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startCountdown = () => {
    setCountdown(30)
    if (countdownRef.current) clearInterval(countdownRef.current)
    countdownRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(countdownRef.current!); return 0 }
        return c - 1
      })
    }, 1000)
  }

  const sendOTP = async () => {
    if (phone.length !== 10) return
    setError('')
    setSending(true)
    try {
      const res = await sendOtpAPI(phone)
      if (!res.success) throw new Error(res.error || 'Failed to send OTP')
      setSessionId(res.session_id || '')
      setStep('otp')
      startCountdown()
      setTimeout(() => refs.current[0]?.focus(), 100)
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP')
    } finally {
      setSending(false)
    }
  }

  const handleOtpChange = (i: number, v: string) => {
    if (!/^\d*$/.test(v)) return
    const next = [...otp]
    next[i] = v.slice(-1)
    setOtp(next)
    if (v && i < 5) refs.current[i + 1]?.focus()
    // Auto-verify on 6 digits
    const code = next.join('')
    if (code.length === 6) verifyCode(code)
  }

  const handleOtpKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) refs.current[i - 1]?.focus()
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (text.length >= 4) {
      e.preventDefault()
      const next = text.split('').concat(Array(6 - text.length).fill(''))
      setOtp(next.slice(0, 6))
      if (text.length === 6) verifyCode(text)
    }
  }

  const verifyCode = async (code: string) => {
    if (!sessionId) { setError('No session — resend OTP'); return }
    setError('')
    setVerifying(true)
    try {
      const res = await verifyOtpAPI(sessionId, code)
      if (!res.success || !res.valid) {
        throw new Error(res.message || 'Invalid or expired OTP')
      }
      setStep('verified')
      setPhone(phone)
      setTimeout(() => navigate('/setup'), 1500)
    } catch (err: any) {
      setError(err.message || 'Verification failed')
      setOtp(['', '', '', '', '', ''])
      setTimeout(() => refs.current[0]?.focus(), 100)
    } finally {
      setVerifying(false)
    }
  }

  const verify = () => {
    const code = otp.join('')
    if (code.length !== 6) return
    verifyCode(code)
  }

  const skipDemo = () => {
    setPhone('demo')
    navigate('/setup')
  }

  return (
    <div className="page animate-slide-up">
      <div className="page-header">
        <button id="otp-back" onClick={() => navigate('/consent')} className="btn-icon">
          <ChevronRight className="w-5 h-5 rotate-180 text-white/60" />
        </button>
        <span className="text-xs text-white/30 uppercase tracking-widest">Verification</span>
        <div className="w-12" />
      </div>

      <div className="flex-1 px-5 pt-8">
        <div className="flex flex-col items-center mb-10">
          <div className={clsx(
            'w-16 h-16 rounded-2xl border flex items-center justify-center mb-5 transition-all duration-500',
            step === 'verified'
              ? 'bg-green-500/10 border-green-500/20'
              : 'bg-poonawala-red/10 border-poonawala-red/20'
          )}>
            {step === 'verified'
              ? <CheckCircle className="w-8 h-8 text-green-400" />
              : <Phone className="w-8 h-8 text-poonawala-red" />
            }
          </div>
          <h1 className="font-display font-bold text-2xl text-white text-center mb-2">
            {step === 'verified' ? 'Verified!' : t('otp_heading')}
          </h1>
          <p className="text-sm text-white/50 text-center">
            {step === 'verified'
              ? `+91 ${phone} confirmed`
              : step === 'otp'
                ? `Enter the 6-digit code sent to +91 ${phone}`
                : t('otp_body')}
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 mb-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-slide-up">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Phone input */}
        {step === 'phone' && (
          <div className="space-y-4">
            <div>
              <label className="label mb-2 block">{t('otp_placeholder')}</label>
              <div className="flex gap-2">
                <div className="flex items-center justify-center px-4 rounded-2xl bg-surface-3 border border-white/10 text-white/50 text-sm font-mono">
                  +91
                </div>
                <input
                  id="phone-input"
                  type="tel"
                  value={phone}
                  onChange={e => { setPhoneLocal(e.target.value.replace(/\D/g, '').slice(0, 10)); setError('') }}
                  onKeyDown={e => { if (e.key === 'Enter') sendOTP() }}
                  placeholder="98765 43210"
                  className="input-field flex-1 font-mono tracking-widest"
                  inputMode="numeric"
                  autoFocus
                />
              </div>
            </div>
            <button
              id="send-otp"
              onClick={sendOTP}
              disabled={phone.length !== 10 || sending}
              className="btn-gold w-full"
            >
              {sending ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-black/20 border-t-black animate-spin" />
                  Sending OTP…
                </span>
              ) : (
                <>
                  {t('otp_send')}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        )}

        {/* OTP input */}
        {step === 'otp' && (
          <div className="space-y-4">
            <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  id={`otp-digit-${i}`}
                  ref={el => refs.current[i] = el}
                  type="text"
                  inputMode="numeric"
                  value={digit}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKey(i, e)}
                  maxLength={1}
                  disabled={verifying}
                  className={clsx(
                    'w-12 h-14 text-center text-xl font-mono font-bold rounded-2xl',
                    'bg-surface-3 border transition-all duration-200 outline-none',
                    verifying ? 'opacity-50' : '',
                    digit
                      ? 'border-gold-400/60 text-gold-300 shadow-gold-sm'
                      : 'border-white/10 text-white'
                  )}
                />
              ))}
            </div>
            <button
              id="verify-otp"
              onClick={verify}
              disabled={otp.join('').length !== 6 || verifying}
              className="btn-gold w-full mt-4"
            >
              {verifying ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-black/20 border-t-black animate-spin" />
                  Verifying…
                </span>
              ) : (
                t('otp_verify')
              )}
            </button>
            <button
              id="resend-otp"
              onClick={sendOTP}
              disabled={countdown > 0 || sending}
              className="btn-ghost w-full text-sm"
            >
              {sending ? 'Sending…' : countdown > 0 ? t('otp_resend', { seconds: countdown }) : 'Resend OTP'}
            </button>
            <button
              onClick={() => { setStep('phone'); setOtp(['', '', '', '', '', '']); setError('') }}
              className="btn-ghost w-full text-sm text-white/30"
            >
              ← Change number
            </button>
          </div>
        )}

        {/* Success */}
        {step === 'verified' && (
          <div className="flex flex-col items-center py-8 animate-slide-up">
            <div className="w-20 h-20 rounded-full bg-green-500/10 border-2 border-green-500 flex items-center justify-center mb-4">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            <p className="text-white/50 text-sm">Redirecting to setup…</p>
          </div>
        )}

        {step !== 'verified' && (
          <div className="mt-8 pt-6 border-t border-white/5">
            <button id="otp-skip" onClick={skipDemo} className="w-full text-center text-sm text-white/30 hover:text-white/60 transition-colors py-3">
              {t('otp_skip')} →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
