import type { Issue, IssueTracker, IssuePriority } from '@/types'
import { generateId } from './utils'

export interface IssueFormData {
  projectId: string
  tracker: IssueTracker
  subject: string
  description: string
  priority: IssuePriority
  assigneeId: string | null
  dueDate: Date | null
  estimatedHours: number | null
}

export interface IssueFormErrors {
  projectId?: string
  tracker?: string
  subject?: string
  description?: string
  priority?: string
  assigneeId?: string
  dueDate?: string
  estimatedHours?: string
}

export function validateIssueForm(data: IssueFormData): IssueFormErrors {
  const errors: IssueFormErrors = {}

  if (!data.projectId) {
    errors.projectId = 'Project is required'
  }

  if (!data.tracker) {
    errors.tracker = 'Tracker is required'
  }

  if (!data.subject) {
    errors.subject = 'Subject is required'
  } else if (data.subject.length < 3) {
    errors.subject = 'Subject must be at least 3 characters'
  } else if (data.subject.length > 255) {
    errors.subject = 'Subject must be at most 255 characters'
  }

  if (data.estimatedHours !== null && data.estimatedHours <= 0) {
    errors.estimatedHours = 'Estimated hours must be positive'
  }

  return errors
}

export function createIssueFromForm(data: IssueFormData, authorId: string): Issue {
  const now = new Date()
  return {
    id: generateId('issue'),
    projectId: data.projectId,
    tracker: data.tracker,
    subject: data.subject,
    description: data.description,
    status: 'new',
    priority: data.priority,
    assigneeId: data.assigneeId,
    authorId,
    dueDate: data.dueDate,
    estimatedHours: data.estimatedHours,
    createdAt: now,
    updatedAt: now,
  }
}

export function updateIssueFromForm(issue: Issue, data: IssueFormData): Issue {
  return {
    ...issue,
    projectId: data.projectId,
    tracker: data.tracker,
    subject: data.subject,
    description: data.description,
    priority: data.priority,
    assigneeId: data.assigneeId,
    dueDate: data.dueDate,
    estimatedHours: data.estimatedHours,
    updatedAt: new Date(),
  }
}
