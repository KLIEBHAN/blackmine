import { CircleDot, FolderKanban, Clock, AlertTriangle } from 'lucide-react'
import { IssuesTable, QuickActions } from '@/components/dashboard'
import { StatCard } from '@/components/ui/stat-card'
import { getIssues } from '@/app/actions/issues'
import { getProjects } from '@/app/actions/projects'
import type { SerializedIssue } from '@/components/dashboard/issues-table'

// Force dynamic rendering - data comes from runtime database, not build-time
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  // Load data from database
  const [issues, projects] = await Promise.all([
    getIssues(),
    getProjects(),
  ])

  // Calculate stats
  const openIssues = issues.filter(
    (i) => i.status === 'new' || i.status === 'in_progress'
  ).length
  const inProgress = issues.filter((i) => i.status === 'in_progress').length
  const dueSoon = issues.filter((i) => {
    if (!i.dueDate || i.status === 'closed' || i.status === 'rejected') return false
    const dueDate = new Date(i.dueDate)
    const now = new Date()
    const weekFromNow = new Date()
    weekFromNow.setDate(weekFromNow.getDate() + 7)
    return dueDate >= now && dueDate <= weekFromNow
  }).length
  const activeProjects = projects.filter((p) => p.status === 'active').length

  // Serialize issues for client component (recent 5)
  const recentIssues: SerializedIssue[] = issues.slice(0, 5).map((issue) => ({
    id: issue.id,
    subject: issue.subject,
    status: issue.status,
    priority: issue.priority,
    tracker: issue.tracker,
    dueDate: issue.dueDate?.toISOString() ?? null,
    project: {
      id: issue.project.id,
      name: issue.project.name,
      identifier: issue.project.identifier,
    },
    assignee: issue.assignee
      ? {
          id: issue.assignee.id,
          firstName: issue.assignee.firstName,
          lastName: issue.assignee.lastName,
        }
      : null,
  }))

  return (
    <div className="grid-pattern min-h-full">
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Overview of your projects and issues
          </p>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Open Issues"
            value={openIssues}
            subtitle="Requiring attention"
            icon={CircleDot}
            variant="default"
            delay={1}
          />
          <StatCard
            title="In Progress"
            value={inProgress}
            subtitle="Currently being worked on"
            icon={Clock}
            variant="success"
            trend={{ value: 12, isPositive: true }}
            delay={2}
          />
          <StatCard
            title="Due This Week"
            value={dueSoon}
            subtitle="Upcoming deadlines"
            icon={AlertTriangle}
            variant={dueSoon > 0 ? 'warning' : 'default'}
            delay={3}
          />
          <StatCard
            title="Active Projects"
            value={activeProjects}
            subtitle="Ongoing work streams"
            icon={FolderKanban}
            delay={4}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Issues Table - takes 2 columns */}
          <div className="lg:col-span-2">
            <IssuesTable issues={recentIssues} />
          </div>

          {/* Quick Actions - takes 1 column */}
          <div>
            <QuickActions />
          </div>
        </div>
      </div>
    </div>
  )
}
