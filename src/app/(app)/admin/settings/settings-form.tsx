'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FormFieldError, GeneralFormError } from '@/components/ui/form-field-error'
import { useFormField } from '@/hooks'
import { cn } from '@/lib/utils'
import { updateAppSettings } from '@/app/actions/settings'
import { priorityOptions, trackerOptions, type IssuePriority, type IssueTracker } from '@/types'
import type { AppSettingsFormData, AppSettingsFormErrors } from '@/lib/settings'

type SettingsFormProps = {
  initialSettings: AppSettingsFormData
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [formData, setFormData] = useState<AppSettingsFormData>(initialSettings)
  const [errors, setErrors] = useState<AppSettingsFormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateField = useFormField(setFormData, errors, setErrors)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setErrors({})
    setIsSubmitting(true)

    const result = await updateAppSettings(formData)

    if (!result.success) {
      const nextErrors = (result.errors || {}) as AppSettingsFormErrors
      setErrors(nextErrors)
      toast.error('Failed to update settings', {
        description: nextErrors.general || 'Please check the form for errors.',
      })
      setIsSubmitting(false)
      return
    }

    toast.success('Settings updated')
    setIsSubmitting(false)
  }

  const hasError = (field: keyof AppSettingsFormErrors) => !!errors[field]

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Global Settings</CardTitle>
        <CardDescription>Manage instance branding and default issue values.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <GeneralFormError error={errors.general} />

          <div className="space-y-2">
            <Label htmlFor="instanceName" className={cn(hasError('instanceName') && 'text-destructive')}>
              Instance Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="instanceName"
              value={formData.instanceName}
              onChange={(event) => updateField('instanceName', event.target.value)}
              className={cn(hasError('instanceName') && 'border-destructive')}
              placeholder="Blackmine"
            />
            <FormFieldError error={errors.instanceName} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="defaultTracker" className={cn(hasError('defaultIssueTracker') && 'text-destructive')}>
                Default Tracker <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.defaultIssueTracker}
                onValueChange={(value) => updateField('defaultIssueTracker', value as IssueTracker)}
              >
                <SelectTrigger
                  id="defaultTracker"
                  className={cn(hasError('defaultIssueTracker') && 'border-destructive')}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {trackerOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormFieldError error={errors.defaultIssueTracker} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultPriority" className={cn(hasError('defaultIssuePriority') && 'text-destructive')}>
                Default Priority <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.defaultIssuePriority}
                onValueChange={(value) => updateField('defaultIssuePriority', value as IssuePriority)}
              >
                <SelectTrigger
                  id="defaultPriority"
                  className={cn(hasError('defaultIssuePriority') && 'border-destructive')}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormFieldError error={errors.defaultIssuePriority} />
            </div>
          </div>

          <Button type="submit" className="gap-2" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="size-4" />
                Save Settings
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
