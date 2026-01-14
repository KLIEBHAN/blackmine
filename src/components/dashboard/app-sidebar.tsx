'use client'

import {
  LayoutDashboard,
  FolderKanban,
  CircleDot,
  Clock,
  Users,
  Plus,
  Database,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { IssueSearch } from './issue-search'
import { useSession } from '@/contexts/session-context'
import { getFullName } from '@/types'
import { getInitials } from '@/lib/utils'

const mainNavItems = [
  { title: 'Dashboard', icon: LayoutDashboard, href: '/' },
  { title: 'Projects', icon: FolderKanban, href: '/projects' },
  { title: 'Issues', icon: CircleDot, href: '/issues' },
  { title: 'Time Tracking', icon: Clock, href: '/time' },
]

function isActiveRoute(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(href + '/')
}

export function AppSidebar() {
  const pathname = usePathname()
  const { session, isAdmin } = useSession()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border pb-4 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:pb-2">
        <div className="flex items-center gap-3 px-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          {/* Logo mark */}
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-sidebar-primary">
            <CircleDot className="size-5 text-sidebar-primary-foreground" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold tracking-tight">Blackmine</span>
            <span className="text-xs text-sidebar-foreground/60 font-mono">v4.0.0</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Quick Search */}
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <IssueSearch />
        </SidebarGroup>

        {/* Quick Actions */}
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupContent>
            <Button
              size="sm"
              className="w-full justify-start gap-2 bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
              asChild
            >
              <Link href="/issues/new">
                <Plus className="size-4" />
                New Issue
              </Link>
            </Button>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-[10px] uppercase tracking-widest font-semibold">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActiveRoute(pathname, item.href)} tooltip={item.title}>
                    <Link href={item.href}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Admin - only visible to admins */}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/50 text-[10px] uppercase tracking-widest font-semibold">
              Admin
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActiveRoute(pathname, '/admin/users')} tooltip="Users">
                    <Link href="/admin/users">
                      <Users className="size-4" />
                      <span>Users</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActiveRoute(pathname, '/admin/database')} tooltip="Database">
                    <Link href="/admin/database">
                      <Database className="size-4" />
                      <span>Database</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border group-data-[collapsible=icon]:items-center">
        <div className="flex items-center gap-3 p-2 min-w-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-1">
          <Avatar className="size-8 shrink-0 rounded-md">
            <AvatarFallback className="rounded-md bg-sidebar-primary text-sidebar-primary-foreground text-xs font-semibold">
              {session ? getInitials(session.firstName, session.lastName) : '??'}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col items-start group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-medium">
              {session ? getFullName(session) : 'Unknown'}
            </span>
            <span className="truncate text-xs text-sidebar-foreground/60">
              {session?.email ?? ''}
            </span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
