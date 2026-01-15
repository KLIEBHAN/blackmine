import { describe, it, expect } from 'vitest'
import {
  getFullName,
  isOverdue,
  isDueThisWeek,
  getPriorityOrder,
  type User,
  type Issue,
} from './index'

describe('getFullName', () => {
  it('returns full name with first and last name', () => {
    const user: User = {
      id: '1',
      email: 'john@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'developer',
      createdAt: new Date(),
    }
    expect(getFullName(user)).toBe('John Doe')
  })

  it('trims whitespace when lastName is empty', () => {
    const user: User = {
      id: '1',
      email: 'john@example.com',
      firstName: 'John',
      lastName: '',
      role: 'developer',
      createdAt: new Date(),
    }
    expect(getFullName(user)).toBe('John')
  })
})

describe('isOverdue', () => {
  const baseIssue: Issue = {
    id: '1',
    projectId: 'proj-1',
    tracker: 'bug',
    subject: 'Test Issue',
    description: '',
    status: 'in_progress',
    priority: 'normal',
    assigneeId: null,
    authorId: 'user-1',
    dueDate: null,
    estimatedHours: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  it('returns false when dueDate is null', () => {
    expect(isOverdue({ ...baseIssue, dueDate: null })).toBe(false)
  })

  it('returns false when status is closed', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    expect(isOverdue({ ...baseIssue, status: 'closed', dueDate: yesterday })).toBe(false)
  })

  it('returns false when status is rejected', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    expect(isOverdue({ ...baseIssue, status: 'rejected', dueDate: yesterday })).toBe(false)
  })

  it('returns false when status is resolved', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    expect(isOverdue({ ...baseIssue, status: 'resolved', dueDate: yesterday })).toBe(false)
  })

  it('handles string dueDate (serialized from JSON)', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    expect(isOverdue({ status: 'in_progress', dueDate: yesterday.toISOString() })).toBe(true)
  })

  it('returns true when dueDate is in the past and issue is open', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    expect(isOverdue({ ...baseIssue, dueDate: yesterday })).toBe(true)
  })

  it('returns false when dueDate is in the future', () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    expect(isOverdue({ ...baseIssue, dueDate: tomorrow })).toBe(false)
  })
})

describe('isDueThisWeek', () => {
  it('returns false when dueDate is null', () => {
    expect(isDueThisWeek({ status: 'new', dueDate: null })).toBe(false)
  })

  it('returns false when status is closed', () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    expect(isDueThisWeek({ status: 'closed', dueDate: tomorrow })).toBe(false)
  })

  it('returns false when status is rejected', () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    expect(isDueThisWeek({ status: 'rejected', dueDate: tomorrow })).toBe(false)
  })

  it('returns false when status is resolved', () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    expect(isDueThisWeek({ status: 'resolved', dueDate: tomorrow })).toBe(false)
  })

  it('returns true when dueDate is within next 7 days', () => {
    const in3Days = new Date()
    in3Days.setDate(in3Days.getDate() + 3)
    expect(isDueThisWeek({ status: 'in_progress', dueDate: in3Days })).toBe(true)
  })

  it('returns true when dueDate is today', () => {
    const today = new Date()
    expect(isDueThisWeek({ status: 'new', dueDate: today })).toBe(true)
  })

  it('returns true when dueDate is exactly 7 days from now', () => {
    const in7Days = new Date()
    in7Days.setDate(in7Days.getDate() + 7)
    expect(isDueThisWeek({ status: 'new', dueDate: in7Days })).toBe(true)
  })

  it('returns false when dueDate is more than 7 days away', () => {
    const in8Days = new Date()
    in8Days.setDate(in8Days.getDate() + 8)
    expect(isDueThisWeek({ status: 'new', dueDate: in8Days })).toBe(false)
  })

  it('returns false when dueDate is in the past', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    expect(isDueThisWeek({ status: 'new', dueDate: yesterday })).toBe(false)
  })

  it('handles string dueDate (serialized from JSON)', () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    expect(isDueThisWeek({ status: 'in_progress', dueDate: tomorrow.toISOString() })).toBe(true)
  })
})

describe('getPriorityOrder', () => {
  it('returns correct order for all priorities', () => {
    expect(getPriorityOrder('low')).toBe(1)
    expect(getPriorityOrder('normal')).toBe(2)
    expect(getPriorityOrder('high')).toBe(3)
    expect(getPriorityOrder('urgent')).toBe(4)
    expect(getPriorityOrder('immediate')).toBe(5)
  })

  it('immediate has highest priority', () => {
    expect(getPriorityOrder('immediate')).toBeGreaterThan(getPriorityOrder('urgent'))
  })
})
