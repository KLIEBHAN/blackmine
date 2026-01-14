'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft, FolderOpen, Edit, Trash2, Minus, Plus, PanelRightClose, PanelRightOpen } from 'lucide-react'
import { Comments, type SerializedComment } from './comments'
import { Markdown, FONT_SIZE_CONFIG, type FontSize } from '@/components/ui/markdown'
import { statusLabels, trackerLabels, isOverdue } from '@/types'
import { IssueSidebar } from './issue-sidebar'
import { cn, formatShortId } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { deleteIssue } from '@/app/actions/issues'

const FONT_SIZE_KEY = 'issue-detail-font-size'
const SIDEBAR_KEY = 'issue-detail-sidebar-visible'
const FONT_SIZES = Object.keys(FONT_SIZE_CONFIG) as FontSize[]

function isValidFontSize(value: string | null): value is FontSize {
  return value !== null && FONT_SIZES.includes(value as FontSize)
}

function useFontSizeStorage(): [FontSize, (size: FontSize) => void] {
  const [fontSize, setFontSizeState] = useState<FontSize>('lg')

  useEffect(() => {
    const saved = localStorage.getItem(FONT_SIZE_KEY)
    if (isValidFontSize(saved)) {
      setFontSizeState(saved)
    }
  }, [])

  const setFontSize = (size: FontSize) => {
    setFontSizeState(size)
    localStorage.setItem(FONT_SIZE_KEY, size)
  }

  return [fontSize, setFontSize]
}

function useSidebarVisibility(): [boolean, () => void] {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem(SIDEBAR_KEY)
    if (saved !== null) {
      setVisible(saved === 'true')
    }
  }, [])

  const toggle = () => {
    const newValue = !visible
    setVisible(newValue)
    localStorage.setItem(SIDEBAR_KEY, String(newValue))
  }

  return [visible, toggle]
}

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
  const [fontSize, setFontSize] = useFontSizeStorage()
  const [sidebarVisible, toggleSidebar] = useSidebarVisibility()

  const changeFontSize = (delta: -1 | 1) => {
    const currentIndex = FONT_SIZES.indexOf(fontSize)
    const newIndex = Math.max(0, Math.min(FONT_SIZES.length - 1, currentIndex + delta))
    setFontSize(FONT_SIZES[newIndex])
  }

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

  return (
    <div className="grid-pattern min-h-full">
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Page Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between opacity-0 animate-card-in">
          <div className="flex items-start gap-4 min-w-0">
            <Button variant="ghost" size="icon" asChild className="mt-1 shrink-0">
              <Link href="/issues">
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
            <div className="min-w-0">
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
              <h1 className="text-2xl font-bold tracking-tight [overflow-wrap:anywhere]">{issue.subject}</h1>
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
          <div className="flex items-center gap-2 sm:shrink-0">
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
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8 hidden lg:flex"
                  onClick={toggleSidebar}
                  aria-label={sidebarVisible ? 'Seitenleiste ausblenden' : 'Seitenleiste einblenden'}
                >
                  {sidebarVisible ? (
                    <PanelRightClose className="size-4" />
                  ) : (
                    <PanelRightOpen className="size-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {sidebarVisible ? 'Seitenleiste ausblenden' : 'Seitenleiste einblenden'}
              </TooltipContent>
            </Tooltip>
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

        <div className={cn(
          "grid gap-6 lg:gap-8",
          sidebarVisible 
            ? "lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px]" 
            : "lg:grid-cols-1"
        )}>
          {/* Main Content */}
          <div className="space-y-6">
            {/* Description Card */}
            <Card className="opacity-0 animate-card-in delay-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-lg">Description</CardTitle>
                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() => changeFontSize(-1)}
                        disabled={fontSize === 'sm'}
                        aria-label="Schrift verkleinern"
                      >
                        <Minus className="size-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Schrift verkleinern</TooltipContent>
                  </Tooltip>
                  <span className="text-xs text-muted-foreground w-12 text-center">
                    {FONT_SIZE_CONFIG[fontSize].label}
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() => changeFontSize(1)}
                        disabled={fontSize === 'xl'}
                        aria-label="Schrift vergrößern"
                      >
                        <Plus className="size-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Schrift vergrößern</TooltipContent>
                  </Tooltip>
                </div>
              </CardHeader>
              <CardContent>
                {issue.description ? (
                  <Markdown fontSize={fontSize}>{issue.description}</Markdown>
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
              fontSize={fontSize}
            />
          </div>

          {/* Sidebar */}
          {sidebarVisible && (
            <IssueSidebar issue={issue} overdue={overdue} />
          )}
        </div>
      </div>
    </div>
  )
}
