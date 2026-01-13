'use client'

import { useState, useMemo } from 'react'
import { cn, formatShortId } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { FilterDropdown } from '@/components/ui/filter-dropdown'
import type { ProjectStatus, IssueTracker } from '@/types'
import { projectStatusLabels, allProjectStatuses, projectStatusColors } from '@/types'
import { filterProjects } from '@/lib/projects'
import { Search, Plus, ListFilter, X, FolderKanban } from 'lucide-react'
import { TrackerIcon } from '@/components/ui/tracker-icon'
import Link from 'next/link'

// Serialized project type from server
export type SerializedProject = {
  id: string
  name: string
  identifier: string
  description: string
  status: string
  createdAt: string
  updatedAt: string
  _count: {
    issues: number
  }
}

// Serialized issue for stats calculation
export type SerializedIssueForStats = {
  id: string
  projectId: string
  status: string
  tracker: string
}

type Props = {
  projects: SerializedProject[]
  issues: SerializedIssueForStats[]
  totalCount: number
}

// Calculate project stats from issues
function getProjectStats(projectId: string, issues: SerializedIssueForStats[]) {
  const projectIssues = issues.filter((i) => i.projectId === projectId)
  const openIssues = projectIssues.filter((i) => i.status !== 'closed').length
  const closedIssues = projectIssues.filter((i) => i.status === 'closed').length
  const totalIssues = projectIssues.length
  const progress = totalIssues > 0 ? (closedIssues / totalIssues) * 100 : 0

  const byTracker: Record<string, number> = {}
  for (const issue of projectIssues) {
    byTracker[issue.tracker] = (byTracker[issue.tracker] || 0) + 1
  }

  return { totalIssues, openIssues, closedIssues, progress, byTracker }
}

export function ProjectsList({ projects, issues, totalCount }: Props) {
  const [search, setSearch] = useState('')
  const [selectedStatuses, setSelectedStatuses] = useState<ProjectStatus[]>(['active'])

  // Apply filters
  const filteredProjects = useMemo(() => {
    return filterProjects(projects, {
      status: selectedStatuses.length > 0 ? selectedStatuses : undefined,
      search: search || undefined,
    })
  }, [projects, search, selectedStatuses])

  const toggleStatus = (status: ProjectStatus) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    )
  }

  const clearFilters = () => {
    setSelectedStatuses([])
    setSearch('')
  }

  const activeFilterCount = selectedStatuses.length

  return (
    <div className="grid-pattern min-h-full">
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Page Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              <span className="font-mono">{filteredProjects.length}</span> of{' '}
              <span className="font-mono">{totalCount}</span> projects
            </p>
          </div>
          <Button className="gap-2" asChild>
            <Link href="/projects/new">
              <Plus className="size-4" />
              New Project
            </Link>
          </Button>
        </div>

        {/* Filter Bar */}
        <Card className="mb-6 opacity-0 animate-card-in delay-1">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              {/* Search */}
              <div className="relative flex-1 min-w-0 sm:min-w-[200px]">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search projects..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 font-sans"
                />
              </div>

              {/* Filters Row */}
              <div className="flex items-center gap-2 sm:gap-3">
              {/* Status Filter */}
              <FilterDropdown<ProjectStatus>
                label="Status"
                menuLabel="Filter by Status"
                icon={ListFilter}
                options={allProjectStatuses.map((s) => ({
                  value: s,
                  label: projectStatusLabels[s],
                  render: (
                    <Badge variant="outline" className={cn('mr-2 rounded-sm px-1.5 py-0 text-[10px]', projectStatusColors[s])}>
                      {projectStatusLabels[s]}
                    </Badge>
                  ),
                }))}
                selected={selectedStatuses}
                onToggle={toggleStatus}
              />

              {/* Clear Filters */}
              {(activeFilterCount > 0 || search) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="gap-1.5 text-muted-foreground hover:text-foreground shrink-0"
                  aria-label="Clear all filters"
                >
                  <X className="size-3.5" />
                  Clear
                </Button>
              )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <Card className="opacity-0 animate-card-in delay-2">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FolderKanban className="size-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No projects found</p>
              {(activeFilterCount > 0 || search) && (
                <Button variant="link" size="sm" onClick={clearFilters} className="mt-2" aria-label="Clear all filters">
                  Clear filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project, index) => {
              const stats = getProjectStats(project.id, issues)

              return (
                <Card
                  key={project.id}
                  className="group opacity-0 animate-card-in hover:shadow-md transition-shadow"
                  style={{ animationDelay: `${(index + 2) * 50}ms` }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/projects/${project.identifier}`}
                          className="block"
                        >
                          <CardTitle className="text-lg font-semibold leading-tight hover:text-primary transition-colors truncate">
                            {project.name}
                          </CardTitle>
                        </Link>
                        <p className="mt-0.5 text-xs font-mono text-muted-foreground">
                          {formatShortId(project.identifier)}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn('shrink-0 rounded-sm px-1.5 py-0 text-[10px]', projectStatusColors[project.status as ProjectStatus])}
                      >
                        {projectStatusLabels[project.status as ProjectStatus]}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {project.description}
                    </p>

                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-mono font-medium">
                          {stats.progress.toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${stats.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Issue Stats */}
                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>
                          <span className="font-mono font-medium text-foreground">{stats.openIssues}</span> open
                        </span>
                        <span>
                          <span className="font-mono font-medium text-foreground">{stats.closedIssues}</span> closed
                        </span>
                      </div>

                      {/* Tracker breakdown */}
                      <div className="flex items-center gap-1.5">
                        {Object.entries(stats.byTracker).map(([tracker, count]) => {
                          if (count === 0) return null
                          return (
                            <div
                              key={tracker}
                              className="flex items-center gap-0.5 text-xs text-muted-foreground"
                              title={`${count} ${tracker}${count !== 1 ? 's' : ''}`}
                            >
                              <TrackerIcon tracker={tracker as IssueTracker} className="size-3.5" />
                              <span className="font-mono">{count}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
