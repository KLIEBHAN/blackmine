import { describe, it, expect } from 'vitest'
import {
  validateProjectForm,
  createProjectFromForm,
  updateProjectFromForm,
  type ProjectFormData,
} from './project-form'
import type { Project } from '@/types'

describe('validateProjectForm', () => {
  const validData: ProjectFormData = {
    name: 'Test Project',
    identifier: 'test-project',
    description: 'A test project description',
    status: 'active',
  }

  it('returns no errors for valid data', () => {
    const errors = validateProjectForm(validData)
    expect(errors).toEqual({})
  })

  describe('name validation', () => {
    it('requires name', () => {
      const errors = validateProjectForm({ ...validData, name: '' })
      expect(errors.name).toBe('Name is required')
    })

    it('requires name to be at least 2 characters', () => {
      const errors = validateProjectForm({ ...validData, name: 'A' })
      expect(errors.name).toBe('Name must be at least 2 characters')
    })

    it('requires name to be at most 100 characters', () => {
      const errors = validateProjectForm({ ...validData, name: 'A'.repeat(101) })
      expect(errors.name).toBe('Name must be at most 100 characters')
    })
  })

  describe('identifier validation', () => {
    it('requires identifier', () => {
      const errors = validateProjectForm({ ...validData, identifier: '' })
      expect(errors.identifier).toBe('Identifier is required')
    })

    it('requires identifier to be at least 2 characters', () => {
      const errors = validateProjectForm({ ...validData, identifier: 'a' })
      expect(errors.identifier).toBe('Identifier must be at least 2 characters')
    })

    it('requires identifier to be at most 50 characters', () => {
      const errors = validateProjectForm({ ...validData, identifier: 'a'.repeat(51) })
      expect(errors.identifier).toBe('Identifier must be at most 50 characters')
    })

    it('requires identifier to be URL-safe (lowercase, hyphens, numbers)', () => {
      const errors = validateProjectForm({ ...validData, identifier: 'test-project!' })
      expect(errors.identifier).toBe('Identifier must contain only lowercase letters, numbers, and hyphens')
    })

    it('accepts valid URL-safe identifier', () => {
      const errors = validateProjectForm({ ...validData, identifier: 'my-project-123' })
      expect(errors.identifier).toBeUndefined()
    })

    it('rejects identifier starting with hyphen', () => {
      const errors = validateProjectForm({ ...validData, identifier: '-project' })
      expect(errors.identifier).toBe('Identifier must start with a letter')
    })

    it('rejects identifier starting with number', () => {
      const errors = validateProjectForm({ ...validData, identifier: '123project' })
      expect(errors.identifier).toBe('Identifier must start with a letter')
    })
  })

  describe('status validation', () => {
    it('requires status', () => {
      const errors = validateProjectForm({ ...validData, status: '' as unknown as 'active' })
      expect(errors.status).toBe('Status is required')
    })
  })
})

describe('createProjectFromForm', () => {
  const formData: ProjectFormData = {
    name: 'New Project',
    identifier: 'new-project',
    description: 'Description',
    status: 'active',
  }

  it('creates project with generated id', () => {
    const project = createProjectFromForm(formData)
    expect(project.id).toMatch(/^proj-/)
  })

  it('sets all form fields', () => {
    const project = createProjectFromForm(formData)
    expect(project.name).toBe('New Project')
    expect(project.identifier).toBe('new-project')
    expect(project.description).toBe('Description')
    expect(project.status).toBe('active')
  })

  it('sets createdAt and updatedAt to now', () => {
    const before = new Date()
    const project = createProjectFromForm(formData)
    const after = new Date()
    expect(project.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
    expect(project.createdAt.getTime()).toBeLessThanOrEqual(after.getTime())
    expect(project.updatedAt.getTime()).toBe(project.createdAt.getTime())
  })
})

describe('updateProjectFromForm', () => {
  const existingProject: Project = {
    id: 'proj-123',
    name: 'Old Name',
    identifier: 'old-identifier',
    description: 'Old description',
    status: 'active',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  }

  const formData: ProjectFormData = {
    name: 'Updated Name',
    identifier: 'updated-identifier',
    description: 'Updated description',
    status: 'archived',
  }

  it('preserves id', () => {
    const updated = updateProjectFromForm(existingProject, formData)
    expect(updated.id).toBe('proj-123')
  })

  it('preserves createdAt', () => {
    const updated = updateProjectFromForm(existingProject, formData)
    expect(updated.createdAt).toEqual(new Date('2024-01-01'))
  })

  it('updates all form fields', () => {
    const updated = updateProjectFromForm(existingProject, formData)
    expect(updated.name).toBe('Updated Name')
    expect(updated.identifier).toBe('updated-identifier')
    expect(updated.description).toBe('Updated description')
    expect(updated.status).toBe('archived')
  })

  it('sets updatedAt to now', () => {
    const before = new Date()
    const updated = updateProjectFromForm(existingProject, formData)
    const after = new Date()
    expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
    expect(updated.updatedAt.getTime()).toBeLessThanOrEqual(after.getTime())
  })
})
