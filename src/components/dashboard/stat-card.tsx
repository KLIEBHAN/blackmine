import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: number | string
  subtitle?: string
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  variant?: 'default' | 'warning' | 'success' | 'danger'
  className?: string
  delay?: number
}

const variantStyles = {
  default: 'border-l-primary',
  warning: 'border-l-amber-500',
  success: 'border-l-emerald-500',
  danger: 'border-l-red-500',
}

const iconVariantStyles = {
  default: 'bg-primary/10 text-primary',
  warning: 'bg-amber-500/10 text-amber-600',
  success: 'bg-emerald-500/10 text-emerald-600',
  danger: 'bg-red-500/10 text-red-600',
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  className,
  delay = 0,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        'relative overflow-hidden border-l-4 opacity-0 animate-card-in',
        variantStyles[variant],
        delay === 1 && 'delay-1',
        delay === 2 && 'delay-2',
        delay === 3 && 'delay-3',
        delay === 4 && 'delay-4',
        className
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {title}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tabular-nums tracking-tight">
                {value}
              </span>
              {trend && (
                <span
                  className={cn(
                    'text-xs font-medium',
                    trend.isPositive ? 'text-emerald-600' : 'text-red-500'
                  )}
                >
                  {trend.isPositive ? '+' : ''}
                  {trend.value}%
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div
            className={cn(
              'flex size-11 items-center justify-center rounded-lg',
              iconVariantStyles[variant]
            )}
          >
            <Icon className="size-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
