import Link from 'next/link'
import { Users, Database, FolderKanban, TicketCheck, Clock } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getDatabaseStats } from '@/app/actions/database'

// Force dynamic rendering - data comes from runtime database, not build-time
export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const stats = await getDatabaseStats()

  const adminSections = [
    {
      title: 'Users',
      description: 'Manage user accounts and permissions',
      href: '/admin/users',
      icon: Users,
      stat: stats.users,
      statLabel: 'users',
    },
    {
      title: 'Database',
      description: 'Export and import database backups',
      href: '/admin/database',
      icon: Database,
      stat: null,
      statLabel: null,
    },
  ]

  const overviewStats = [
    { label: 'Projects', value: stats.projects, icon: FolderKanban, href: '/projects' },
    { label: 'Issues', value: stats.issues, icon: TicketCheck, href: '/issues' },
    { label: 'Time Entries', value: stats.timeEntries, icon: Clock, href: '/time' },
  ]

  return (
    <div className="grid-pattern min-h-full">
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Administration</h1>
          <p className="text-muted-foreground">Manage your Blackmine instance</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-8">
          {adminSections.map((section) => (
            <Link key={section.href} href={section.href}>
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <section.icon className="size-5" />
                    {section.title}
                    {section.stat !== null && (
                      <span className="ml-auto text-sm font-normal text-muted-foreground">
                        {section.stat} {section.statLabel}
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>

        <h2 className="text-lg font-semibold mb-4">System Overview</h2>
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
          {overviewStats.map((stat) => (
            <Link key={stat.href} href={stat.href}>
              <Card className="transition-colors hover:bg-muted/50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <stat.icon className="size-8 text-muted-foreground" />
                    <div>
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <div className="text-sm text-muted-foreground">{stat.label}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
