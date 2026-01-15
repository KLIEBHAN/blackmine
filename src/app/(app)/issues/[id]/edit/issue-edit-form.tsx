'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { toast } from 'sonner'
import { cn, formatDate, formatFileSize } from '@/lib/utils'
import { textileToMarkdown } from '@/lib/textile'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { updateIssue, type IssueFormErrors } from '@/app/actions/issues'
import { deleteAttachment, uploadAttachment } from '@/app/actions/attachments'
import { FormFieldError, GeneralFormError } from '@/components/ui/form-field-error'
import { ArrowLeft, Save, Loader2, Paperclip, Upload, Download, Trash2 } from 'lucide-react'
import { type IssueTracker, type IssuePriority, trackerOptions, priorityOptions, getFullName } from '@/types'
import { useFormField } from '@/hooks'

const MarkdownEditor = dynamic(
  () => import('@/components/ui/markdown-editor').then((m) => m.MarkdownEditor),
  {
    loading: () => (
      <Textarea
        placeholder="Loading editor..."
        disabled
        rows={5}
        className="max-h-80 animate-pulse"
      />
    ),
    ssr: false,
  }
)

type FormData = {
  projectId: string
  tracker: IssueTracker
  subject: string
  description: string
  priority: IssuePriority
  assigneeId: string | null
  dueDate: string | null
  estimatedHours: number | null
}

type SerializedUser = {
  id: string
  firstName: string
  lastName: string
}

type SerializedProject = {
  id: string
  name: string
  status: string
}

type SerializedIssue = {
  id: string
  subject: string
  description: string
  descriptionFormat: 'markdown' | 'textile'
  tracker: string
  status: string
  priority: string
  projectId: string
  assigneeId: string | null
  dueDate: string | null
  estimatedHours: number | null
  attachments: {
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
  }[]
}

type Props = {
  issue: SerializedIssue
  users: SerializedUser[]
  projects: SerializedProject[]
}

export function IssueEditForm({ issue, users, projects }: Props) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<IssueFormErrors>({})

  const activeProjects = projects.filter((p) => p.status === 'active')

  const initialDescription =
    issue.descriptionFormat === 'textile' ? textileToMarkdown(issue.description) : issue.description

  const [formData, setFormData] = useState<FormData>({
    projectId: issue.projectId,
    tracker: issue.tracker as IssueTracker,
    subject: issue.subject,
    description: initialDescription,
    priority: issue.priority as IssuePriority,
    assigneeId: issue.assigneeId,
    dueDate: issue.dueDate,
    estimatedHours: issue.estimatedHours,
  })
  const [attachments, setAttachments] = useState(issue.attachments)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const updateField = useFormField(setFormData, errors, setErrors)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})

    const result = await updateIssue(issue.id, {
      projectId: formData.projectId,
      tracker: formData.tracker,
      subject: formData.subject,
      description: formData.description,
      priority: formData.priority,
      assigneeId: formData.assigneeId,
      dueDate: formData.dueDate,
      estimatedHours: formData.estimatedHours,
    })

    if (!result.success) {
      const errors = (result.errors || {}) as IssueFormErrors
      setErrors(errors)
      setIsSubmitting(false)
      toast.error('Failed to update issue', {
        description: errors.general || 'Please check the form for errors.',
      })
      return
    }

    toast.success('Issue updated', {
      description: 'Your changes have been saved.',
    })
    router.push(`/issues/${issue.id}`)
  }

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setUploadError(null)

    const file = fileInputRef.current?.files?.[0]
    if (!file) {
      setUploadError('Please choose a file to upload.')
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    setIsUploading(true)
    const result = await uploadAttachment(issue.id, formData)

    if (result.success && result.attachment) {
      setAttachments((prev) => [
        {
          id: result.attachment.id,
          filename: result.attachment.filename,
          contentType: result.attachment.contentType,
          size: result.attachment.size,
          createdAt: result.attachment.createdAt.toISOString(),
          author: {
            id: result.attachment.author.id,
            firstName: result.attachment.author.firstName,
            lastName: result.attachment.author.lastName,
          },
        },
        ...prev,
      ])
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } else if (result.errors) {
      setUploadError(result.errors.file || result.errors.general || 'Upload failed.')
    } else {
      setUploadError('Upload failed.')
    }

    setIsUploading(false)
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

  const hasError = (field: keyof IssueFormErrors) => !!errors[field]

  return (
    <div className="grid-pattern min-h-full">
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Page Header */}
        <div className="mb-6 flex items-center gap-4 opacity-0 animate-card-in">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/issues/${issue.id}`}>
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Edit Issue</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              <span className="font-mono">#{issue.id.split('-')[1] || issue.id}</span>
              {' · '}
              {issue.subject}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card className="opacity-0 animate-card-in delay-1">
            <CardHeader>
              <CardTitle className="text-lg">Issue Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* General Error */}
              <GeneralFormError error={errors.general} />

              {/* Project & Tracker Row */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Project */}
                <div className="space-y-2">
                  <Label htmlFor="project" className={cn(hasError('projectId') && 'text-destructive')}>
                    Project <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.projectId}
                    onValueChange={(value) => updateField('projectId', value)}
                  >
                    <SelectTrigger
                      id="project"
                      className={cn(hasError('projectId') && 'border-destructive')}
                    >
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeProjects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormFieldError error={errors.projectId} />
                </div>

                {/* Tracker */}
                <div className="space-y-2">
                  <Label htmlFor="tracker" className={cn(hasError('tracker') && 'text-destructive')}>
                    Tracker <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.tracker}
                    onValueChange={(value) => updateField('tracker', value as IssueTracker)}
                  >
                    <SelectTrigger
                      id="tracker"
                      className={cn(hasError('tracker') && 'border-destructive')}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {trackerOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="secondary"
                              className={cn(
                                'rounded px-1.5 py-0 text-[10px]',
                                `tracker-${option.value}`
                              )}
                            >
                              {option.label}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormFieldError error={errors.tracker} />
                </div>
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <Label htmlFor="subject" className={cn(hasError('subject') && 'text-destructive')}>
                  Subject <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="subject"
                  placeholder="Brief description of the issue"
                  value={formData.subject}
                  onChange={(e) => updateField('subject', e.target.value)}
                  className={cn(hasError('subject') && 'border-destructive')}
                />
                <FormFieldError error={errors.subject} />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <MarkdownEditor
                  value={formData.description}
                  onChange={(value) => updateField('description', value)}
                  placeholder="Detailed description of the issue..."
                />
              </div>

              {/* Priority & Assignee Row */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Priority */}
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => updateField('priority', value as IssuePriority)}
                  >
                    <SelectTrigger id="priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                'priority-indicator h-4',
                                `priority-${option.value}`
                              )}
                            />
                            <span>{option.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Assignee */}
                <div className="space-y-2">
                  <Label htmlFor="assignee">Assignee</Label>
                  <Select
                    value={formData.assigneeId ?? '__unassigned__'}
                    onValueChange={(value) => updateField('assigneeId', value === '__unassigned__' ? null : value)}
                  >
                    <SelectTrigger id="assignee">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__unassigned__">Unassigned</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {getFullName(user)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Due Date & Estimated Hours Row */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Due Date */}
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate || ''}
                    onChange={(e) =>
                      updateField('dueDate', e.target.value || null)
                    }
                    className="font-mono"
                  />
                </div>

                {/* Estimated Hours */}
                <div className="space-y-2">
                  <Label htmlFor="estimatedHours">Estimated Hours</Label>
                  <Input
                    id="estimatedHours"
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="0"
                    value={formData.estimatedHours ?? ''}
                    onChange={(e) =>
                      updateField(
                        'estimatedHours',
                        e.target.value ? parseFloat(e.target.value) : null
                      )
                    }
                    className="font-mono"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Paperclip className="size-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">Attachments</h3>
                  <Badge variant="secondary" className="text-xs">
                    {attachments.length}
                  </Badge>
                </div>

                {attachments.length === 0 ? (
                  <div className="text-sm text-muted-foreground italic">No attachments yet.</div>
                ) : (
                  <div className="space-y-3">
                    {attachments.map((attachment, index) => (
                      <div key={attachment.id}>
                        {index > 0 && <Separator className="my-3" />}
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <Button
                              variant="link"
                              asChild
                              className="h-auto p-0 text-sm font-medium"
                            >
                              <Link
                                href={`/issues/${issue.id}/attachments/${attachment.id}`}
                                aria-label={`Download ${attachment.filename}`}
                              >
                                {attachment.filename}
                              </Link>
                            </Button>
                            <div className="text-xs text-muted-foreground">
                              {formatFileSize(attachment.size)} · {attachment.contentType} ·{' '}
                              {attachment.author.firstName} {attachment.author.lastName} ·{' '}
                              {formatDate(attachment.createdAt, 'datetime')}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" asChild>
                              <Link
                                href={`/issues/${issue.id}/attachments/${attachment.id}`}
                                aria-label={`Download ${attachment.filename}`}
                              >
                                <Download className="size-4" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteAttachment(attachment.id)}
                              disabled={deletingAttachmentId === attachment.id}
                              aria-label={`Delete ${attachment.filename}`}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <Separator />
                <form onSubmit={handleUpload} className="grid w-full max-w-lg gap-2">
                  <Label
                    htmlFor="attachment-upload"
                    className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                  >
                    Upload File
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    <Input
                      id="attachment-upload"
                      ref={fileInputRef}
                      type="file"
                      className="text-sm cursor-pointer file:cursor-pointer"
                    />
                    <Button type="submit" size="sm" className="gap-2" disabled={isUploading}>
                      <Upload className="size-3.5" />
                      {isUploading ? 'Uploading...' : 'Upload'}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Max file size 100 MB.</p>
                  {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}
                </form>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="mt-6 flex items-center justify-end gap-3 opacity-0 animate-card-in delay-2">
            <Button type="button" variant="outline" asChild>
              <Link href={`/issues/${issue.id}`}>Cancel</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="size-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
