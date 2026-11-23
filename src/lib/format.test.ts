import { describe, expect, it } from 'vitest'
import { formatDateOnly, formatKg, formatTimeOnly, fullName, initials, todayIso } from './format'

describe('format', () => {
  it('does not shift a date-only value across time zones', () => {
    expect(formatDateOnly('2026-11-28')).toContain('28')
  })

  it('trims seconds from a time-only value', () => {
    expect(formatTimeOnly('09:30:00')).toBe('09:30')
  })

  it('formats kilograms with Spanish separators', () => {
    expect(formatKg(1234.5)).toMatch(/1\D?234,5 kg/)
  })

  it('builds names and initials from partial data', () => {
    expect(fullName({ firstName: 'Lucia', lastName: null })).toBe('Lucia')
    expect(initials({ firstName: 'lucia', lastName: 'mamani' })).toBe('LM')
  })

  it('returns today in ISO date format', () => {
    expect(todayIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
