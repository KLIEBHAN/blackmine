'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize, Minimize2, Expand, MoveHorizontal } from 'lucide-react'
import { Button } from './button'
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip'

import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface PdfPreviewProps {
  url: string
}

type ZoomMode = 'scale' | 'fitWidth' | 'fitPage'

const ZOOM_STEPS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0]
const DEFAULT_SCALE = 1.0

export function PdfPreview({ url }: PdfPreviewProps) {
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [error, setError] = useState(false)
  const [scale, setScale] = useState(DEFAULT_SCALE)
  const [zoomMode, setZoomMode] = useState<ZoomMode>('fitPage')
  const [containerSize, setContainerSize] = useState<{ width: number; height: number } | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const observerRef = useRef<ResizeObserver | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Sync fullscreen state with browser
  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(document.fullscreenElement === containerRef.current)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Measure container on mount and resize (callback ref with proper cleanup)
  const measureContainer = useCallback((node: HTMLDivElement | null) => {
    // Cleanup previous observer when node changes or unmounts
    if (observerRef.current) {
      observerRef.current.disconnect()
      observerRef.current = null
    }

    if (!node) return

    const updateSize = () => {
      setContainerSize({
        width: node.clientWidth - 32, // 16px padding each side
        height: node.clientHeight - 32,
      })
    }
    updateSize()

    observerRef.current = new ResizeObserver(updateSize)
    observerRef.current.observe(node)
  }, [])

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages)
    setError(false)
  }

  function onDocumentLoadError() {
    setError(true)
  }

  function zoomIn() {
    setZoomMode('scale')
    setScale(prev => {
      const nextIdx = ZOOM_STEPS.findIndex(s => s > prev)
      return nextIdx >= 0 ? ZOOM_STEPS[nextIdx] : prev
    })
  }

  function zoomOut() {
    setZoomMode('scale')
    setScale(prev => {
      const prevIdx = ZOOM_STEPS.findLastIndex(s => s < prev)
      return prevIdx >= 0 ? ZOOM_STEPS[prevIdx] : prev
    })
  }

  function fitToWidth() {
    setZoomMode('fitWidth')
  }

  function fitToPage() {
    setZoomMode('fitPage')
  }

  function toggleFullscreen() {
    if (!containerRef.current) return
    if (isFullscreen) {
      document.exitFullscreen()
    } else {
      containerRef.current.requestFullscreen()
    }
  }

  function getZoomLabel(): string {
    switch (zoomMode) {
      case 'scale': return `${Math.round(scale * 100)}%`
      case 'fitWidth': return 'Width'
      case 'fitPage': return 'Page'
    }
  }

  // Calculate Page props based on zoom mode
  function getPageProps() {
    if (zoomMode === 'fitWidth' && containerSize) {
      return { width: containerSize.width }
    }
    if (zoomMode === 'fitPage' && containerSize) {
      // Use height constraint, let width be proportional
      return { height: containerSize.height }
    }
    return { scale }
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2">
        <p className="text-sm text-muted-foreground">PDF preview not available.</p>
        <a href={url} className="text-sm text-primary hover:underline">
          Download instead
        </a>
      </div>
    )
  }

  const canZoomIn = zoomMode === 'scale' ? scale < ZOOM_STEPS[ZOOM_STEPS.length - 1] : true
  const canZoomOut = zoomMode === 'scale' ? scale > ZOOM_STEPS[0] : true

  return (
    <div ref={containerRef} className="flex flex-col h-full bg-background">
      {/* Toolbar */}
      <div className="flex items-center justify-center gap-1 py-1.5 px-2 border-b bg-muted/30">
        {/* Zoom controls */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8" onClick={zoomOut} disabled={!canZoomOut}>
              <ZoomOut className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Zoom out</TooltipContent>
        </Tooltip>

        <span className="text-xs text-muted-foreground w-12 text-center">
          {getZoomLabel()}
        </span>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8" onClick={zoomIn} disabled={!canZoomIn}>
              <ZoomIn className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Zoom in</TooltipContent>
        </Tooltip>

        <div className="w-px h-4 bg-border mx-1" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={zoomMode === 'fitWidth' ? 'secondary' : 'ghost'}
              size="icon"
              className="size-8"
              onClick={fitToWidth}
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
              className="size-8"
              onClick={fitToPage}
            >
              <Maximize className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Fit to page</TooltipContent>
        </Tooltip>

        <div className="w-px h-4 bg-border mx-1" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8" onClick={toggleFullscreen}>
              {isFullscreen ? <Minimize2 className="size-4" /> : <Expand className="size-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}</TooltipContent>
        </Tooltip>

        {/* Page navigation (if multi-page) */}
        {numPages && numPages > 1 && (
          <>
            <div className="w-px h-4 bg-border mx-1" />
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => setPageNumber(p => Math.max(1, p - 1))}
              disabled={pageNumber <= 1}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-xs text-muted-foreground">
              {pageNumber} / {numPages}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => setPageNumber(p => Math.min(numPages, p + 1))}
              disabled={pageNumber >= numPages}
            >
              <ChevronRight className="size-4" />
            </Button>
          </>
        )}
      </div>

      {/* PDF Content */}
      <div ref={measureContainer} className="flex-1 overflow-auto p-4">
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-muted-foreground">Loading PDF...</p>
            </div>
          }
          className="flex justify-center"
        >
          <Page
            pageNumber={pageNumber}
            className="shadow-lg"
            {...getPageProps()}
          />
        </Document>
      </div>
    </div>
  )
}
