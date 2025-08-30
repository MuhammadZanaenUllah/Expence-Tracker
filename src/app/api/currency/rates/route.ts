import { NextRequest, NextResponse } from 'next/server'
import { fetchExchangeRates } from '@/lib/currency'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const baseCurrency = searchParams.get('base') || 'USD'
    const targetCurrencies = searchParams.get('currencies')?.split(',') || []

    // Fetch latest exchange rates
    const rates = await fetchExchangeRates()

    // If specific currencies are requested, filter the response
    if (targetCurrencies.length > 0) {
      const filteredRates: Record<string, number> = {}
      
      for (const currency of targetCurrencies) {
        if (rates[currency]) {
          // Calculate rate relative to base currency
          if (baseCurrency === 'USD') {
            filteredRates[currency] = rates[currency]
          } else {
            // Convert: base -> USD -> target
            const baseToUsd = 1 / rates[baseCurrency]
            filteredRates[currency] = baseToUsd * rates[currency]
          }
        }
      }
      
      return NextResponse.json({
        base: baseCurrency,
        rates: filteredRates,
        timestamp: Date.now()
      })
    }

    // Return all rates relative to base currency
    const adjustedRates: Record<string, number> = {}
    
    if (baseCurrency === 'USD') {
      // USD is our base, return rates as-is
      Object.assign(adjustedRates, rates)
    } else {
      // Convert all rates relative to the requested base currency
      const baseRate = rates[baseCurrency]
      if (!baseRate) {
        return NextResponse.json(
          { error: `Unsupported base currency: ${baseCurrency}` },
          { status: 400 }
        )
      }
      
      for (const [currency, rate] of Object.entries(rates)) {
        adjustedRates[currency] = rate / baseRate
      }
    }

    return NextResponse.json({
      base: baseCurrency,
      rates: adjustedRates,
      timestamp: Date.now()
    })
  } catch (error) {
    console.error('Error fetching exchange rates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch exchange rates' },
      { status: 500 }
    )
  }
}