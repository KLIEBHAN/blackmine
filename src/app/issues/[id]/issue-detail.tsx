'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft, FolderOpen, Edit, Trash2 } from 'lucide-react'
import { Comments, type SerializedComment } from './comments'
import { Markdown } from '@/components/ui/markdown'
import { statusLabels, trackerLabels, priorityLabels, getFullName, isOverdue } from '@/types'
import { IssueSidebar } from './issue-sidebar'
import { cn, formatShortId } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { deleteIssue } from '@/app/actions/issues'

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
                  #{formatShortId(issue.id)}
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
                Are you sure you want to delete issue #{formatShortId(issue.id)}?
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
          <IssueSidebar issue={issue} overdue={overdue} />
        </div>
      </div>
    </div>
  )
}
