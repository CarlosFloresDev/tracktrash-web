const dateFormat = new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
const dateTimeFormat = new Intl.DateTimeFormat('es-PE', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})
const numberFormat = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 1 })

/** `scheduledDate` arrives as `YYYY-MM-DD` and must not be shifted by the local time zone. */
export function formatDateOnly(value: string): string {
  const [year, month, day] = value.split('-').map(Number)
  return dateFormat.format(new Date(year, month - 1, day))
}

export function formatTimeOnly(value: string): string {
  return value.slice(0, 5)
}

export function formatDateTime(value: string): string {
  return dateTimeFormat.format(new Date(value))
}

export function formatNumber(value: number): string {
  return numberFormat.format(value)
}

export function formatKg(value: number): string {
  return `${formatNumber(value)} kg`
}

export function fullName(person: { firstName?: string | null; lastName?: string | null }): string {
  return [person.firstName, person.lastName].filter(Boolean).join(' ')
}

export function initials(person: { firstName?: string | null; lastName?: string | null }): string {
  return `${person.firstName?.[0] ?? ''}${person.lastName?.[0] ?? ''}`.toUpperCase()
}

/** Local `YYYY-MM-DD`, used as the minimum for the schedule date input. */
export function todayIso(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}
