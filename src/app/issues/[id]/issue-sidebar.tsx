'use client'

import { cn, getInitials, formatDate } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { AlertCircle } from 'lucide-react'
import { statusLabels, priorityLabels, getFullName } from '@/types'
import type { SerializedIssue } from './issue-detail'

interface IssueSidebarProps {
  issue: SerializedIssue
  overdue: boolean
}

export function IssueSidebar({ issue, overdue }: IssueSidebarProps) {
  const status = issue.status as keyof typeof statusLabels
  const priority = issue.priority as keyof typeof priorityLabels

  return (
    <div className="space-y-6">
      <Card className="opacity-0 animate-card-in delay-1 overflow-hidden border-primary/10">
        <div className={cn('h-1.5 w-full', `status-${status}`)} />
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/80">
            Issue Metadata
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <Badge
              variant="secondary"
              className={cn(
                'rounded-sm px-2 py-0.5 text-xs font-medium',
                `status-${status}`
              )}
            >
              {statusLabels[status]}
            </Badge>
          </div>

          <Separator className="bg-border/50" />

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Priority</span>
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'priority-indicator h-4',
                  `priority-${priority}`
                )}
              />
              <span
                className={cn(
                  'text-sm font-medium',
                  priority === 'urgent' && 'text-amber-600',
                  priority === 'immediate' && 'text-red-600',
                  priority === 'high' && 'text-orange-600'
                )}
              >
                {priorityLabels[priority]}
              </span>
            </div>
          </div>

          <Separator className="bg-border/50" />

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Assignee</span>
            {issue.assignee ? (
              <div className="flex items-center gap-2">
                <Avatar className="size-5">
                  <AvatarFallback className="bg-muted text-[9px] font-medium">
                    {getInitials(issue.assignee.firstName, issue.assignee.lastName)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">
                  {getFullName(issue.assignee)}
                </span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground italic">Unassigned</span>
            )}
          </div>

          <Separator className="bg-border/50" />

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Author</span>
            <div className="flex items-center gap-2">
              <Avatar className="size-5">
                <AvatarFallback className="bg-muted text-[9px] font-medium">
                  {getInitials(issue.author.firstName, issue.author.lastName)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">
                {getFullName(issue.author)}
              </span>
            </div>
          </div>

          <Separator className="bg-border/50" />

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Due Date</span>
            {issue.dueDate ? (
              <div className="flex items-center gap-1.5">
                {overdue && <AlertCircle className="size-3.5 text-red-500" />}
                <span
                  className={cn(
                    'font-mono text-sm',
                    overdue && 'font-medium text-red-600'
                  )}
                >
                  {formatDate(issue.dueDate, 'long')}
                </span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            )}
          </div>

          <Separator className="bg-border/50" />

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Estimated</span>
            <span className="font-mono text-sm font-medium">
              {issue.estimatedHours !== null
                ? `${issue.estimatedHours}h`
                : '—'}
            </span>
          </div>
        </CardContent>
        
        <div className="bg-muted/30 px-6 py-4 border-t border-border/50 space-y-2">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase tracking-tight">
            <span>Created</span>
            <span className="font-mono">
              {formatDate(issue.createdAt, 'datetime')}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase tracking-tight">
            <span>Updated</span>
            <span className="font-mono">
              {formatDate(issue.updatedAt, 'datetime')}
            </span>
          </div>
        </div>
      </Card>
    </div>
  )
}
