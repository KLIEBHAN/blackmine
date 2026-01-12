// Core domain types for Redmine Clone

export type IssueStatus = 'new' | 'in_progress' | 'resolved' | 'closed' | 'rejected'
export type IssuePriority = 'low' | 'normal' | 'high' | 'urgent' | 'immediate'
export type IssueTracker = 'bug' | 'feature' | 'support' | 'task'
export type ProjectStatus = 'active' | 'archived' | 'closed'
export type UserRole = 'admin' | 'manager' | 'developer' | 'reporter'

// Shared utility types
export type SortDirection = 'asc' | 'desc'

// Display labels for enum types
export const statusLabels: Record<IssueStatus, string> = {
  new: 'New',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
  rejected: 'Rejected',
}

export const trackerLabels: Record<IssueTracker, string> = {
  bug: 'Bug',
  feature: 'Feature',
  support: 'Support',
  task: 'Task',
}

export const priorityLabels: Record<IssuePriority, string> = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
  urgent: 'Urgent',
  immediate: 'Immediate',
}

export const projectStatusLabels: Record<ProjectStatus, string> = {
  active: 'Active',
  archived: 'Archived',
  closed: 'Closed',
}

// All values arrays - derived from label keys for type-safety
export const allIssueStatuses = Object.keys(statusLabels) as IssueStatus[]
export const allIssueTrackers = Object.keys(trackerLabels) as IssueTracker[]
export const allIssuePriorities = Object.keys(priorityLabels) as IssuePriority[]
export const allProjectStatuses = Object.keys(projectStatusLabels) as ProjectStatus[]

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  createdAt: Date
}

export interface Project {
  id: string
  name: string
  identifier: string // URL-safe identifier
  description: string
  status: ProjectStatus
  createdAt: Date
  updatedAt: Date
}

export interface Issue {
  id: string
  projectId: string
  tracker: IssueTracker
  subject: string
  description: string
  status: IssueStatus
  priority: IssuePriority
  assigneeId: string | null
  authorId: string
  dueDate: Date | null
  estimatedHours: number | null
  createdAt: Date
  updatedAt: Date
}

export interface TimeEntry {
  id: string
  issueId: string
  userId: string
  hours: number
  comments: string
  activityType: string
  spentOn: Date
  createdAt: Date
}

export interface Comment {
  id: string
  issueId: string
  authorId: string
  content: string
  createdAt: Date
  updatedAt: Date
}

// Helper functions
export function getFullName(user: User): string {
  return `${user.firstName} ${user.lastName}`.trim()
}

export function isOverdue(issue: Pick<Issue, 'status' | 'dueDate'>): boolean {
  if (!issue.dueDate || issue.status === 'closed' || issue.status === 'rejected') {
    return false
  }
  return new Date(issue.dueDate) < new Date()
}

export function getPriorityOrder(priority: IssuePriority): number {
  const order: Record<IssuePriority, number> = {
    immediate: 5,
    urgent: 4,
    high: 3,
    normal: 2,
    low: 1,
  }
  return order[priority]
}
