'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { cn, getInitials, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { deleteIssue } from '@/app/actions/issues'
import {
  ArrowLeft,
  FolderOpen,
  AlertCircle,
  Edit,
  Trash2,
} from 'lucide-react'
import { Comments, type SerializedComment } from './comments'
import { Markdown } from '@/components/ui/markdown'
import { statusLabels, trackerLabels, priorityLabels, getFullName, isOverdue } from '@/types'

// Serialized types for client component
export type SerializedIssue = {
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

interface IssueDetailProps {
  issue: SerializedIssue
  comments: SerializedComment[]
  currentUserId: string
}

export function IssueDetail({ issue, comments, currentUserId }: IssueDetailProps) {
  const router = useRouter()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const overdue = isOverdue(issue)

  const handleDelete = async () => {
    setIsDeleting(true)
    const result = await deleteIssue(issue.id)
    if (result.success) {
      toast.success('Issue deleted', {
        description: `"${issue.subject}" has been permanently deleted.`,
      })
      router.push('/issues')
    } else {
      toast.error('error' in result ? result.error : 'Failed to delete issue')
      setIsDeleting(false)
    }
  }

  const tracker = issue.tracker as keyof typeof trackerLabels
  const status = issue.status as keyof typeof statusLabels
  const priority = issue.priority as keyof typeof priorityLabels

  return (
    <div className="grid-pattern min-h-full">
      <div className="mx-auto max-w-4xl p-6 lg:p-8">
        {/* Page Header */}
        <div className="mb-6 flex items-start justify-between gap-4 opacity-0 animate-card-in">
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="icon" asChild className="mt-1">
              <Link href="/issues">
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge
                  variant="secondary"
                  className={cn(
                    'rounded px-2 py-0.5 text-xs font-semibold uppercase',
                    `tracker-${tracker}`
                  )}
                >
                  {trackerLabels[tracker]}
                </Badge>
                <span className="font-mono text-sm text-muted-foreground">
                  #{issue.id.split('-')[1] || issue.id}
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">{issue.subject}</h1>
              <Link
                href={`/projects/${issue.project.identifier}`}
                className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
              >
                <FolderOpen className="size-3.5" />
                {issue.project.name}
              </Link>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2" asChild>
              <Link href={`/issues/${issue.id}/edit`}>
                <Edit className="size-3.5" />
                Edit
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-destructive hover:text-destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="size-3.5" />
              Delete
            </Button>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Issue</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete issue #{issue.id.split('-')[1] || issue.id}?
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-md border bg-muted/50 p-3">
              <p className="font-medium text-sm">{issue.subject}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {trackerLabels[tracker]} • {statusLabels[status]}
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Issue'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description Card */}
            <Card className="opacity-0 animate-card-in delay-1">
              <CardHeader>
                <CardTitle className="text-lg">Description</CardTitle>
              </CardHeader>
              <CardContent>
                {issue.description ? (
                  <Markdown>{issue.description}</Markdown>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No description provided.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Comments Section */}
            <Comments
              issueId={issue.id}
              comments={comments}
              currentUserId={currentUserId}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <Card className="opacity-0 animate-card-in delay-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Status
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Badge
                  variant="secondary"
                  className={cn(
                    'rounded-sm px-3 py-1 text-sm font-medium',
                    `status-${status}`
                  )}
                >
                  {statusLabels[status]}
                </Badge>
              </CardContent>
            </Card>

            {/* Details Card */}
            <Card className="opacity-0 animate-card-in delay-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Details
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                {/* Priority */}
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

                <Separator />

                {/* Assignee */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Assignee</span>
                  {issue.assignee ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="size-5">
                        <AvatarFallback className="bg-muted text-[9px] font-medium">
                          {getInitials(issue.assignee.firstName, issue.assignee.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">
                        {getFullName(issue.assignee)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Unassigned</span>
                  )}
                </div>

                <Separator />

                {/* Author */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Author</span>
                  <div className="flex items-center gap-2">
                    <Avatar className="size-5">
                      <AvatarFallback className="bg-muted text-[9px] font-medium">
                        {getInitials(issue.author.firstName, issue.author.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">
                      {getFullName(issue.author)}
                    </span>
                  </div>
                </div>

                <Separator />

                {/* Due Date */}
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

                <Separator />

                {/* Estimated Hours */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Estimated</span>
                  <span className="font-mono text-sm">
                    {issue.estimatedHours !== null
                      ? `${issue.estimatedHours}h`
                      : '—'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Timestamps Card */}
            <Card className="opacity-0 animate-card-in delay-3">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Timestamps
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Created</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {formatDate(issue.createdAt, 'datetime')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Updated</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {formatDate(issue.updatedAt, 'datetime')}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
