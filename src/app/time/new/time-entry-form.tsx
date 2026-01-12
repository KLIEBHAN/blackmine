'use client'

import { useState, useCallback } from 'react'
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
import { ArrowLeft, Save, AlertCircle, Loader2, Clock } from 'lucide-react'

const activityTypes = [
  'development',
  'design',
  'review',
  'testing',
  'documentation',
  'support',
  'meeting',
  'other',
]

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
}

export function TimeEntryForm({ issues, projects, preselectedIssueId }: Props) {
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

  const updateField = useCallback(<K extends keyof typeof formData>(
    field: K,
    value: (typeof formData)[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field as keyof TimeEntryFormErrors]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field as keyof TimeEntryFormErrors]
        return next
      })
    }
  }, [errors])

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

    // TODO: Get actual user ID from auth context
    const userId = 'user-1'
    const result = await createTimeEntry(formData, userId)

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
              {errors.general && (
                <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="size-4" />
                  {errors.general}
                </div>
              )}

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
                {errors.issueId && (
                  <p className="flex items-center gap-1.5 text-sm text-destructive">
                    <AlertCircle className="size-3.5" />
                    {errors.issueId}
                  </p>
                )}
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
                  {errors.hours && (
                    <p className="flex items-center gap-1.5 text-sm text-destructive">
                      <AlertCircle className="size-3.5" />
                      {errors.hours}
                    </p>
                  )}
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
                      {activityTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          <span className="capitalize">{type}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.activityType && (
                    <p className="flex items-center gap-1.5 text-sm text-destructive">
                      <AlertCircle className="size-3.5" />
                      {errors.activityType}
                    </p>
                  )}
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
                {errors.spentOn && (
                  <p className="flex items-center gap-1.5 text-sm text-destructive">
                    <AlertCircle className="size-3.5" />
                    {errors.spentOn}
                  </p>
                )}
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
