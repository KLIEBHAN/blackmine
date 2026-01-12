import { AlertCircle } from 'lucide-react'

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
