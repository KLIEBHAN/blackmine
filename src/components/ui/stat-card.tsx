import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'

type StatCardVariant = 'default' | 'warning' | 'success' | 'danger'

interface StatCardProps {
  /** Primary label (accepts both 'label' and 'title' for backwards compatibility) */
  label?: string
  title?: string
  value: string | number
  icon: LucideIcon
  /** Custom icon container styling (alternative to variant) */
  iconClassName?: string
  /** Optional progress bar (0-100) */
  progress?: number
  /** Optional subtitle below the value */
  subtitle?: string
  /** Optional trend indicator */
  trend?: {
    value: number
    isPositive: boolean
  }
  /** Color variant - sets border and icon colors */
  variant?: StatCardVariant
  className?: string
  /** Animation delay (1-5) */
  delay?: number
  /** Optional link - makes the card clickable */
  href?: string
}

const variantStyles: Record<StatCardVariant, string> = {
  default: 'border-l-primary',
  warning: 'border-l-amber-500',
  success: 'border-l-emerald-500',
  danger: 'border-l-red-500',
}

const iconVariantStyles: Record<StatCardVariant, string> = {
  default: 'bg-primary/10 text-primary',
  warning: 'bg-amber-500/10 text-amber-600',
  success: 'bg-emerald-500/10 text-emerald-600',
  danger: 'bg-red-500/10 text-red-600',
}

export function StatCard({
  label,
  title,
  value,
  icon: Icon,
  iconClassName,
  progress,
  subtitle,
  trend,
  variant,
  className,
  delay = 0,
  href,
}: StatCardProps) {
  const displayLabel = label ?? title ?? ''
  const useVariantStyling = variant !== undefined || subtitle !== undefined || trend !== undefined
  
  const cardContent = (
    <>
      <CardContent className={cn('p-4', useVariantStyling && 'p-5')}>
        <div className={cn('flex items-center justify-between', useVariantStyling && 'items-start')}>
          <div className={useVariantStyling ? 'space-y-2' : undefined}>
            <p className={cn(
              'text-muted-foreground',
              useVariantStyling 
                ? 'text-xs font-medium uppercase tracking-wider' 
                : 'text-sm'
            )}>
              {displayLabel}
            </p>
            <div className="flex items-baseline gap-2">
              <span className={cn(
                'font-bold',
                useVariantStyling 
                  ? 'text-3xl tabular-nums tracking-tight' 
                  : 'text-2xl font-mono'
              )}>
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
              'flex items-center justify-center rounded-lg',
              useVariantStyling ? 'size-11' : 'size-10',
              iconClassName ?? (variant ? iconVariantStyles[variant] : iconVariantStyles.default)
            )}
          >
            <Icon className="size-5" />
          </div>
        </div>
        {progress !== undefined && (
          <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </CardContent>
    </>
  )

  const cardClasses = cn(
    'relative overflow-hidden opacity-0 animate-card-in',
    useVariantStyling && 'border-l-4',
    variant && variantStyles[variant],
    delay === 1 && 'delay-1',
    delay === 2 && 'delay-2',
    delay === 3 && 'delay-3',
    delay === 4 && 'delay-4',
    href && 'transition-shadow hover:shadow-md cursor-pointer',
    className
  )

  if (href) {
    return (
      <Link href={href} className="block">
        <Card className={cardClasses}>
          {cardContent}
        </Card>
      </Link>
    )
  }

  return (
    <Card className={cardClasses}>
      {cardContent}
    </Card>
  )
}
