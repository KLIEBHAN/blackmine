'use client'

import { cn } from '@/lib/utils'
import { SortIcon } from './sort-icon'
import type { SortDirection } from '@/types'

type SortableTableHeaderProps<T extends string> = {
  field: T
  label: string
  currentField: T
  direction: SortDirection
  onSort: (field: T) => void
  align?: 'left' | 'right'
  className?: string
}

export function SortableTableHeader<T extends string>({
  field,
  label,
  currentField,
  direction,
  onSort,
  align = 'left',
  className,
}: SortableTableHeaderProps<T>) {
  return (
    <button
      onClick={() => onSort(field)}
      className={cn(
        'flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer',
        align === 'right' && 'ml-auto justify-end',
        className
      )}
      aria-label={`Sort by ${label.toLowerCase()}`}
    >
      {label}
      <SortIcon field={field} currentField={currentField} direction={direction} />
    </button>
  )
}
