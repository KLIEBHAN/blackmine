import { describe, it, expect } from 'vitest'
import {
  validateTimeEntryForm,
  createTimeEntryFromForm,
  type TimeEntryFormData,
} from './time-entry-form'

describe('validateTimeEntryForm', () => {
  const validForm: TimeEntryFormData = {
    issueId: 'issue-1',
    hours: 2.5,
    activityType: 'Development',
    spentOn: new Date('2024-01-15'),
    comments: 'Worked on feature',
  }

  it('returns no errors for valid form', () => {
    const errors = validateTimeEntryForm(validForm)
    expect(Object.keys(errors)).toHaveLength(0)
  })

  it('requires issueId', () => {
    const errors = validateTimeEntryForm({ ...validForm, issueId: '' })
    expect(errors.issueId).toBe('Issue is required')
  })

  it('requires hours', () => {
    const errors = validateTimeEntryForm({ ...validForm, hours: null as unknown as number })
    expect(errors.hours).toBe('Hours is required')
  })

  it('requires hours to be positive', () => {
    const errors = validateTimeEntryForm({ ...validForm, hours: 0 })
    expect(errors.hours).toBe('Hours must be greater than 0')
  })

  it('requires hours to be at most 24', () => {
    const errors = validateTimeEntryForm({ ...validForm, hours: 25 })
    expect(errors.hours).toBe('Hours cannot exceed 24 per entry')
  })

  it('requires activityType', () => {
    const errors = validateTimeEntryForm({ ...validForm, activityType: '' })
    expect(errors.activityType).toBe('Activity type is required')
  })

  it('requires spentOn date', () => {
    const errors = validateTimeEntryForm({ ...validForm, spentOn: null as unknown as Date })
    expect(errors.spentOn).toBe('Date is required')
  })

  it('allows empty comments', () => {
    const errors = validateTimeEntryForm({ ...validForm, comments: '' })
    expect(errors.comments).toBeUndefined()
  })

  it('returns multiple errors when multiple fields invalid', () => {
    const errors = validateTimeEntryForm({
      issueId: '',
      hours: 0,
      activityType: '',
      spentOn: null as unknown as Date,
      comments: '',
    })
    expect(Object.keys(errors)).toHaveLength(4)
  })
})

describe('createTimeEntryFromForm', () => {
  const formData: TimeEntryFormData = {
    issueId: 'issue-1',
    hours: 3.5,
    activityType: 'Development',
    spentOn: new Date('2024-01-15'),
    comments: 'Implemented feature',
  }

  it('creates time entry with all fields', () => {
    const entry = createTimeEntryFromForm(formData, 'user-1')
    expect(entry.issueId).toBe('issue-1')
    expect(entry.userId).toBe('user-1')
    expect(entry.hours).toBe(3.5)
    expect(entry.activityType).toBe('Development')
    expect(entry.comments).toBe('Implemented feature')
  })

  it('generates unique id', () => {
    const entry1 = createTimeEntryFromForm(formData, 'user-1')
    const entry2 = createTimeEntryFromForm(formData, 'user-1')
    expect(entry1.id).not.toBe(entry2.id)
  })

  it('sets createdAt to current time', () => {
    const before = new Date()
    const entry = createTimeEntryFromForm(formData, 'user-1')
    const after = new Date()
    expect(entry.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
    expect(entry.createdAt.getTime()).toBeLessThanOrEqual(after.getTime())
  })

  it('preserves spentOn date', () => {
    const entry = createTimeEntryFromForm(formData, 'user-1')
    expect(entry.spentOn.toISOString().split('T')[0]).toBe('2024-01-15')
  })
})
