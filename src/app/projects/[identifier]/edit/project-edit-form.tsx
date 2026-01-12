'use client'

import { useState, useCallback, useTransition } from 'react'
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
import { updateProject, isIdentifierTaken } from '@/app/actions/projects'
import { FormFieldError, GeneralFormError } from '@/components/ui/form-field-error'
import { ArrowLeft, Save, AlertCircle, Loader2, FolderEdit } from 'lucide-react'
import { type ProjectStatus, projectStatusOptions } from '@/types'

type ProjectFormData = {
  name: string
  identifier: string
  description: string
  status: ProjectStatus
}

type ProjectFormErrors = {
  name?: string
  identifier?: string
  status?: string
  general?: string
}

export type SerializedProject = {
  id: string
  name: string
  identifier: string
  description: string
  status: string
  createdAt: string
  updatedAt: string
}

interface ProjectEditFormProps {
  project: SerializedProject
}

export function ProjectEditForm({ project }: ProjectEditFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<ProjectFormErrors>({})
  const [identifierExists, setIdentifierExists] = useState(false)
  const [checkingIdentifier, setCheckingIdentifier] = useState(false)

  const [formData, setFormData] = useState<ProjectFormData>({
    name: project.name,
    identifier: project.identifier,
    description: project.description,
    status: project.status as ProjectStatus,
  })

  // Check identifier availability
  const checkIdentifier = useCallback(async (identifier: string) => {
    if (!identifier || identifier.length < 2 || identifier === project.identifier) {
      setIdentifierExists(false)
      return
    }
    setCheckingIdentifier(true)
    try {
      const taken = await isIdentifierTaken(identifier, project.id)
      setIdentifierExists(taken)
    } finally {
      setCheckingIdentifier(false)
    }
  }, [project.identifier, project.id])

  const updateField = useCallback(<K extends keyof ProjectFormData>(
    field: K,
    value: ProjectFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    
    // Check identifier if changed
    if (field === 'identifier') {
      checkIdentifier(value as string)
    }
    
    // Clear error when user edits field
    const errorField = field as keyof ProjectFormErrors
    if (errors[errorField]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[errorField]
        return next
      })
    }
  }, [errors, checkIdentifier])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Client-side validation
    const validationErrors: ProjectFormErrors = {}
    if (!formData.name.trim()) {
      validationErrors.name = 'Name is required'
    }
    if (!formData.identifier.trim()) {
      validationErrors.identifier = 'Identifier is required'
    } else if (!/^[a-z][a-z0-9-]*$/.test(formData.identifier)) {
      validationErrors.identifier = 'Must start with letter, use lowercase, numbers, hyphens only'
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    startTransition(async () => {
      const result = await updateProject(project.id, {
        name: formData.name,
        identifier: formData.identifier,
        description: formData.description,
        status: formData.status,
      })

      if (!result.success) {
        setErrors(result.errors || { general: 'Failed to update project' })
        toast.error('Failed to update project')
        return
      }

      toast.success(`Project "${formData.name}" updated`)
      router.push(`/projects/${result.project!.identifier}`)
    })
  }

  const hasError = (field: keyof ProjectFormErrors) => !!errors[field]

  return (
    <div className="grid-pattern min-h-full">
      <div className="mx-auto max-w-2xl p-6 lg:p-8">
        {/* Page Header */}
        <div className="mb-6 flex items-center gap-4 opacity-0 animate-card-in">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/projects/${project.identifier}`}>
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <FolderEdit className="size-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Edit Project</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                <span className="font-mono">{project.identifier}</span>
                {' · '}
                {project.name}
              </p>
            </div>
          </div>
        </div>

        {/* General Error */}
        <GeneralFormError error={errors.general} className="mb-4 rounded-lg border border-destructive/50" />

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card className="opacity-0 animate-card-in delay-1">
            <CardHeader>
              <CardTitle className="text-lg">Project Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className={cn(hasError('name') && 'text-destructive')}>
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="My Project"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className={cn(hasError('name') && 'border-destructive')}
                  autoFocus
                />
                <FormFieldError error={errors.name} />
              </div>

              {/* Identifier */}
              <div className="space-y-2">
                <Label htmlFor="identifier" className={cn(hasError('identifier') && 'text-destructive')}>
                  Identifier <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="identifier"
                    placeholder="my-project"
                    value={formData.identifier}
                    onChange={(e) => updateField('identifier', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    className={cn(
                      'font-mono text-sm',
                      hasError('identifier') && 'border-destructive',
                      identifierExists && !errors.identifier && 'border-amber-500'
                    )}
                  />
                  {checkingIdentifier && (
                    <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Used in URLs. Lowercase letters, numbers, and hyphens only.
                </p>
                <FormFieldError error={errors.identifier} />
                {identifierExists && !errors.identifier && (
                  <p className="flex items-center gap-1.5 text-sm text-amber-600">
                    <AlertCircle className="size-3.5" />
                    This identifier is already in use
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the purpose of this project..."
                  rows={4}
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                />
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status" className={cn(hasError('status') && 'text-destructive')}>
                  Status <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => updateField('status', value as ProjectStatus)}
                >
                  <SelectTrigger
                    id="status"
                    className={cn(hasError('status') && 'border-destructive')}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {projectStatusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'size-2 rounded-full',
                              option.value === 'active' && 'bg-green-500',
                              option.value === 'archived' && 'bg-amber-500',
                              option.value === 'closed' && 'bg-slate-400'
                            )}
                          />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormFieldError error={errors.status} />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="mt-6 flex items-center justify-end gap-3 opacity-0 animate-card-in delay-2">
            <Button type="button" variant="outline" asChild>
              <Link href={`/projects/${project.identifier}`}>Cancel</Link>
            </Button>
            <Button type="submit" disabled={isPending || identifierExists} className="gap-2">
              {isPending ? (
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
