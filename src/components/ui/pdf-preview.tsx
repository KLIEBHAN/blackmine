'use client'

import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'

import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

// ============================================================================
// Types & Constants
// ============================================================================

export type ZoomMode = 'scale' | 'fitWidth' | 'fitPage'
export const ZOOM_LEVELS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0] as const

interface PdfPreviewProps {
  url: string
  currentPage?: number
  onPageChange?: (page: number) => void
  zoom?: number
  zoomMode?: ZoomMode
  onTotalPages?: (total: number) => void
}

// ============================================================================
// Component
// ============================================================================

/**
 * Renders a PDF page with controlled zoom/pagination.
 * Pure render component - all controls are managed by parent.
 */
export function PdfPreview({
  url,
  currentPage = 1,
  zoom = 1.0,
  zoomMode = 'fitPage',
  onTotalPages,
}: PdfPreviewProps) {
  const [hasError, setHasError] = useState(false)
  const [contentDimensions, setContentDimensions] = useState<{ width: number; height: number } | null>(null)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)
  const pendingUpdateRef = useRef<number | null>(null)

  // Debounced resize handler to prevent flickering
  const updateDimensions = useCallback(() => {
    if (pendingUpdateRef.current) {
      cancelAnimationFrame(pendingUpdateRef.current)
    }
    pendingUpdateRef.current = requestAnimationFrame(() => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current
        setContentDimensions(prev => {
          // Only update if dimensions actually changed (prevents unnecessary re-renders)
          if (prev?.width === clientWidth && prev?.height === clientHeight) {
            return prev
          }
          return { width: clientWidth, height: clientHeight }
        })
      }
    })
  }, [])

  // Setup ResizeObserver
  useEffect(() => {
    const node = containerRef.current
    if (!node) return

    updateDimensions()
    
    resizeObserverRef.current = new ResizeObserver(updateDimensions)
    resizeObserverRef.current.observe(node)

    return () => {
      if (pendingUpdateRef.current) {
        cancelAnimationFrame(pendingUpdateRef.current)
      }
      resizeObserverRef.current?.disconnect()
    }
  }, [updateDimensions])

  function handleDocumentLoad({ numPages }: { numPages: number }) {
    onTotalPages?.(numPages)
    setHasError(false)
  }

  function handleDocumentError() {
    setHasError(true)
  }

  // Memoize page size props to prevent unnecessary re-renders
  const pageSizeProps = useMemo(() => {
    if (zoomMode === 'fitWidth' && contentDimensions) {
      return { width: contentDimensions.width }
    }
    if (zoomMode === 'fitPage' && contentDimensions) {
      return { height: contentDimensions.height }
    }
    return { scale: zoom }
  }, [zoomMode, zoom, contentDimensions])

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
    <div ref={containerRef} className="h-full w-full overflow-auto flex items-start justify-center">
      <Document
        file={url}
        onLoadSuccess={handleDocumentLoad}
        onLoadError={handleDocumentError}
        loading={
          <div className="flex items-center justify-center h-full w-full">
            <p className="text-sm text-muted-foreground">Loading PDF...</p>
          </div>
        }
      >
        <Page
          pageNumber={currentPage}
          className="shadow-lg"
          {...pageSizeProps}
        />
      </Document>
    </div>
  )
}
