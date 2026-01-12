import { describe, it, expect } from 'vitest'
import {
  validateIssueForm,
  createIssueFromForm,
  updateIssueFromForm,
  type IssueFormData,
} from './issue-form'
import type { Issue, IssueTracker } from '@/types'

describe('validateIssueForm', () => {
  const validFormData: IssueFormData = {
    projectId: 'proj-1',
    tracker: 'bug',
    subject: 'Test Issue Subject',
    description: 'This is a description',
    priority: 'normal',
    assigneeId: null,
    dueDate: null,
    estimatedHours: null,
  }

  it('returns no errors for valid form data', () => {
    const errors = validateIssueForm(validFormData)
    expect(errors).toEqual({})
  })

  it('requires projectId', () => {
    const errors = validateIssueForm({ ...validFormData, projectId: '' })
    expect(errors.projectId).toBe('Project is required')
  })

  it('requires tracker', () => {
    const errors = validateIssueForm({ ...validFormData, tracker: '' as unknown as IssueTracker })
    expect(errors.tracker).toBe('Tracker is required')
  })

  it('requires subject', () => {
    const errors = validateIssueForm({ ...validFormData, subject: '' })
    expect(errors.subject).toBe('Subject is required')
  })

  it('requires subject to have at least 3 characters', () => {
    const errors = validateIssueForm({ ...validFormData, subject: 'ab' })
    expect(errors.subject).toBe('Subject must be at least 3 characters')
  })

  it('requires subject to be at most 255 characters', () => {
    const errors = validateIssueForm({ ...validFormData, subject: 'a'.repeat(256) })
    expect(errors.subject).toBe('Subject must be at most 255 characters')
  })

  it('allows empty description', () => {
    const errors = validateIssueForm({ ...validFormData, description: '' })
    expect(errors.description).toBeUndefined()
  })

  it('validates estimatedHours is positive when provided', () => {
    const errors = validateIssueForm({ ...validFormData, estimatedHours: -1 })
    expect(errors.estimatedHours).toBe('Estimated hours must be positive')
  })

  it('validates estimatedHours is not zero', () => {
    const errors = validateIssueForm({ ...validFormData, estimatedHours: 0 })
    expect(errors.estimatedHours).toBe('Estimated hours must be positive')
  })

  it('allows null estimatedHours', () => {
    const errors = validateIssueForm({ ...validFormData, estimatedHours: null })
    expect(errors.estimatedHours).toBeUndefined()
  })

  it('allows valid estimatedHours', () => {
    const errors = validateIssueForm({ ...validFormData, estimatedHours: 8 })
    expect(errors.estimatedHours).toBeUndefined()
  })

  it('returns multiple errors at once', () => {
    const errors = validateIssueForm({
      projectId: '',
      tracker: '' as unknown as IssueTracker,
      subject: '',
      description: '',
      priority: 'normal',
      assigneeId: null,
      dueDate: null,
      estimatedHours: null,
    })
    expect(Object.keys(errors).length).toBeGreaterThan(1)
    expect(errors.projectId).toBeDefined()
    expect(errors.tracker).toBeDefined()
    expect(errors.subject).toBeDefined()
  })
})

describe('createIssueFromForm', () => {
  const validFormData: IssueFormData = {
    projectId: 'proj-1',
    tracker: 'feature',
    subject: 'New Feature Request',
    description: 'Detailed description here',
    priority: 'high',
    assigneeId: 'user-2',
    dueDate: new Date('2024-05-01'),
    estimatedHours: 16,
  }

  it('creates an issue with correct properties', () => {
    const issue = createIssueFromForm(validFormData, 'user-1')

    expect(issue.projectId).toBe('proj-1')
    expect(issue.tracker).toBe('feature')
    expect(issue.subject).toBe('New Feature Request')
    expect(issue.description).toBe('Detailed description here')
    expect(issue.priority).toBe('high')
    expect(issue.assigneeId).toBe('user-2')
    expect(issue.dueDate).toEqual(new Date('2024-05-01'))
    expect(issue.estimatedHours).toBe(16)
    expect(issue.authorId).toBe('user-1')
    expect(issue.status).toBe('new')
  })

  it('generates a unique id', () => {
    const issue1 = createIssueFromForm(validFormData, 'user-1')
    const issue2 = createIssueFromForm(validFormData, 'user-1')

    expect(issue1.id).toBeDefined()
    expect(issue2.id).toBeDefined()
    expect(issue1.id).not.toBe(issue2.id)
  })

  it('sets createdAt and updatedAt to current time', () => {
    const before = new Date()
    const issue = createIssueFromForm(validFormData, 'user-1')
    const after = new Date()

    expect(issue.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
    expect(issue.createdAt.getTime()).toBeLessThanOrEqual(after.getTime())
    expect(issue.updatedAt.getTime()).toEqual(issue.createdAt.getTime())
  })

  it('handles null optional fields', () => {
    const formData: IssueFormData = {
      ...validFormData,
      assigneeId: null,
      dueDate: null,
      estimatedHours: null,
    }

    const issue = createIssueFromForm(formData, 'user-1')

    expect(issue.assigneeId).toBeNull()
    expect(issue.dueDate).toBeNull()
    expect(issue.estimatedHours).toBeNull()
  })
})

describe('updateIssueFromForm', () => {
  const existingIssue: Issue = {
    id: 'issue-123',
    projectId: 'proj-1',
    tracker: 'bug',
    subject: 'Original Subject',
    description: 'Original description',
    status: 'in_progress',
    priority: 'normal',
    assigneeId: 'user-1',
    authorId: 'user-2',
    dueDate: new Date('2024-03-15'),
    estimatedHours: 8,
    createdAt: new Date('2024-01-01T10:00:00'),
    updatedAt: new Date('2024-01-01T10:00:00'),
  }

  const updateData: IssueFormData = {
    projectId: 'proj-2',
    tracker: 'feature',
    subject: 'Updated Subject',
    description: 'Updated description',
    priority: 'high',
    assigneeId: 'user-3',
    dueDate: new Date('2024-06-01'),
    estimatedHours: 16,
  }

  it('updates all editable fields from form data', () => {
    const updated = updateIssueFromForm(existingIssue, updateData)

    expect(updated.projectId).toBe('proj-2')
    expect(updated.tracker).toBe('feature')
    expect(updated.subject).toBe('Updated Subject')
    expect(updated.description).toBe('Updated description')
    expect(updated.priority).toBe('high')
    expect(updated.assigneeId).toBe('user-3')
    expect(updated.dueDate).toEqual(new Date('2024-06-01'))
    expect(updated.estimatedHours).toBe(16)
  })

  it('preserves immutable fields (id, authorId, status, createdAt)', () => {
    const updated = updateIssueFromForm(existingIssue, updateData)

    expect(updated.id).toBe('issue-123')
    expect(updated.authorId).toBe('user-2')
    expect(updated.status).toBe('in_progress')
    expect(updated.createdAt).toEqual(new Date('2024-01-01T10:00:00'))
  })

  it('updates updatedAt timestamp', () => {
    const before = new Date()
    const updated = updateIssueFromForm(existingIssue, updateData)
    const after = new Date()

    expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
    expect(updated.updatedAt.getTime()).toBeLessThanOrEqual(after.getTime())
    expect(updated.updatedAt).not.toEqual(existingIssue.updatedAt)
  })

  it('handles null optional fields', () => {
    const updated = updateIssueFromForm(existingIssue, {
      ...updateData,
      assigneeId: null,
      dueDate: null,
      estimatedHours: null,
    })

    expect(updated.assigneeId).toBeNull()
    expect(updated.dueDate).toBeNull()
    expect(updated.estimatedHours).toBeNull()
  })

  it('returns a new object without mutating the original', () => {
    const updated = updateIssueFromForm(existingIssue, updateData)

    expect(updated).not.toBe(existingIssue)
    expect(existingIssue.subject).toBe('Original Subject')
  })
})
