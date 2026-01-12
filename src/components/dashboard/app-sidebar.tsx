'use client'

import {
  LayoutDashboard,
  FolderKanban,
  CircleDot,
  Clock,
  Settings,
  ChevronDown,
  Plus,
  Search,
} from 'lucide-react'
import Link from 'next/link'

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const mainNavItems = [
  { title: 'Dashboard', icon: LayoutDashboard, href: '/', isActive: true },
  { title: 'Projects', icon: FolderKanban, href: '/projects' },
  { title: 'Issues', icon: CircleDot, href: '/issues' },
  { title: 'Time Tracking', icon: Clock, href: '/time' },
]

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border pb-4">
        <div className="flex items-center gap-3 px-2">
          {/* Logo mark */}
          <div className="flex size-9 items-center justify-center rounded-md bg-sidebar-primary">
            <CircleDot className="size-5 text-sidebar-primary-foreground" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold tracking-tight">Redmine</span>
            <span className="text-xs text-sidebar-foreground/60 font-mono">v4.0.0</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Quick Search */}
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <div className="relative px-2">
            <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-sidebar-foreground/50" />
            <input
              type="text"
              placeholder="Search issues..."
              className="h-9 w-full rounded-md border border-sidebar-border bg-sidebar-accent/50 pl-9 pr-3 text-sm placeholder:text-sidebar-foreground/40 focus:border-sidebar-ring focus:outline-none focus:ring-1 focus:ring-sidebar-ring"
            />
            <kbd className="absolute right-4 top-1/2 -translate-y-1/2 rounded border border-sidebar-border bg-sidebar px-1.5 py-0.5 text-[10px] font-mono text-sidebar-foreground/50">
              /
            </kbd>
          </div>
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
                  <SidebarMenuButton asChild isActive={item.isActive} tooltip={item.title}>
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

        {/* Admin */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-[10px] uppercase tracking-widest font-semibold">
            Admin
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Users">
                  <Link href="/admin/users">
                    <Settings className="size-4" />
                    <span>Users</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent"
                >
                  <Avatar className="size-8 rounded-md">
                    <AvatarFallback className="rounded-md bg-sidebar-primary text-sidebar-primary-foreground text-xs font-semibold">
                      AU
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start group-data-[collapsible=icon]:hidden">
                    <span className="text-sm font-medium">Admin User</span>
                    <span className="text-xs text-sidebar-foreground/60">admin@example.com</span>
                  </div>
                  <ChevronDown className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                align="start"
                className="w-56"
              >
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
