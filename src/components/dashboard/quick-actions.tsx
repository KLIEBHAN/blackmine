import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  CirclePlus,
  FolderPlus,
  Clock,
  BarChart3,
} from 'lucide-react'
import Link from 'next/link'

const actions = [
  {
    title: 'New Issue',
    description: 'Create a new issue or bug report',
    icon: CirclePlus,
    href: '/issues/new',
    variant: 'default' as const,
  },
  {
    title: 'New Project',
    description: 'Start a new project workspace',
    icon: FolderPlus,
    href: '/projects/new',
    variant: 'secondary' as const,
  },
  {
    title: 'Log Time',
    description: 'Track time spent on tasks',
    icon: Clock,
    href: '/time/new',
    variant: 'secondary' as const,
  },
  {
    title: 'Reports',
    description: 'View project analytics',
    icon: BarChart3,
    href: '/reports',
    variant: 'secondary' as const,
  },
]

interface QuickActionsProps {
  className?: string
}

export function QuickActions({ className }: QuickActionsProps) {
  return (
    <Card className={cn('opacity-0 animate-card-in delay-4', className)}>
      <CardHeader className="border-b pb-4">
        <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 p-4">
        {actions.map((action) => (
          <Button
            key={action.title}
            variant={action.variant}
            className={cn(
              'h-auto justify-start gap-3 px-4 py-3',
              action.variant === 'default' &&
                'bg-primary text-primary-foreground hover:bg-primary/90'
            )}
            asChild
          >
            <Link href={action.href}>
              <div
                className={cn(
                  'flex size-9 items-center justify-center rounded-md',
                  action.variant === 'default'
                    ? 'bg-white/20'
                    : 'bg-muted'
                )}
              >
                <action.icon className="size-4" />
              </div>
              <div className="flex flex-col items-start">
                <span className="font-medium">{action.title}</span>
                <span
                  className={cn(
                    'text-xs',
                    action.variant === 'default'
                      ? 'text-primary-foreground/70'
                      : 'text-muted-foreground'
                  )}
                >
                  {action.description}
                </span>
              </div>
            </Link>
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}
