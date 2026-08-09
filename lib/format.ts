export function money(amount: number, currency: 'USD' | 'NPR' = 'USD') {
  if (currency === 'NPR') return `रु ${amount.toLocaleString('en-IN')}`
  return `$${amount.toLocaleString('en-US')}`
}

export function formatDate(input: string | number, locale = 'en') {
  const d = typeof input === 'string' ? new Date(input + (input.length === 10 ? 'T00:00:00' : '')) : new Date(input)
  return d.toLocaleDateString(locale === 'ne' ? 'ne-NP' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(input: number, locale = 'en') {
  return new Date(input).toLocaleString(locale === 'ne' ? 'ne-NP' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}
