import type { Project, Issue, ProjectStatus, IssueTracker } from '@/types'

export interface ProjectFilters {
  status?: ProjectStatus[]
  search?: string
}

export interface ProjectStats {
  totalIssues: number
  openIssues: number
  closedIssues: number
  progress: number
  byTracker: Record<IssueTracker, number>
}

/**
 * Filter projects by status and search term
 */
export function filterProjects(projects: Project[], filters: ProjectFilters): Project[] {
  return projects.filter((project) => {
    // Status filter
    if (filters.status?.length && !filters.status.includes(project.status)) {
      return false
    }

    // Search filter (name, description, identifier)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const searchFields = [project.name, project.description, project.identifier]
      if (!searchFields.some((field) => field.toLowerCase().includes(searchLower))) {
        return false
      }
    }

    return true
  })
}

/**
 * Calculate statistics for a project based on its issues
 */
export function getProjectStats(projectId: string, issues: Issue[]): ProjectStats {
  const projectIssues = issues.filter((issue) => issue.projectId === projectId)

  const openStatuses = ['new', 'in_progress']
  const closedStatuses = ['closed', 'resolved', 'rejected']

  const openIssues = projectIssues.filter((issue) => openStatuses.includes(issue.status)).length
  const closedIssues = projectIssues.filter((issue) => closedStatuses.includes(issue.status)).length
  const totalIssues = projectIssues.length

  const progress = totalIssues > 0 ? (closedIssues / totalIssues) * 100 : 0

  const byTracker: Record<IssueTracker, number> = {
    bug: 0,
    feature: 0,
    support: 0,
    task: 0,
  }

  for (const issue of projectIssues) {
    byTracker[issue.tracker]++
  }

  return {
    totalIssues,
    openIssues,
    closedIssues,
    progress,
    byTracker,
  }
}

/**
 * Find a project by its URL-safe identifier
 */
export function getProjectByIdentifier(projects: Project[], identifier: string): Project | undefined {
  return projects.find((project) => project.identifier === identifier)
}

/**
 * Find a project by its ID
 */
export function getProjectById(projects: Project[], id: string): Project | undefined {
  return projects.find((project) => project.id === id)
}

/**
 * Delete a project by ID (returns new array)
 */
export function deleteProject(projects: Project[], id: string): Project[] {
  return projects.filter((project) => project.id !== id)
}

/**
 * Delete a project by identifier (returns new array)
 */
export function deleteProjectByIdentifier(projects: Project[], identifier: string): Project[] {
  return projects.filter((project) => project.identifier !== identifier)
}
