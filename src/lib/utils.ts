import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extracts initials from a name (max 2 characters).
 * Supports both full name string and separate first/last name.
 */
export function getInitials(name: string): string
export function getInitials(firstName: string, lastName: string): string
export function getInitials(firstOrFull: string, lastName?: string): string {
  if (lastName !== undefined) {
    return `${firstOrFull[0] || ''}${lastName[0] || ''}`.toUpperCase()
  }
  return firstOrFull
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export type DateFormat = 'short' | 'medium' | 'long' | 'datetime'

const dateFormatOptions: Record<DateFormat, Intl.DateTimeFormatOptions> = {
  short: { month: 'short', day: 'numeric' },
  medium: { year: 'numeric', month: 'short', day: 'numeric' },
  long: { year: 'numeric', month: 'long', day: 'numeric' },
  datetime: { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' },
}

/**
 * Formats a date string using predefined formats.
 * - 'short': Jan 12 (for tables/lists)
 * - 'medium': Jan 12, 2026 (for metadata)
 * - 'long': January 12, 2026 (for detail views)
 * - 'datetime': Jan 12, 2026, 10:30 AM (for timestamps)
 */
export function formatDate(date: string | Date, format: DateFormat = 'medium'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', dateFormatOptions[format])
}
