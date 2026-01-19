'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { cn, getInitials, formatDate } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertCircle, Clock } from 'lucide-react'
import { statusLabels, priorityLabels, getFullName, isDueSoon, allIssueStatuses, type IssueStatus } from '@/types'
import { updateIssueStatus } from '@/app/actions/issues'
import type { SerializedIssue } from './issue-detail'

interface IssueSidebarProps {
  issue: SerializedIssue
  overdue: boolean
}

export function IssueSidebar({ issue, overdue }: IssueSidebarProps) {
  const [isPending, startTransition] = useTransition()
  const status = issue.status as IssueStatus
  const priority = issue.priority as keyof typeof priorityLabels
  const dueSoon = !overdue && isDueSoon(issue)

  const handleStatusChange = (newStatus: string) => {
    startTransition(async () => {
      const result = await updateIssueStatus(issue.id, newStatus)
      if (result.success) {
        toast.success('Status updated', {
          description: `Issue status changed to "${statusLabels[newStatus as IssueStatus]}".`,
        })
      } else {
        toast.error('Failed to update status', {
          description: result.error,
        })
      }
    })
  }

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
            <Select value={status} onValueChange={handleStatusChange} disabled={isPending}>
              <SelectTrigger
                size="sm"
                className={cn(
                  'h-auto w-auto gap-1.5 border-0 bg-transparent px-2 py-0.5 text-xs font-medium shadow-none hover:bg-accent',
                  `status-${status}`
                )}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {allIssueStatuses.map((s) => (
                  <SelectItem key={s} value={s} className={cn('text-xs', `status-${s}`)}>
                    {statusLabels[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                {dueSoon && <Clock className="size-3.5 text-amber-500" />}
                <span
                  className={cn(
                    'font-mono text-sm',
                    overdue && 'font-medium text-red-600',
                    dueSoon && 'font-medium text-amber-600'
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
