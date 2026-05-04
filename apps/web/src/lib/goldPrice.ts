const API_KEY = import.meta.env.VITE_METAL_API_KEY as string
const TROY_OZ_TO_GRAMS = 31.1035

export interface GoldPriceData {
  pricePerGram24k: number
  pricePerGram22k: number
  pricePerGram18k: number
  usdPerOz: number
  inrPerUsd: number
  timestamp: number
}

let cached: { data: GoldPriceData; fetchedAt: number } | null = null
const CACHE_MS = 60_000

export async function fetchGoldPrice(): Promise<GoldPriceData> {
  if (cached && Date.now() - cached.fetchedAt < CACHE_MS) return cached.data

  const res = await fetch(
    `https://api.metalpriceapi.com/v1/latest?api_key=${API_KEY}&base=USD&currencies=XAU,INR`
  )
  if (!res.ok) throw new Error(`Metal API ${res.status}`)
  const json = await res.json()
  if (!json.success) throw new Error('Metal API returned success=false')

  const { XAU, INR } = json.rates as { XAU: number; INR: number }
  // XAU = oz per USD, INR = INR per USD
  const inrPerOz = INR / XAU
  const pricePerGram24k = Math.round(inrPerOz / TROY_OZ_TO_GRAMS)

  const data: GoldPriceData = {
    pricePerGram24k,
    pricePerGram22k: Math.round(pricePerGram24k * (22 / 24)),
    pricePerGram18k: Math.round(pricePerGram24k * (18 / 24)),
    usdPerOz: Math.round(INR / XAU / INR * 100) / 100,
    inrPerUsd: Math.round(INR * 100) / 100,
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
