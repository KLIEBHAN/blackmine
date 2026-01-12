import type { Project, ProjectStatus } from '@/types'
import { generateId } from './utils'

export interface ProjectFormData {
  name: string
  identifier: string
  description: string
  status: ProjectStatus
}

export interface ProjectFormErrors {
  name?: string
  identifier?: string
  description?: string
  status?: string
}

const IDENTIFIER_PATTERN = /^[a-z][a-z0-9-]*$/

export function validateProjectForm(data: ProjectFormData): ProjectFormErrors {
  const errors: ProjectFormErrors = {}

  // Name validation
  if (!data.name) {
    errors.name = 'Name is required'
  } else if (data.name.length < 2) {
    errors.name = 'Name must be at least 2 characters'
  } else if (data.name.length > 100) {
    errors.name = 'Name must be at most 100 characters'
  }

  // Identifier validation
  if (!data.identifier) {
    errors.identifier = 'Identifier is required'
  } else if (data.identifier.length < 2) {
    errors.identifier = 'Identifier must be at least 2 characters'
  } else if (data.identifier.length > 50) {
    errors.identifier = 'Identifier must be at most 50 characters'
  } else if (!/^[a-z]/.test(data.identifier)) {
    errors.identifier = 'Identifier must start with a letter'
  } else if (!IDENTIFIER_PATTERN.test(data.identifier)) {
    errors.identifier = 'Identifier must contain only lowercase letters, numbers, and hyphens'
  }

  // Status validation
  if (!data.status) {
    errors.status = 'Status is required'
  }

  return errors
}

export function createProjectFromForm(data: ProjectFormData): Project {
  const now = new Date()
  return {
    id: generateId('proj'),
    name: data.name,
    identifier: data.identifier,
    description: data.description,
    status: data.status,
    createdAt: now,
    updatedAt: now,
  }
}

export function updateProjectFromForm(project: Project, data: ProjectFormData): Project {
  return {
    ...project,
    name: data.name,
    identifier: data.identifier,
    description: data.description,
    status: data.status,
    updatedAt: new Date(),
  }
}
