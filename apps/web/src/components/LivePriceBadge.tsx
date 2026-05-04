import { useEffect, useState } from 'react'
import { fetchGoldPrice, type GoldPriceData } from '../lib/goldPrice'

export function LivePriceBadge() {
  const [data, setData] = useState<GoldPriceData | null>(null)

  useEffect(() => {
    fetchGoldPrice().then(setData).catch(() => {})
  }, [])

  if (!data) return <div className="h-5 w-28 rounded-full bg-white/10 animate-pulse" />

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gold-500/15 text-gold-400">
      ₹{data.pricePerGram24k.toLocaleString('en-IN')}/gm · 24K
    </div>
  )
}
