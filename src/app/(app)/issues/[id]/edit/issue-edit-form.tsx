'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { FormFieldError, GeneralFormError } from '@/components/ui/form-field-error'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { type IssueTracker, type IssuePriority, trackerOptions, priorityOptions, getFullName } from '@/types'
import { useFormField } from '@/hooks'

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
  tracker: string
  status: string
  priority: string
  projectId: string
  assigneeId: string | null
  dueDate: string | null
  estimatedHours: number | null
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

  const [formData, setFormData] = useState<FormData>({
    projectId: issue.projectId,
    tracker: issue.tracker as IssueTracker,
    subject: issue.subject,
    description: issue.description,
    priority: issue.priority as IssuePriority,
    assigneeId: issue.assigneeId,
    dueDate: issue.dueDate,
    estimatedHours: issue.estimatedHours,
  })

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
                <Textarea
                  id="description"
                  placeholder="Detailed description of the issue..."
                  rows={5}
                  className="max-h-80 overflow-y-auto"
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
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
