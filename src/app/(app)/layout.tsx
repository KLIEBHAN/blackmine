import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar, DashboardHeader } from '@/components/dashboard'
import type { SidebarCounts } from '@/components/dashboard/app-sidebar'
import { MobileNav } from '@/components/ui/mobile-nav'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { SessionProvider, type ClientSession } from '@/contexts/session-context'
import type { UserRole } from '@/types'
import { isOverdue } from '@/types'
import { getIssues } from '@/app/actions/issues'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session) {
    redirect('/login')
  }

  // Load issues only after session is confirmed
  const issues = await getIssues()

  // Calculate sidebar counts
  const openIssues = issues.filter(
    (i) => i.status === 'new' || i.status === 'in_progress'
  ).length
  const overdueIssues = issues.filter(isOverdue).length

  const sidebarCounts: SidebarCounts = {
    openIssues,
    overdueIssues,
  }

  const clientSession: ClientSession = {
    ...session,
    role: session.role as UserRole,
  }

  return (
    <SessionProvider session={clientSession}>
      <SidebarProvider defaultOpen={false}>
        <AppSidebar counts={sidebarCounts} />
        <SidebarInset>
          <DashboardHeader />
          <main className="flex-1 overflow-auto pb-20 md:pb-0">{children}</main>
        </SidebarInset>
        <MobileNav />
      </SidebarProvider>
    </SessionProvider>
  )
}
