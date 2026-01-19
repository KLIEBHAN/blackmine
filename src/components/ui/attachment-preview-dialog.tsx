'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import {
  Download,
  X,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize2,
  Expand,
  MoveHorizontal,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

import { isPdf } from '@/lib/attachment-preview'
import { Button } from './button'
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from './dialog'
import { PdfPreview, ZOOM_LEVELS, type ZoomMode } from './pdf-preview'
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip'

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
  const isPdfFile = isPdf(attachment)

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState<number | null>(null)
  const [zoom, setZoom] = useState(1.0)
  const [zoomMode, setZoomMode] = useState<ZoomMode>('fitPage')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [attachmentKey, setAttachmentKey] = useState(attachment.id)

  const contentRef = useRef<HTMLDivElement>(null)

  // Reset state when attachment changes (via key change pattern)
  if (attachment.id !== attachmentKey) {
    setAttachmentKey(attachment.id)
    setPage(1)
    setTotalPages(null)
    setZoom(1.0)
    setZoomMode('fitPage')
  }

  useEffect(() => {
    function syncFullscreenState() {
      if (contentRef.current) {
        setIsFullscreen(document.fullscreenElement === contentRef.current)
      }
    }
    document.addEventListener('fullscreenchange', syncFullscreenState)
    return () => document.removeEventListener('fullscreenchange', syncFullscreenState)
  }, [])

  function zoomIn() {
    setZoomMode('scale')
    setZoom(current => {
      const nextLevelIndex = ZOOM_LEVELS.findIndex(level => level > current)
      return nextLevelIndex >= 0 ? ZOOM_LEVELS[nextLevelIndex] : current
    })
  }

  function zoomOut() {
    setZoomMode('scale')
    setZoom(current => {
      const prevLevelIndex = ZOOM_LEVELS.findLastIndex(level => level < current)
      return prevLevelIndex >= 0 ? ZOOM_LEVELS[prevLevelIndex] : current
    })
  }

  function toggleFullscreen() {
    if (!contentRef.current) return
    if (isFullscreen) {
      document.exitFullscreen()
    } else {
      contentRef.current.requestFullscreen()
    }
  }

  function getZoomLabel() {
    switch (zoomMode) {
      case 'scale': return `${Math.round(zoom * 100)}%`
      case 'fitWidth': return 'Width'
      case 'fitPage': return 'Page'
    }
  }

  const canZoomIn = zoomMode === 'scale' ? zoom < ZOOM_LEVELS[ZOOM_LEVELS.length - 1] : true
  const canZoomOut = zoomMode === 'scale' ? zoom > ZOOM_LEVELS[0] : true
  const isMultiPage = totalPages !== null && totalPages > 1

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="!max-w-[95vw] w-full h-[95vh] p-0 gap-0 flex flex-col bg-zinc-950 border border-zinc-700 overflow-hidden"
      >
        <div ref={contentRef} className="flex flex-col h-full w-full bg-zinc-950">
          <DialogHeader className="flex-row items-center gap-2 px-4 h-14 bg-zinc-900 border-b border-zinc-800 shrink-0 space-y-0">
            <DialogTitle className="truncate text-sm font-medium text-zinc-100 mr-auto max-w-[200px] md:max-w-md">
              {attachment.filename}
            </DialogTitle>

            {isPdfFile && (
              <>
                <ToolbarDivider />
                
                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800" onClick={zoomOut} disabled={!canZoomOut}>
                        <ZoomOut className="size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Zoom out</TooltipContent>
                  </Tooltip>

                  <span className="text-xs text-zinc-400 w-12 text-center font-mono">
                    {getZoomLabel()}
                  </span>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800" onClick={zoomIn} disabled={!canZoomIn}>
                        <ZoomIn className="size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Zoom in</TooltipContent>
                  </Tooltip>
                </div>

                <ToolbarDivider />

                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={zoomMode === 'fitWidth' ? 'secondary' : 'ghost'}
                        size="icon"
                        className={`size-8 ${zoomMode === 'fitWidth' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'}`}
                        onClick={() => setZoomMode('fitWidth')}
                      >
                        <MoveHorizontal className="size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Fit to width</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={zoomMode === 'fitPage' ? 'secondary' : 'ghost'}
                        size="icon"
                        className={`size-8 ${zoomMode === 'fitPage' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'}`}
                        onClick={() => setZoomMode('fitPage')}
                      >
                        <Maximize className="size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Fit to page</TooltipContent>
                  </Tooltip>
                </div>

                <ToolbarDivider />

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800" onClick={toggleFullscreen}>
                      {isFullscreen ? <Minimize2 className="size-4" /> : <Expand className="size-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}</TooltipContent>
                </Tooltip>

                {isMultiPage && (
                  <>
                    <ToolbarDivider />
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page <= 1}
                      >
                        <ChevronLeft className="size-4" />
                      </Button>
                      <span className="text-xs text-zinc-400 min-w-[3rem] text-center font-mono">
                        {page} / {totalPages}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                        onClick={() => setPage(p => Math.min(totalPages!, p + 1))}
                        disabled={page >= totalPages!}
                      >
                        <ChevronRight className="size-4" />
                      </Button>
                    </div>
                  </>
                )}
              </>
            )}

            <ToolbarDivider />

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                asChild
              >
                <Link
                  href={attachmentUrl}
                  aria-label={`Download ${attachment.filename}`}
                  download
                >
                  <Download className="size-4" />
                </Link>
              </Button>
              <DialogClose asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                >
                  <X className="size-4" />
                  <span className="sr-only">Close</span>
                </Button>
              </DialogClose>
            </div>
          </DialogHeader>

          <div className="flex-1 min-h-0 w-full overflow-hidden bg-zinc-950">
            {isPdfFile ? (
              <PdfPreview 
                url={attachmentUrl} 
                currentPage={page}
                onTotalPages={setTotalPages}
                zoom={zoom}
                zoomMode={zoomMode}
              />
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
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ToolbarDivider() {
  return <div className="w-px h-4 bg-zinc-800 mx-2 shrink-0" />
}