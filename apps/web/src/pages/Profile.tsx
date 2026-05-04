import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Shield, Globe, Bell, HelpCircle, LogOut, Check, ChevronDown } from 'lucide-react'
import { BottomNav } from '../components/BottomNav'
import { clsx } from 'clsx'
import { useTranslation } from 'react-i18next'

const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिंदी' },
  { code: 'mr', label: 'Marathi', native: 'मराठी' },
  { code: 'gu', label: 'Gujarati', native: 'ગુજરાતી' },
]

function SettingRow({ icon: Icon, label, value, onClick, danger = false }: {
  icon: React.ElementType
  label: string
  value?: string
  onClick?: () => void
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 py-4 border-b border-white/5 last:border-0 active:bg-white/3 transition-colors"
    >
      <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center', danger ? 'bg-red-500/10' : 'bg-white/5')}>
        <Icon className={clsx('w-4.5 h-4.5', danger ? 'text-red-400' : 'text-white/50')} />
      </div>
      <span className={clsx('flex-1 text-sm text-left', danger ? 'text-red-400' : 'text-white/80')}>{label}</span>
      {value && <span className="text-xs text-white/40 mr-2">{value}</span>}
      {!danger && <ChevronRight className="w-4 h-4 text-white/20 flex-shrink-0" />}
    </button>
  )
}

export function Profile() {
  const navigate = useNavigate()
  const { i18n } = useTranslation()
  const [showLangPicker, setShowLangPicker] = useState(false)
  const [currentLang, setCurrentLang] = useState(
    LANGUAGES.find(l => l.code === i18n.language) ?? LANGUAGES[0]
  )

  const changeLang = (lang: typeof LANGUAGES[0]) => {
    setCurrentLang(lang)
    i18n.changeLanguage(lang.code)
    setShowLangPicker(false)
  }

  return (
    <div className="min-h-screen bg-[#080C18] text-white pb-28 overflow-y-auto no-scrollbar">
      {/* Header */}
      <div className="bg-[#080C18]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-md mx-auto px-5 py-4">
          <p className="font-display font-bold text-white text-lg">Profile</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-5 pt-5 space-y-4">
        {/* User card */}
        <div className="bg-gradient-to-br from-[#141824] to-[#0F1520] border border-white/8 rounded-2xl p-5">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-poonawala-red to-red-700 flex items-center justify-center shadow-[0_0_20px_rgba(227,29,37,0.3)]">
                <span className="text-2xl font-display font-black text-white">GP</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-[#141824] flex items-center justify-center">
                <Check className="w-2.5 h-2.5 text-white" />
              </div>
            </div>
            <div>
              <p className="font-display font-bold text-white text-lg">Gold Applicant</p>
              <p className="text-sm text-white/50">+91 98765 43210</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-[10px] text-green-400 font-semibold">
                  KYC VERIFIED
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { val: '0', label: 'Active Loans' },
            { val: '0', label: 'Completed' },
            { val: '₹0', label: 'Total Borrowed' },
          ].map(({ val, label }) => (
            <div key={label} className="bg-[#141824] border border-white/6 rounded-xl p-3 text-center">
              <p className="font-display font-bold text-white text-lg">{val}</p>
              <p className="text-[10px] text-white/40 mt-0.5 leading-tight">{label}</p>
            </div>
          ))}
        </div>

        {/* Language picker */}
        <div className="bg-[#141824] border border-white/6 rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowLangPicker(!showLangPicker)}
            className="w-full flex items-center gap-4 p-4"
          >
            <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
              <Globe className="w-4 h-4 text-white/50" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm text-white/80">Language</p>
              <p className="text-xs text-white/40 mt-0.5">{currentLang.native}</p>
            </div>
            <ChevronDown className={clsx('w-4 h-4 text-white/30 transition-transform', showLangPicker && 'rotate-180')} />
          </button>

          {showLangPicker && (
            <div className="border-t border-white/5">
              {LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => changeLang(lang)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/3 transition-colors"
                >
                  <div>
                    <span className="text-sm text-white/80">{lang.label}</span>
                    <span className="text-xs text-white/40 ml-2">{lang.native}</span>
                  </div>
                  {currentLang.code === lang.code && <Check className="w-4 h-4 text-poonawala-red" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Settings */}
        <div className="bg-[#141824] border border-white/6 rounded-2xl px-4">
          <SettingRow icon={Bell} label="Notifications" value="On" />
          <SettingRow icon={Shield} label="Privacy & Security" />
          <SettingRow icon={HelpCircle} label="Help & Support" />
        </div>

        {/* About */}
        <div className="bg-[#141824] border border-white/6 rounded-2xl p-4">
          <p className="text-xs text-white/40 uppercase tracking-wider mb-3">About</p>
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-sm text-white/60">App Version</span>
              <span className="text-sm text-white/40">v1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-white/60">Powered by</span>
              <span className="text-sm text-white/40">Poonawala Fincorp</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-white/60">RBI License</span>
              <span className="text-sm text-green-400">Active</span>
            </div>
          </div>
        </div>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <span className="px-2.5 py-1 rounded-full bg-gold-500/10 border border-gold-500/20 text-[10px] text-gold-400 font-semibold">RBI REGULATED</span>
          <span className="px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] text-blue-400 font-semibold">DPDP 2023</span>
          <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-white/30">ISO 27001</span>
        </div>

        {/* Sign out */}
        <button
          onClick={() => navigate('/language')}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-red-500/20 text-red-400 text-sm"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>

      <BottomNav />
    </div>
  )
}
