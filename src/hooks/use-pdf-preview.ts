import { useState, useCallback } from 'react'

/**
 * Hook for toggling PDF preview visibility.
 * Returns the currently previewed attachment ID and a toggle function.
 */
export function usePdfPreview() {
  const [previewAttachmentId, setPreviewAttachmentId] = useState<string | null>(null)

  const togglePreview = useCallback((attachmentId: string) => {
    setPreviewAttachmentId(prev => prev === attachmentId ? null : attachmentId)
  }, [])

  return { previewAttachmentId, togglePreview }
}
