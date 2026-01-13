'use client'

import { useState, useMemo } from 'react'
import { cn, getInitials, formatDate, staggerDelay, formatShortId } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { FilterDropdown } from '@/components/ui/filter-dropdown'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { IssueStatus, IssueTracker, IssuePriority, Issue } from '@/types'
import { isOverdue, statusLabels, trackerLabels, priorityLabels, allIssueStatuses, allIssueTrackers, allIssuePriorities, getFullName } from '@/types'
import { filterIssues, sortIssues, type IssueSort, type IssueFilters } from '@/lib/issues'
import {
  AlertCircle,
  Search,
  Plus,
  X,
  ListFilter,
  Filter,
  SlidersHorizontal,
} from 'lucide-react'
import { SortIcon } from '@/components/ui/sort-icon'
import Link from 'next/link'

// Types for Prisma-returned data (serialized from server)
type IssueWithRelations = {
  id: string
  subject: string
  description: string
  tracker: string
  status: string
  priority: string
  dueDate: string | null
  estimatedHours: number | null
  createdAt: string
  updatedAt: string
  projectId: string
  authorId: string
  assigneeId: string | null
  project: {
    id: string
    name: string
    identifier: string
  }
  author: {
    id: string
    firstName: string
    lastName: string
  }
  assignee: {
    id: string
    firstName: string
    lastName: string
  } | null
}

// Convert serialized Prisma data to Issue type for filter utilities
function toIssue(issue: IssueWithRelations): Issue {
  return {
    id: issue.id,
    subject: issue.subject,
    description: issue.description,
    tracker: issue.tracker as IssueTracker,
    status: issue.status as IssueStatus,
    priority: issue.priority as IssuePriority,
    dueDate: issue.dueDate ? new Date(issue.dueDate) : null,
    estimatedHours: issue.estimatedHours,
    createdAt: new Date(issue.createdAt),
    updatedAt: new Date(issue.updatedAt),
    projectId: issue.projectId,
    authorId: issue.authorId,
    assigneeId: issue.assigneeId,
  }
}

type Props = {
  issues: IssueWithRelations[]
  totalCount: number
  hideHeader?: boolean
}

export function IssuesList({ issues, totalCount, hideHeader = false }: Props) {
  const [search, setSearch] = useState('')
  const [selectedStatuses, setSelectedStatuses] = useState<IssueStatus[]>([])
  const [selectedTrackers, setSelectedTrackers] = useState<IssueTracker[]>([])
  const [selectedPriorities, setSelectedPriorities] = useState<IssuePriority[]>([])
  const [sort, setSort] = useState<IssueSort>({ field: 'priority', direction: 'desc' })

  // Build filters
  const filters: IssueFilters = useMemo(() => ({
    status: selectedStatuses.length > 0 ? selectedStatuses : undefined,
    tracker: selectedTrackers.length > 0 ? selectedTrackers : undefined,
    priority: selectedPriorities.length > 0 ? selectedPriorities : undefined,
    search: search || undefined,
  }), [search, selectedStatuses, selectedTrackers, selectedPriorities])

  // Memoize conversion separately - only recalculates when issues prop changes
  const issueObjects = useMemo(() => issues.map(toIssue), [issues])
  
  // Filter and sort (recalculates on filter/sort changes, but not on conversion)
  const filteredIssues = useMemo(() => {
    const filtered = filterIssues(issueObjects, filters)
    const sorted = sortIssues(filtered, sort)
    // Map back to original issues with relations
    return sorted.map(fi => issues.find(i => i.id === fi.id)!)
  }, [issues, issueObjects, filters, sort])

  const activeFilterCount = selectedStatuses.length + selectedTrackers.length + selectedPriorities.length

  // Generic toggle for multi-select filters
  const toggle = <T,>(value: T, setter: React.Dispatch<React.SetStateAction<T[]>>) => {
    setter((prev) => prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value])
  }

  const clearFilters = () => {
    setSelectedStatuses([])
    setSelectedTrackers([])
    setSelectedPriorities([])
    setSearch('')
  }

  const toggleSort = (field: IssueSort['field']) => {
    setSort((prev) => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc',
    }))
  }

  return (
    <div className="grid-pattern min-h-full">
      <div className={cn("p-6 lg:p-8", hideHeader && "pt-0")}>
        {/* Page Header */}
        {!hideHeader && (
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Issues</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                <span className="font-mono">{filteredIssues.length}</span> of{' '}
                <span className="font-mono">{totalCount}</span> issues
              </p>
            </div>
            <Button asChild className="gap-2">
              <Link href="/issues/new">
                <Plus className="size-4" />
                New Issue
              </Link>
            </Button>
          </div>
        )}

        {/* Filter Bar */}
        <Card className="mb-6 opacity-0 animate-card-in delay-1">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search issues..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 font-sans"
                />
              </div>

              {/* Status Filter */}
              <FilterDropdown<IssueStatus>
                label="Status"
                menuLabel="Filter by Status"
                icon={ListFilter}
                options={allIssueStatuses.map((s) => ({
                  value: s,
                  label: statusLabels[s],
                  render: (
                    <Badge variant="secondary" className={cn('mr-2 rounded-sm px-1.5 py-0 text-[10px]', `status-${s}`)}>
                      {statusLabels[s]}
                    </Badge>
                  ),
                }))}
                selected={selectedStatuses}
                onToggle={(s) => toggle(s, setSelectedStatuses)}
              />

              {/* Tracker Filter */}
              <FilterDropdown<IssueTracker>
                label="Tracker"
                menuLabel="Filter by Tracker"
                icon={Filter}
                options={allIssueTrackers.map((t) => ({
                  value: t,
                  label: trackerLabels[t],
                  render: (
                    <Badge variant="secondary" className={cn('mr-2 rounded px-1.5 py-0 text-[10px]', `tracker-${t}`)}>
                      {trackerLabels[t]}
                    </Badge>
                  ),
                }))}
                selected={selectedTrackers}
                onToggle={(t) => toggle(t, setSelectedTrackers)}
                width="w-44"
              />

              {/* Priority Filter */}
              <FilterDropdown<IssuePriority>
                label="Priority"
                menuLabel="Filter by Priority"
                icon={SlidersHorizontal}
                options={allIssuePriorities.map((p) => ({
                  value: p,
                  label: priorityLabels[p],
                  render: (
                    <div className="flex items-center gap-2">
                      <div className={cn('priority-indicator h-4', `priority-${p}`)} />
                      <span>{priorityLabels[p]}</span>
                    </div>
                  ),
                }))}
                selected={selectedPriorities}
                onToggle={(p) => toggle(p, setSelectedPriorities)}
                width="w-44"
              />

              {/* Clear Filters */}
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="gap-1.5 text-muted-foreground hover:text-foreground"
                  aria-label={`Clear ${activeFilterCount} active filters`}
                >
                  <X className="size-3.5" />
                  Clear ({activeFilterCount})
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Issues Table */}
        <Card className="opacity-0 animate-card-in delay-2 overflow-hidden">
          <CardContent className="p-0">
            <Table className="table-fixed">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-8 pl-4"></TableHead>
                  <TableHead className="w-[40%] font-semibold">
                    <button
                      onClick={() => toggleSort('subject')}
                      className="flex items-center gap-1.5 hover:text-primary transition-colors"
                      aria-label="Sort by issue"
                    >
                      Issue
                      <SortIcon field="subject" currentField={sort.field} direction={sort.direction} />
                    </button>
                  </TableHead>
                  <TableHead className="font-semibold">Project</TableHead>
                  <TableHead className="font-semibold">
                    <button
                      onClick={() => toggleSort('status')}
                      className="flex items-center gap-1.5 hover:text-primary transition-colors"
                      aria-label="Sort by status"
                    >
                      Status
                      <SortIcon field="status" currentField={sort.field} direction={sort.direction} />
                    </button>
                  </TableHead>
                  <TableHead className="font-semibold">
                    <button
                      onClick={() => toggleSort('priority')}
                      className="flex items-center gap-1.5 hover:text-primary transition-colors"
                      aria-label="Sort by priority"
                    >
                      Priority
                      <SortIcon field="priority" currentField={sort.field} direction={sort.direction} />
                    </button>
                  </TableHead>
                  <TableHead className="font-semibold">Assignee</TableHead>
                  <TableHead className="pr-4 text-right font-semibold">
                    <button
                      onClick={() => toggleSort('dueDate')}
                      className="flex items-center justify-end gap-1.5 hover:text-primary transition-colors ml-auto"
                      aria-label="Sort by due date"
                    >
                      Due
                      <SortIcon field="dueDate" currentField={sort.field} direction={sort.direction} />
                    </button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIssues.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Search className="size-8 opacity-50" />
                        <p>No issues found</p>
                        {activeFilterCount > 0 && (
                          <Button variant="link" size="sm" onClick={clearFilters}>
                            Clear filters
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredIssues.map((issue, index) => {
                    const assigneeName = issue.assignee
                      ? getFullName(issue.assignee)
                      : null
                    const overdue = isOverdue(issue)

                    return (
                      <TableRow
                        key={issue.id}
                        className="group animate-fade-in"
                        style={staggerDelay(index)}
                      >
                        {/* Priority indicator */}
                        <TableCell className="pl-4 pr-0">
                          <div
                            className={cn(
                              'priority-indicator h-8',
                              `priority-${issue.priority}`
                            )}
                          />
                        </TableCell>

                        {/* Issue info */}
                        <TableCell>
                          <div className="flex flex-col gap-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="secondary"
                                className={cn('badge-tracker shrink-0', `tracker-${issue.tracker}`)}
                              >
                                {trackerLabels[issue.tracker as IssueTracker]}
                              </Badge>
                                <span className="font-mono text-xs text-muted-foreground">
                                  #{formatShortId(issue.id)}
                                </span>
                            </div>
                            <Link
                              href={`/issues/${issue.id}`}
                              className="font-medium hover:text-primary hover:underline truncate"
                              title={issue.subject}
                            >
                              {issue.subject}
                            </Link>
                          </div>
                        </TableCell>

                        {/* Project */}
                        <TableCell>
                          <Link
                            href={`/projects/${issue.project.identifier}`}
                            className="text-sm text-muted-foreground hover:text-primary hover:underline truncate block"
                            title={issue.project.name}
                          >
                            {issue.project.name}
                          </Link>
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={cn(
                              'rounded-sm px-2 py-0.5 text-xs font-medium',
                              `status-${issue.status}`
                            )}
                          >
                            {statusLabels[issue.status as IssueStatus]}
                          </Badge>
                        </TableCell>

                        {/* Priority */}
                        <TableCell>
                          <span
                            className={cn(
                              'text-sm font-medium',
                              issue.priority === 'urgent' && 'text-amber-600',
                              issue.priority === 'immediate' && 'text-red-600',
                              issue.priority === 'high' && 'text-orange-600'
                            )}
                          >
                            {priorityLabels[issue.priority as IssuePriority]}
                          </span>
                        </TableCell>

                        {/* Assignee */}
                        <TableCell>
                          {assigneeName ? (
                            <div className="flex items-center gap-2 min-w-0">
                              <Avatar className="size-6 shrink-0">
                                <AvatarFallback className="bg-muted text-[10px] font-medium">
                                  {getInitials(assigneeName)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm truncate" title={assigneeName}>{assigneeName}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Unassigned</span>
                          )}
                        </TableCell>

                        {/* Due date */}
                        <TableCell className="pr-4 text-right">
                          {issue.dueDate ? (
                            <div className="flex items-center justify-end gap-1.5">
                              {overdue && (
                                <AlertCircle className="size-3.5 text-red-500" />
                              )}
                              <span
                                className={cn(
                                  'font-mono text-sm',
                                  overdue && 'font-medium text-red-600'
                                )}
                              >
                                {formatDate(issue.dueDate, 'short')}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
