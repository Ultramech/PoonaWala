import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSessionStore } from '../store/session'
import i18n from '../i18n'
import { Globe } from 'lucide-react'
import { clsx } from 'clsx'

const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
  // Phase 1 pilot languages (placeholders - to be enabled):
  { code: 'mr', label: 'Marathi', native: 'मराठी', flag: '🇮🇳', disabled: true },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்', flag: '🇮🇳', disabled: true },
  { code: 'te', label: 'Telugu', native: 'తెలుగు', flag: '🇮🇳', disabled: true },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ', flag: '🇮🇳', disabled: true },
  { code: 'gu', label: 'Gujarati', native: 'ગુજરાતી', flag: '🇮🇳', disabled: true },
  { code: 'bn', label: 'Bengali', native: 'বাংলা', flag: '🇮🇳', disabled: true },
  { code: 'pa', label: 'Punjabi', native: 'ਪੰਜਾਬੀ', flag: '🇮🇳', disabled: true },
  { code: 'ml', label: 'Malayalam', native: 'മലയാളം', flag: '🇮🇳', disabled: true },
  { code: 'or', label: 'Odia', native: 'ଓଡ଼ିଆ', flag: '🇮🇳', disabled: true },
  { code: 'as', label: 'Assamese', native: 'অসমীয়া', flag: '🇮🇳', disabled: true },
]

export function LanguagePicker() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { setLang, state } = useSessionStore()

  const select = (code: string) => {
    setLang(code)
    i18n.changeLanguage(code)
    navigate('/welcome')
  }

  return (
    <div className="page animate-fade-in">
      {/* Header */}
      <div className="flex flex-col items-center pt-16 pb-8 px-5">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gold-gradient flex items-center justify-center shadow-gold">
            <span className="text-2xl">👁</span>
          </div>
          <div>
            <h1 className="font-display font-bold text-xl text-gradient-gold leading-none">GoldEye</h1>
            <p className="text-xs text-white/40 mt-0.5">Gold Loan AI</p>
          </div>
        </div>

        <Globe className="w-8 h-8 text-gold-400 mb-4" />
        <h2 className="font-display font-bold text-2xl text-white text-center mb-2">
          {t('lang_picker_title')}
        </h2>
        <p className="text-sm text-white/50 text-center">
          {t('lang_picker_subtitle')}
        </p>
      </div>

      {/* Language grid */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-8">
        <div className="grid grid-cols-2 gap-3">
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              id={`lang-${lang.code}`}
              onClick={() => !lang.disabled && select(lang.code)}
              disabled={lang.disabled}
              className={clsx(
                'relative flex flex-col items-center gap-2 p-4 rounded-2xl border',
                'transition-all duration-200 touch-target',
                lang.disabled
                  ? 'opacity-30 cursor-not-allowed bg-surface-2 border-white/5'
                  : state.lang === lang.code
                    ? 'bg-gold-500/15 border-gold-400/50 shadow-gold-sm scale-[1.02]'
                    : 'bg-surface-2 border-white/8 hover:bg-surface-3 hover:border-white/15 active:scale-[0.97]'
              )}
            >
              <span className="text-3xl">{lang.flag}</span>
              <div className="text-center">
                <p className="font-display font-semibold text-sm text-white">{lang.native}</p>
                <p className="text-xs text-white/40">{lang.label}</p>
              </div>
              {lang.disabled && (
                <span className="absolute top-2 right-2 text-[9px] text-white/30 font-medium uppercase tracking-wide">
                  Soon
                </span>
              )}
              {state.lang === lang.code && !lang.disabled && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-gold-400" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
