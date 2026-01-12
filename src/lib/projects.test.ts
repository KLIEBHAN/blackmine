import { describe, it, expect } from 'vitest'
import {
  filterProjects,
  getProjectStats,
  getProjectByIdentifier,
  getProjectById,
  deleteProject,
  deleteProjectByIdentifier,
} from './projects'
import type { Project, Issue } from '@/types'

const mockProjects: Project[] = [
  {
    id: 'proj-1',
    name: 'Website Redesign',
    identifier: 'website-redesign',
    description: 'Complete overhaul of the company website',
    status: 'active',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-03-15'),
  },
  {
    id: 'proj-2',
    name: 'Mobile App',
    identifier: 'mobile-app',
    description: 'iOS and Android mobile application',
    status: 'active',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-03-20'),
  },
  {
    id: 'proj-3',
    name: 'Legacy System',
    identifier: 'legacy-system',
    description: 'Old system being phased out',
    status: 'archived',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'proj-4',
    name: 'Completed Project',
    identifier: 'completed-project',
    description: 'A project that is done',
    status: 'closed',
    createdAt: new Date('2023-06-01'),
    updatedAt: new Date('2024-02-01'),
  },
]

const mockIssues: Issue[] = [
  {
    id: 'issue-1',
    projectId: 'proj-1',
    tracker: 'bug',
    subject: 'Bug 1',
    description: '',
    status: 'new',
    priority: 'high',
    assigneeId: 'user-1',
    authorId: 'user-1',
    dueDate: null,
    estimatedHours: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'issue-2',
    projectId: 'proj-1',
    tracker: 'feature',
    subject: 'Feature 1',
    description: '',
    status: 'in_progress',
    priority: 'normal',
    assigneeId: 'user-2',
    authorId: 'user-1',
    dueDate: null,
    estimatedHours: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'issue-3',
    projectId: 'proj-1',
    tracker: 'task',
    subject: 'Task 1',
    description: '',
    status: 'closed',
    priority: 'low',
    assigneeId: null,
    authorId: 'user-1',
    dueDate: null,
    estimatedHours: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'issue-4',
    projectId: 'proj-2',
    tracker: 'bug',
    subject: 'Bug 2',
    description: '',
    status: 'new',
    priority: 'urgent',
    assigneeId: 'user-1',
    authorId: 'user-2',
    dueDate: null,
    estimatedHours: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

describe('filterProjects', () => {
  it('returns all projects when no filters applied', () => {
    const result = filterProjects(mockProjects, {})
    expect(result).toHaveLength(4)
  })

  it('filters by status', () => {
    const result = filterProjects(mockProjects, { status: ['active'] })
    expect(result).toHaveLength(2)
    expect(result.every((p) => p.status === 'active')).toBe(true)
  })

  it('filters by multiple statuses', () => {
    const result = filterProjects(mockProjects, { status: ['active', 'archived'] })
    expect(result).toHaveLength(3)
  })

  it('filters by search term in name', () => {
    const result = filterProjects(mockProjects, { search: 'Mobile' })
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Mobile App')
  })

  it('filters by search term in description', () => {
    const result = filterProjects(mockProjects, { search: 'overhaul' })
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Website Redesign')
  })

  it('filters by search term in identifier', () => {
    const result = filterProjects(mockProjects, { search: 'legacy' })
    expect(result).toHaveLength(1)
    expect(result[0].identifier).toBe('legacy-system')
  })

  it('search is case-insensitive', () => {
    const result = filterProjects(mockProjects, { search: 'MOBILE' })
    expect(result).toHaveLength(1)
  })

  it('combines status and search filters', () => {
    const result = filterProjects(mockProjects, { status: ['active'], search: 'app' })
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Mobile App')
  })

  it('returns empty array when no matches', () => {
    const result = filterProjects(mockProjects, { search: 'nonexistent' })
    expect(result).toHaveLength(0)
  })
})

describe('getProjectStats', () => {
  it('calculates total issues', () => {
    const stats = getProjectStats('proj-1', mockIssues)
    expect(stats.totalIssues).toBe(3)
  })

  it('calculates open issues', () => {
    const stats = getProjectStats('proj-1', mockIssues)
    expect(stats.openIssues).toBe(2) // new + in_progress
  })

  it('calculates closed issues', () => {
    const stats = getProjectStats('proj-1', mockIssues)
    expect(stats.closedIssues).toBe(1)
  })

  it('calculates progress percentage', () => {
    const stats = getProjectStats('proj-1', mockIssues)
    // 1 closed out of 3 = 33.33%
    expect(stats.progress).toBeCloseTo(33.33, 1)
  })

  it('handles project with no issues', () => {
    const stats = getProjectStats('proj-3', mockIssues)
    expect(stats.totalIssues).toBe(0)
    expect(stats.openIssues).toBe(0)
    expect(stats.closedIssues).toBe(0)
    expect(stats.progress).toBe(0)
  })

  it('counts issues by tracker', () => {
    const stats = getProjectStats('proj-1', mockIssues)
    expect(stats.byTracker.bug).toBe(1)
    expect(stats.byTracker.feature).toBe(1)
    expect(stats.byTracker.task).toBe(1)
    expect(stats.byTracker.support).toBe(0)
  })
})

describe('getProjectByIdentifier', () => {
  it('finds project by identifier', () => {
    const project = getProjectByIdentifier(mockProjects, 'mobile-app')
    expect(project).toBeDefined()
    expect(project?.name).toBe('Mobile App')
  })

  it('returns undefined for non-existent identifier', () => {
    const project = getProjectByIdentifier(mockProjects, 'nonexistent')
    expect(project).toBeUndefined()
  })
})

describe('getProjectById', () => {
  it('finds project by id', () => {
    const project = getProjectById(mockProjects, 'proj-2')
    expect(project).toBeDefined()
    expect(project?.name).toBe('Mobile App')
  })

  it('returns undefined for non-existent id', () => {
    const project = getProjectById(mockProjects, 'proj-999')
    expect(project).toBeUndefined()
  })
})

describe('deleteProject', () => {
  it('removes project from array', () => {
    const projects = [...mockProjects]
    const result = deleteProject(projects, 'proj-1')
    expect(result).toHaveLength(3)
    expect(result.find((p) => p.id === 'proj-1')).toBeUndefined()
  })

  it('returns unchanged array if project not found', () => {
    const projects = [...mockProjects]
    const result = deleteProject(projects, 'nonexistent')
    expect(result).toHaveLength(4)
  })

  it('does not mutate original array', () => {
    const projects = [...mockProjects]
    const originalLength = projects.length
    deleteProject(projects, 'proj-1')
    expect(projects).toHaveLength(originalLength)
  })

  it('can delete by identifier', () => {
    const projects = [...mockProjects]
    const result = deleteProjectByIdentifier(projects, 'mobile-app')
    expect(result).toHaveLength(3)
    expect(result.find((p) => p.identifier === 'mobile-app')).toBeUndefined()
  })
})
