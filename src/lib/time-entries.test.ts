import { describe, it, expect } from 'vitest'
import type { TimeEntry } from '@/types'
import {
  filterTimeEntries,
  sortTimeEntries,
  getTimeEntryById,
  deleteTimeEntry,
  getTotalHours,
  getTimeEntriesByIssue,
  getTimeEntriesByUser,
} from './time-entries'

const mockTimeEntries: TimeEntry[] = [
  {
    id: 'time-1',
    issueId: 'issue-1',
    userId: 'user-1',
    hours: 2.5,
    comments: 'Debugging login issue',
    activityType: 'development',
    spentOn: new Date('2024-03-15'),
    createdAt: new Date('2024-03-15T10:00:00'),
  },
  {
    id: 'time-2',
    issueId: 'issue-1',
    userId: 'user-2',
    hours: 4,
    comments: 'Code review',
    activityType: 'review',
    spentOn: new Date('2024-03-16'),
    createdAt: new Date('2024-03-16T14:00:00'),
  },
  {
    id: 'time-3',
    issueId: 'issue-2',
    userId: 'user-1',
    hours: 1.5,
    comments: 'Design meeting',
    activityType: 'meeting',
    spentOn: new Date('2024-03-17'),
    createdAt: new Date('2024-03-17T09:00:00'),
  },
  {
    id: 'time-4',
    issueId: 'issue-3',
    userId: 'user-3',
    hours: 6,
    comments: 'Feature implementation',
    activityType: 'development',
    spentOn: new Date('2024-03-14'),
    createdAt: new Date('2024-03-14T08:00:00'),
  },
]

describe('filterTimeEntries', () => {
  it('returns all entries when no filters', () => {
    const result = filterTimeEntries(mockTimeEntries, {})
    expect(result).toHaveLength(4)
  })

  it('filters by issueId', () => {
    const result = filterTimeEntries(mockTimeEntries, { issueId: 'issue-1' })
    expect(result).toHaveLength(2)
    expect(result.every((e: TimeEntry) => e.issueId === 'issue-1')).toBe(true)
  })

  it('filters by userId', () => {
    const result = filterTimeEntries(mockTimeEntries, { userId: 'user-1' })
    expect(result).toHaveLength(2)
    expect(result.every((e: TimeEntry) => e.userId === 'user-1')).toBe(true)
  })

  it('filters by activityType', () => {
    const result = filterTimeEntries(mockTimeEntries, { activityType: 'development' })
    expect(result).toHaveLength(2)
  })

  it('filters by date range - from only', () => {
    const result = filterTimeEntries(mockTimeEntries, { from: new Date('2024-03-16') })
    expect(result).toHaveLength(2)
  })

  it('filters by date range - to only', () => {
    const result = filterTimeEntries(mockTimeEntries, { to: new Date('2024-03-15') })
    expect(result).toHaveLength(2)
  })

  it('filters by date range - both from and to', () => {
    const result = filterTimeEntries(mockTimeEntries, {
      from: new Date('2024-03-15'),
      to: new Date('2024-03-16'),
    })
    expect(result).toHaveLength(2)
  })

  it('combines multiple filters', () => {
    const result = filterTimeEntries(mockTimeEntries, {
      userId: 'user-1',
      activityType: 'development',
    })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('time-1')
  })

  it('filters by search in comments', () => {
    const result = filterTimeEntries(mockTimeEntries, { search: 'review' })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('time-2')
  })
})

describe('sortTimeEntries', () => {
  it('sorts by spentOn descending (default)', () => {
    const result = sortTimeEntries(mockTimeEntries)
    expect(result[0].id).toBe('time-3') // 2024-03-17
    expect(result[3].id).toBe('time-4') // 2024-03-14
  })

  it('sorts by spentOn ascending', () => {
    const result = sortTimeEntries(mockTimeEntries, 'spentOn', 'asc')
    expect(result[0].id).toBe('time-4') // 2024-03-14
    expect(result[3].id).toBe('time-3') // 2024-03-17
  })

  it('sorts by hours descending', () => {
    const result = sortTimeEntries(mockTimeEntries, 'hours', 'desc')
    expect(result[0].hours).toBe(6)
    expect(result[3].hours).toBe(1.5)
  })

  it('sorts by hours ascending', () => {
    const result = sortTimeEntries(mockTimeEntries, 'hours', 'asc')
    expect(result[0].hours).toBe(1.5)
    expect(result[3].hours).toBe(6)
  })

  it('sorts by createdAt', () => {
    const result = sortTimeEntries(mockTimeEntries, 'createdAt', 'desc')
    expect(result[0].id).toBe('time-3')
  })
})

describe('getTimeEntryById', () => {
  it('finds existing time entry', () => {
    const result = getTimeEntryById(mockTimeEntries, 'time-2')
    expect(result).toBeDefined()
    expect(result?.hours).toBe(4)
  })

  it('returns undefined for non-existent entry', () => {
    const result = getTimeEntryById(mockTimeEntries, 'non-existent')
    expect(result).toBeUndefined()
  })
})

describe('deleteTimeEntry', () => {
  it('removes entry from array', () => {
    const entries = [...mockTimeEntries]
    const result = deleteTimeEntry(entries, 'time-1')
    expect(result).toHaveLength(3)
    expect(result.find((e: TimeEntry) => e.id === 'time-1')).toBeUndefined()
  })

  it('returns unchanged array for non-existent entry', () => {
    const entries = [...mockTimeEntries]
    const result = deleteTimeEntry(entries, 'non-existent')
    expect(result).toHaveLength(4)
  })

  it('does not mutate original array', () => {
    const entries = [...mockTimeEntries]
    deleteTimeEntry(entries, 'time-1')
    expect(entries).toHaveLength(4)
  })
})

describe('getTotalHours', () => {
  it('sums all hours', () => {
    const result = getTotalHours(mockTimeEntries)
    expect(result).toBe(14) // 2.5 + 4 + 1.5 + 6
  })

  it('returns 0 for empty array', () => {
    const result = getTotalHours([])
    expect(result).toBe(0)
  })
})

describe('getTimeEntriesByIssue', () => {
  it('groups entries by issueId', () => {
    const result = getTimeEntriesByIssue(mockTimeEntries)
    expect(Object.keys(result)).toHaveLength(3)
    expect(result['issue-1']).toHaveLength(2)
    expect(result['issue-2']).toHaveLength(1)
    expect(result['issue-3']).toHaveLength(1)
  })

  it('returns empty object for empty array', () => {
    const result = getTimeEntriesByIssue([])
    expect(result).toEqual({})
  })
})

describe('getTimeEntriesByUser', () => {
  it('groups entries by userId', () => {
    const result = getTimeEntriesByUser(mockTimeEntries)
    expect(Object.keys(result)).toHaveLength(3)
    expect(result['user-1']).toHaveLength(2)
    expect(result['user-2']).toHaveLength(1)
    expect(result['user-3']).toHaveLength(1)
  })
})
