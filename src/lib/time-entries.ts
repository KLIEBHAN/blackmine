import type { TimeEntry, SortDirection } from '@/types'

export interface TimeEntryFilters {
  issueId?: string
  userId?: string
  activityType?: string
  from?: Date
  to?: Date
  search?: string
}

export type TimeEntrySortField = 'spentOn' | 'hours' | 'createdAt'

export function filterTimeEntries(
  entries: TimeEntry[],
  filters: TimeEntryFilters
): TimeEntry[] {
  return entries.filter((entry) => {
    if (filters.issueId && entry.issueId !== filters.issueId) return false
    if (filters.userId && entry.userId !== filters.userId) return false
    if (filters.activityType && entry.activityType !== filters.activityType) return false

    if (filters.from) {
      const fromDate = new Date(filters.from)
      fromDate.setHours(0, 0, 0, 0)
      const entryDate = new Date(entry.spentOn)
      entryDate.setHours(0, 0, 0, 0)
      if (entryDate < fromDate) return false
    }

    if (filters.to) {
      const toDate = new Date(filters.to)
      toDate.setHours(23, 59, 59, 999)
      const entryDate = new Date(entry.spentOn)
      if (entryDate > toDate) return false
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      if (!entry.comments.toLowerCase().includes(searchLower)) return false
    }

    return true
  })
}

export function sortTimeEntries(
  entries: TimeEntry[],
  field: TimeEntrySortField = 'spentOn',
  direction: SortDirection = 'desc'
): TimeEntry[] {
  const sorted = [...entries].sort((a, b) => {
    let comparison = 0

    switch (field) {
      case 'spentOn':
        comparison = new Date(a.spentOn).getTime() - new Date(b.spentOn).getTime()
        break
      case 'hours':
        comparison = a.hours - b.hours
        break
      case 'createdAt':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        break
    }

    return direction === 'desc' ? -comparison : comparison
  })

  return sorted
}

export function getTimeEntryById(
  entries: TimeEntry[],
  id: string
): TimeEntry | undefined {
  return entries.find((entry) => entry.id === id)
}

export function deleteTimeEntry(entries: TimeEntry[], id: string): TimeEntry[] {
  return entries.filter((entry) => entry.id !== id)
}

export function getTotalHours(entries: TimeEntry[]): number {
  return entries.reduce((sum, entry) => sum + entry.hours, 0)
}

export function getTimeEntriesByIssue(
  entries: TimeEntry[]
): Record<string, TimeEntry[]> {
  return entries.reduce(
    (acc, entry) => {
      if (!acc[entry.issueId]) {
        acc[entry.issueId] = []
      }
      acc[entry.issueId].push(entry)
      return acc
    },
    {} as Record<string, TimeEntry[]>
  )
}

export function getTimeEntriesByUser(
  entries: TimeEntry[]
): Record<string, TimeEntry[]> {
  return entries.reduce(
    (acc, entry) => {
      if (!acc[entry.userId]) {
        acc[entry.userId] = []
      }
      acc[entry.userId].push(entry)
      return acc
    },
    {} as Record<string, TimeEntry[]>
  )
}
