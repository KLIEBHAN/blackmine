'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2 } from 'lucide-react'
import { searchIssues } from '@/app/actions/issues'
import { cn } from '@/lib/utils'

type SearchResult = Awaited<ReturnType<typeof searchIssues>>[number]

export function IssueSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const search = useCallback(async (term: string) => {
    if (term.length < 2) {
      setResults([])
      return
    }
    setIsLoading(true)
    try {
      const data = await searchIssues(term)
      setResults(data)
      setSelectedIndex(-1)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300)
    return () => clearTimeout(timer)
  }, [query, search])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen || results.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((i) => (i < results.length - 1 ? i + 1 : 0))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((i) => (i > 0 ? i - 1 : results.length - 1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0) {
          navigateTo(results[selectedIndex].id)
        }
        break
      case 'Escape':
        setIsOpen(false)
        inputRef.current?.blur()
        break
    }
  }

  function navigateTo(id: string) {
    setIsOpen(false)
    setQuery('')
    router.push(`/issues/${id}`)
  }

  const priorityColors: Record<string, string> = {
    low: 'bg-slate-500',
    normal: 'bg-blue-500',
    high: 'bg-orange-500',
    urgent: 'bg-red-500',
    immediate: 'bg-red-700',
  }

  return (
    <div ref={containerRef} className="relative px-2">
      <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-sidebar-foreground/50" />
      {isLoading && (
        <Loader2 className="absolute right-10 top-1/2 size-4 -translate-y-1/2 animate-spin text-sidebar-foreground/50" />
      )}
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setIsOpen(true)
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Search issues..."
        className="h-9 w-full rounded-md border border-sidebar-border bg-sidebar-accent/50 pl-9 pr-3 text-sm placeholder:text-sidebar-foreground/40 focus:border-sidebar-ring focus:outline-none focus:ring-1 focus:ring-sidebar-ring"
      />
      <kbd className="absolute right-4 top-1/2 -translate-y-1/2 rounded border border-sidebar-border bg-sidebar px-1.5 py-0.5 text-[10px] font-mono text-sidebar-foreground/50">
        /
      </kbd>

      {isOpen && results.length > 0 && (
        <div className="absolute left-2 right-2 top-full z-50 mt-1 max-h-80 overflow-auto rounded-md border border-sidebar-border bg-sidebar shadow-lg">
          {results.map((issue, index) => (
            <button
              key={issue.id}
              onClick={() => navigateTo(issue.id)}
              className={cn(
                'flex w-full items-start gap-3 px-3 py-2 text-left text-sm hover:bg-sidebar-accent',
                selectedIndex === index && 'bg-sidebar-accent'
              )}
            >
              <span
                className={cn('mt-1.5 size-2 shrink-0 rounded-full', priorityColors[issue.priority] || 'bg-gray-500')}
              />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{issue.subject}</div>
                <div className="truncate text-xs text-sidebar-foreground/60">
                  {issue.project.name} · {issue.tracker} · {issue.status}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && query.length >= 2 && results.length === 0 && !isLoading && (
        <div className="absolute left-2 right-2 top-full z-50 mt-1 rounded-md border border-sidebar-border bg-sidebar p-3 text-center text-sm text-sidebar-foreground/60 shadow-lg">
          No issues found
        </div>
      )}
    </div>
  )
}
