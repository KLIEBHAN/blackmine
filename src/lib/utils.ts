import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

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

export function formatDate(date: string | Date, format: DateFormat = 'medium'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', dateFormatOptions[format])
}

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function formatShortId(id: string): string {
  if (!id) return ''
  const parts = id.split('-')
  const base = parts[parts.length - 1] || id
  return base.slice(0, 4)
}

const STAGGER_DELAY_MS = 30

export function staggerDelay(index: number): { animationDelay: string } {
  return { animationDelay: `${index * STAGGER_DELAY_MS}ms` }
}
