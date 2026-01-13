import { describe, it, expect } from 'vitest'
import { cn, getInitials, formatDate, generateId, formatShortId, staggerDelay } from './utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible')
  })

  it('merges tailwind classes correctly', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2')
  })
})

describe('getInitials', () => {
  it('returns initials from full name', () => {
    expect(getInitials('John Doe')).toBe('JD')
  })

  it('returns initials from firstName and lastName', () => {
    expect(getInitials('John', 'Doe')).toBe('JD')
  })

  it('handles single name', () => {
    expect(getInitials('John')).toBe('J')
  })

  it('handles three-word name (takes first two)', () => {
    expect(getInitials('John Michael Doe')).toBe('JM')
  })

  it('handles empty strings gracefully', () => {
    expect(getInitials('', '')).toBe('')
  })
})

describe('formatDate', () => {
  const testDate = new Date('2026-01-15T10:30:00Z')
  const dateString = '2026-01-15T10:30:00Z'

  it('formats Date object with medium format (default)', () => {
    const result = formatDate(testDate)
    expect(result).toMatch(/Jan\s+15,\s+2026/)
  })

  it('formats date string with medium format', () => {
    const result = formatDate(dateString)
    expect(result).toMatch(/Jan\s+15,\s+2026/)
  })

  it('formats with short format', () => {
    const result = formatDate(testDate, 'short')
    expect(result).toMatch(/Jan\s+15/)
  })

  it('formats with long format', () => {
    const result = formatDate(testDate, 'long')
    expect(result).toMatch(/January\s+15,\s+2026/)
  })

  it('formats with datetime format', () => {
    const result = formatDate(testDate, 'datetime')
    expect(result).toMatch(/Jan\s+15,\s+2026/)
    // Time part depends on timezone, just check it contains AM/PM or 24h format
    expect(result).toMatch(/\d{1,2}:\d{2}/)
  })
})

describe('generateId', () => {
  it('generates id with prefix', () => {
    const id = generateId('test')
    expect(id).toMatch(/^test-\d+-[a-z0-9]+$/)
  })

  it('generates unique ids', () => {
    const id1 = generateId('item')
    const id2 = generateId('item')
    expect(id1).not.toBe(id2)
  })
})

describe('formatShortId', () => {
  it('returns last 4 chars of final segment', () => {
    expect(formatShortId('proj-1234567890-abcdefg')).toBe('abcd')
  })

  it('handles simple id', () => {
    expect(formatShortId('simple')).toBe('simp')
  })

  it('returns empty string for empty input', () => {
    expect(formatShortId('')).toBe('')
  })

  it('handles short final segment', () => {
    expect(formatShortId('prefix-ab')).toBe('ab')
  })
})

describe('staggerDelay', () => {
  it('returns 0ms for index 0', () => {
    expect(staggerDelay(0)).toEqual({ animationDelay: '0ms' })
  })

  it('returns 30ms for index 1', () => {
    expect(staggerDelay(1)).toEqual({ animationDelay: '30ms' })
  })

  it('returns 150ms for index 5', () => {
    expect(staggerDelay(5)).toEqual({ animationDelay: '150ms' })
  })
})
