'use client'

import { ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react'
import type { SortDirection } from '@/types'

type SortIconProps<T extends string> = {
  field: T
  currentField: T
  direction: SortDirection
}

/**
 * Displays sort direction indicator for table headers.
 * Shows neutral icon when column is not sorted, up/down when sorted.
 */
export function SortIcon<T extends string>({
  field,
  currentField,
  direction,
}: SortIconProps<T>) {
  if (currentField !== field) {
    return <ArrowUpDown className="size-3.5 text-muted-foreground/50" />
  }
  return direction === 'desc' ? (
    <ChevronDown className="size-3.5 text-primary" />
  ) : (
    <ChevronUp className="size-3.5 text-primary" />
  )
}
