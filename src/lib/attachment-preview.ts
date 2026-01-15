/**
 * Attachment preview utilities for determining previewable file types.
 */

/** Image MIME types that browsers can display natively */
export const IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/avif',
] as const

type AttachmentLike = {
  contentType: string
  filename: string
}

/** Check if attachment is a PDF */
export function isPdf(attachment: AttachmentLike): boolean {
  return (
    attachment.contentType === 'application/pdf' ||
    attachment.filename.toLowerCase().endsWith('.pdf')
  )
}

/** Check if attachment is a browser-displayable image */
export function isImage(attachment: Pick<AttachmentLike, 'contentType'>): boolean {
  return (IMAGE_TYPES as readonly string[]).includes(attachment.contentType)
}

/** Check if attachment has a previewable type (PDF or image) */
export function hasPreview(attachment: AttachmentLike): boolean {
  return isPdf(attachment) || isImage(attachment)
}
