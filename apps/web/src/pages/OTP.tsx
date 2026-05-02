import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSessionStore } from '../store/session'
import { ChevronRight, Phone, ArrowRight } from 'lucide-react'
import { clsx } from 'clsx'

export function OTP() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { setPhone } = useSessionStore()

  const [phone, setPhoneLocal] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [sending, setSending] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const refs = useRef<(HTMLInputElement | null)[]>([])

  const sendOTP = async () => {
    if (phone.length !== 10) return
    setSending(true)
    // Simulate OTP send (real integration: MSG91 / Fast2SMS)
    await new Promise(r => setTimeout(r, 1000))
    setSending(false)
    setStep('otp')
    setCountdown(30)
    const timer = setInterval(() => setCountdown(c => { if (c <= 1) { clearInterval(timer); return 0 } return c - 1 }), 1000)
  }

  const handleOtpChange = (i: number, v: string) => {
    if (!/^\d*$/.test(v)) return
    const next = [...otp]
    next[i] = v.slice(-1)
    setOtp(next)
    if (v && i < 5) refs.current[i + 1]?.focus()
  }

  const handleOtpKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) refs.current[i - 1]?.focus()
  }

  const verify = () => {
    const code = otp.join('')
    if (code.length !== 6) return
    // For hackathon MVP: accept any 6-digit code
    setPhone(phone)
    navigate('/setup')
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
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-5">
            <Phone className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="font-display font-bold text-2xl text-white text-center mb-2">
            {t('otp_heading')}
          </h1>
          <p className="text-sm text-white/50 text-center">{t('otp_body')}</p>
        </div>

        {step === 'phone' ? (
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
                  onChange={e => setPhoneLocal(e.target.value.replace(/\D/g, '').slice(0, 10))}
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
              {sending ? t('loading') : t('otp_send')}
              {!sending && <ArrowRight className="w-5 h-5" />}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-white/50 text-center mb-4">
              Sent to +91 {phone}
            </p>
            <div className="flex gap-2 justify-center">
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
                  className={clsx(
                    'w-12 h-14 text-center text-xl font-mono font-bold rounded-2xl',
                    'bg-surface-3 border transition-all duration-200 outline-none',
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
              disabled={otp.join('').length !== 6}
              className="btn-gold w-full mt-4"
            >
              {t('otp_verify')}
            </button>
            <button
              id="resend-otp"
              onClick={sendOTP}
              disabled={countdown > 0}
              className="btn-ghost w-full text-sm"
            >
              {countdown > 0 ? t('otp_resend', { seconds: countdown }) : 'Resend OTP'}
            </button>
          </div>
        )}

        {/* Demo skip */}
        <div className="mt-8 pt-6 border-t border-white/5">
          <button id="otp-skip" onClick={skipDemo} className="w-full text-center text-sm text-white/30 hover:text-white/60 transition-colors py-3">
            {t('otp_skip')} →
          </button>
        </div>
      </div>
    </div>
  )
}
