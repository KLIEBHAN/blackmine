'use client'

import { useState, useMemo } from 'react'
import { cn, getInitials, formatDate, staggerDelay, formatShortId } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FilterDropdown } from '@/components/ui/filter-dropdown'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { IssueStatus, IssueTracker, IssuePriority, Issue } from '@/types'
import { isOverdue, statusLabels, trackerLabels, priorityLabels, allIssueStatuses, allIssueTrackers, allIssuePriorities, getFullName } from '@/types'
import { filterIssues, sortIssues, type IssueSort, type IssueFilters } from '@/lib/issues'
import { bulkUpdateIssues, type BulkUpdateData } from '@/app/actions/issues'
import { toast } from 'sonner'
import {
  AlertCircle,
  Search,
  Plus,
  X,
  ListFilter,
  Filter,
  SlidersHorizontal,
  Edit2,
  Loader2,
} from 'lucide-react'
import { SortableTableHeader } from '@/components/ui/sortable-table-header'
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

type SerializedUser = {
  id: string
  firstName: string
  lastName: string
}

type Props = {
  issues: IssueWithRelations[]
  totalCount: number
  hideHeader?: boolean
  users?: SerializedUser[]
  initialStatuses?: IssueStatus[]
}

export function IssuesList({ issues, totalCount, hideHeader = false, users = [], initialStatuses }: Props) {
  const [search, setSearch] = useState('')
  const [selectedStatuses, setSelectedStatuses] = useState<IssueStatus[]>(
    initialStatuses ?? ['new', 'in_progress']
  )
  const [selectedTrackers, setSelectedTrackers] = useState<IssueTracker[]>([])
  const [selectedPriorities, setSelectedPriorities] = useState<IssuePriority[]>([])
  const [sort, setSort] = useState<IssueSort>({ field: 'dueDate', direction: 'asc' })

  // Selection state for bulk editing
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkEditOpen, setBulkEditOpen] = useState(false)
  const [bulkEditData, setBulkEditData] = useState<BulkUpdateData>({})
  const [isBulkUpdating, setIsBulkUpdating] = useState(false)

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

  // Selection helpers for bulk editing
  const visibleIds = filteredIssues.map(i => i.id)
  const allSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.has(id))
  const someSelected = visibleIds.some(id => selectedIds.has(id))

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(visibleIds))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const clearSelection = () => setSelectedIds(new Set())

  const handleBulkEdit = async () => {
    setIsBulkUpdating(true)
    const result = await bulkUpdateIssues(Array.from(selectedIds), bulkEditData)
    setIsBulkUpdating(false)

    if (result.success) {
      toast.success(`Updated ${result.updatedCount} issue${result.updatedCount !== 1 ? 's' : ''}`)
      setBulkEditOpen(false)
      setBulkEditData({})
      clearSelection()
    } else {
      toast.error('Failed to update', { description: result.error })
    }
  }

  return (
    <div className="grid-pattern min-h-full">
      <div className={cn("p-4 sm:p-6 lg:p-8", hideHeader && "pt-0")}>
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
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              {/* Search */}
              <div className="relative flex-1 min-w-0 sm:min-w-[200px]">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search issues..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 font-sans"
                />
              </div>

              {/* Filters Row - scrollable on mobile */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 sm:gap-3 sm:overflow-visible">
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
                  className="gap-1.5 text-muted-foreground hover:text-foreground shrink-0"
                  aria-label={`Clear ${activeFilterCount} active filters`}
                >
                  <X className="size-3.5" />
                  Clear ({activeFilterCount})
                </Button>
              )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Action Bar - shown when issues are selected */}
        {selectedIds.size > 0 && (
          <Card className="mb-6 border-primary/50 bg-primary/5">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">
                  {selectedIds.size} issue{selectedIds.size > 1 ? 's' : ''} selected
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearSelection}
                  >
                    Clear
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setBulkEditOpen(true)}
                    className="gap-2"
                  >
                    <Edit2 className="size-4" />
                    Edit
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Issues - Card View for Mobile, Table for Desktop */}
        {filteredIssues.length === 0 ? (
          <Card className="opacity-0 animate-card-in delay-2">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Search className="size-8 opacity-50 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No issues found</p>
              {activeFilterCount > 0 && (
                <Button variant="link" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="space-y-3 md:hidden">
              {/* Mobile Select All Header */}
              <div className="flex items-center gap-3 px-1">
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected && !allSelected}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all visible issues"
                />
                <span className="text-sm text-muted-foreground">
                  Select all ({filteredIssues.length})
                </span>
              </div>

              {filteredIssues.map((issue, index) => {
                const assigneeName = issue.assignee ? getFullName(issue.assignee) : null
                const overdue = isOverdue(issue)
                return (
                  <Card
                    key={issue.id}
                    className="opacity-0 animate-card-in"
                    style={staggerDelay(index + 2)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedIds.has(issue.id)}
                          onCheckedChange={() => toggleSelect(issue.id)}
                          aria-label={`Select issue ${issue.subject}`}
                          className="mt-1"
                        />
                        <div className={cn('priority-indicator h-full min-h-[60px] shrink-0', `priority-${issue.priority}`)} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className={cn('badge-tracker shrink-0', `tracker-${issue.tracker}`)}>
                              {trackerLabels[issue.tracker as IssueTracker]}
                            </Badge>
                            <span className="font-mono text-xs text-muted-foreground">
                              #{formatShortId(issue.id)}
                            </span>
                          </div>
                          <Link
                            href={`/issues/${issue.id}`}
                            className="font-medium hover:text-primary hover:underline line-clamp-2"
                          >
                            {issue.subject}
                          </Link>
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <Link
                              href={`/projects/${issue.project.identifier}`}
                              className="hover:text-primary hover:underline truncate"
                            >
                              {issue.project.name}
                            </Link>
                            <span>•</span>
                            <Badge variant="secondary" className={cn('rounded-sm px-1.5 py-0 text-[10px]', `status-${issue.status}`)}>
                              {statusLabels[issue.status as IssueStatus]}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between mt-3 pt-3 border-t">
                            <div className="flex items-center gap-2">
                              {assigneeName ? (
                                <>
                                  <Avatar className="size-5">
                                    <AvatarFallback className="bg-muted text-[9px] font-medium">
                                      {getInitials(assigneeName)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs truncate max-w-[100px]">{assigneeName}</span>
                                </>
                              ) : (
                                <span className="text-xs text-muted-foreground">Unassigned</span>
                              )}
                            </div>
                            {issue.dueDate && (
                              <div className="flex items-center gap-1">
                                {overdue && <AlertCircle className="size-3 text-red-500" />}
                                <span className={cn('font-mono text-xs', overdue && 'text-red-600 font-medium')}>
                                  {formatDate(issue.dueDate, 'short')}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Desktop Table View */}
            <Card className="opacity-0 animate-card-in delay-2 overflow-hidden hidden md:block">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
            <Table className="table-fixed min-w-[800px]">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-10 pl-4">
                    <Checkbox
                      checked={allSelected}
                      indeterminate={someSelected && !allSelected}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all visible issues"
                    />
                  </TableHead>
                  <TableHead className="w-8"></TableHead>
                  <TableHead className="w-[40%] font-semibold">
                    <SortableTableHeader
                      field="subject"
                      label="Issue"
                      currentField={sort.field}
                      direction={sort.direction}
                      onSort={toggleSort}
                    />
                  </TableHead>
                  <TableHead className="font-semibold hidden md:table-cell">Project</TableHead>
                  <TableHead className="font-semibold">
                    <SortableTableHeader
                      field="status"
                      label="Status"
                      currentField={sort.field}
                      direction={sort.direction}
                      onSort={toggleSort}
                    />
                  </TableHead>
                  <TableHead className="font-semibold">
                    <SortableTableHeader
                      field="priority"
                      label="Priority"
                      currentField={sort.field}
                      direction={sort.direction}
                      onSort={toggleSort}
                    />
                  </TableHead>
                  <TableHead className="font-semibold hidden lg:table-cell">Assignee</TableHead>
                  <TableHead className="pr-4 text-right font-semibold">
                    <SortableTableHeader
                      field="dueDate"
                      label="Due"
                      currentField={sort.field}
                      direction={sort.direction}
                      onSort={toggleSort}
                      align="right"
                    />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIssues.map((issue, index) => {
                    const assigneeName = issue.assignee
                      ? getFullName(issue.assignee)
                      : null
                    const overdue = isOverdue(issue)

                    return (
                      <TableRow
                        key={issue.id}
                        className="group animate-fade-in"
                        style={staggerDelay(index)}
                        data-state={selectedIds.has(issue.id) ? 'selected' : undefined}
                      >
                        {/* Selection checkbox */}
                        <TableCell className="pl-4 pr-0">
                          <Checkbox
                            checked={selectedIds.has(issue.id)}
                            onCheckedChange={() => toggleSelect(issue.id)}
                            aria-label={`Select issue ${issue.subject}`}
                          />
                        </TableCell>

                        {/* Priority indicator */}
                        <TableCell className="pr-0">
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
                        <TableCell className="hidden md:table-cell">
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
                        <TableCell className="hidden lg:table-cell">
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
                  })}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
          </>
        )}
      </div>

      {/* Bulk Edit Modal */}
      <Dialog open={bulkEditOpen} onOpenChange={setBulkEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit {selectedIds.size} issue{selectedIds.size > 1 ? 's' : ''}</DialogTitle>
            <DialogDescription>
              Empty fields keep their current value. Only changed fields will be updated.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Status */}
            <div className="grid gap-2">
              <Label htmlFor="bulk-status">Status</Label>
              <Select
                value={bulkEditData.status ?? ''}
                onValueChange={(v) => setBulkEditData(prev => ({
                  ...prev,
                  status: v || undefined
                }))}
              >
                <SelectTrigger id="bulk-status">
                  <SelectValue placeholder="No change" />
                </SelectTrigger>
                <SelectContent>
                  {allIssueStatuses.map(s => (
                    <SelectItem key={s} value={s}>
                      <Badge variant="secondary" className={cn('rounded-sm', `status-${s}`)}>
                        {statusLabels[s]}
                      </Badge>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="grid gap-2">
              <Label htmlFor="bulk-priority">Priority</Label>
              <Select
                value={bulkEditData.priority ?? ''}
                onValueChange={(v) => setBulkEditData(prev => ({
                  ...prev,
                  priority: v || undefined
                }))}
              >
                <SelectTrigger id="bulk-priority">
                  <SelectValue placeholder="No change" />
                </SelectTrigger>
                <SelectContent>
                  {allIssuePriorities.map(p => (
                    <SelectItem key={p} value={p}>
                      <div className="flex items-center gap-2">
                        <div className={cn('priority-indicator h-4', `priority-${p}`)} />
                        {priorityLabels[p]}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tracker */}
            <div className="grid gap-2">
              <Label htmlFor="bulk-tracker">Tracker</Label>
              <Select
                value={bulkEditData.tracker ?? ''}
                onValueChange={(v) => setBulkEditData(prev => ({
                  ...prev,
                  tracker: v || undefined
                }))}
              >
                <SelectTrigger id="bulk-tracker">
                  <SelectValue placeholder="No change" />
                </SelectTrigger>
                <SelectContent>
                  {allIssueTrackers.map(t => (
                    <SelectItem key={t} value={t}>
                      <Badge variant="secondary" className={cn('rounded', `tracker-${t}`)}>
                        {trackerLabels[t]}
                      </Badge>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Assignee */}
            {users.length > 0 && (
              <div className="grid gap-2">
                <Label htmlFor="bulk-assignee">Assignee</Label>
                <Select
                  value={bulkEditData.assigneeId === null ? '__unassigned__' : bulkEditData.assigneeId ?? ''}
                  onValueChange={(v) => setBulkEditData(prev => ({
                    ...prev,
                    assigneeId: v === '' ? undefined : v === '__unassigned__' ? null : v
                  }))}
                >
                  <SelectTrigger id="bulk-assignee">
                    <SelectValue placeholder="No change" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__unassigned__">Unassigned</SelectItem>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {getFullName(user)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Due Date */}
            <div className="grid gap-2">
              <Label htmlFor="bulk-dueDate">Due date</Label>
              <div className="flex gap-2">
                <Input
                  id="bulk-dueDate"
                  type="date"
                  value={bulkEditData.dueDate === null ? '' : bulkEditData.dueDate ?? ''}
                  onChange={(e) => setBulkEditData(prev => ({
                    ...prev,
                    dueDate: e.target.value || undefined
                  }))}
                  className="font-mono flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setBulkEditData(prev => ({ ...prev, dueDate: null }))}
                >
                  Clear
                </Button>
              </div>
              {bulkEditData.dueDate === null && (
                <p className="text-xs text-muted-foreground">Due date will be cleared</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkEditOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleBulkEdit}
              disabled={isBulkUpdating || Object.keys(bulkEditData).length === 0}
            >
              {isBulkUpdating ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                `Update ${selectedIds.size} issue${selectedIds.size > 1 ? 's' : ''}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
