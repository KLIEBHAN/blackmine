'use client'

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { IssueStatus, IssueTracker, IssuePriority, Issue } from '@/types'
import { isOverdue, statusLabels, trackerLabels, priorityLabels } from '@/types'
import { filterIssues, sortIssues, type IssueSort, type IssueFilters } from '@/lib/issues'
import {
  AlertCircle,
  Search,
  Plus,
  Filter,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  X,
  ListFilter,
  SlidersHorizontal,
} from 'lucide-react'
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

const allStatuses: IssueStatus[] = ['new', 'in_progress', 'resolved', 'closed', 'rejected']
const allTrackers: IssueTracker[] = ['bug', 'feature', 'support', 'task']
const allPriorities: IssuePriority[] = ['immediate', 'urgent', 'high', 'normal', 'low']

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function SortIcon({ field, currentSort }: { field: IssueSort['field']; currentSort: IssueSort }) {
  if (currentSort.field !== field) {
    return <ArrowUpDown className="size-3.5 text-muted-foreground/50" />
  }
  return currentSort.direction === 'desc' ? (
    <ChevronDown className="size-3.5 text-primary" />
  ) : (
    <ChevronUp className="size-3.5 text-primary" />
  )
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
}

export function IssuesList({ issues, totalCount }: Props) {
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
      <div className="mx-auto max-w-7xl p-6 lg:p-8">
        {/* Page Header */}
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <ListFilter className="size-4" />
                    Status
                    {selectedStatuses.length > 0 && (
                      <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs font-mono">
                        {selectedStatuses.length}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {allStatuses.map((status) => (
                    <DropdownMenuCheckboxItem
                      key={status}
                      checked={selectedStatuses.includes(status)}
                      onCheckedChange={() => toggle(status, setSelectedStatuses)}
                    >
                      <Badge
                        variant="secondary"
                        className={cn('mr-2 rounded-sm px-1.5 py-0 text-[10px]', `status-${status}`)}
                      >
                        {statusLabels[status]}
                      </Badge>
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Tracker Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter className="size-4" />
                    Tracker
                    {selectedTrackers.length > 0 && (
                      <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs font-mono">
                        {selectedTrackers.length}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-44">
                  <DropdownMenuLabel>Filter by Tracker</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {allTrackers.map((tracker) => (
                    <DropdownMenuCheckboxItem
                      key={tracker}
                      checked={selectedTrackers.includes(tracker)}
                      onCheckedChange={() => toggle(tracker, setSelectedTrackers)}
                    >
                      <Badge
                        variant="secondary"
                        className={cn('mr-2 rounded px-1.5 py-0 text-[10px]', `tracker-${tracker}`)}
                      >
                        {trackerLabels[tracker]}
                      </Badge>
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Priority Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <SlidersHorizontal className="size-4" />
                    Priority
                    {selectedPriorities.length > 0 && (
                      <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs font-mono">
                        {selectedPriorities.length}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-44">
                  <DropdownMenuLabel>Filter by Priority</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {allPriorities.map((priority) => (
                    <DropdownMenuCheckboxItem
                      key={priority}
                      checked={selectedPriorities.includes(priority)}
                      onCheckedChange={() => toggle(priority, setSelectedPriorities)}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={cn('priority-indicator h-4', `priority-${priority}`)}
                        />
                        <span>{priorityLabels[priority]}</span>
                      </div>
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Clear Filters */}
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="gap-1.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                  Clear ({activeFilterCount})
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Issues Table */}
        <Card className="opacity-0 animate-card-in delay-2">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-12 pl-4"></TableHead>
                  <TableHead className="font-semibold">
                    <button
                      onClick={() => toggleSort('subject')}
                      className="flex items-center gap-1.5 hover:text-primary transition-colors"
                    >
                      Issue
                      <SortIcon field="subject" currentSort={sort} />
                    </button>
                  </TableHead>
                  <TableHead className="font-semibold">Project</TableHead>
                  <TableHead className="font-semibold">
                    <button
                      onClick={() => toggleSort('status')}
                      className="flex items-center gap-1.5 hover:text-primary transition-colors"
                    >
                      Status
                      <SortIcon field="status" currentSort={sort} />
                    </button>
                  </TableHead>
                  <TableHead className="font-semibold">
                    <button
                      onClick={() => toggleSort('priority')}
                      className="flex items-center gap-1.5 hover:text-primary transition-colors"
                    >
                      Priority
                      <SortIcon field="priority" currentSort={sort} />
                    </button>
                  </TableHead>
                  <TableHead className="font-semibold">Assignee</TableHead>
                  <TableHead className="pr-4 text-right font-semibold">
                    <button
                      onClick={() => toggleSort('dueDate')}
                      className="flex items-center justify-end gap-1.5 hover:text-primary transition-colors ml-auto"
                    >
                      Due
                      <SortIcon field="dueDate" currentSort={sort} />
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
                      ? `${issue.assignee.firstName} ${issue.assignee.lastName}`
                      : null
                    const overdue = isOverdue({
                      status: issue.status as IssueStatus,
                      dueDate: issue.dueDate ? new Date(issue.dueDate) : null,
                    })

                    return (
                      <TableRow
                        key={issue.id}
                        className="group animate-fade-in"
                        style={{ animationDelay: `${index * 30}ms` }}
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
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="secondary"
                                className={cn(
                                  'rounded px-1.5 py-0 text-[10px] font-semibold uppercase',
                                  `tracker-${issue.tracker}`
                                )}
                              >
                                {trackerLabels[issue.tracker as IssueTracker]}
                              </Badge>
                              <span className="font-mono text-xs text-muted-foreground">
                                #{issue.id.split('-').pop()}
                              </span>
                            </div>
                            <Link
                              href={`/issues/${issue.id}`}
                              className="font-medium hover:text-primary hover:underline"
                            >
                              {issue.subject}
                            </Link>
                          </div>
                        </TableCell>

                        {/* Project */}
                        <TableCell>
                          <Link
                            href={`/projects/${issue.project.identifier}`}
                            className="text-sm text-muted-foreground hover:text-primary hover:underline"
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
                            <div className="flex items-center gap-2">
                              <Avatar className="size-6">
                                <AvatarFallback className="bg-muted text-[10px] font-medium">
                                  {getInitials(assigneeName)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{assigneeName}</span>
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
                                {new Date(issue.dueDate).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                })}
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
