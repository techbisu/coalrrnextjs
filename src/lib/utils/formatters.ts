export function formatINR(value: string | number): string {
  const n = typeof value === 'string' ? Number(value) : value
  if (isNaN(n)) return value as string
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n)
}

export function formatNumber(value: string | number, decimals = 2): string {
  const n = typeof value === 'string' ? Number(value) : value
  if (isNaN(n)) return value as string
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: decimals }).format(n)
}

export function timeAgo(val: string | number | null | undefined): string {
  if (!val) return 'Unknown'
  
  let d: number
  if (typeof val === 'number') {
    d = val > 1e11 ? val : val * 1000
  } else if (!isNaN(Number(val))) {
    const num = Number(val)
    d = num > 1e11 ? num : num * 1000
  } else {
    d = new Date(val).getTime()
  }

  if (isNaN(d)) return 'Unknown'

  const diff = Date.now() - d
  const sec = Math.floor(diff / 1000)
  if (sec < 0) return 'Just now'
  if (sec < 60) return `${sec}s ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.floor(hr / 24)
  return `${day}d ago`
}

export function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000)
}
