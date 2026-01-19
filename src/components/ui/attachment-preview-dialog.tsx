'use client'

import Link from 'next/link'
import { Download } from 'lucide-react'

import { isPdf } from '@/lib/attachment-preview'
import { Button } from './button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog'
import { PdfPreview } from './pdf-preview'

interface AttachmentPreviewDialogProps {
  attachment: {
    id: string
    filename: string
    contentType: string
  }
  issueId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AttachmentPreviewDialog({
  attachment,
  issueId,
  open,
  onOpenChange,
}: AttachmentPreviewDialogProps) {
  const attachmentUrl = `/issues/${issueId}/attachments/${attachment.id}`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-full max-h-[calc(100vh-4rem)] flex flex-col">
        <DialogHeader className="flex-row items-center justify-between gap-4 space-y-0">
          <DialogTitle className="truncate pr-8">{attachment.filename}</DialogTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href={attachmentUrl} aria-label={`Download ${attachment.filename}`}>
              <Download className="size-4 mr-2" />
              Download
            </Link>
          </Button>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-hidden rounded-md border bg-muted/30">
          {isPdf(attachment) ? (
            <PdfPreview url={attachmentUrl} />
          ) : (
            <div className="flex items-center justify-center h-full p-4">
              <img
                src={attachmentUrl}
                alt={attachment.filename}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
