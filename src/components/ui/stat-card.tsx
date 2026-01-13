import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  iconClassName?: string
  progress?: number
  className?: string
  delay?: number
}

export function StatCard({
  label,
  value,
  icon: Icon,
  iconClassName,
  progress,
  className,
  delay = 1,
}: StatCardProps) {
  return (
    <Card className={cn(`opacity-0 animate-card-in delay-${delay}`, className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold font-mono">{value}</p>
          </div>
          <div className={cn('size-10 rounded-lg flex items-center justify-center', iconClassName)}>
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
    </Card>
  )
}
