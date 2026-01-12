'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { deleteProject } from '@/app/actions/projects'
import {
  ArrowLeft,
  Plus,
  Settings,
  Bug,
  Sparkles,
  HelpCircle,
  CheckSquare,
  AlertCircle,
  Calendar,
  BarChart3,
  Trash2,
} from 'lucide-react'
import { statusLabels, trackerLabels, projectStatusLabels } from '@/types'

const projectStatusColors = {
  active: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
  archived: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
  closed: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
} as const

const trackerIcons: Record<string, React.ReactNode> = {
  bug: <Bug className="size-4" />,
  feature: <Sparkles className="size-4" />,
  support: <HelpCircle className="size-4" />,
  task: <CheckSquare className="size-4" />,
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase()
}

// Serialized types for client component
export type SerializedProject = {
  id: string
  name: string
  identifier: string
  description: string
  status: string
  createdAt: string
  updatedAt: string
  issues: SerializedIssue[]
}

export type SerializedIssue = {
  id: string
  subject: string
  tracker: string
  status: string
  priority: string
  updatedAt: string
  author: {
    id: string
    firstName: string
    lastName: string
  }
  assignee: {
    id: string
    firstName: string
    lastName: string
  } | null
}

interface ProjectDetailProps {
  project: SerializedProject
}

export function ProjectDetail({ project }: ProjectDetailProps) {
  const router = useRouter()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const status = project.status as keyof typeof projectStatusLabels

  // Calculate stats
  const totalIssues = project.issues.length
  const openIssues = project.issues.filter(
    (i) => i.status !== 'closed' && i.status !== 'rejected' && i.status !== 'resolved'
  ).length
  const closedIssues = totalIssues - openIssues
  const progress = totalIssues > 0 ? (closedIssues / totalIssues) * 100 : 0

  // Issue breakdown by tracker
  const byTracker = project.issues.reduce<Record<string, number>>((acc, issue) => {
    acc[issue.tracker] = (acc[issue.tracker] || 0) + 1
    return acc
  }, {})

  // Recent issues (last 5, sorted by updatedAt)
  const recentIssues = [...project.issues]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5)

  const handleDelete = async () => {
    setIsDeleting(true)
    const result = await deleteProject(project.id)
    if (result.success) {
      toast.success(`Project "${project.name}" deleted`)
      router.push('/projects')
    } else {
      toast.error(result.error || 'Failed to delete project')
      setIsDeleting(false)
    }
  }

  return (
    <div className="grid-pattern min-h-full">
      <div className="mx-auto max-w-7xl p-6 lg:p-8">
        {/* Back link */}
        <Link
          href="/projects"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to Projects
        </Link>

        {/* Project Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
              <Badge
                variant="outline"
                className={cn('rounded-sm px-2 py-0.5 text-xs', projectStatusColors[status])}
              >
                {projectStatusLabels[status]}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground max-w-2xl">
              {project.description}
            </p>
            <p className="mt-2 text-xs font-mono text-muted-foreground">
              Identifier: {project.identifier}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2" asChild>
              <Link href={`/projects/${project.identifier}/edit`}>
                <Settings className="size-4" />
                Settings
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-destructive hover:text-destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="size-4" />
              Delete
            </Button>
            <Button asChild size="sm" className="gap-2">
              <Link href={`/issues/new?project=${project.id}`}>
                <Plus className="size-4" />
                New Issue
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card className="opacity-0 animate-card-in delay-1">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Issues</p>
                  <p className="text-2xl font-bold font-mono">{totalIssues}</p>
                </div>
                <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="size-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="opacity-0 animate-card-in delay-2">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Open</p>
                  <p className="text-2xl font-bold font-mono">{openIssues}</p>
                </div>
                <div className="size-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <AlertCircle className="size-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="opacity-0 animate-card-in delay-3">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Closed</p>
                  <p className="text-2xl font-bold font-mono">{closedIssues}</p>
                </div>
                <div className="size-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <CheckSquare className="size-5 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="opacity-0 animate-card-in delay-4">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Progress</p>
                  <p className="text-2xl font-bold font-mono">{progress.toFixed(0)}%</p>
                </div>
                <div className="size-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Calendar className="size-5 text-blue-600" />
                </div>
              </div>
              <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Issues */}
          <Card className="lg:col-span-2 opacity-0 animate-card-in delay-5">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Recent Issues</CardTitle>
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/issues?project=${project.id}`}>
                    View all
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {recentIssues.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <CheckSquare className="size-8 opacity-50 mb-2" />
                  <p>No issues yet</p>
                  <Button asChild variant="link" size="sm" className="mt-1">
                    <Link href={`/issues/new?project=${project.id}`}>
                      Create the first issue
                    </Link>
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-10 pl-4"></TableHead>
                      <TableHead className="font-semibold">Issue</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Assignee</TableHead>
                      <TableHead className="pr-4 text-right font-semibold">Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentIssues.map((issue, index) => {
                      const tracker = issue.tracker as keyof typeof trackerLabels
                      const issueStatus = issue.status as keyof typeof statusLabels

                      return (
                        <TableRow
                          key={issue.id}
                          className="group animate-fade-in"
                          style={{ animationDelay: `${index * 30}ms` }}
                        >
                          {/* Priority indicator */}
                          <TableCell className="pl-4 pr-0">
                            <div
                              className={cn(
                                'priority-indicator h-8',
                                `priority-${issue.priority}`
                              )}
                            />
                          </TableCell>

                          {/* Issue info */}
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="secondary"
                                  className={cn(
                                    'rounded px-1.5 py-0 text-[10px] font-semibold uppercase',
                                    `tracker-${issue.tracker}`
                                  )}
                                >
                                  {trackerLabels[tracker]}
                                </Badge>
                                <span className="font-mono text-xs text-muted-foreground">
                                  #{issue.id.split('-')[1] || issue.id}
                                </span>
                              </div>
                              <Link
                                href={`/issues/${issue.id}`}
                                className="font-medium hover:text-primary hover:underline line-clamp-1"
                              >
                                {issue.subject}
                              </Link>
                            </div>
                          </TableCell>

                          {/* Status */}
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={cn(
                                'rounded-sm px-2 py-0.5 text-xs font-medium',
                                `status-${issue.status}`
                              )}
                            >
                              {statusLabels[issueStatus]}
                            </Badge>
                          </TableCell>

                          {/* Assignee */}
                          <TableCell>
                            {issue.assignee ? (
                              <div className="flex items-center gap-2">
                                <Avatar className="size-6">
                                  <AvatarFallback className="bg-muted text-[10px] font-medium">
                                    {getInitials(issue.assignee.firstName, issue.assignee.lastName)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm">
                                  {issue.assignee.firstName} {issue.assignee.lastName}
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">Unassigned</span>
                            )}
                          </TableCell>

                          {/* Updated */}
                          <TableCell className="pr-4 text-right">
                            <span className="font-mono text-xs text-muted-foreground">
                              {new Date(issue.updatedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Issue Breakdown */}
          <Card className="opacity-0 animate-card-in delay-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Issue Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* By Tracker */}
              <div>
                <p className="text-sm font-medium mb-2">By Type</p>
                <div className="space-y-2">
                  {Object.entries(byTracker).map(([tracker, count]) => (
                    <div key={tracker} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <div className={cn('p-1 rounded', `tracker-${tracker}`)}>
                          {trackerIcons[tracker]}
                        </div>
                        <span className="capitalize">{tracker}</span>
                      </div>
                      <span className="font-mono text-sm">{count}</span>
                    </div>
                  ))}
                  {Object.keys(byTracker).length === 0 && (
                    <p className="text-sm text-muted-foreground italic">No issues</p>
                  )}
                </div>
              </div>

              {/* Project Info */}
              <div className="pt-4 border-t border-border/50">
                <p className="text-sm font-medium mb-2">Project Info</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Created</span>
                    <span className="font-mono">
                      {new Date(project.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Updated</span>
                    <span className="font-mono">
                      {new Date(project.updatedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this project? This action cannot be undone.
              All associated issues will also be deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border bg-muted/50 p-3">
            <p className="font-medium text-sm">{project.name}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {project.identifier} • {totalIssues} issues
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
