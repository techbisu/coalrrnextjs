import { appConfig } from '@/core/config/app.config'

/**
 * Format a Date, string, or timestamp into IST (Asia/Kolkata) locale string.
 * Output format: e.g. "21/08/2026, 11:25:00 AM"
 */
export function formatDateTimeIST(
  dateInput: Date | string | number | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateInput) return '—'
  const date = typeof dateInput === 'object' ? dateInput : new Date(dateInput)
  if (isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat('en-IN', {
    timeZone: appConfig.timeZone,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    ...options,
  }).format(date)
}

/**
 * Format a Date, string, or timestamp into IST (Asia/Kolkata) date-only string.
 * Output format: e.g. "21/08/2026"
 */
export function formatDateIST(
  dateInput: Date | string | number | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateInput) return '—'
  const date = typeof dateInput === 'object' ? dateInput : new Date(dateInput)
  if (isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat('en-IN', {
    timeZone: appConfig.timeZone,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...options,
  }).format(date)
}

/**
 * Convert BigInt epoch seconds or epoch ms to formatted IST string.
 */
export function formatEpochIST(
  epochInput: bigint | number | null | undefined
): string {
  if (epochInput == null) return '—'
  const num = Number(epochInput)
  if (isNaN(num)) return '—'
  // If epoch is in seconds (e.g. 10 digits), convert to ms
  const ms = num < 1e11 ? num * 1000 : num
  return formatDateTimeIST(new Date(ms))
}
