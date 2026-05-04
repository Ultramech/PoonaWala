import { useLocation, useNavigate } from 'react-router-dom'
import { Home, Calculator, Camera, Clock, User } from 'lucide-react'
import { clsx } from 'clsx'

const TABS = [
  { path: '/home', icon: Home, label: 'Home' },
  { path: '/estimate', icon: Calculator, label: 'Estimate' },
  { path: '/apply', icon: Camera, label: 'Apply', primary: true },
  { path: '/history', icon: Clock, label: 'History' },
  { path: '/profile', icon: User, label: 'Profile' },
]

export function BottomNav() {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <div className="w-full max-w-md pointer-events-auto">
        <div className="mx-3 mb-3 bg-surface-1/90 backdrop-blur-xl border border-white/10 rounded-3xl px-2 py-2 flex items-center justify-around shadow-[0_-4px_32px_rgba(0,0,0,0.5)]">
          {TABS.map(({ path, icon: Icon, label, primary }) => {
            const active = pathname === path || (path === '/home' && pathname === '/')
            if (primary) {
              return (
                <button
                  key={path}
                  onClick={() => navigate('/consent')}
                  className="flex flex-col items-center gap-1 -mt-6"
                >
                  <div className="w-14 h-14 rounded-2xl bg-poonawala-red flex items-center justify-center shadow-[0_4px_20px_rgba(227,29,37,0.5)] active:scale-95 transition-transform">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-[10px] text-white/50">{label}</span>
                </button>
              )
            }
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="flex flex-col items-center gap-1 px-2 py-1 rounded-2xl transition-colors"
              >
                <div className={clsx(
                  'w-10 h-10 rounded-xl flex items-center justify-center transition-all',
                  active ? 'bg-poonawala-red/15' : 'bg-transparent'
                )}>
                  <Icon className={clsx('w-5 h-5 transition-colors', active ? 'text-poonawala-red' : 'text-white/40')} />
                </div>
                <span className={clsx('text-[10px] transition-colors', active ? 'text-poonawala-red font-medium' : 'text-white/40')}>
                  {label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
