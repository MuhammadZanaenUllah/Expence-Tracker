// Supported currencies with their symbols and names
export const SUPPORTED_CURRENCIES = {
  USD: { symbol: '$', name: 'US Dollar' },
  EUR: { symbol: '€', name: 'Euro' },
  GBP: { symbol: '£', name: 'British Pound' },
  JPY: { symbol: '¥', name: 'Japanese Yen' },
  CAD: { symbol: 'C$', name: 'Canadian Dollar' },
  AUD: { symbol: 'A$', name: 'Australian Dollar' },
  CHF: { symbol: 'CHF', name: 'Swiss Franc' },
  CNY: { symbol: '¥', name: 'Chinese Yuan' },
  INR: { symbol: '₹', name: 'Indian Rupee' },
  BRL: { symbol: 'R$', name: 'Brazilian Real' },
  PKR: { symbol: '₨', name: 'Pakistani Rupee' },
} as const

export type Currency = keyof typeof SUPPORTED_CURRENCIES

// Exchange rates cache (in a real app, this would be fetched from an API)
let exchangeRatesCache: Record<string, number> = {
  USD: 1, // Base currency
  EUR: 0.85,
  GBP: 0.73,
  JPY: 110.0,
  CAD: 1.25,
  AUD: 1.35,
  CHF: 0.92,
  CNY: 6.45,
  INR: 74.5,
  BRL: 5.2,
  PKR: 278.5,
}

let lastFetchTime = 0
const CACHE_DURATION = 60 * 60 * 1000 // 1 hour in milliseconds

/**
 * Fetch exchange rates from an external API
 */
export async function fetchExchangeRates(): Promise<Record<string, number>> {
  const now = Date.now()
  
  // Return cached rates if they're still fresh
  if (now - lastFetchTime < CACHE_DURATION) {
    return exchangeRatesCache
  }

  try {
    // In a real implementation, you would use a service like:
    // - https://api.exchangerate-api.com/v4/latest/USD
    // - https://openexchangerates.org/api/latest.json
    // - https://api.fixer.io/latest
    
    // For now, we'll simulate an API call with static rates
    await new Promise(resolve => setTimeout(resolve, 100)) // Simulate network delay
    
    // Update cache timestamp
    lastFetchTime = now
    
    return exchangeRatesCache
  } catch (error) {
    console.error('Failed to fetch exchange rates:', error)
    // Return cached rates on error
    return exchangeRatesCache
  }
}

/**
 * Convert amount from one currency to another
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency
): Promise<number> {
  if (fromCurrency === toCurrency) {
    return amount
  }

  const rates = await fetchExchangeRates()
  
  // Convert to USD first (base currency), then to target currency
  const usdAmount = amount / rates[fromCurrency]
  const convertedAmount = usdAmount * rates[toCurrency]
  
  return convertedAmount
}

/**
 * Format currency amount with proper symbol and locale
 */
export function formatCurrency(
  amount: number,
  currency: Currency,
  locale: string = 'en-US'
): string {
  const currencyInfo = SUPPORTED_CURRENCIES[currency]
  
  try {
    // Use Intl.NumberFormat for proper localization
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    
    return formatter.format(amount)
  } catch (error) {
    // Fallback to manual formatting if Intl.NumberFormat fails
    console.warn(`Failed to format currency ${currency}:`, error)
    return `${currencyInfo.symbol}${amount.toFixed(2)}`
  }
}

/**
 * Format currency amount with custom symbol (for display purposes)
 */
export function formatCurrencySimple(
  amount: number,
  currency: Currency
): string {
  const currencyInfo = SUPPORTED_CURRENCIES[currency]
  return `${currencyInfo.symbol}${amount.toFixed(2)}`
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: Currency): string {
  return SUPPORTED_CURRENCIES[currency].symbol
}

/**
 * Get currency name
 */
export function getCurrencyName(currency: Currency): string {
  return SUPPORTED_CURRENCIES[currency].name
}

/**
 * Get all supported currencies as options for select inputs
 */
export function getCurrencyOptions(): Array<{ value: Currency; label: string }> {
  return Object.entries(SUPPORTED_CURRENCIES).map(([code, info]) => ({
    value: code as Currency,
    label: `${code} - ${info.name}`,
  }))
}

/**
 * Validate if a currency code is supported
 */
export function isValidCurrency(currency: string): currency is Currency {
  return currency in SUPPORTED_CURRENCIES
}

/**
 * Convert multiple amounts to a target currency
 */
export async function convertMultipleCurrencies(
  amounts: Array<{ amount: number; fromCurrency: Currency }>,
  toCurrency: Currency
): Promise<number[]> {
  const rates = await fetchExchangeRates()
  
  return amounts.map(({ amount, fromCurrency }) => {
    if (fromCurrency === toCurrency) {
      return amount
    }
    
    // Convert to USD first, then to target currency
    const usdAmount = amount / rates[fromCurrency]
    return usdAmount * rates[toCurrency]
  })
}

/**
 * Get exchange rate between two currencies
 */
export async function getExchangeRate(
  fromCurrency: Currency,
  toCurrency: Currency
): Promise<number> {
  if (fromCurrency === toCurrency) {
    return 1
  }

  const rates = await fetchExchangeRates()
  
  // Calculate rate: from -> USD -> to
  const usdRate = 1 / rates[fromCurrency]
  const targetRate = rates[toCurrency]
  
  return usdRate * targetRate
}