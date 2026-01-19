'use client'

import Link from 'next/link'
import { Download, X } from 'lucide-react'

import { isPdf } from '@/lib/attachment-preview'
import { Button } from './button'
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from './dialog'
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
      <DialogContent
        showCloseButton={false}
        className="max-w-none w-[calc(100vw-2rem)] h-[calc(100vh-2rem)] p-0 gap-0 flex flex-col bg-zinc-950 border-zinc-800 overflow-hidden"
      >
        <DialogHeader className="flex-row items-center justify-between px-4 h-14 bg-zinc-900 border-b border-zinc-800 shrink-0 space-y-0">
          <DialogTitle className="truncate text-sm font-medium text-zinc-100 flex-1 pr-4">
            {attachment.filename}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
              asChild
            >
              <Link
                href={attachmentUrl}
                aria-label={`Download ${attachment.filename}`}
              >
                <Download className="size-4 mr-2" />
                Download
              </Link>
            </Button>
            <DialogClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
              >
                <X className="size-4" />
                <span className="sr-only">Close</span>
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>
        <div className="flex-1 min-h-0 w-full overflow-hidden bg-zinc-950">
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
