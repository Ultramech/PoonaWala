import { useLocation, useNavigate } from 'react-router-dom'
import { Home, Calculator, Camera, User } from 'lucide-react'
import { clsx } from 'clsx'

const SIDE_TABS = [
  { path: '/home', icon: Home, label: 'Home' },
  { path: '/estimate', icon: Calculator, label: 'Estimate' },
]
const SIDE_TABS_RIGHT = [
  { path: '/profile', icon: User, label: 'Profile' },
]

export function BottomNav() {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const isActive = (p: string) => pathname === p

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <div className="w-full max-w-md pointer-events-auto">
        <div className="mx-4 mb-4 bg-[#111827]/90 backdrop-blur-xl border border-white/10 rounded-3xl px-4 py-2 flex items-center justify-between shadow-[0_-4px_40px_rgba(0,0,0,0.6)]">

          {/* Left tabs */}
          <div className="flex gap-1">
            {SIDE_TABS.map(({ path, icon: Icon, label }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="flex flex-col items-center gap-0.5 px-4 py-2 rounded-2xl transition-all"
              >
                <div className={clsx(
                  'w-10 h-9 rounded-xl flex items-center justify-center transition-all',
                  isActive(path) ? 'bg-poonawala-red/15' : ''
                )}>
                  <Icon className={clsx('w-5 h-5', isActive(path) ? 'text-poonawala-red' : 'text-white/35')} />
                </div>
                <span className={clsx('text-[10px]', isActive(path) ? 'text-poonawala-red font-semibold' : 'text-white/35')}>
                  {label}
                </span>
              </button>
            ))}
          </div>

          {/* Center Apply button */}
          <button
            onClick={() => navigate('/consent')}
            className="flex flex-col items-center gap-0.5 -mt-5"
          >
            <div className="w-14 h-14 rounded-2xl bg-poonawala-red flex items-center justify-center shadow-[0_4px_24px_rgba(227,29,37,0.55)] active:scale-95 transition-transform border border-red-400/20">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <span className="text-[10px] text-white/40 mt-0.5">Apply</span>
          </button>

          {/* Right tabs */}
          <div className="flex gap-1">
            {/* Placeholder to balance layout */}
            <div className="w-[72px]" />
            {SIDE_TABS_RIGHT.map(({ path, icon: Icon, label }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="flex flex-col items-center gap-0.5 px-4 py-2 rounded-2xl transition-all"
              >
                <div className={clsx(
                  'w-10 h-9 rounded-xl flex items-center justify-center transition-all',
                  isActive(path) ? 'bg-poonawala-red/15' : ''
                )}>
                  <Icon className={clsx('w-5 h-5', isActive(path) ? 'text-poonawala-red' : 'text-white/35')} />
                </div>
                <span className={clsx('text-[10px]', isActive(path) ? 'text-poonawala-red font-semibold' : 'text-white/35')}>
                  {label}
                </span>
              </button>
            ))}
          </div>

        </div>
      </div>
    </nav>
  )
}
