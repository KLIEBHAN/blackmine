'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize, Minimize2, Expand, MoveHorizontal } from 'lucide-react'
import { Button } from './button'
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip'

import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// PDF.js requires a web worker for parsing - we load it from CDN to avoid bundling issues
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

// ============================================================================
// Types & Constants
// ============================================================================

interface PdfPreviewProps {
  /** URL to the PDF file (can be a relative path or absolute URL) */
  url: string
}

export type ZoomMode = 'scale' | 'fitWidth' | 'fitPage'

/** Predefined zoom levels for consistent stepping (50% to 300%) */
export const ZOOM_LEVELS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0] as const
const INITIAL_ZOOM = 1.0

/** Padding inside the PDF content area (used for size calculations) */
const CONTENT_PADDING = 32 // 16px on each side

// ============================================================================
// Component
// ============================================================================

interface PdfPreviewProps {
  /** URL to the PDF file (can be a relative path or absolute URL) */
  url: string
  /** Whether to show the internal toolbar. Defaults to true. */
  showToolbar?: boolean
  /** Controlled current page number */
  currentPage?: number
  /** Callback when page changes */
  onPageChange?: (page: number) => void
  /** Controlled zoom level */
  zoom?: number
  /** Callback when zoom changes */
  onZoomChange?: (zoom: number) => void
  /** Controlled zoom mode */
  zoomMode?: ZoomMode
  /** Callback when zoom mode changes */
  onZoomModeChange?: (mode: ZoomMode) => void
  /** Callback when total pages are loaded */
  onTotalPages?: (total: number) => void
}

/**
 * Renders a PDF with toolbar controls for zoom, fit modes, fullscreen, and pagination.
 * Uses react-pdf (PDF.js) for cross-browser compatibility.
 */
export function PdfPreview({
  url,
  showToolbar = true,
  currentPage: controlledPage,
  onPageChange,
  zoom: controlledZoom,
  onZoomChange,
  zoomMode: controlledZoomMode,
  onZoomModeChange,
  onTotalPages,
}: PdfPreviewProps) {
  // --- Document State ---
  const [internalTotalPages, setInternalTotalPages] = useState<number | null>(null)
  const totalPages = internalTotalPages

  const [internalPage, setInternalPage] = useState(1)
  const currentPage = controlledPage ?? internalPage

  const [hasError, setHasError] = useState(false)

  // --- Zoom State ---
  const [internalZoom, setInternalZoom] = useState(INITIAL_ZOOM)
  const manualZoom = controlledZoom ?? internalZoom

  const [internalZoomMode, setInternalZoomMode] = useState<ZoomMode>('fitPage')
  const zoomMode = controlledZoomMode ?? internalZoomMode

  // --- Helpers for State Updates ---
  const setCurrentPage = (page: number | ((prev: number) => number)) => {
    const newPage = typeof page === 'function' ? page(currentPage) : page
    setInternalPage(newPage)
    onPageChange?.(newPage)
  }

  const setManualZoom = (zoom: number | ((prev: number) => number)) => {
    const newZoom = typeof zoom === 'function' ? zoom(manualZoom) : zoom
    setInternalZoom(newZoom)
    onZoomChange?.(newZoom)
  }

  const setZoomMode = (mode: ZoomMode) => {
    setInternalZoomMode(mode)
    onZoomModeChange?.(mode)
  }

  // --- Layout State ---
  const [contentDimensions, setContentDimensions] = useState<{ width: number; height: number } | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // --- Refs ---
  const rootContainerRef = useRef<HTMLDivElement>(null)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)

  // ============================================================================
  // Effects
  // ============================================================================

  // Keep React state in sync with browser's fullscreen state
  // (User can exit fullscreen via ESC key, which bypasses our toggle function)
  useEffect(() => {
    function syncFullscreenState() {
      setIsFullscreen(document.fullscreenElement === rootContainerRef.current)
    }
    document.addEventListener('fullscreenchange', syncFullscreenState)
    return () => document.removeEventListener('fullscreenchange', syncFullscreenState)
  }, [])

  // ============================================================================
  // Callbacks
  // ============================================================================

  /**
   * Callback ref that sets up a ResizeObserver on the content container.
   * We need to measure the container to calculate fit-to-width/page dimensions.
   */
  const contentContainerRef = useCallback((node: HTMLDivElement | null) => {
    // Cleanup any existing observer before setting up a new one
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect()
      resizeObserverRef.current = null
    }

    if (!node) return

    const measureAndUpdateDimensions = () => {
      setContentDimensions({
        width: node.clientWidth - CONTENT_PADDING,
        height: node.clientHeight - CONTENT_PADDING,
      })
    }

    // Measure immediately and observe for future changes
    measureAndUpdateDimensions()
    resizeObserverRef.current = new ResizeObserver(measureAndUpdateDimensions)
    resizeObserverRef.current.observe(node)
  }, [])

  // ============================================================================
  // Event Handlers
  // ============================================================================

  function handleDocumentLoad({ numPages }: { numPages: number }) {
    setInternalTotalPages(numPages)
    onTotalPages?.(numPages)
    setHasError(false)
  }

  function handleDocumentError() {
    setHasError(true)
  }

  // ============================================================================
  // Zoom Controls
  // ============================================================================

  function zoomIn() {
    // Switch to manual zoom mode when user explicitly zooms
    setZoomMode('scale')
    setManualZoom(current => {
      const nextLevelIndex = ZOOM_LEVELS.findIndex(level => level > current)
      return nextLevelIndex >= 0 ? ZOOM_LEVELS[nextLevelIndex] : current
    })
  }

  function zoomOut() {
    setZoomMode('scale')
    setManualZoom(current => {
      const prevLevelIndex = ZOOM_LEVELS.findLastIndex(level => level < current)
      return prevLevelIndex >= 0 ? ZOOM_LEVELS[prevLevelIndex] : current
    })
  }

  function setFitToWidth() {
    setZoomMode('fitWidth')
  }

  function setFitToPage() {
    setZoomMode('fitPage')
  }

  // ============================================================================
  // Fullscreen
  // ============================================================================

  function toggleFullscreen() {
    if (!rootContainerRef.current) return

    if (isFullscreen) {
      document.exitFullscreen()
    } else {
      rootContainerRef.current.requestFullscreen()
    }
  }

  // ============================================================================
  // Pagination
  // ============================================================================

  function goToPreviousPage() {
    setCurrentPage(page => Math.max(1, page - 1))
  }

  function goToNextPage() {
    if (!totalPages) return
    setCurrentPage(page => Math.min(totalPages, page + 1))
  }

  // ============================================================================
  // Derived Values
  // ============================================================================

  /** Human-readable zoom label for the toolbar */
  function getZoomLabel(): string {
    switch (zoomMode) {
      case 'scale': return `${Math.round(manualZoom * 100)}%`
      case 'fitWidth': return 'Width'
      case 'fitPage': return 'Page'
    }
  }

  /** Props passed to react-pdf's Page component to control sizing */
  function getPageSizeProps(): { scale?: number; width?: number; height?: number } {
    if (zoomMode === 'fitWidth' && contentDimensions) {
      return { width: contentDimensions.width }
    }
    if (zoomMode === 'fitPage' && contentDimensions) {
      return { height: contentDimensions.height }
    }
    return { scale: manualZoom }
  }

  // Zoom buttons should always be enabled in fit modes (allows switching to manual zoom)
  const canZoomIn = zoomMode === 'scale' ? manualZoom < ZOOM_LEVELS[ZOOM_LEVELS.length - 1] : true
  const canZoomOut = zoomMode === 'scale' ? manualZoom > ZOOM_LEVELS[0] : true

  const isMultiPage = totalPages !== null && totalPages > 1
  const isFirstPage = currentPage <= 1
  const isLastPage = totalPages !== null && (totalPages ? currentPage >= totalPages : true)

  // ============================================================================
  // Render
  // ============================================================================

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2">
        <p className="text-sm text-muted-foreground">PDF preview not available.</p>
        <a href={url} className="text-sm text-primary hover:underline">
          Download instead
        </a>
      </div>
    )
  }

  return (
    <div ref={rootContainerRef} className="flex flex-col h-full bg-background">
      {/* Toolbar */}
      {showToolbar && (
        <div className="flex items-center justify-center gap-1 py-1.5 px-2 border-b bg-muted/30">
          {/* Zoom Controls */}
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

          <ToolbarDivider />

          {/* Fit Mode Controls */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={zoomMode === 'fitWidth' ? 'secondary' : 'ghost'}
                size="icon"
                className="size-8"
                onClick={setFitToWidth}
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
                onClick={setFitToPage}
              >
                <Maximize className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Fit to page</TooltipContent>
          </Tooltip>

          <ToolbarDivider />

          {/* Fullscreen Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8" onClick={toggleFullscreen}>
                {isFullscreen ? <Minimize2 className="size-4" /> : <Expand className="size-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}</TooltipContent>
          </Tooltip>

          {/* Page Navigation (only shown for multi-page PDFs) */}
          {isMultiPage && (
            <>
              <ToolbarDivider />
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={goToPreviousPage}
                disabled={isFirstPage}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <span className="text-xs text-muted-foreground">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={goToNextPage}
                disabled={isLastPage}
              >
                <ChevronRight className="size-4" />
              </Button>
            </>
          )}
        </div>
      )}

      {/* PDF Content */}
      <div ref={contentContainerRef} className={`flex-1 overflow-auto ${showToolbar ? 'p-4' : 'p-0'}`}>
        <Document
          file={url}
          onLoadSuccess={handleDocumentLoad}
          onLoadError={handleDocumentError}
          loading={
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-muted-foreground">Loading PDF...</p>
            </div>
          }
          className="flex justify-center"
        >
          <Page
            pageNumber={currentPage}
            className="shadow-lg"
            {...getPageSizeProps()}
          />
        </Document>
      </div>
    </div>
  )
}

// ============================================================================
// Helper Components
// ============================================================================

/** Visual separator between toolbar button groups */
function ToolbarDivider() {
  return <div className="w-px h-4 bg-border mx-1" />
}
