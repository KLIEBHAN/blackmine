'use client'

import { cn, getInitials, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { IssueStatus, IssueTracker, IssuePriority } from '@/types'
import { statusLabels, trackerLabels, priorityLabels, getFullName, isOverdue } from '@/types'
import { AlertCircle, ArrowUpRight, CircleDot } from 'lucide-react'
import Link from 'next/link'

// Serialized types for client component (dates as strings)
export type SerializedIssue = {
  id: string
  subject: string
  status: string
  priority: string
  tracker: string
  dueDate: string | null
  project: { id: string; name: string; identifier: string }
  assignee: { id: string; firstName: string; lastName: string } | null
}

interface IssuesTableProps {
  title?: string
  issues: SerializedIssue[]
  showProject?: boolean
  className?: string
}

export function IssuesTable({
  title = 'Recent Issues',
  issues,
  showProject = true,
  className,
}: IssuesTableProps) {
  if (issues.length === 0) {
    return (
      <Card className={cn('opacity-0 animate-card-in delay-3', className)}>
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          <Link
            href="/issues"
            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            View all
            <ArrowUpRight className="size-3" />
          </Link>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CircleDot className="size-8 opacity-50 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No recent issues</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('opacity-0 animate-card-in delay-3', className)}>
      <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        <Link
          href="/issues"
          className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          View all
          <ArrowUpRight className="size-3" />
        </Link>
      </CardHeader>

      {/* Mobile Card View */}
      <CardContent className="p-3 space-y-3 md:hidden">
        {issues.map((issue) => {
          const overdue = isOverdue(issue)
          const assigneeName = issue.assignee ? getFullName(issue.assignee) : null

          return (
            <div
              key={issue.id}
              className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
            >
              <div className={cn('priority-indicator h-full min-h-[50px] shrink-0', `priority-${issue.priority}`)} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary" className={cn('badge-tracker shrink-0', `tracker-${issue.tracker}`)}>
                    {trackerLabels[issue.tracker as IssueTracker]}
                  </Badge>
                  <span className="font-mono text-xs text-muted-foreground">
                    #{issue.id.slice(-4)}
                  </span>
                </div>
                <Link
                  href={`/issues/${issue.id}`}
                  className="font-medium hover:text-primary hover:underline line-clamp-2 text-sm"
                >
                  {issue.subject}
                </Link>
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  {showProject && (
                    <>
                      <Link
                        href={`/projects/${issue.project.identifier}`}
                        className="hover:text-primary hover:underline truncate"
                      >
                        {issue.project.name}
                      </Link>
                      <span>•</span>
                    </>
                  )}
                  <Badge variant="secondary" className={cn('rounded-sm px-1.5 py-0 text-[10px]', `status-${issue.status}`)}>
                    {statusLabels[issue.status as IssueStatus]}
                  </Badge>
                  {issue.dueDate && (
                    <>
                      <span>•</span>
                      <span className={cn('font-mono', overdue && 'text-red-600 font-medium')}>
                        {overdue && <AlertCircle className="inline size-3 mr-0.5" />}
                        {formatDate(issue.dueDate, 'short')}
                      </span>
                    </>
                  )}
                </div>
              </div>
              {assigneeName && (
                <Avatar className="size-6 shrink-0">
                  <AvatarFallback className="bg-muted text-[9px] font-medium">
                    {getInitials(assigneeName)}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          )
        })}
      </CardContent>

      {/* Desktop Table View */}
      <CardContent className="p-0 hidden md:block">
        <div className="overflow-x-auto">
        <Table className="min-w-[700px]">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12 pl-4"></TableHead>
              <TableHead className="font-semibold">Issue</TableHead>
              {showProject && <TableHead className="font-semibold">Project</TableHead>}
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Priority</TableHead>
              <TableHead className="font-semibold">Assignee</TableHead>
              <TableHead className="pr-4 text-right font-semibold">Due</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {issues.map((issue) => {
              const overdue = isOverdue(issue)
              const assigneeName = issue.assignee ? getFullName(issue.assignee) : null

              return (
                <TableRow key={issue.id} className="group">
                  <TableCell className="pl-4 pr-0">
                    <div
                      className={cn(
                        'priority-indicator h-8',
                        `priority-${issue.priority}`
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className={cn('badge-tracker', `tracker-${issue.tracker}`)}
                        >
                          {trackerLabels[issue.tracker as IssueTracker]}
                        </Badge>
                        <span className="font-mono text-xs text-muted-foreground">
                          #{issue.id.slice(-4)}
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
                  {showProject && (
                    <TableCell>
                      <Link 
                        href={`/projects/${issue.project.identifier}`}
                        className="text-sm text-muted-foreground hover:text-primary hover:underline"
                      >
                        {issue.project.name}
                      </Link>
                    </TableCell>
                  )}
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
  )
}
