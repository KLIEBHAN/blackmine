import { CircleDot, FolderKanban, Clock, AlertTriangle, AlertOctagon } from 'lucide-react'
import { IssuesTable, QuickActions } from '@/components/dashboard'
import { StatCard } from '@/components/ui/stat-card'
import { getIssues } from '@/app/actions/issues'
import { getProjects } from '@/app/actions/projects'
import { getSession } from '@/lib/session'
import { isDueThisWeek, isOverdue } from '@/types'
import type { SerializedIssue } from '@/components/dashboard/issues-table'

// Force dynamic rendering - data comes from runtime database, not build-time
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  // Load data from database
  const [issues, projects, session] = await Promise.all([
    getIssues(),
    getProjects(),
    getSession(),
  ])

  // Calculate stats
  const openIssues = issues.filter(
    (i) => i.status === 'new' || i.status === 'in_progress'
  ).length
  const inProgress = issues.filter((i) => i.status === 'in_progress').length
  const overdueCount = issues.filter(isOverdue).length
  const dueSoon = issues.filter(isDueThisWeek).length
  const activeProjects = projects.filter((p) => p.status === 'active').length

  // Helper to serialize an issue for client component
  const serializeIssue = (issue: typeof issues[0]): SerializedIssue => ({
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
  })

  // Serialize issues for client component (recent 5)
  const recentIssues: SerializedIssue[] = issues.slice(0, 5).map(serializeIssue)

  // My Issues - issues assigned to current user (open only, max 5)
  const myIssues: SerializedIssue[] = session
    ? issues
        .filter((i) => i.assigneeId === session.id && (i.status === 'new' || i.status === 'in_progress'))
        .slice(0, 5)
        .map(serializeIssue)
    : []

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
          {overdueCount > 0 ? (
            <StatCard
              title="Overdue"
              value={overdueCount}
              subtitle="Needs immediate attention"
              icon={AlertOctagon}
              variant="danger"
              delay={1}
              href="/issues?due=overdue"
            />
          ) : (
            <StatCard
              title="Open Issues"
              value={openIssues}
              subtitle="Requiring attention"
              icon={CircleDot}
              variant="default"
              delay={1}
              href="/issues"
            />
          )}
          <StatCard
            title="In Progress"
            value={inProgress}
            subtitle="Currently being worked on"
            icon={Clock}
            variant="success"
            delay={2}
            href="/issues?status=in_progress"
          />
          <StatCard
            title="Due This Week"
            value={dueSoon}
            subtitle="Upcoming deadlines"
            icon={AlertTriangle}
            variant={dueSoon > 0 ? 'warning' : 'default'}
            delay={3}
            href="/issues?due=this_week"
          />
          <StatCard
            title="Active Projects"
            value={activeProjects}
            subtitle="Ongoing work streams"
            icon={FolderKanban}
            delay={4}
            href="/projects"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* My Issues - takes 2 columns */}
          {myIssues.length > 0 && (
            <div className="lg:col-span-2">
              <IssuesTable title="My Issues" issues={myIssues} />
            </div>
          )}

          {/* Quick Actions - takes 1 column */}
          <div>
            <QuickActions />
          </div>

          {/* Recent Issues - takes 2 columns (or 3 if no My Issues) */}
          <div className={myIssues.length > 0 ? 'lg:col-span-2' : 'lg:col-span-3'}>
            <IssuesTable issues={recentIssues} />
          </div>
        </div>
      </div>
    </div>
  )
}
