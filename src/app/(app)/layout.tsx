import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar, DashboardHeader } from '@/components/dashboard'
import { MobileNav } from '@/components/ui/mobile-nav'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { SessionProvider, type ClientSession } from '@/contexts/session-context'
import type { UserRole } from '@/types'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  
  if (!session) {
    redirect('/login')
  }

  const clientSession: ClientSession = {
    ...session,
    role: session.role as UserRole,
  }

  return (
    <SessionProvider session={clientSession}>
      <SidebarProvider defaultOpen={false}>
        <AppSidebar />
        <SidebarInset>
          <DashboardHeader />
          <main className="flex-1 overflow-auto pb-20 md:pb-0">{children}</main>
        </SidebarInset>
        <MobileNav />
      </SidebarProvider>
    </SessionProvider>
  )
}
