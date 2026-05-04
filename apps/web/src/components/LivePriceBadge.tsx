import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { fetchGoldPrice, type GoldPriceData } from '../lib/goldPrice'
import { clsx } from 'clsx'

export function LivePriceBadge() {
  const [data, setData] = useState<GoldPriceData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGoldPrice()
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="h-5 w-28 rounded-full bg-white/10 animate-pulse" />
  )
  if (!data) return null

  const up = data.changePercent >= 0
  return (
    <div className={clsx(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold',
      up ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'
    )}>
      {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {up ? '+' : ''}{data.changePercent.toFixed(2)}% today
    </div>
  )
}
