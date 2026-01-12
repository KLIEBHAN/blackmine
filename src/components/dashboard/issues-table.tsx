'use client'

import { cn, getInitials } from '@/lib/utils'
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
import { statusLabels, trackerLabels, priorityLabels } from '@/types'
import { AlertCircle, ArrowUpRight } from 'lucide-react'
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

function getFullName(user: { firstName: string; lastName: string }): string {
  return `${user.firstName} ${user.lastName}`
}

function isOverdue(issue: SerializedIssue): boolean {
  if (!issue.dueDate) return false
  if (issue.status === 'closed' || issue.status === 'rejected') return false
  return new Date(issue.dueDate) < new Date()
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
      <CardContent className="p-0">
        <Table>
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

              return (
                <TableRow key={issue.id} className="group">
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

                  {/* Project */}
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
                    {issue.assignee ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="size-6">
                          <AvatarFallback className="bg-muted text-[10px] font-medium">
                            {getInitials(getFullName(issue.assignee))}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{getFullName(issue.assignee)}</span>
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
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
