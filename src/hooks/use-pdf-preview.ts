import { useState, useCallback } from 'react'

/**
 * Hook for toggling attachment preview visibility (PDF, images, etc.).
 * Returns the currently previewed attachment ID and a toggle function.
 */
export function useAttachmentPreview() {
  const [previewAttachmentId, setPreviewAttachmentId] = useState<string | null>(null)

  const togglePreview = useCallback((attachmentId: string) => {
    setPreviewAttachmentId(prev => prev === attachmentId ? null : attachmentId)
  }, [])

  return { previewAttachmentId, togglePreview }
}

/** @deprecated Use useAttachmentPreview instead */
export const usePdfPreview = useAttachmentPreview
