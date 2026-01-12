'use client'

import { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'
import type { LucideIcon } from 'lucide-react'

export interface FilterOption<T extends string> {
  value: T
  label: string
  /** Custom content to render (overrides label) */
  render?: ReactNode
}

interface FilterDropdownProps<T extends string> {
  /** Button label */
  label: string
  /** Menu header label */
  menuLabel: string
  /** Icon component */
  icon: LucideIcon
  /** Available options */
  options: FilterOption<T>[]
  /** Currently selected values */
  selected: T[]
  /** Callback when selection changes */
  onToggle: (value: T) => void
  /** Menu content width class (default: w-48) */
  width?: string
}

/**
 * Reusable multi-select filter dropdown with checkbox items.
 * Shows a badge with the count of selected items.
 */
export function FilterDropdown<T extends string>({
  label,
  menuLabel,
  icon: Icon,
  options,
  selected,
  onToggle,
  width = 'w-48',
}: FilterDropdownProps<T>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Icon className="size-4" />
          {label}
          {selected.length > 0 && (
            <Badge
              variant="default"
              className="ml-1 px-1.5 py-0 text-[10px] font-mono rounded-full h-4 min-w-4 flex items-center justify-center"
            >
              {selected.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className={width}>
        <DropdownMenuLabel>{menuLabel}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.value}
            checked={selected.includes(option.value)}
            onCheckedChange={() => onToggle(option.value)}
          >
            {option.render ?? option.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
