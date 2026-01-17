'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormFieldError, GeneralFormError } from '@/components/ui/form-field-error'
import { login, type LoginFormErrors } from '@/app/actions/auth'
import { Loader2, LogIn } from 'lucide-react'

type LoginFormProps = {
  instanceName: string
}

export function LoginForm({ instanceName }: LoginFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<LoginFormErrors>({})
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setIsSubmitting(true)

    const result = await login(email, password)
    
    if (!result.success) {
      setErrors(result.errors || {})
      if (result.errors?.general) {
        toast.error(result.errors.general)
      }
      setIsSubmitting(false)
    }
  }

  const hasError = (field: keyof LoginFormErrors) => !!errors[field]

  return (
    <div className="grid-pattern flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md opacity-0 animate-card-in">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10">
            <LogIn className="size-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Sign in to {instanceName}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <GeneralFormError error={errors.general} />
            
            <div className="space-y-2">
              <Label htmlFor="email" className={cn(hasError('email') && 'text-destructive')}>
                Email
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }))
                }}
                className={cn(hasError('email') && 'border-destructive')}
              />
              <FormFieldError error={errors.email} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className={cn(hasError('password') && 'text-destructive')}>
                Password
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }))
                }}
                className={cn(hasError('password') && 'border-destructive')}
              />
              <FormFieldError error={errors.password} />
            </div>

            <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="size-4" />
                  Sign in
                </>
              )}
            </Button>
          </form>
          
          <div className="mt-6 rounded-lg bg-muted/50 p-4 text-center text-sm text-muted-foreground">
            <p className="font-medium">Demo Credentials</p>
            <p className="mt-1">admin@example.com / password123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
