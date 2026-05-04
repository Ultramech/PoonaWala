const GOLD_API_KEY = 'ae1f3e7e6228ea2b1aa0ef56f9019b68'
const TROY_OZ_TO_GRAMS = 31.1035

export interface GoldPriceData {
  pricePerGram: number
  pricePerOz: number
  change: number
  changePercent: number
  timestamp: number
}

let cached: { data: GoldPriceData; fetchedAt: number } | null = null
const CACHE_MS = 60_000

export async function fetchGoldPrice(): Promise<GoldPriceData> {
  if (cached && Date.now() - cached.fetchedAt < CACHE_MS) return cached.data

  const res = await fetch('https://www.goldapi.io/api/XAU/INR', {
    headers: { 'x-access-token': GOLD_API_KEY, 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error(`Gold API error: ${res.status}`)
  const json = await res.json()

  const pricePerOz: number = json.price ?? json.price_gram_24k * TROY_OZ_TO_GRAMS
  const pricePerGram = json.price_gram_24k ?? pricePerOz / TROY_OZ_TO_GRAMS

  const data: GoldPriceData = {
    pricePerGram: Math.round(pricePerGram),
    pricePerOz: Math.round(pricePerOz),
    change: json.ch ?? 0,
    changePercent: json.chp ?? 0,
    timestamp: json.timestamp ?? Date.now() / 1000,
  }
  cached = { data, fetchedAt: Date.now() }
  return data
}

export function calcLoanBand(weightG: number, purityKarat: number, pricePerGram24k: number) {
  const purityFactor = purityKarat / 24
  const goldValue = weightG * purityFactor * pricePerGram24k
  const ltv = goldValue < 250000 ? 0.65 : 0.75
  return {
    goldValue: Math.round(goldValue),
    loanLow: Math.round(goldValue * (ltv - 0.05)),
    loanHigh: Math.round(goldValue * ltv),
    ltv: Math.round(ltv * 100),
  }
}
