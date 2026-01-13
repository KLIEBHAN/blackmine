'use client'

import { Bug, Sparkles, HelpCircle, CheckSquare, type LucideProps } from 'lucide-react'
import type { IssueTracker } from '@/types'

type TrackerIconProps = {
  tracker: IssueTracker
  className?: string
}

const icons: Record<IssueTracker, React.ComponentType<LucideProps>> = {
  bug: Bug,
  feature: Sparkles,
  support: HelpCircle,
  task: CheckSquare,
}

/**
 * Renders the appropriate icon for an issue tracker type.
 * Centralizes tracker icon mapping to avoid duplication across components.
 */
export function TrackerIcon({ tracker, className = 'size-4' }: TrackerIconProps) {
  const Icon = icons[tracker] ?? Bug
  return <Icon className={className} />
}
