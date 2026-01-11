import { CircleDot, FolderKanban, Clock, AlertTriangle } from 'lucide-react'
import { StatCard, IssuesTable, QuickActions } from '@/components/dashboard'
import { mockIssues, mockProjects } from '@/lib/mock-data'

export default function DashboardPage() {
  // Calculate stats from mock data
  const openIssues = mockIssues.filter(
    (i) => i.status === 'new' || i.status === 'in_progress'
  ).length
  const inProgress = mockIssues.filter((i) => i.status === 'in_progress').length
  const dueSoon = mockIssues.filter((i) => {
    if (!i.dueDate || i.status === 'closed' || i.status === 'rejected') return false
    const dueDate = new Date(i.dueDate)
    const now = new Date()
    const weekFromNow = new Date()
    weekFromNow.setDate(weekFromNow.getDate() + 7)
    return dueDate >= now && dueDate <= weekFromNow
  }).length
  const activeProjects = mockProjects.filter((p) => p.status === 'active').length

  return (
    <div className="grid-pattern min-h-full">
      <div className="mx-auto max-w-7xl p-6 lg:p-8">
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
            <IssuesTable issues={mockIssues} />
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
