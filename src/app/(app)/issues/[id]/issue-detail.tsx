'use client'

import { useState, useSyncExternalStore, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft, FolderOpen, Edit, Trash2, Minus, Plus, PanelRightClose, PanelRightOpen, Paperclip, Download, Eye, EyeOff } from 'lucide-react'
import { Comments, type SerializedComment } from './comments'
import { Markdown, FONT_SIZE_CONFIG, type FontSize } from '@/components/ui/markdown'
import { statusLabels, trackerLabels, isOverdue } from '@/types'
import { IssueSidebar } from './issue-sidebar'
import { cn, formatDate, formatFileSize, formatShortId } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { convertIssueDescriptionToMarkdown, deleteIssue } from '@/app/actions/issues'
import { deleteAttachment } from '@/app/actions/attachments'
import { useAttachmentPreview } from '@/hooks/use-attachment-preview'
import { PdfPreview } from '@/components/ui/pdf-preview'
import { useSession } from '@/contexts/session-context'
import { isPdf, hasPreview } from '@/lib/attachment-preview'

const FONT_SIZE_KEY = 'issue-detail-font-size'
const SIDEBAR_KEY = 'issue-detail-sidebar-visible'
const FONT_SIZES = Object.keys(FONT_SIZE_CONFIG) as FontSize[]
const ATTACHMENT_BUTTON_CLASS = 'size-8 sm:size-9'

function isValidFontSize(value: string | null): value is FontSize {
  return value !== null && FONT_SIZES.includes(value as FontSize)
}

// useSyncExternalStore pattern for SSR-safe localStorage access
function useFontSizeStorage(): [FontSize, (size: FontSize) => void] {
  const subscribe = useCallback((callback: () => void) => {
    window.addEventListener('storage', callback)
    return () => window.removeEventListener('storage', callback)
  }, [])

  const getSnapshot = useCallback(() => {
    const saved = localStorage.getItem(FONT_SIZE_KEY)
    return isValidFontSize(saved) ? saved : 'lg'
  }, [])

  const getServerSnapshot = useCallback((): FontSize => 'lg', [])

  const fontSize = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const setFontSize = useCallback((size: FontSize) => {
    localStorage.setItem(FONT_SIZE_KEY, size)
    // Trigger re-render by dispatching storage event
    window.dispatchEvent(new StorageEvent('storage', { key: FONT_SIZE_KEY }))
  }, [])

  return [fontSize, setFontSize]
}

function useSidebarVisibility(): [boolean, () => void] {
  const subscribe = useCallback((callback: () => void) => {
    window.addEventListener('storage', callback)
    return () => window.removeEventListener('storage', callback)
  }, [])

  const getSnapshot = useCallback(() => {
    const saved = localStorage.getItem(SIDEBAR_KEY)
    return saved === null ? true : saved === 'true'
  }, [])

  const getServerSnapshot = useCallback(() => true, [])

  const visible = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const toggle = useCallback(() => {
    const newValue = !visible
    localStorage.setItem(SIDEBAR_KEY, String(newValue))
    window.dispatchEvent(new StorageEvent('storage', { key: SIDEBAR_KEY }))
  }, [visible])

  return [visible, toggle]
}

// Serialized types for client component
export type SerializedAttachment = {
  id: string
  filename: string
  contentType: string
  size: number
  createdAt: string
  author: {
    id: string
    firstName: string
    lastName: string
  }
}

export type SerializedIssue = {
  id: string
  subject: string
  description: string
  descriptionFormat: 'markdown' | 'textile'
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
  attachments: SerializedAttachment[]
}

interface IssueDetailProps {
  issue: SerializedIssue
  comments: SerializedComment[]
  currentUserId: string
}

export function IssueDetail({ issue, comments, currentUserId }: IssueDetailProps) {
  const router = useRouter()
  const { isAdmin } = useSession()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isConverting, setIsConverting] = useState(false)
  const [attachments, setAttachments] = useState(issue.attachments)
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<string | null>(null)
  const { previewAttachmentId, togglePreview } = useAttachmentPreview()
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

  const handleConvertDescription = async () => {
    setIsConverting(true)
    const result = await convertIssueDescriptionToMarkdown(issue.id)
    if (result.success) {
      if (result.updated) {
        toast.success('Converted to Markdown', {
          description: 'The description is now stored as Markdown.',
        })
      }
      router.refresh()
    } else {
      toast.error('error' in result ? result.error : 'Failed to convert description')
    }
    setIsConverting(false)
  }

  const handleDeleteAttachment = async (attachmentId: string) => {
    setDeletingAttachmentId(attachmentId)
    const result = await deleteAttachment(attachmentId)

    if (result.success) {
      setAttachments((prev) => prev.filter((attachment) => attachment.id !== attachmentId))
    } else {
      toast.error('error' in result ? result.error : 'Failed to delete attachment')
    }

    setDeletingAttachmentId(null)
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
                  aria-label={sidebarVisible ? 'Hide sidebar' : 'Show sidebar'}
                >
                  {sidebarVisible ? (
                    <PanelRightClose className="size-4" />
                  ) : (
                    <PanelRightOpen className="size-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {sidebarVisible ? 'Hide sidebar' : 'Show sidebar'}
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
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between space-y-0">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">Description</CardTitle>
                  {issue.descriptionFormat === 'textile' && (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      Legacy Textile
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {issue.descriptionFormat === 'textile' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleConvertDescription}
                      disabled={isConverting}
                      className="text-xs sm:text-sm"
                    >
                      {isConverting ? 'Converting...' : 'Convert'}
                    </Button>
                  )}
                  <div className="flex items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          onClick={() => changeFontSize(-1)}
                          disabled={fontSize === 'sm'}
                          aria-label="Decrease font size"
                        >
                          <Minus className="size-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Decrease font size</TooltipContent>
                    </Tooltip>
                    <span className="text-xs text-muted-foreground w-8 sm:w-12 text-center">
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
                          aria-label="Increase font size"
                        >
                          <Plus className="size-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Increase font size</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {issue.description ? (
                  <Markdown fontSize={fontSize} format={issue.descriptionFormat}>
                    {issue.description}
                  </Markdown>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No description provided.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="opacity-0 animate-card-in delay-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Paperclip className="size-4" />
                  Attachments
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {attachments.length === 0 ? (
                  <div className="text-sm text-muted-foreground italic px-1">
                    No attachments yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {attachments.map((attachment, index) => (
                      <div key={attachment.id}>
                        {index > 0 && <Separator className="my-3" />}
                        <div className="flex flex-col gap-3">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                            <div className="min-w-0 flex-1">
                              <Button
                                variant="link"
                                asChild
                                className="h-auto p-0 text-sm font-medium break-all"
                              >
                                <Link
                                  href={`/issues/${issue.id}/attachments/${attachment.id}`}
                                  aria-label={`Download ${attachment.filename}`}
                                >
                                  {attachment.filename}
                                </Link>
                              </Button>
                              <div className="mt-1 flex flex-wrap gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground">
                                <span>{formatFileSize(attachment.size)}</span>
                                <span>·</span>
                                <span className="truncate max-w-[120px] sm:max-w-none">{attachment.contentType}</span>
                                <span className="hidden sm:inline">·</span>
                                <span className="hidden sm:inline">{attachment.author.firstName} {attachment.author.lastName}</span>
                                <span className="hidden sm:inline">·</span>
                                <span className="hidden sm:inline">{formatDate(attachment.createdAt, 'datetime')}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2">
                              {hasPreview(attachment) && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={ATTACHMENT_BUTTON_CLASS}
                                  onClick={() => togglePreview(attachment.id)}
                                  aria-label={previewAttachmentId === attachment.id ? "Hide preview" : "Preview"}
                                >
                                  {previewAttachmentId === attachment.id ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                </Button>
                              )}
                              <Button variant="ghost" size="icon" className={ATTACHMENT_BUTTON_CLASS} asChild>
                                <Link
                                  href={`/issues/${issue.id}/attachments/${attachment.id}`}
                                  aria-label={`Download ${attachment.filename}`}
                                >
                                  <Download className="size-4" />
                                </Link>
                              </Button>
                              {(currentUserId === attachment.author.id || isAdmin) && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={ATTACHMENT_BUTTON_CLASS}
                                  onClick={() => handleDeleteAttachment(attachment.id)}
                                  disabled={deletingAttachmentId === attachment.id}
                                  aria-label={`Delete ${attachment.filename}`}
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                          {previewAttachmentId === attachment.id && (
                            <div className={cn(
                              'w-full rounded-md border bg-muted/50 overflow-hidden animate-in fade-in slide-in-from-top-2',
                              isPdf(attachment) ? 'h-[400px] sm:h-[600px]' : 'max-h-[600px]'
                            )}>
                              {isPdf(attachment) ? (
                                <PdfPreview key={attachment.id} url={`/issues/${issue.id}/attachments/${attachment.id}`} />
                              ) : (
                                <img
                                  src={`/issues/${issue.id}/attachments/${attachment.id}`}
                                  alt={attachment.filename}
                                  className="w-full h-auto object-contain"
                                />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
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
