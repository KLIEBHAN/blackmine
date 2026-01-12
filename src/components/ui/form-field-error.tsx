import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FormFieldErrorProps {
  error: string | undefined
}

/**
 * Displays a form field validation error with consistent styling.
 * Renders nothing if error is undefined/empty.
 */
export function FormFieldError({ error }: FormFieldErrorProps) {
  if (!error) return null

  return (
    <p className="flex items-center gap-1.5 text-sm text-destructive">
      <AlertCircle className="size-3.5" />
      {error}
    </p>
  )
}

interface GeneralFormErrorProps {
  error: string | undefined
  className?: string
}

/**
 * Displays a general form error (e.g., server errors) in a prominent box.
 * Renders nothing if error is undefined/empty.
 */
export function GeneralFormError({ error, className }: GeneralFormErrorProps) {
  if (!error) return null

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive',
        className
      )}
    >
      <AlertCircle className="size-4" />
      {error}
    </div>
  )
}
