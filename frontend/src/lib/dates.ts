/** Parse a YYYY-MM-DD string as local midnight (avoids UTC offset bugs). */
export function parseLocalDate(s: string): Date {
  if (s.length === 10) {
    const [y, m, d] = s.split('-').map(Number)
    return new Date(y, m - 1, d)
  }
  const dt = new Date(s)
  dt.setHours(0, 0, 0, 0)
  return dt
}

/** Format a Date as a local YYYY-MM-DD string. */
export function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const today = () => toLocalDateStr(new Date())

/** Whole days between two YYYY-MM-DD dates (b - a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((parseLocalDate(b).getTime() - parseLocalDate(a).getTime()) / 86_400_000)
}

/** "today" · "yesterday" · "12 days ago" · "3 months ago" */
export function humanAgo(dateStr: string): string {
  const d = daysBetween(dateStr, today())
  if (d === 0) return 'today'
  if (d === 1) return 'yesterday'
  if (d < 0)   return `in ${-d} days`
  if (d < 30)  return `${d} days ago`
  const months = Math.round(d / 30.44)
  if (months < 18) return `${months} month${months > 1 ? 's' : ''} ago`
  return `${Math.round(d / 365.25)} years ago`
}

/** "3 weeks" · "2 months" · "1 year" — for intervals, not dates. */
export function humanDuration(days: number): string {
  if (days < 14)  return `${days} days`
  if (days < 60)  return `${Math.round(days / 7)} weeks`
  if (days < 365) return `${Math.round(days / 30.44)} months`
  const years = days / 365.25
  return years === 1 ? '1 year' : `${years.toFixed(years % 1 ? 1 : 0)} years`
}
