import { useCallback, type Dispatch, type SetStateAction } from 'react'

/** Updates a form field and clears its associated error. */
export function useFormField<
  TFormData extends Record<string, unknown>,
  TErrors extends Record<string, string | undefined>
>(
  setFormData: Dispatch<SetStateAction<TFormData>>,
  errors: TErrors,
  setErrors: Dispatch<SetStateAction<TErrors>>
) {
  return useCallback(
    <K extends keyof TFormData>(field: K, value: TFormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }))
      if (errors[field as keyof TErrors]) {
        setErrors((prev) => {
          const next = { ...prev }
          delete next[field as keyof TErrors]
          return next
        })
      }
    },
    [setFormData, errors, setErrors]
  )
}
