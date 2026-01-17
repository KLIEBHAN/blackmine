import { describe, it, expect } from 'vitest'
import { filterIssues, sortIssues, getOpenIssues, getClosedIssues, getIssueById, deleteIssue } from './issues'
import type { Issue } from '@/types'

// Test fixtures
const createIssue = (overrides: Partial<Issue> = {}): Issue => ({
  id: 'test-1',
  projectId: 'proj-1',
  tracker: 'bug',
  subject: 'Test Issue',
  description: 'Test description',
  status: 'new',
  priority: 'normal',
  assigneeId: 'user-1',
  authorId: 'user-2',
  dueDate: new Date('2024-04-01'),
  estimatedHours: 4,
  createdAt: new Date('2024-03-01'),
  updatedAt: new Date('2024-03-01'),
  ...overrides,
})

const testIssues: Issue[] = [
  createIssue({ id: '1', status: 'new', priority: 'high', subject: 'High priority bug' }),
  createIssue({ id: '2', status: 'in_progress', priority: 'normal', subject: 'Normal task' }),
  createIssue({ id: '3', status: 'closed', priority: 'low', subject: 'Closed issue' }),
  createIssue({ id: '4', status: 'new', priority: 'urgent', tracker: 'feature', projectId: 'proj-2' }),
  createIssue({ id: '5', status: 'rejected', priority: 'normal', assigneeId: null }),
]

describe('filterIssues', () => {
  it('returns all issues when no filters provided', () => {
    const result = filterIssues(testIssues, {})
    expect(result).toHaveLength(5)
  })

  it('filters by single status', () => {
    const result = filterIssues(testIssues, { status: 'new' })
    expect(result).toHaveLength(2)
    expect(result.every((i) => i.status === 'new')).toBe(true)
  })

  it('filters by multiple statuses', () => {
    const result = filterIssues(testIssues, { status: ['new', 'in_progress'] })
    expect(result).toHaveLength(3)
  })

  it('filters by priority', () => {
    const result = filterIssues(testIssues, { priority: 'high' })
    expect(result).toHaveLength(1)
    expect(result[0].priority).toBe('high')
  })

  it('filters by tracker', () => {
    const result = filterIssues(testIssues, { tracker: 'feature' })
    expect(result).toHaveLength(1)
    expect(result[0].tracker).toBe('feature')
  })

  it('filters by projectId', () => {
    const result = filterIssues(testIssues, { projectId: 'proj-2' })
    expect(result).toHaveLength(1)
    expect(result[0].projectId).toBe('proj-2')
  })

  it('filters by assigneeId', () => {
    const result = filterIssues(testIssues, { assigneeId: 'user-1' })
    expect(result).toHaveLength(4)
  })

  it('filters unassigned issues', () => {
    const result = filterIssues(testIssues, { assigneeId: null })
    expect(result).toHaveLength(1)
    expect(result[0].assigneeId).toBeNull()
  })

  it('filters by search in subject', () => {
    const result = filterIssues(testIssues, { search: 'bug' })
    expect(result).toHaveLength(1)
    expect(result[0].subject).toContain('bug')
  })

  it('filters by search case-insensitive', () => {
    const result = filterIssues(testIssues, { search: 'HIGH' })
    expect(result).toHaveLength(1)
  })

  it('trims search input before matching', () => {
    const result = filterIssues(testIssues, { search: '  bug  ' })
    expect(result).toHaveLength(1)
  })

  it('ignores whitespace-only search', () => {
    const result = filterIssues(testIssues, { search: '   ' })
    expect(result).toHaveLength(5)
  })

  it('filters by search in id', () => {
    const issue = createIssue({ id: 'issue-abc123', subject: 'No match', description: 'No match' })
    const result = filterIssues([issue], { search: 'abc123' })
    expect(result).toHaveLength(1)
  })

  it('combines multiple filters', () => {
    const result = filterIssues(testIssues, {
      status: 'new',
      priority: 'high',
    })
    expect(result).toHaveLength(1)
    expect(result[0].status).toBe('new')
    expect(result[0].priority).toBe('high')
  })
})

describe('sortIssues', () => {
  it('sorts by priority descending (highest first)', () => {
    const result = sortIssues(testIssues, { field: 'priority', direction: 'desc' })
    expect(result[0].priority).toBe('urgent')
    expect(result[result.length - 1].priority).toBe('low')
  })

  it('sorts by priority ascending (lowest first)', () => {
    const result = sortIssues(testIssues, { field: 'priority', direction: 'asc' })
    expect(result[0].priority).toBe('low')
    expect(result[result.length - 1].priority).toBe('urgent')
  })

  it('sorts by status', () => {
    const result = sortIssues(testIssues, { field: 'status', direction: 'asc' })
    expect(result[0].status).toBe('new')
    expect(result[result.length - 1].status).toBe('rejected')
  })

  it('sorts by subject alphabetically', () => {
    const result = sortIssues(testIssues, { field: 'subject', direction: 'asc' })
    expect(result[0].subject).toBe('Closed issue')
  })

  it('sorts by createdAt', () => {
    const issuesWithDates = [
      createIssue({ id: '1', createdAt: new Date('2024-01-01') }),
      createIssue({ id: '2', createdAt: new Date('2024-03-01') }),
      createIssue({ id: '3', createdAt: new Date('2024-02-01') }),
    ]
    const result = sortIssues(issuesWithDates, { field: 'createdAt', direction: 'asc' })
    expect(result[0].id).toBe('1')
    expect(result[2].id).toBe('2')
  })

  it('sorts by dueDate with null dates at end', () => {
    const issuesWithDueDates = [
      createIssue({ id: '1', dueDate: null }),
      createIssue({ id: '2', dueDate: new Date('2024-04-01') }),
      createIssue({ id: '3', dueDate: new Date('2024-03-01') }),
    ]
    const result = sortIssues(issuesWithDueDates, { field: 'dueDate', direction: 'asc' })
    expect(result[0].id).toBe('3')
    expect(result[1].id).toBe('2')
    expect(result[2].id).toBe('1') // null at end
  })

  it('does not mutate original array', () => {
    const original = [...testIssues]
    sortIssues(testIssues, { field: 'priority', direction: 'desc' })
    expect(testIssues).toEqual(original)
  })
})

describe('getOpenIssues', () => {
  it('returns only non-closed and non-rejected issues', () => {
    const result = getOpenIssues(testIssues)
    expect(result).toHaveLength(3)
    expect(result.every((i) => i.status !== 'closed' && i.status !== 'rejected')).toBe(true)
  })
})

describe('getClosedIssues', () => {
  it('returns only closed and rejected issues', () => {
    const result = getClosedIssues(testIssues)
    expect(result).toHaveLength(2)
    expect(result.every((i) => i.status === 'closed' || i.status === 'rejected')).toBe(true)
  })
})

describe('getIssueById', () => {
  it('returns issue when found', () => {
    const result = getIssueById(testIssues, '1')
    expect(result).toBeDefined()
    expect(result?.id).toBe('1')
    expect(result?.subject).toBe('High priority bug')
  })

  it('returns undefined when issue not found', () => {
    const result = getIssueById(testIssues, 'non-existent')
    expect(result).toBeUndefined()
  })

  it('returns undefined for empty array', () => {
    const result = getIssueById([], '1')
    expect(result).toBeUndefined()
  })
})

describe('deleteIssue', () => {
  it('removes issue from array when found', () => {
    const issues = [
      createIssue({ id: 'del-1' }),
      createIssue({ id: 'del-2' }),
      createIssue({ id: 'del-3' }),
    ]
    const result = deleteIssue(issues, 'del-2')
    expect(result).toBe(true)
    expect(issues).toHaveLength(2)
    expect(issues.find(i => i.id === 'del-2')).toBeUndefined()
  })

  it('returns false when issue not found', () => {
    const issues = [createIssue({ id: 'del-1' })]
    const result = deleteIssue(issues, 'non-existent')
    expect(result).toBe(false)
    expect(issues).toHaveLength(1)
  })

  it('returns false for empty array', () => {
    const issues: Issue[] = []
    const result = deleteIssue(issues, 'any-id')
    expect(result).toBe(false)
  })

  it('mutates original array in-place', () => {
    const issues = [createIssue({ id: 'del-1' }), createIssue({ id: 'del-2' })]
    const originalRef = issues
    deleteIssue(issues, 'del-1')
    expect(issues).toBe(originalRef) // Same reference
    expect(issues).toHaveLength(1)
  })
})
