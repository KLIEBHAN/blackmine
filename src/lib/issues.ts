// Issue utility functions for filtering, sorting, and searching

import type { Issue, IssueStatus, IssuePriority, IssueTracker, SortDirection } from '@/types'
import { getPriorityOrder } from '@/types'

export interface IssueFilters {
  status?: IssueStatus | IssueStatus[]
  priority?: IssuePriority | IssuePriority[]
  tracker?: IssueTracker | IssueTracker[]
  projectId?: string | string[]
  assigneeId?: string | null // null = unassigned
  search?: string
}

export type IssueSortField = 'priority' | 'status' | 'createdAt' | 'updatedAt' | 'dueDate' | 'subject'

export interface IssueSort {
  field: IssueSortField
  direction: SortDirection
}

/**
 * Filter issues based on provided criteria
 */
export function filterIssues(issues: Issue[], filters: IssueFilters): Issue[] {
  return issues.filter((issue) => {
    // Status filter
    if (filters.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status]
      if (!statuses.includes(issue.status)) return false
    }

    // Priority filter
    if (filters.priority) {
      const priorities = Array.isArray(filters.priority) ? filters.priority : [filters.priority]
      if (!priorities.includes(issue.priority)) return false
    }

    // Tracker filter
    if (filters.tracker) {
      const trackers = Array.isArray(filters.tracker) ? filters.tracker : [filters.tracker]
      if (!trackers.includes(issue.tracker)) return false
    }

    // Project filter
    if (filters.projectId) {
      const projectIds = Array.isArray(filters.projectId) ? filters.projectId : [filters.projectId]
      if (!projectIds.includes(issue.projectId)) return false
    }

    // Assignee filter (null means unassigned)
    if (filters.assigneeId !== undefined) {
      if (filters.assigneeId === null && issue.assigneeId !== null) return false
      if (filters.assigneeId !== null && issue.assigneeId !== filters.assigneeId) return false
    }

    // Search filter (trimmed, searches subject, description, and id)
    if (filters.search) {
      const search = filters.search.trim()
      if (search) {
        const searchLower = search.toLowerCase()
        const matchesSubject = issue.subject.toLowerCase().includes(searchLower)
        const matchesDescription = issue.description.toLowerCase().includes(searchLower)
        const matchesId = issue.id.toLowerCase().includes(searchLower)
        if (!matchesSubject && !matchesDescription && !matchesId) return false
      }
    }

    return true
  })
}

/**
 * Sort issues by specified field and direction
 */
export function sortIssues(issues: Issue[], sort: IssueSort): Issue[] {
  const sorted = [...issues]
  const multiplier = sort.direction === 'asc' ? 1 : -1

  sorted.sort((a, b) => {
    switch (sort.field) {
      case 'priority':
        // Higher priority order = higher priority, so desc means highest first
        return (getPriorityOrder(a.priority) - getPriorityOrder(b.priority)) * multiplier

      case 'status': {
        const statusOrder: Record<IssueStatus, number> = {
          new: 1,
          in_progress: 2,
          resolved: 3,
          closed: 4,
          rejected: 5,
        }
        return (statusOrder[a.status] - statusOrder[b.status]) * multiplier
      }

      case 'createdAt':
        return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * multiplier

      case 'updatedAt':
        return (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()) * multiplier

      case 'dueDate': {
        // Issues without due date go to the end
        if (!a.dueDate && !b.dueDate) return 0
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return (new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()) * multiplier
      }

      case 'subject':
        return a.subject.localeCompare(b.subject) * multiplier

      default:
        return 0
    }
  })

  return sorted
}

/**
 * Get open issues (not closed or rejected)
 */
export function getOpenIssues(issues: Issue[]): Issue[] {
  return filterIssues(issues, {
    status: ['new', 'in_progress', 'resolved'],
  })
}

/**
 * Get closed issues
 */
export function getClosedIssues(issues: Issue[]): Issue[] {
  return filterIssues(issues, {
    status: ['closed', 'rejected'],
  })
}

/**
 * Find a single issue by ID
 */
export function getIssueById(issues: Issue[], id: string): Issue | undefined {
  return issues.find((issue) => issue.id === id)
}

/**
 * Delete an issue from the array (mutates in-place)
 * Returns true if deleted, false if not found
 */
export function deleteIssue(issues: Issue[], id: string): boolean {
  const index = issues.findIndex((issue) => issue.id === id)
  if (index === -1) return false
  issues.splice(index, 1)
  return true
}
