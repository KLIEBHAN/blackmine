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
