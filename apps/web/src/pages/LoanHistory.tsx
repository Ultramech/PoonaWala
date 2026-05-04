import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Clock, Zap, User, AlertTriangle, Camera, Search } from 'lucide-react'
import { apiBase } from '../lib/api'
import { BottomNav } from '../components/BottomNav'
import { clsx } from 'clsx'

interface SessionSummary {
  session_id: string
  phone: string | null
  status: string
  created_at: string
  confidence_score: number | null
  routing: string | null
}

const ROUTING_CONFIG = {
  INSTANT: { label: 'Pre-Approved', icon: Zap, bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20' },
  AGENT: { label: 'Agent Visit', icon: User, bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  RECAPTURE: { label: 'Retake Photo', icon: Camera, bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20' },
  REJECT: { label: 'Rejected', icon: AlertTriangle, bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours}h ago`
  if (hours < 48) return 'Yesterday'
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function LoanHistory() {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('ALL')

  useEffect(() => {
    fetch(`${apiBase}/api/dashboard/sessions`)
      .then(r => r.json())
      .then(data => { setSessions(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filters = ['ALL', 'INSTANT', 'AGENT', 'REJECT']
  const filtered = filter === 'ALL' ? sessions : sessions.filter(s => s.routing === filter)

  return (
    <div className="min-h-screen bg-[#080C18] text-white pb-28 overflow-y-auto no-scrollbar">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#080C18]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-md mx-auto px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-display font-bold text-white text-lg">Loan History</p>
              <p className="text-xs text-white/40">{sessions.length} applications</p>
            </div>
            <button className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Search className="w-4 h-4 text-white/40" />
            </button>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {filters.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={clsx(
                  'px-3 py-1.5 rounded-xl text-xs font-medium flex-shrink-0 transition-all',
                  filter === f
                    ? 'bg-poonawala-red text-white'
                    : 'bg-white/5 text-white/50 border border-white/8'
                )}
              >
                {f === 'ALL' ? 'All' : ROUTING_CONFIG[f as keyof typeof ROUTING_CONFIG]?.label ?? f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-5 pt-4 space-y-3">
        {loading && (
          <>
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse" />
            ))}
          </>
        )}

        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-white/20" />
            </div>
            <p className="text-white/60 font-medium mb-1">No applications yet</p>
            <p className="text-xs text-white/30">Your gold loan history will appear here</p>
            <button
              onClick={() => navigate('/consent')}
              className="mt-6 px-6 py-3 rounded-2xl bg-poonawala-red text-white text-sm font-semibold"
            >
              Apply for a Loan
            </button>
          </div>
        )}

        {!loading && filtered.map(session => {
          const routing = session.routing as keyof typeof ROUTING_CONFIG | null
          const cfg = routing ? ROUTING_CONFIG[routing] : null
          const Icon = cfg?.icon ?? Clock

          return (
            <button
              key={session.session_id}
              onClick={() => navigate(`/dashboard/session/${session.session_id}`)}
              className="w-full text-left bg-[#141824] border border-white/6 rounded-2xl p-4 flex items-center gap-4 active:scale-[0.98] transition-transform hover:border-white/10"
            >
              <div className={clsx(
                'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0',
                cfg?.bg ?? 'bg-white/5'
              )}>
                <Icon className={clsx('w-5 h-5', cfg?.text ?? 'text-white/40')} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-white/50 truncate">
                    #{session.session_id.split('-')[0].toUpperCase()}
                  </span>
                  {cfg && (
                    <span className={clsx(
                      'text-[10px] font-semibold px-2 py-0.5 rounded-full border',
                      cfg.bg, cfg.text, cfg.border
                    )}>
                      {cfg.label}
                    </span>
                  )}
                </div>
                <p className="text-xs text-white/40">{formatDate(session.created_at)}</p>
                {session.phone && (
                  <p className="text-xs text-white/30 mt-0.5">{session.phone}</p>
                )}
              </div>

              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                {session.confidence_score !== null && (
                  <div className="text-right">
                    <p className="text-[10px] text-white/30">Confidence</p>
                    <p className={clsx(
                      'text-sm font-bold',
                      session.confidence_score >= 0.75 ? 'text-green-400' :
                      session.confidence_score >= 0.55 ? 'text-yellow-400' : 'text-orange-400'
                    )}>
                      {Math.round(session.confidence_score * 100)}%
                    </p>
                  </div>
                )}
                <ChevronRight className="w-4 h-4 text-white/20" />
              </div>
            </button>
          )
        })}

        {!loading && sessions.length > 0 && (
          <p className="text-center text-xs text-white/20 py-2">
            Showing {filtered.length} of {sessions.length} applications
          </p>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
