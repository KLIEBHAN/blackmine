import { describe, it, expect } from 'vitest'
import {
  validateUserForm,
  createUserFromForm,
  updateUserFromForm,
  type UserFormData,
} from './user-form'
import type { User } from '@/types'

describe('validateUserForm', () => {
  const validData: UserFormData = {
    email: 'john@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'developer',
  }

  it('returns no errors for valid data', () => {
    const errors = validateUserForm(validData)
    expect(Object.keys(errors)).toHaveLength(0)
  })

  describe('email validation', () => {
    it('requires email', () => {
      const errors = validateUserForm({ ...validData, email: '' })
      expect(errors.email).toBe('Email is required')
    })

    it('requires valid email format', () => {
      const errors = validateUserForm({ ...validData, email: 'invalid' })
      expect(errors.email).toBe('Invalid email format')
    })

    it('requires @ symbol', () => {
      const errors = validateUserForm({ ...validData, email: 'john.example.com' })
      expect(errors.email).toBe('Invalid email format')
    })

    it('accepts valid email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.org',
        'user+tag@company.co.uk',
      ]
      validEmails.forEach((email) => {
        const errors = validateUserForm({ ...validData, email })
        expect(errors.email).toBeUndefined()
      })
    })
  })

  describe('firstName validation', () => {
    it('requires firstName', () => {
      const errors = validateUserForm({ ...validData, firstName: '' })
      expect(errors.firstName).toBe('First name is required')
    })

    it('requires at least 2 characters', () => {
      const errors = validateUserForm({ ...validData, firstName: 'J' })
      expect(errors.firstName).toBe('First name must be at least 2 characters')
    })

    it('accepts valid firstName', () => {
      const errors = validateUserForm({ ...validData, firstName: 'Jo' })
      expect(errors.firstName).toBeUndefined()
    })
  })

  describe('lastName validation', () => {
    it('requires lastName', () => {
      const errors = validateUserForm({ ...validData, lastName: '' })
      expect(errors.lastName).toBe('Last name is required')
    })

    it('requires at least 2 characters', () => {
      const errors = validateUserForm({ ...validData, lastName: 'D' })
      expect(errors.lastName).toBe('Last name must be at least 2 characters')
    })

    it('accepts valid lastName', () => {
      const errors = validateUserForm({ ...validData, lastName: 'Do' })
      expect(errors.lastName).toBeUndefined()
    })
  })

  describe('role validation', () => {
    it('requires role', () => {
      const errors = validateUserForm({ ...validData, role: '' as never })
      expect(errors.role).toBe('Role is required')
    })

    it('accepts valid roles', () => {
      const roles = ['admin', 'manager', 'developer', 'reporter'] as const
      roles.forEach((role) => {
        const errors = validateUserForm({ ...validData, role })
        expect(errors.role).toBeUndefined()
      })
    })
  })

  describe('duplicate email check', () => {
    const existingEmails = ['existing@example.com', 'taken@company.org']

    it('rejects duplicate email', () => {
      const errors = validateUserForm(
        { ...validData, email: 'existing@example.com' },
        existingEmails
      )
      expect(errors.email).toBe('Email already exists')
    })

    it('is case-insensitive', () => {
      const errors = validateUserForm(
        { ...validData, email: 'EXISTING@example.com' },
        existingEmails
      )
      expect(errors.email).toBe('Email already exists')
    })

    it('allows email when excluded', () => {
      const errors = validateUserForm(
        { ...validData, email: 'existing@example.com' },
        existingEmails,
        'existing@example.com' // exclude self when editing
      )
      expect(errors.email).toBeUndefined()
    })
  })
})

describe('createUserFromForm', () => {
  const formData: UserFormData = {
    email: 'new@example.com',
    firstName: 'New',
    lastName: 'User',
    role: 'developer',
  }

  it('creates user with all form data', () => {
    const user = createUserFromForm(formData)
    expect(user.email).toBe('new@example.com')
    expect(user.firstName).toBe('New')
    expect(user.lastName).toBe('User')
    expect(user.role).toBe('developer')
  })

  it('generates unique id', () => {
    const user1 = createUserFromForm(formData)
    const user2 = createUserFromForm(formData)
    expect(user1.id).not.toBe(user2.id)
    expect(user1.id).toMatch(/^user-/)
  })

  it('sets createdAt to now', () => {
    const before = new Date()
    const user = createUserFromForm(formData)
    const after = new Date()
    expect(user.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
    expect(user.createdAt.getTime()).toBeLessThanOrEqual(after.getTime())
  })

  it('normalizes email to lowercase', () => {
    const user = createUserFromForm({ ...formData, email: 'NEW@EXAMPLE.COM' })
    expect(user.email).toBe('new@example.com')
  })

  it('trims whitespace from names', () => {
    const user = createUserFromForm({
      ...formData,
      firstName: '  John  ',
      lastName: '  Doe  ',
    })
    expect(user.firstName).toBe('John')
    expect(user.lastName).toBe('Doe')
  })
})

describe('updateUserFromForm', () => {
  const existingUser: User = {
    id: 'user-existing',
    email: 'old@example.com',
    firstName: 'Old',
    lastName: 'User',
    role: 'reporter',
    createdAt: new Date('2024-01-01'),
  }

  const updateData: UserFormData = {
    email: 'updated@example.com',
    firstName: 'Updated',
    lastName: 'Person',
    role: 'manager',
  }

  it('updates all fields', () => {
    const updated = updateUserFromForm(existingUser, updateData)
    expect(updated.email).toBe('updated@example.com')
    expect(updated.firstName).toBe('Updated')
    expect(updated.lastName).toBe('Person')
    expect(updated.role).toBe('manager')
  })

  it('preserves id', () => {
    const updated = updateUserFromForm(existingUser, updateData)
    expect(updated.id).toBe('user-existing')
  })

  it('preserves createdAt', () => {
    const updated = updateUserFromForm(existingUser, updateData)
    expect(updated.createdAt).toEqual(new Date('2024-01-01'))
  })

  it('normalizes email to lowercase', () => {
    const updated = updateUserFromForm(existingUser, {
      ...updateData,
      email: 'UPDATED@EXAMPLE.COM',
    })
    expect(updated.email).toBe('updated@example.com')
  })
})
