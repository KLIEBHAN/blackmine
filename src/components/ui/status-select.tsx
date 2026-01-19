'use client'

import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { allIssueStatuses, statusLabels, type IssueStatus } from '@/types'

export interface StatusSelectProps {
  value: IssueStatus
  onValueChange: (status: IssueStatus) => void
  disabled?: boolean
  variant?: 'default' | 'inline'
  align?: 'start' | 'center' | 'end'
  id?: string
  className?: string
}

export function StatusSelect({
  value,
  onValueChange,
  disabled = false,
  variant = 'default',
  align,
  id,
  className,
}: StatusSelectProps) {
  const isInline = variant === 'inline'

  return (
    <Select
      value={value}
      onValueChange={(v) => onValueChange(v as IssueStatus)}
      disabled={disabled}
    >
      <SelectTrigger
        id={id}
        size={isInline ? 'sm' : 'default'}
        className={cn(
          `status-${value}`,
          isInline && 'h-auto w-auto gap-1.5 border-0 bg-transparent px-2 py-0.5 text-xs font-medium shadow-none hover:bg-accent',
          className
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent align={align ?? (isInline ? 'end' : 'center')}>
        {allIssueStatuses.map((status) => (
          <SelectItem key={status} value={status} className={cn(isInline && 'text-xs', `status-${status}`)}>
            {statusLabels[status]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
