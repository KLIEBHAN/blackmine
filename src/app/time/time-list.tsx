'use client'

import { useState, useMemo } from 'react'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Clock,
  Search,
  Plus,
  X,
  Calendar,
  User,
  Activity,
} from 'lucide-react'
import Link from 'next/link'
import { getInitials, formatDate, staggerDelay } from '@/lib/utils'
import { SortableTableHeader } from '@/components/ui/sortable-table-header'
import { type SortDirection, type ActivityType, getFullName, activityTypeLabels, allActivityTypes } from '@/types'

// Serialized types for client component
export type SerializedUser = {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
}

export type SerializedIssue = {
  id: string
  subject: string
  project: {
    id: string
    name: string
    identifier: string
  }
}

export type SerializedTimeEntry = {
  id: string
  issueId: string
  userId: string
  hours: number
  activityType: ActivityType
  spentOn: string
  comments: string
  createdAt: string
  issue: SerializedIssue
  user: SerializedUser
}


type TimeEntrySortField = 'spentOn' | 'hours'

interface TimeSort {
  field: TimeEntrySortField
  direction: SortDirection
}

interface TimeListProps {
  timeEntries: SerializedTimeEntry[]
  users: SerializedUser[]
}

export function TimeList({ timeEntries, users }: TimeListProps) {
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [selectedActivity, setSelectedActivity] = useState<string>('')
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')
  const [sort, setSort] = useState<TimeSort>({ field: 'spentOn', direction: 'desc' })

  // Apply filters and sorting
  const filteredEntries = useMemo(() => {
    let result = [...timeEntries]

    // Filter by user
    if (selectedUser) {
      result = result.filter((e) => e.userId === selectedUser)
    }

    // Filter by activity
    if (selectedActivity) {
      result = result.filter((e) => e.activityType === selectedActivity)
    }

    // Filter by date range
    if (fromDate) {
      const from = new Date(fromDate)
      result = result.filter((e) => new Date(e.spentOn) >= from)
    }
    if (toDate) {
      const to = new Date(toDate)
      result = result.filter((e) => new Date(e.spentOn) <= to)
    }

    // Filter by search
    if (search) {
      const lowerSearch = search.toLowerCase()
      result = result.filter(
        (e) =>
          e.comments.toLowerCase().includes(lowerSearch) ||
          e.issue.subject.toLowerCase().includes(lowerSearch)
      )
    }

    // Sort
    result.sort((a, b) => {
      const multiplier = sort.direction === 'desc' ? -1 : 1
      if (sort.field === 'spentOn') {
        return multiplier * (new Date(a.spentOn).getTime() - new Date(b.spentOn).getTime())
      }
      return multiplier * (a.hours - b.hours)
    })

    return result
  }, [timeEntries, selectedUser, selectedActivity, fromDate, toDate, search, sort])

  const totalHours = useMemo(
    () => filteredEntries.reduce((sum, e) => sum + e.hours, 0),
    [filteredEntries]
  )

  const hasFilters = selectedUser || selectedActivity || fromDate || toDate || search

  const clearFilters = () => {
    setSelectedUser('')
    setSelectedActivity('')
    setFromDate('')
    setToDate('')
    setSearch('')
  }

  const toggleSort = (field: TimeEntrySortField) => {
    setSort((prev) => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc',
    }))
  }

  return (
    <div className="grid-pattern min-h-full">
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Page Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Time Tracking</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              <span className="font-mono">{filteredEntries.length}</span> entries ·{' '}
              <span className="font-mono font-semibold text-primary">{totalHours.toFixed(1)}h</span> total
            </p>
          </div>
          <Button asChild className="gap-2">
            <Link href="/time/new">
              <Plus className="size-4" />
              Log Time
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
                  placeholder="Search comments..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 font-sans"
                />
              </div>

              {/* User Filter */}
              <Select 
                value={selectedUser || '__all__'} 
                onValueChange={(v) => setSelectedUser(v === '__all__' ? '' : v)}
              >
                <SelectTrigger className="w-[160px] gap-2">
                  <User className="size-4 text-muted-foreground" />
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Users</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {getFullName(user)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Activity Filter */}
              <Select 
                value={selectedActivity || '__all__'} 
                onValueChange={(v) => setSelectedActivity(v === '__all__' ? '' : v)}
              >
                <SelectTrigger className="w-[160px] gap-2">
                  <Activity className="size-4 text-muted-foreground" />
                  <SelectValue placeholder="All Activities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Activities</SelectItem>
                  {allActivityTypes.map((activity) => (
                    <SelectItem key={activity} value={activity}>
                      {activityTypeLabels[activity]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Date Range */}
              <div className="flex items-center gap-2">
                <Calendar className="size-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-[140px] font-mono text-sm"
                  placeholder="From"
                />
                <span className="text-muted-foreground">—</span>
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-[140px] font-mono text-sm"
                  placeholder="To"
                />
              </div>

              {/* Clear Filters */}
              {hasFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="gap-1.5 text-muted-foreground hover:text-foreground"
                  aria-label="Clear all filters"
                >
                  <X className="size-3.5" />
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Time Entries Table */}
        <Card className="opacity-0 animate-card-in delay-2">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-24 pl-4 font-semibold">
                    <SortableTableHeader
                      field="spentOn"
                      label="Date"
                      currentField={sort.field}
                      direction={sort.direction}
                      onSort={toggleSort}
                    />
                  </TableHead>
                  <TableHead className="font-semibold">User</TableHead>
                  <TableHead className="font-semibold">Issue</TableHead>
                  <TableHead className="font-semibold">Activity</TableHead>
                  <TableHead className="font-semibold">Comments</TableHead>
                  <TableHead className="pr-4 text-right font-semibold">
                    <SortableTableHeader
                      field="hours"
                      label="Hours"
                      currentField={sort.field}
                      direction={sort.direction}
                      onSort={toggleSort}
                      align="right"
                    />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Clock className="size-8 opacity-50" />
                        <p>No time entries found</p>
                        {hasFilters && (
                          <Button variant="link" size="sm" onClick={clearFilters}>
                            Clear filters
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEntries.map((entry, index) => (
                    <TableRow
                      key={entry.id}
                      className="group animate-fade-in"
                      style={staggerDelay(index)}
                    >
                      {/* Date */}
                      <TableCell className="pl-4">
                        <span className="font-mono text-sm">
                          {formatDate(entry.spentOn, 'short')}
                        </span>
                      </TableCell>

                      {/* User */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="size-6">
                            <AvatarFallback className="bg-muted text-[10px] font-medium">
                              {getInitials(getFullName(entry.user))}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{getFullName(entry.user)}</span>
                        </div>
                      </TableCell>

                      {/* Issue */}
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <Link
                            href={`/issues/${entry.issue.id}`}
                            className="text-sm font-medium hover:text-primary hover:underline"
                          >
                            {entry.issue.subject}
                          </Link>
                          <Link
                            href={`/projects/${entry.issue.project.identifier}`}
                            className="text-xs text-muted-foreground hover:text-primary"
                          >
                            {entry.issue.project.name}
                          </Link>
                        </div>
                      </TableCell>

                      {/* Activity */}
                      <TableCell>
                        <Badge variant="secondary" className="rounded px-2 py-0.5 text-xs">
                          {activityTypeLabels[entry.activityType]}
                        </Badge>
                      </TableCell>

                      {/* Comments */}
                      <TableCell>
                        <p className="text-sm text-muted-foreground line-clamp-1 max-w-[250px]">
                          {entry.comments || '—'}
                        </p>
                      </TableCell>

                      {/* Hours */}
                      <TableCell className="pr-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Clock className="size-3.5 text-muted-foreground" />
                          <span className="font-mono text-sm font-semibold">
                            {entry.hours.toFixed(1)}h
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Total Summary */}
            {filteredEntries.length > 0 && (
              <div className="border-t bg-muted/30 px-4 py-3">
                <div className="flex items-center justify-end gap-4">
                  <span className="text-sm text-muted-foreground">Total:</span>
                  <span className="font-mono text-lg font-bold text-primary">
                    {totalHours.toFixed(1)}h
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
