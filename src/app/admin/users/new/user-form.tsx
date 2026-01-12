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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { UserRole } from '@/types'
import { useFormField } from '@/hooks'
import { createUser, isEmailTaken } from '@/app/actions/users'
import { FormFieldError } from '@/components/ui/form-field-error'
import { ArrowLeft, Save, Loader2, UserPlus, Shield, Briefcase, Code, FileText } from 'lucide-react'

type UserFormData = {
  email: string
  firstName: string
  lastName: string
  role: UserRole
}

type UserFormErrors = {
  email?: string
  firstName?: string
  lastName?: string
  role?: string
}

const roleOptions: { value: UserRole; label: string; icon: typeof Shield }[] = [
  { value: 'admin', label: 'Administrator', icon: Shield },
  { value: 'manager', label: 'Manager', icon: Briefcase },
  { value: 'developer', label: 'Developer', icon: Code },
  { value: 'reporter', label: 'Reporter', icon: FileText },
]

export function UserForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<UserFormErrors>({})

  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    firstName: '',
    lastName: '',
    role: 'developer',
  })

  const updateField = useFormField(setFormData, errors, setErrors)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Client-side validation
    const validationErrors: UserFormErrors = {}
    if (!formData.firstName.trim()) {
      validationErrors.firstName = 'First name is required'
    }
    if (!formData.lastName.trim()) {
      validationErrors.lastName = 'Last name is required'
    }
    if (!formData.email.trim()) {
      validationErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      validationErrors.email = 'Invalid email format'
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsSubmitting(true)

    // Check for duplicate email
    const emailTaken = await isEmailTaken(formData.email)
    if (emailTaken) {
      setErrors({ email: 'This email is already in use' })
      setIsSubmitting(false)
      return
    }

    // Create user via server action
    const result = await createUser({
      email: formData.email,
      firstName: formData.firstName,
      lastName: formData.lastName,
      role: formData.role,
    })

    if (!result.success && result.errors) {
      setErrors(result.errors as UserFormErrors)
      toast.error('Failed to create user')
      setIsSubmitting(false)
      return
    }

    toast.success(`User "${formData.firstName} ${formData.lastName}" created`)
    router.push('/admin/users')
  }

  const hasError = (field: keyof UserFormErrors) => !!errors[field]

  return (
    <div className="grid-pattern min-h-full">
      <div className="mx-auto max-w-2xl p-6 lg:p-8">
        {/* Page Header */}
        <div className="mb-6 flex items-center gap-4 opacity-0 animate-card-in">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/users">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <UserPlus className="size-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">New User</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Add a new user to the system
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card className="opacity-0 animate-card-in delay-1">
            <CardHeader>
              <CardTitle className="text-lg">User Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Name Row */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* First Name */}
                <div className="space-y-2">
                  <Label
                    htmlFor="firstName"
                    className={cn(hasError('firstName') && 'text-destructive')}
                  >
                    First Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={(e) => updateField('firstName', e.target.value)}
                    className={cn(hasError('firstName') && 'border-destructive')}
                    autoFocus
                  />
                  <FormFieldError error={errors.firstName} />
                </div>

                {/* Last Name */}
                <div className="space-y-2">
                  <Label
                    htmlFor="lastName"
                    className={cn(hasError('lastName') && 'text-destructive')}
                  >
                    Last Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={(e) => updateField('lastName', e.target.value)}
                    className={cn(hasError('lastName') && 'border-destructive')}
                  />
                  <FormFieldError error={errors.lastName} />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className={cn(hasError('email') && 'text-destructive')}
                >
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john.doe@example.com"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className={cn(hasError('email') && 'border-destructive')}
                />
                <FormFieldError error={errors.email} />
              </div>

              {/* Role */}
              <div className="space-y-2">
                <Label
                  htmlFor="role"
                  className={cn(hasError('role') && 'text-destructive')}
                >
                  Role <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => updateField('role', value as UserRole)}
                >
                  <SelectTrigger
                    id="role"
                    className={cn(hasError('role') && 'border-destructive')}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((option) => {
                      const Icon = option.icon
                      return (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <Icon
                              className={cn(
                                'size-3.5',
                                option.value === 'admin' && 'text-red-500',
                                option.value === 'manager' && 'text-purple-500',
                                option.value === 'developer' && 'text-blue-500',
                                option.value === 'reporter' && 'text-slate-500'
                              )}
                            />
                            {option.label}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                <FormFieldError error={errors.role} />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="mt-6 flex items-center justify-end gap-3 opacity-0 animate-card-in delay-2">
            <Button type="button" variant="outline" asChild>
              <Link href="/admin/users">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="size-4" />
                  Create User
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
