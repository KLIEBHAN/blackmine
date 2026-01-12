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
import { createTimeEntry, type TimeEntryFormErrors } from '@/app/actions/time-entries'
import { useFormField } from '@/hooks'
import { FormFieldError, GeneralFormError } from '@/components/ui/form-field-error'
import { ArrowLeft, Save, Loader2, Clock } from 'lucide-react'
import { activityTypeOptions } from '@/types'

type SerializedIssue = {
  id: string
  subject: string
  projectId: string
}

type SerializedProject = {
  id: string
  name: string
}

type Props = {
  issues: SerializedIssue[]
  projects: SerializedProject[]
  preselectedIssueId?: string
  currentUserId: string
}

export function TimeEntryForm({ issues, projects, preselectedIssueId, currentUserId }: Props) {
  const router = useRouter()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<TimeEntryFormErrors>({})

  const [formData, setFormData] = useState({
    issueId: preselectedIssueId ?? '',
    hours: 0,
    activityType: 'development',
    spentOn: new Date().toISOString().split('T')[0],
    comments: '',
  })

  const updateField = useFormField(setFormData, errors, setErrors)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Client-side validation
    const clientErrors: TimeEntryFormErrors = {}
    if (!formData.issueId) {
      clientErrors.issueId = 'Issue is required'
    }
    if (!formData.hours || formData.hours <= 0) {
      clientErrors.hours = 'Hours must be greater than 0'
    } else if (formData.hours > 24) {
      clientErrors.hours = 'Hours cannot exceed 24'
    }
    if (!formData.activityType) {
      clientErrors.activityType = 'Activity type is required'
    }
    if (!formData.spentOn) {
      clientErrors.spentOn = 'Date is required'
    }

    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors)
      return
    }

    setIsSubmitting(true)

    const result = await createTimeEntry(formData, currentUserId)

    if (!result.success) {
      setErrors(result.errors || {})
      toast.error('Failed to log time')
      setIsSubmitting(false)
      return
    }

    toast.success(`${formData.hours}h logged successfully`)
    router.push('/time')
  }

  const hasError = (field: keyof TimeEntryFormErrors) => !!errors[field]

  // Group issues by project for better UX
  const issuesByProject = projects.map((project) => ({
    project,
    issues: issues.filter((issue) => issue.projectId === project.id),
  })).filter((group) => group.issues.length > 0)

  return (
    <div className="grid-pattern min-h-full">
      <div className="mx-auto max-w-3xl p-6 lg:p-8">
        {/* Page Header */}
        <div className="mb-6 flex items-center gap-4 opacity-0 animate-card-in">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/time">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <Clock className="size-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Log Time</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Record time spent on an issue
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card className="opacity-0 animate-card-in delay-1">
            <CardHeader>
              <CardTitle className="text-lg">Time Entry Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* General Error */}
              <GeneralFormError error={errors.general} />

              {/* Issue Selection */}
              <div className="space-y-2">
                <Label htmlFor="issue" className={cn(hasError('issueId') && 'text-destructive')}>
                  Issue <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.issueId}
                  onValueChange={(value) => updateField('issueId', value)}
                >
                  <SelectTrigger
                    id="issue"
                    className={cn(hasError('issueId') && 'border-destructive')}
                  >
                    <SelectValue placeholder="Select an issue" />
                  </SelectTrigger>
                  <SelectContent>
                    {issuesByProject.map(({ project, issues }) => (
                      <div key={project.id}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                          {project.name}
                        </div>
                        {issues.map((issue) => (
                          <SelectItem key={issue.id} value={issue.id}>
                            <span className="font-mono text-muted-foreground">#{issue.id.slice(-4)}</span>
                            {' '}
                            <span className="truncate">{issue.subject}</span>
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
                <FormFieldError error={errors.issueId} />
              </div>

              {/* Hours & Activity Row */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Hours */}
                <div className="space-y-2">
                  <Label htmlFor="hours" className={cn(hasError('hours') && 'text-destructive')}>
                    Hours <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="hours"
                    type="number"
                    min="0.25"
                    max="24"
                    step="0.25"
                    placeholder="0"
                    value={formData.hours || ''}
                    onChange={(e) =>
                      updateField('hours', e.target.value ? parseFloat(e.target.value) : 0)
                    }
                    className={cn('font-mono', hasError('hours') && 'border-destructive')}
                  />
                  <FormFieldError error={errors.hours} />
                </div>

                {/* Activity Type */}
                <div className="space-y-2">
                  <Label htmlFor="activity" className={cn(hasError('activityType') && 'text-destructive')}>
                    Activity <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.activityType}
                    onValueChange={(value) => updateField('activityType', value)}
                  >
                    <SelectTrigger
                      id="activity"
                      className={cn(hasError('activityType') && 'border-destructive')}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {activityTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormFieldError error={errors.activityType} />
                </div>
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="spentOn" className={cn(hasError('spentOn') && 'text-destructive')}>
                  Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="spentOn"
                  type="date"
                  value={formData.spentOn}
                  onChange={(e) => updateField('spentOn', e.target.value)}
                  className={cn('font-mono', hasError('spentOn') && 'border-destructive')}
                />
                <FormFieldError error={errors.spentOn} />
              </div>

              {/* Comments */}
              <div className="space-y-2">
                <Label htmlFor="comments">Comments</Label>
                <Textarea
                  id="comments"
                  placeholder="What did you work on?"
                  rows={4}
                  value={formData.comments}
                  onChange={(e) => updateField('comments', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="mt-6 flex items-center justify-end gap-3 opacity-0 animate-card-in delay-2">
            <Button type="button" variant="outline" asChild>
              <Link href="/time">Cancel</Link>
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
                  Log Time
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
