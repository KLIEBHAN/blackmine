/**
 * Handles errors in server actions with consistent logging and response format.
 *
 * @param error - The caught error
 * @param operation - Human-readable operation name for logging (e.g., "create issue")
 * @param useErrorsFormat - If true, returns { errors: { general } }, else { error }
 * @returns Standardized error response object
 */
export function handleActionError(
  error: unknown,
  operation: string,
  useErrorsFormat: true
): { success: false; errors: { general: string } }
export function handleActionError(
  error: unknown,
  operation: string,
  useErrorsFormat?: false
): { success: false; error: string }
export function handleActionError(
  error: unknown,
  operation: string,
  useErrorsFormat = false
): { success: false; error?: string; errors?: { general: string } } {
  console.error(`Failed to ${operation}:`, error)
  const message = `Failed to ${operation}. Please try again.`

  if (useErrorsFormat) {
    return { success: false, errors: { general: message } }
  }
  return { success: false, error: message }
}
